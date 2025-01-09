<template>
	<div class="flex items-center">
		<h2 class="text-amazon">
			{{ $t("PageSpecificTitle", ["Prime Video"]) }}
		</h2>
	</div>
	<div class="line flex">
		<p>{{ $t("SelfAdsSwitch") }}</p>
		<Switch
			v-model="settings.Amazon.skipAd"
			class="ml-auto"
		></Switch>
	</div>
	<div class="line flex">
		<p>{{ $t("PaidContentSwitch") }}</p>
		<Switch
			v-model="settings.Amazon.filterPaid"
			class="ml-auto"
		></Switch>
	</div>
	<div class="line flex">
		<p>{{ $t("ContinuePositionSwitch") }}</p>
		<Switch
			v-model="settings.Amazon.continuePosition"
			class="ml-auto"
		></Switch>
	</div>
	<div class="line flex">
		<p>{{ $t("XraySwitch") }}</p>
		<Switch
			v-model="settings.Amazon.xray"
			class="ml-auto"
		></Switch>
	</div>
</template>
<script setup lang="ts">
const optionsStore = useOptionsStore()
const { settings } = storeToRefs(optionsStore)
</script>
<style scoped></style>
