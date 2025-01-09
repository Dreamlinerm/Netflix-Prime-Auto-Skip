<template>
	<div class="flex items-center">
		<RouterLinkUp />
		<h2 class="text-disney">
			{{ $t("pageSpecificTitle", ["Disney"]) }}
		</h2>
	</div>
	<div class="line flex">
		<p>{{ $t("selfAdSwitch") }}</p>
		<Switch
			v-model="settings.Disney.selfAd"
			class="ml-auto"
		></Switch>
		<p
			v-if="advancedSettings"
			class="description"
		>
			{{ $t("selfAdDescription") }}
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
</script>
<style scoped></style>
