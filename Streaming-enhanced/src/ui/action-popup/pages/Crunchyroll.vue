<template>
	<div class="flex items-center">
		<h2 class="text-crunchyroll">
			{{ $t("PageSpecificTitle", ["Crunchyroll"]) }}
		</h2>
	</div>
	<div class="line flex">
		<p>{{ $t("IntroSwitch") }}</p>
		<Switch
			v-model="settings.Crunchyroll.skipIntro"
			class="ml-auto"
		></Switch>
	</div>
	<div class="line flex">
		<p>{{ $t("ReleaseCalendarSwitch") }}</p>
		<Switch
			v-model="settings.Crunchyroll.releaseCalendar"
			class="ml-auto"
		></Switch>
	</div>
	<div class="line flex">
		<p>{{ $t("ProfileSwitch") }}</p>
		<Switch
			v-model="settings.Crunchyroll.profile"
			class="ml-auto"
		></Switch>
	</div>
	<div class="line flex">
		<p>{{ $t("BigPlayerSwitch") }}</p>
		<Switch
			v-model="settings.Crunchyroll.bigPlayer"
			class="ml-auto"
		></Switch>
	</div>
	<div class="line flex">
		<p>{{ $t("DisableNumpadSwitch") }}</p>
		<Switch
			v-model="settings.Crunchyroll.disableNumpad"
			class="ml-auto"
		></Switch>
	</div>
</template>
<script setup lang="ts">
const optionsStore = useOptionsStore()
const { settings } = storeToRefs(optionsStore)
</script>
<style scoped></style>
