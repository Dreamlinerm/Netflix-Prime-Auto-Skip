<template>
	<!-- <div class=" flex flex-align">
	<svg style="padding-right: 20px" id="backButton" xmlns="http://www.w3.org/2000/svg" height="50px"
		viewBox="0 0 24 24" fill="#fff">
		<path id="backButton" d="M0 0h24v24H0V0z" fill="none" />
		<path id="backButton" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
	</svg>
	<h2 data-i18n style="color: #00aeef">PageSpecificTitle;Prime Video</h2>
</div> -->
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
