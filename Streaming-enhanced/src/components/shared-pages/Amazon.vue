<template>
	<div class="flex items-center">
		<RouterLinkUp v-if="!advancedSettings" />
		<h1 class="text-amazon">
			{{ $t("pageSpecificTitle", ["Prime Video"]) }}
		</h1>
	</div>
	<template
		v-for="setting in settingsList"
		:key="setting"
	>
		<div class="p-1 m-0 flex">
			<p>{{ $t(setting + "Switch") }}</p>
			<Switch
				v-model="settings.Amazon[setting]"
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

const settingsList: Array<"skipAd" | "filterPaid" | "continuePosition" | "xray"> = [
	"skipAd",
	"filterPaid",
	"continuePosition",
	"xray",
]
</script>
<style scoped></style>
