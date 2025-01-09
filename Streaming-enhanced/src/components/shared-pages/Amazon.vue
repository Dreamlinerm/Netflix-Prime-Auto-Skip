<template>
	<div class="flex items-center">
		<RouterLinkUp />
		<h2 class="text-amazon">
			{{ $t("pageSpecificTitle", ["Prime Video"]) }}
		</h2>
	</div>
	<div
		v-for="setting in settingsList"
		:key="setting"
		class="line flex"
	>
		<p>{{ $t(setting + "Switch") }}</p>
		<Switch
			v-model="settings.Amazon[setting]"
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

const settingsList: Array<"skipAd" | "filterPaid" | "continuePosition" | "xray"> = [
	"skipAd",
	"filterPaid",
	"continuePosition",
	"xray",
]
</script>
<style scoped></style>
