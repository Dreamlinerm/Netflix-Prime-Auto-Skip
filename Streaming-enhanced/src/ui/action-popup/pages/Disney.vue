<template>
	<div class="flex items-center">
		<h2 class="text-disney">
			{{ $t("PageSpecificTitle", ["Disney"]) }}
		</h2>
	</div>
	<div class="line flex">
		<p>{{ $t("SelfAdsSwitch") }}</p>
		<Switch
			v-model="settings.Disney.selfAd"
			class="ml-auto"
		></Switch>
	</div>
</template>
<script setup lang="ts">
const optionsStore = useOptionsStore()
const { settings } = storeToRefs(optionsStore)
</script>
<style scoped></style>
