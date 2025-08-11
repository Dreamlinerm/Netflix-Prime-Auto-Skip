<template>
	<div class="flex items-center">
		<RouterLinkUp />
		<h1 class="text-amazon">
			{{ $t("sharedPageTitle") }}
		</h1>
	</div>
	<div class="py-1 m-0 flex">
		<p>{{ $t("skipIntroSwitch") }}</p>
		<div class="tooltip">
			<i-mdi-help-circle height="1rem" />
			<div class="tooltip-content text-primary-content">
				{{ $t("skipIntroDescription") }}
			</div>
		</div>
		<Switch
			v-model="skipIntro"
			class="ml-auto"
		></Switch>
	</div>
	<hr />
	<div class="py-1 m-0 flex">
		<p>{{ $t("skipCreditsSwitch") }}</p>
		<div class="tooltip">
			<i-mdi-help-circle height="1rem" />
			<div class="tooltip-content text-primary-content">
				{{ $t("skipCreditsDescription") }}
			</div>
		</div>
		<Switch
			v-model="skipCredits"
			class="ml-auto"
		></Switch>
	</div>
	<div class="py-1 m-0 flex">
		<p>{{ $t("watchCreditsSwitch") }}</p>
		<div class="tooltip">
			<i-mdi-help-circle height="1rem" />
			<div class="tooltip-content text-primary-content">
				{{ $t("watchCreditsDescription") }}
			</div>
		</div>
		<Switch
			v-model="watchCredits"
			class="ml-auto"
		></Switch>
	</div>
	<hr />
	<div class="py-1 m-0 flex">
		<p>{{ $t("skipAdSwitch") }}</p>
		<div class="tooltip">
			<i-mdi-help-circle height="1rem" />
			<div class="tooltip-content text-primary-content">
				{{ $t("skipAdDescription") }}
			</div>
		</div>
		<Switch
			v-model="blockAds"
			class="ml-auto"
		></Switch>
	</div>
	<div class="py-1 m-0 flex">
		<p>{{ $t("speedSliderSwitch") }}</p>
		<div class="tooltip">
			<i-mdi-help-circle height="1rem" />
			<div class="tooltip-content text-primary-content">
				{{ $t("speedSliderDescription") }}
			</div>
		</div>
		<Switch
			v-model="speedSlider"
			class="ml-auto"
		></Switch>
	</div>
	<div class="py-1 m-0 flex">
		<p>{{ $t("fullscreenSwitch") }}</p>
		<div class="tooltip">
			<i-mdi-help-circle height="1rem" />
			<div class="tooltip-content text-primary-content">
				{{ $t("fullscreenDescription") }}
			</div>
		</div>
		<Switch
			v-model="settings.Video.playOnFullScreen"
			class="ml-auto"
		></Switch>
	</div>
	<div class="py-1 m-0 flex">
		<p>{{ $t("doubleClickSwitch") }}</p>
		<div class="tooltip">
			<i-mdi-help-circle height="1rem" />
			<div class="tooltip-content text-primary-content">
				{{ $t("doubleClickDescription") }}
			</div>
		</div>
		<Switch
			v-model="settings.Video.doubleClick"
			class="ml-auto"
		></Switch>
	</div>
	<div class="py-1 m-0 flex">
		<p>{{ $t("scrollVolumeSwitch") }}</p>
		<div class="tooltip">
			<i-mdi-help-circle height="1rem" />
			<div class="tooltip-content text-primary-content">
				{{ $t("scrollVolumeDescription") }}
			</div>
		</div>
		<Switch
			v-model="settings.Video.scrollVolume"
			class="ml-auto"
		></Switch>
	</div>
	<div class="py-1 m-0 flex">
		<p>{{ $t("hideTitlesSwitch") }}</p>
		<div class="tooltip">
			<i-mdi-help-circle height="1rem" />
			<div class="tooltip-content text-primary-content">
				{{ $t("hideTitlesDescription") }}
			</div>
		</div>
		<Switch
			v-model="hideTitles"
			class="ml-auto"
		></Switch>
	</div>
	<div class="py-1 m-0 flex">
		<p>{{ $t("showRatingSwitch") }}</p>
		<div class="tooltip">
			<i-mdi-help-circle height="1rem" />
			<div class="tooltip-content text-primary-content">
				{{ $t("showRatingDescription") }}
			</div>
		</div>
		<Switch
			v-model="showRating"
			class="ml-auto"
		></Switch>
	</div>
	<div class="py-1 m-0 flex">
		<p>{{ $t("showYearSwitch") }}</p>
		<div class="tooltip">
			<i-mdi-help-circle height="1rem" />
			<div class="tooltip-content text-primary-content">
				{{ $t("showYearDescription") }}
			</div>
		</div>
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
	get: () => streamingServices.every((service) => settings.value[service]?.skipCredits ?? true),
	set: (value) => {
		streamingServices.forEach((service) => {
			if (settings.value[service]?.skipCredits !== undefined) {
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
				if (settings.value[service]?.skipCredits !== undefined) {
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
