<script setup lang="ts">
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const optionsStore = useOptionsStore()
const { settings } = storeToRefs(optionsStore)

async function resetAddon() {
	if (confirm(t("resetConfirm"))) {
		await chrome.storage.local.clear()
		await chrome.storage.sync.clear()
		// settings.value = defaultSettings
		location.reload()
	}
}
let file = new Blob([JSON.stringify(settings.value)], { type: "text/json" })
const href = URL.createObjectURL(file)

function replaceSettings(event: Event) {
	const input = event.target as HTMLInputElement
	const file = input.files?.[0]
	if (file === undefined || file.type !== "application/json") {
		alert(t("invalidJson"))
		return
	} else {
		const reader = new FileReader()
		reader.addEventListener("load", (e) => {
			try {
				const data = JSON.parse(e.target?.result as string)
				settings.value = data
			} catch (e) {
				alert(t("invalidJson"))
				return
			}
		})
		reader.readAsText(file)
	}
}
</script>

<template>
	<div>
		<div class="flex flex-col flex-align">
			<h2>{{ $t("importSettings") }}</h2>
			<div>
				<a
					class="btn btn-secondary rounded-2xl my-2"
					:href="href"
					download="settings.json"
				>
					{{ $t("saveSettings") }}
				</a>
			</div>
			<div class="flex flex-row flex-align">
				<p>{{ $t("uploadSettings") }}</p>
				<input
					type="file"
					name="settings"
					accept="text/json"
					class="file-input w-full max-w-xs"
					@change="replaceSettings"
				/>
			</div>
			<!-- <div class="flex flex-row flex-align">
				<input
					type="file"
					name="settings"
					accept="text/json"
				/>
				<div class="btn btn-secondary rounded-2xl">{{ $t("uploadSettings") }}</div>
			</div> -->
		</div>
	</div>
	<div
		class="btn btn-secondary rounded-2xl reset my-2"
		@click="resetAddon"
	>
		{{ $t("resetAddon") }}
	</div>
</template>
