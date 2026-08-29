<script setup lang="ts">
import { useI18n } from "vue-i18n"

const { t } = useI18n()

const cloudSyncStore = useCloudSyncStore()
const { cloudSync } = storeToRefs(cloudSyncStore)
const hiddenTitlesStore = useHiddenTitlesStore()
const { hiddenTitles, hiddenTitlesTombstones } = storeToRefs(hiddenTitlesStore)

const redirectUri = browser.identity.getRedirectURL()

const connectingProvider = ref<CloudSyncProvider | null>(null)
const syncing = ref(false)

const isGoogleDriveConnected = computed(() => !!cloudSync.value.googleDrive.refreshToken)
const isDropboxConnected = computed(() => !!cloudSync.value.dropbox.refreshToken)

function providerLabel(provider: CloudSyncProvider) {
	if (provider === "googleDrive") return "Google Drive"
	if (provider === "dropbox") return "Dropbox"
	return t("cloudSyncProviderNone")
}

async function connect(provider: "googleDrive" | "dropbox") {
	connectingProvider.value = provider
	try {
		cloudSync.value = await connectCloudProvider(provider, cloudSync.value)
		await syncNow()
	} catch (error) {
		cloudSync.value = {
			...cloudSync.value,
			lastError: error instanceof Error ? error.message : String(error),
		}
	} finally {
		connectingProvider.value = null
	}
}

function disconnect() {
	if (!confirm(t("cloudSyncDisconnectConfirm"))) return
	cloudSync.value = disconnectCloudProvider(cloudSync.value)
}

async function syncNow() {
	if (cloudSync.value.provider === "none") return
	syncing.value = true
	try {
		const result = await runCloudSync(cloudSync.value, {
			items: hiddenTitles.value,
			tombstones: hiddenTitlesTombstones.value,
		})
		cloudSync.value = result.settings
		if (result.local) {
			hiddenTitles.value = result.local.items
			hiddenTitlesTombstones.value = result.local.tombstones
		}
	} finally {
		syncing.value = false
	}
}
</script>

<template>
	<h1>{{ $t("cloudSyncPageTitle") }}</h1>
	<p class="description">{{ $t("cloudSyncPageDescription") }}</p>

	<div class="redirect-uri-box">
		<p class="description">{{ $t("cloudSyncRedirectUriHelp") }}</p>
		<code>{{ redirectUri }}</code>
	</div>

	<div
		v-if="cloudSync.provider !== 'none'"
		class="status-box"
	>
		<p>{{ $t("cloudSyncActiveProvider", [providerLabel(cloudSync.provider)]) }}</p>
		<p v-if="cloudSync.lastSyncedAt">{{ $t("cloudSyncLastSynced", [new Date(cloudSync.lastSyncedAt).toLocaleString()]) }}</p>
		<p
			v-if="cloudSync.lastError"
			class="text-error"
		>
			{{ cloudSync.lastError }}
		</p>
		<div class="flex gap-2 mt-2">
			<button
				class="btn btn-sm"
				:disabled="syncing"
				@click="syncNow"
			>
				{{ syncing ? $t("cloudSyncSyncing") : $t("cloudSyncNow") }}
			</button>
			<button
				class="btn btn-sm btn-outline btn-error"
				@click="disconnect"
			>
				{{ $t("cloudSyncDisconnect") }}
			</button>
		</div>
	</div>

	<div class="provider-grid">
		<div class="provider-card">
			<h2>Google Drive</h2>
			<p class="description">{{ $t("cloudSyncGoogleDriveHelp") }}</p>
			<label class="field">
				{{ $t("cloudSyncClientId") }}
				<input
					v-model="cloudSync.googleDrive.clientId"
					type="text"
					class="input input-bordered input-sm"
				/>
			</label>
			<label class="field">
				{{ $t("cloudSyncClientSecret") }}
				<input
					v-model="cloudSync.googleDrive.clientSecret"
					type="password"
					class="input input-bordered input-sm"
				/>
			</label>
			<button
				class="btn btn-sm btn-primary mt-2"
				:disabled="connectingProvider !== null"
				@click="connect('googleDrive')"
			>
				{{
					connectingProvider === "googleDrive"
						? $t("cloudSyncConnecting")
						: isGoogleDriveConnected
							? $t("cloudSyncReconnect")
							: $t("cloudSyncConnect")
				}}
			</button>
		</div>

		<div class="provider-card">
			<h2>Dropbox</h2>
			<p class="description">{{ $t("cloudSyncDropboxHelp") }}</p>
			<label class="field">
				{{ $t("cloudSyncAppKey") }}
				<input
					v-model="cloudSync.dropbox.appKey"
					type="text"
					class="input input-bordered input-sm"
				/>
			</label>
			<button
				class="btn btn-sm btn-primary mt-2"
				:disabled="connectingProvider !== null"
				@click="connect('dropbox')"
			>
				{{
					connectingProvider === "dropbox"
						? $t("cloudSyncConnecting")
						: isDropboxConnected
							? $t("cloudSyncReconnect")
							: $t("cloudSyncConnect")
				}}
			</button>
		</div>
	</div>
</template>

<style scoped>
.redirect-uri-box {
	margin: 8px 0;
}
.redirect-uri-box code {
	display: inline-block;
	padding: 2px 6px;
	border-radius: 4px;
	background: rgba(128, 128, 128, 0.2);
	word-break: break-all;
}
.status-box {
	border: 1px solid #ccc;
	border-radius: 8px;
	padding: 12px;
	margin: 12px 0;
}
.provider-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 16px;
}
.provider-card {
	border: 1px solid #ccc;
	border-radius: 8px;
	padding: 12px;
	display: flex;
	flex-direction: column;
}
.field {
	display: flex;
	flex-direction: column;
	gap: 2px;
	margin-top: 8px;
	font-size: 0.85rem;
}
</style>
