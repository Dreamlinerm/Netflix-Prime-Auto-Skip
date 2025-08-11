<template>
	<div class="flex items-center">
		<RouterLinkUp v-if="!advancedSettings" />
		<h1 class="text-disney">
			{{ $t("pageSpecificTitle", ["Disney"]) }}
		</h1>
	</div>
	<div class="py-1 m-0 flex">
		<p>{{ $t("selfAdSwitch") }}</p>
		<div
			class="tooltip"
			v-if="!advancedSettings"
		>
			<i-mdi-help-circle height="1rem" />
			<div class="tooltip-content text-primary-content">
				{{ $t("selfAdDescription") }}
			</div>
		</div>
		<Switch
			v-model="settings.Disney.selfAd"
			class="ml-auto"
		></Switch>
	</div>
	<template v-if="advancedSettings">
		<p class="description">
			{{ $t("selfAdDescription") }}
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
</script>
<style scoped></style>
