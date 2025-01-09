<template>
	<div class="flex items-center">
		<RouterLinkUp />
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
