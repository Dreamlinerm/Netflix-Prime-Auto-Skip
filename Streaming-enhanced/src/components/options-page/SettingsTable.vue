<template>
	<table
		style="border: 1px solid white"
		class="featureTable"
	>
		<tr>
			<th class="whitespace-nowrap">{{ $t("Feature") }}</th>
			<th>{{ $t("Shared") }}</th>
			<th>Netflix</th>
			<th>Prime</th>
			<th>Disney+</th>
			<th>Crunchyroll</th>
			<th>HBO</th>
		</tr>
		<tr>
			<td class="tooltip">
				<p>{{ $t("IntroSwitch") }}</p>
				<p class="tooltiptext">{{ $t("SharedIntroDescription") }}</p>
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
				<p>{{ $t("CreditsSwitch") }}</p>
				<p class="tooltiptext">{{ $t("CreditsSwitchDescription") }}</p>
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
				<p>{{ $t("WatchCreditsSwitch") }}</p>
				<p class="tooltiptext">{{ $t("WatchCreditsSwitchDescription") }}</p>
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
				<p>{{ $t("AdsSwitch") }}</p>
				<p class="tooltiptext">{{ $t("AdsSwitchDescription") }}</p>
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
					v-model="settings.Amazon.blockFreevee"
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
				<p>{{ $t("RatingSwitch") }}</p>
				<p class="tooltiptext">{{ $t("RatingSwitchDescription") }}</p>
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
				<p>{{ $t("SliderSwitch") }}</p>
				<p class="tooltiptext">{{ $t("SliderSwitchDescription") }}</p>
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
					settings.value[service].watchCredits = !value
				}
			})
		}
	},
})

const AmazonSkipCredits = computed({
	get: () => settings.value.Amazon.skipCredits,
	set: (value) => {
		settings.value.Amazon.skipCredits = value
		if (value) settings.value.Amazon.watchCredits = !value
	},
})
const NetflixSkipCredits = computed({
	get: () => settings.value.Netflix.skipCredits,
	set: (value) => {
		settings.value.Netflix.skipCredits = value
		if (value) settings.value.Netflix.watchCredits = !value
	},
})
const DisneySkipCredits = computed({
	get: () => settings.value.Disney.skipCredits,
	set: (value) => {
		settings.value.Disney.skipCredits = value
		if (value) settings.value.Disney.watchCredits = !value
	},
})
const HBOSkipCredits = computed({
	get: () => settings.value.HBO.skipCredits,
	set: (value) => {
		settings.value.HBO.skipCredits = value
		if (value) settings.value.HBO.watchCredits = !value
	},
})

const AmazonWatchCredits = computed({
	get: () => settings.value.Amazon.watchCredits,
	set: (value) => {
		settings.value.Amazon.watchCredits = value
		if (value) settings.value.Amazon.skipCredits = !value
	},
})
const NetflixWatchCredits = computed({
	get: () => settings.value.Netflix.watchCredits,
	set: (value) => {
		settings.value.Netflix.watchCredits = value
		if (value) settings.value.Netflix.skipCredits = !value
	},
})
const DisneyWatchCredits = computed({
	get: () => settings.value.Disney.watchCredits,
	set: (value) => {
		settings.value.Disney.watchCredits = value
		if (value) settings.value.Disney.skipCredits = !value
	},
})
const HBOWatchCredits = computed({
	get: () => settings.value.HBO.watchCredits,
	set: (value) => {
		settings.value.HBO.watchCredits = value
		if (value) settings.value.HBO.skipCredits = !value
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
					settings.value[service].skipCredits = !value
				}
			})
		}
	},
})
const skipAd = computed({
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

<style scoped>
.featureTable tr *:nth-of-type(2) {
	border-right: 1px solid white;
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
	background-color: #fff;
	color: #000;
	text-align: center;
	border-radius: 6px;
	padding: 5px 0;
	position: absolute;
	z-index: 1;
	bottom: 100%;
	left: 0%;
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
