<template>
	<table class="featureTable">
		<thead>
			<tr>
				<th class="whitespace-nowrap">{{ $t("feature") }}</th>
				<th>{{ $t("shared") }}</th>
				<th>Netflix</th>
				<th>Prime</th>
				<th>Disney+</th>
				<th>Crunchyroll</th>
				<th>HBO</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td class="tooltip">
					<p>{{ $t("skipIntroSwitch") }}</p>
					<p class="tooltiptext">{{ $t("skipIntroDescription") }}</p>
				</td>
				<td>
					<Switch
						v-model="skipIntro"
						class="ml-auto"
					></Switch>
				</td>
				<td>
					<Switch
						v-model="settings.Netflix.skipIntro"
						class="ml-auto"
					></Switch>
				</td>
				<td>
					<Switch
						v-model="settings.Amazon.skipIntro"
						class="ml-auto"
					></Switch>
				</td>
				<td>
					<Switch
						v-model="settings.Disney.skipIntro"
						class="ml-auto"
					></Switch>
				</td>
				<td>
					<Switch
						v-model="settings.Crunchyroll.skipIntro"
						class="ml-auto"
					></Switch>
				</td>
				<td>
					<Switch
						v-model="settings.HBO.skipIntro"
						class="ml-auto"
					></Switch>
				</td>
			</tr>
			<tr>
				<td class="tooltip">
					<p>{{ $t("creditsSwitch") }}</p>
					<p class="tooltiptext">{{ $t("creditsDescription") }}</p>
				</td>
				<td>
					<Switch
						v-model="skipCredits"
						class="ml-auto"
					></Switch>
				</td>
				<td>
					<Switch
						v-model="NetflixSkipCredits"
						class="ml-auto"
					></Switch>
				</td>
				<td>
					<Switch
						v-model="AmazonSkipCredits"
						class="ml-auto"
					></Switch>
				</td>
				<td>
					<Switch
						v-model="DisneySkipCredits"
						class="ml-auto"
					></Switch>
				</td>
				<td>➖</td>
				<td>
					<Switch
						v-model="HBOSkipCredits"
						class="ml-auto"
					></Switch>
				</td>
			</tr>
			<tr>
				<td class="tooltip">
					<p>{{ $t("watchCreditsSwitch") }}</p>
					<p class="tooltiptext">{{ $t("watchCreditsDescription") }}</p>
				</td>
				<td>
					<Switch
						v-model="watchCredits"
						class="ml-auto"
					></Switch>
				</td>
				<td>
					<Switch
						v-model="NetflixWatchCredits"
						class="ml-auto"
					></Switch>
				</td>
				<td>
					<Switch
						v-model="AmazonWatchCredits"
						class="ml-auto"
					></Switch>
				</td>
				<td>
					<Switch
						v-model="DisneyWatchCredits"
						class="ml-auto"
					></Switch>
				</td>
				<td>➖</td>
				<td>
					<Switch
						v-model="HBOWatchCredits"
						class="ml-auto"
					></Switch>
				</td>
			</tr>
			<tr>
				<td class="tooltip">
					<p>{{ $t("skipAdSwitch") }}</p>
					<p class="tooltiptext">{{ $t("skipAdDescription") }}</p>
				</td>
				<td>
					<Switch
						v-model="skipAd"
						class="ml-auto"
					></Switch>
				</td>
				<td>
					<Switch
						v-model="settings.Netflix.skipAd"
						class="ml-auto"
					></Switch>
				</td>
				<td>
					<Switch
						v-model="settings.Amazon.skipAd"
						class="ml-auto"
					></Switch>
				</td>
				<td>
					<Switch
						v-model="settings.Disney.skipAd"
						class="ml-auto"
					></Switch>
				</td>
				<td>➖</td>
				<td>➖</td>
			</tr>
			<tr>
				<td class="tooltip">
					<p>{{ $t("ratingSwitch") }}</p>
					<p class="tooltiptext">{{ $t("ratingDescription") }}</p>
				</td>
				<td>
					<Switch
						v-model="showRating"
						class="ml-auto"
					></Switch>
				</td>
				<td>
					<Switch
						v-model="settings.Netflix.showRating"
						class="ml-auto"
					></Switch>
				</td>
				<td>
					<Switch
						v-model="settings.Amazon.showRating"
						class="ml-auto"
					></Switch>
				</td>
				<td>
					<Switch
						v-model="settings.Disney.showRating"
						class="ml-auto"
					></Switch>
				</td>
				<td>➖</td>
				<td>
					<Switch
						v-model="settings.HBO.showRating"
						class="ml-auto"
					></Switch>
				</td>
			</tr>
			<tr>
				<td class="tooltip">
					<p>{{ $t("sliderSwitch") }}</p>
					<p class="tooltiptext">{{ $t("sliderDescription") }}</p>
				</td>
				<td>
					<Switch
						v-model="speedSlider"
						class="ml-auto"
					></Switch>
				</td>
				<td>
					<Switch
						v-model="settings.Netflix.speedSlider"
						class="ml-auto"
					></Switch>
				</td>
				<td>
					<Switch
						v-model="settings.Amazon.speedSlider"
						class="ml-auto"
					></Switch>
				</td>
				<td>
					<Switch
						v-model="settings.Disney.speedSlider"
						class="ml-auto"
					></Switch>
				</td>
				<td>
					<Switch
						v-model="settings.Crunchyroll.speedSlider"
						class="ml-auto"
					></Switch>
				</td>
				<td>
					<Switch
						v-model="settings.HBO.speedSlider"
						class="ml-auto"
					></Switch>
				</td>
			</tr>
		</tbody>
	</table>
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

