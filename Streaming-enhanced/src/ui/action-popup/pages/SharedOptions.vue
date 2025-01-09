<template>
	<div class="flex items-center">
		<RouterLinkUp />
		<h2 class="text-amazon">
			{{ $t("SharedPageTitle") }}
		</h2>
	</div>
	<div class="p-1 m-0 flex">
		<p>{{ $t("IntroSwitch") }}</p>
		<Switch
			v-model="skipIntro"
			class="ml-auto"
		></Switch>
	</div>
	<hr />
	<div class="p-1 m-0 flex">
		<p>{{ $t("CreditsSwitch") }}</p>
		<Switch
			v-model="skipCredits"
			class="ml-auto"
		></Switch>
	</div>
	<div class="p-1 m-0 flex">
		<p>{{ $t("WatchCreditsSwitch") }}</p>
		<Switch
			v-model="watchCredits"
			class="ml-auto"
		></Switch>
	</div>
	<hr />
	<div class="p-1 m-0 flex">
		<p>{{ $t("AdsSwitch") }}</p>
		<Switch
			v-model="blockAds"
			class="ml-auto"
		></Switch>
	</div>
	<div class="p-1 m-0 flex">
		<p>{{ $t("SliderSwitch") }}</p>
		<Switch
			v-model="speedSlider"
			class="ml-auto"
		></Switch>
	</div>
	<div class="p-1 m-0 flex">
		<p>{{ $t("FullscreenSwitch") }}</p>
		<Switch
			v-model="settings.Video.playOnFullScreen"
			class="ml-auto"
		></Switch>
	</div>
	<div class="p-1 m-0 flex">
		<p>{{ $t("DoubleClickSwitch") }}</p>
		<Switch
			v-model="settings.Video.doubleClick"
			class="ml-auto"
		></Switch>
	</div>
	<div class="p-1 m-0 flex">
		<p>{{ $t("scrollVolumeSwitch") }}</p>
		<Switch
			v-model="settings.Video.scrollVolume"
			class="ml-auto"
		></Switch>
	</div>
	<div class="p-1 m-0 flex">
		<p>{{ $t("RatingSwitch") }}</p>
		<Switch
			v-model="showRating"
			class="ml-auto"
		></Switch>
	</div>
	<div class="p-1 m-0 flex">
		<p>{{ $t("ShowYearSwitch") }}</p>
		<Switch
			v-model="settings.Video.showYear"
			class="ml-auto"
		></Switch>
	</div>
	<a
		href="https://www.themoviedb.org"
		target="_blank"
		class="p-1 m-0 flex"
	>
		<img
			src="@assets/TMDB.svg"
			alt="TMDB"
		/>
	</a>
</template>
<script setup lang="ts">
const optionsStore = useOptionsStore()
const { settings } = storeToRefs(optionsStore)
type StreamingService = "Amazon" | "Netflix" | "Disney" | "Crunchyroll" | "HBO"

const streamingServices: Array<StreamingService> = ["Amazon", "Netflix", "Disney", "Crunchyroll", "HBO"]

const skipIntro = computed({
	get: () => streamingServices.every((service) => settings.value[service].skipIntro),
	set: (value) => {
		streamingServices.forEach((service) => {
			settings.value[service].skipIntro = value
		})
	},
})

const skipCredits = computed({
	// @ts-expect-error ?. handles the error
	get: () => streamingServices.every((service) => settings.value[service]?.skipCredits ?? true),
	set: (value) => {
		streamingServices.forEach((service) => {
			// @ts-expect-error ?. handles the error
			if (settings.value[service]?.skipCredits !== undefined) {
				// @ts-expect-error ?. handles the error
				settings.value[service].skipCredits = value
			}
		})
		streamingServices.forEach((service) => {
			// @ts-expect-error ?. handles the error
			if (settings.value[service]?.watchCredits !== undefined) {
				// @ts-expect-error ?. handles the error
				settings.value[service].watchCredits = !value
			}
		})
	},
})

const watchCredits = computed({
	// @ts-expect-error ?. handles the error
	get: () => streamingServices.every((service) => settings.value[service]?.watchCredits ?? true),
	set: (value) => {
		streamingServices.forEach((service) => {
			// @ts-expect-error ?. handles the error
			if (settings.value[service]?.watchCredits !== undefined) {
				// @ts-expect-error ?. handles the error
				settings.value[service].watchCredits = value
			}
		})
		streamingServices.forEach((service) => {
			// @ts-expect-error ?. handles the error
			if (settings.value[service]?.skipCredits !== undefined) {
				// @ts-expect-error ?. handles the error
				settings.value[service].skipCredits = !value
			}
		})
	},
})
const blockAds = computed({
	get: () => settings.value?.Amazon.blockFreevee && settings.value?.Netflix.skipAd && settings.value?.Disney.skipAd,
	set: (value) => {
		settings.value.Amazon.blockFreevee = settings.value.Netflix.skipAd = settings.value.Disney.skipAd = value
	},
})

const speedSlider = computed({
	get: () => streamingServices.every((service) => settings.value[service].speedSlider),
	set: (value) => {
		streamingServices.forEach((service) => {
			settings.value[service].speedSlider = value
		})
	},
})

const showRating = computed({
	// @ts-expect-error ?. handles the error
	get: () => streamingServices.every((service) => settings.value[service]?.showRating ?? true),
	set: (value) => {
		streamingServices.forEach((service) => {
			// @ts-expect-error ?. handles the error
			if (settings.value[service]?.showRating !== undefined) {
				// @ts-expect-error ?. handles the error
				settings.value[service].showRating = value
			}
		})
	},
})
</script>
<style scoped></style>
