<template>
	<div class="flex items-center">
		<RouterLinkUp />
		<h2 class="text-crunchyroll">
			{{ $t("pageSpecificTitle", ["Crunchyroll"]) }}
		</h2>
	</div>
	<div
		v-for="setting in settingsList"
		:key="setting"
		class="line flex"
	>
		<p>{{ $t(setting + "Switch") }}</p>
		<Switch
			v-model="settings.Crunchyroll[setting]"
			class="ml-auto"
		></Switch>
		<p
			v-if="advancedSettings"
			class="description"
		>
			{{ $t(setting + "Description") }}
		</p>
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
	"profile",
	"bigPlayer",
	"disableNumpad",
]
</script>
<style scoped></style>