const AmazonSkipCredits = computed({
	get: () => settings.value.Amazon.skipCredits,
	set: (value) => {
		settings.value.Amazon.skipCredits = value
		if (value) settings.value.Amazon.watchCredits = false
	},
})
const NetflixSkipCredits = computed({
	get: () => settings.value.Netflix.skipCredits,
	set: (value) => {
		settings.value.Netflix.skipCredits = value
		if (value) settings.value.Netflix.watchCredits = false
	},
})
const DisneySkipCredits = computed({
	get: () => settings.value.Disney.skipCredits,
	set: (value) => {
		settings.value.Disney.skipCredits = value
		if (value) settings.value.Disney.watchCredits = false
	},
})
const HBOSkipCredits = computed({
	get: () => settings.value.HBO.skipCredits,
	set: (value) => {
		settings.value.HBO.skipCredits = value
		if (value) settings.value.HBO.watchCredits = false
	},
})

const AmazonWatchCredits = computed({
	get: () => settings.value.Amazon.watchCredits,
	set: (value) => {
		settings.value.Amazon.watchCredits = value
		if (value) settings.value.Amazon.skipCredits = false
	},
})
const NetflixWatchCredits = computed({
	get: () => settings.value.Netflix.watchCredits,
	set: (value) => {
		settings.value.Netflix.watchCredits = value
		if (value) settings.value.Netflix.skipCredits = false
	},
})
const DisneyWatchCredits = computed({
	get: () => settings.value.Disney.watchCredits,
	set: (value) => {
		settings.value.Disney.watchCredits = value
		if (value) settings.value.Disney.skipCredits = false
	},
})
const HBOWatchCredits = computed({
	get: () => settings.value.HBO.watchCredits,
	set: (value) => {
		settings.value.HBO.watchCredits = value
		if (value) settings.value.HBO.skipCredits = false
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
const skipAd = computed({
	get: () => settings.value?.Amazon.skipAd && settings.value?.Netflix.skipAd && settings.value?.Disney.skipAd,
	set: (value) => {
		settings.value.Amazon.skipAd = settings.value.Netflix.skipAd = settings.value.Disney.skipAd = value
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

<style scoped>
table {
	@apply border-[1px] border-solid border-primary-content;
}
.featureTable tr *:nth-of-type(2) {
	@apply border-r-[1px] border-primary-content;
}
.featureTable tr td:nth-of-type(2) label {
	margin-right: 20px;
}
.featureTable {
	border-collapse: collapse;
}
th,
td {
	text-align: center;
}
p {
	@apply m-0;
}

.tooltip {
	border-bottom: 1px dotted white;
	@apply whitespace-nowrap inline-block relative;
}

.tooltip .tooltiptext {
	visibility: hidden;
	width: 300px;
	color: #000;
	text-align: center;
	border-radius: 6px;
	padding: 5px 0;
	position: absolute;
	z-index: 1;
	bottom: 100%;
	left: 0%;
	@apply bg-primary-content text-primary;
}
.tooltiptext {
	white-space: normal;
}
.tooltip .tooltiptext::after {
	content: "";
	position: absolute;
	top: 100%;
	left: 50%;
	margin-left: -5px;
	border-width: 5px;
	border-style: solid;
	border-color: #fff transparent transparent transparent;
}

.tooltip:hover .tooltiptext {
	visibility: visible;
}
</style>
