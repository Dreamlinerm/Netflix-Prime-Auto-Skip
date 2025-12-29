<template>
	<div class="flex items-center">
		<RouterLinkUp v-if="!advancedSettings" />
		<h1 class="text-crunchyroll">
			{{ $t("pageSpecificTitle", ["Crunchyroll"]) }}
		</h1>
	</div>
	<template
		v-for="setting in settingsList"
		:key="setting"
	>
		<div class="p-1 m-0 flex">
			<div class="tooltip flex">
				<p>{{ $t(setting + "Switch") }}</p>
				<template v-if="!advancedSettings">
					<i-mdi-help-circle height="1rem" />
					<div
						class="tooltip-content text-primary-content"
						style="transform: unset; inset: auto auto var(--tt-off) 0%"
					>
						{{ $t(setting + "Description") }}
					</div>
				</template>
			</div>
			<Switch
				v-model="settings.Crunchyroll[setting]"
				class="ml-auto"
			></Switch>
		</div>
		<template v-if="advancedSettings">
			<p class="description">
				{{ $t(setting + "Description") }}
			</p>
			<hr />
		</template>
	</template>
	<div class="py-1 m-0 flex">
		<p>{{ $t("user") + " " }}</p>
		<!-- <p style="text-transform: capitalize">{{ settings.General.pr }}</p> -->
		<img
			style="margin-left: auto; height: 40px; border-radius: 4px; margin-right: 8px"
			alt="profile Picture"
			:src="
				settings.General.Crunchyroll_profilePicture
					? settings.General.Crunchyroll_profilePicture
					: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
			"
		/>
	</div>
	<hr v-if="advancedSettings" />
	<div class="p-1 m-0 flex">
		<div class="tooltip flex">
			<p class="whitespace-nowrap mr-2">{{ $t("crunchyrollDelay") }}</p>
			<template v-if="!advancedSettings">
				<i-mdi-help-circle height="1rem" />
				<div
					class="tooltip-content text-primary-content"
					style="transform: unset; inset: auto auto var(--tt-off) 0%"
				>
					{{ $t("crunchyrollDelayDescription") }}
				</div>
			</template>
		</div>
		<input
			type="number"
			v-model="settings.General.Crunchyroll_skipTimeout"
			@change="setTimeout(($event.target as HTMLInputElement).value)"
			class="w-full p-1 m-0 input border-inherit"
			min="0"
		/>
	</div>
	<template v-if="advancedSettings">
		<p class="description">
			{{ $t("crunchyrollDelayDescription") }}
		</p>
		<hr />
	</template>
</template>
<script setup lang="ts">
const optionsStore = useOptionsStore()
const { settings } = storeToRefs(optionsStore)
const props = defineProps({
	advancedSettings: {
		type: Boolean,
		default: false,
	},
})
const settingsList: Array<
	"skipIntro" | "skipCredits" | "skipAfterCredits" | "releaseCalendar" | "profile" | "bigPlayer" | "disableNumpad"
> = ["skipAfterCredits", "releaseCalendar", "bigPlayer", "disableNumpad", "profile"]
function setTimeout(num: string | null) {
	const parsed = parseInt(num || "0")
	if (parsed > 0) settings.value.General.Crunchyroll_skipTimeout = parsed
	else settings.value.General.Crunchyroll_skipTimeout = 0
}
</script>
<style scoped></style>
