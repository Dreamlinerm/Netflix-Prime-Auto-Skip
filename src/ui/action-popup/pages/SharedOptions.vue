<template>
	<div class="flex items-center">
		<RouterLinkUp />
		<h1 class="text-amazon">
			{{ $t("sharedPageTitle") }}
		</h1>
	</div>
	<div class="py-1 m-0 flex">
		<p>{{ $t("skipIntroSwitch") }}</p>
		<Switch
			v-model="skipIntro"
			class="ml-auto"
		></Switch>
	</div>
	<hr />
	<div class="py-1 m-0 flex">
		<p>{{ $t("skipCreditsSwitch") }}</p>
		<Switch
			v-model="skipCredits"
			class="ml-auto"
		></Switch>
	</div>
	<div class="py-1 m-0 flex">
		<p>{{ $t("watchCreditsSwitch") }}</p>
		<Switch
			v-model="watchCredits"
			class="ml-auto"
		></Switch>
	</div>
	<hr />
	<div class="py-1 m-0 flex">
		<p>{{ $t("skipAdSwitch") }}</p>
		<Switch
			v-model="blockAds"
			class="ml-auto"
		></Switch>
	</div>
	<div class="py-1 m-0 flex">
		<p>{{ $t("speedSliderSwitch") }}</p>
		<Switch
			v-model="speedSlider"
			class="ml-auto"
		></Switch>
	</div>
	<div class="py-1 m-0 flex">
		<p>{{ $t("fullscreenSwitch") }}</p>
		<Switch
			v-model="settings.Video.playOnFullScreen"
			class="ml-auto"
		></Switch>
	</div>
	<div class="py-1 m-0 flex">
		<p>{{ $t("doubleClickSwitch") }}</p>
		<Switch
			v-model="settings.Video.doubleClick"
			class="ml-auto"
		></Switch>
	</div>
	<div class="py-1 m-0 flex">
		<p>{{ $t("scrollVolumeSwitch") }}</p>
		<Switch
			v-model="settings.Video.scrollVolume"
			class="ml-auto"
		></Switch>
	</div>
	<div class="py-1 m-0 flex">
		<p>{{ $t("hideTitlesSwitch") }}</p>
		<Switch
			v-model="hideTitles"
			class="ml-auto"
		></Switch>
	</div>
	<div class="py-1 m-0 flex">
		<p>{{ $t("showRatingSwitch") }}</p>
		<Switch
			v-model="showRating"
			class="ml-auto"
		></Switch>
	</div>
	<div class="py-1 m-0 flex">
		<p>{{ $t("showYearSwitch") }}</p>
		<Switch
			v-model="settings.Video.showYear"
			class="ml-auto"
		></Switch>
	</div>
	<a
		href="https://www.themoviedb.org"
		target="_blank"
		class="py-1 m-0 flex"
	>
		<img
			src="@assets/TMDB.svg"
			alt="TMDB"
		/>
	</a>
	<!-- <div class="line flex">
		<p>{{ $t("affiliateSwitch") }}</p>
		<Switch
			v-model="settings.General.affiliate"
			class="ml-auto"
		></Switch>
	</div> -->
</template>
<script setup lang="ts">
const optionsStore = useOptionsStore()
const { settings } = storeToRefs(optionsStore)
type StreamingService = "Amazon" | "Netflix" | "Disney" | "Crunchyroll" | "HBO" | "Paramount"

const streamingServices: Array<StreamingService> = ["Amazon", "Netflix", "Disney", "Crunchyroll", "HBO", "Paramount"]

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
		if (value) {
			streamingServices.forEach((service) => {
				// @ts-expect-error ?. handles the error
				if (settings.value[service]?.watchCredits !== undefined) {
					// @ts-expect-error ?. handles the error
					settings.value[service].watchCredits = false
				}
			})
		}
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
		if (value) {
			streamingServices.forEach((service) => {
				// @ts-expect-error ?. handles the error
				if (settings.value[service]?.skipCredits !== undefined) {
					// @ts-expect-error ?. handles the error
					settings.value[service].skipCredits = false
				}
			})
		}
	},
})
const blockAds = computed({
	get: () =>
		settings.value?.Amazon.skipAd &&
		settings.value?.Netflix.skipAd &&
		settings.value?.Disney.skipAd &&
		settings.value?.Paramount.skipAd,
	set: (value) => {
		settings.value.Amazon.skipAd =
			settings.value.Netflix.skipAd =
			settings.value.Disney.skipAd =
			settings.value.Paramount.skipAd =
				value
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

const hideTitles = computed({
	get: () => settings.value?.Netflix.hideTitles && settings.value?.Disney.hideTitles,
	set: (value) => {
		settings.value.Netflix.hideTitles = settings.value.Disney.hideTitles = value
	},
})
</script>
<style scoped></style>
