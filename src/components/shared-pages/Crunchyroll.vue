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
			<p>{{ $t(setting + "Switch") }}</p>
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
const settingsList: Array<"skipIntro" | "releaseCalendar" | "profile" | "bigPlayer" | "disableNumpad"> = [
	"skipIntro",
	"releaseCalendar",
	"bigPlayer",
	"disableNumpad",
	"profile",
]
</script>
<style scoped></style>
