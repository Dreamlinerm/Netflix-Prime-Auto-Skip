<script setup lang="ts">
const optionsStore = useOptionsStore()
const { settings } = storeToRefs(optionsStore)
const optionalSettings = computed({
	get: () => settings.value.Amazon.filterPaid && settings.value.Video.showYear,
	set: (value) => {
		settings.value.Amazon.filterPaid = value
		settings.value.Video.showYear = value
	},
})
</script>

<template>
	<div class="w-full h-full flex flex-col justify-center items-center text-center md:my-12">
		<h1>🎉 Installed! 🚀</h1>
		<p>
			Thank you for installing Streaming enhanced! ❤️
			<br />
			Turn on all optional features:
			<Switch
				v-model="optionalSettings"
				class="ml-auto"
			></Switch>
		</p>
	</div>
	<div class="py-1 m-0 flex">
		<p>{{ $t("filterPaidSwitch") }}</p>
		<Switch
			v-model="settings.Amazon.filterPaid"
			class="ml-auto"
		></Switch>
	</div>
	<p class="description">
		{{ $t("defaultfilterPaidDescription") }}
	</p>
	<hr />
	<div class="py-1 m-0 flex">
		<p>{{ $t("showYearSwitch") }}</p>
		<Switch
			v-model="settings.Video.showYear"
			class="ml-auto"
		></Switch>
	</div>
	<p class="description">
		{{ $t("showYearDescription") }}
	</p>
	<hr />
	<div class="py-1 m-0 flex">
		<p>{{ $t("epilepsySwitch") }}</p>
		<Switch
			v-model="settings.Video.epilepsy"
			class="ml-auto"
		></Switch>
	</div>
	<p class="description">
		{{ $t("epilepsyDescription") }}
	</p>
	<hr />
</template>
