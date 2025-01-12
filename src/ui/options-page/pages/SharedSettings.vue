<script setup lang="ts">
const optionsStore = useOptionsStore()
const { settings } = storeToRefs(optionsStore)

type StreamingService = "Amazon" | "Netflix" | "Disney" | "Crunchyroll" | "HBO"

const streamingServices: Array<StreamingService> = ["Amazon", "Netflix", "Disney", "Crunchyroll", "HBO"]

const fullScreen = computed({
	// @ts-expect-error ?. handles the error
	get: () => streamingServices.every((service) => settings.value[service]?.fullScreen ?? true),
	set: (value) => {
		streamingServices.forEach((service) => {
			// @ts-expect-error ?. handles the error
			if (settings.value[service]?.fullScreen !== undefined) {
				// @ts-expect-error ?. handles the error
				settings.value[service].fullScreen = value
			}
		})
	},
})

const speedSlider = computed({
	get: () => streamingServices.every((service) => settings.value[service]?.speedSlider ?? true),
	set: (value) => {
		streamingServices.forEach((service) => {
			if (settings.value[service]?.speedSlider !== undefined) {
				settings.value[service].speedSlider = value
			}
		})
	},
})
const SliderPreview = ref(10)
const isMobile = /mobile|streamingEnhanced/i.test(navigator.userAgent)
</script>
<template>
	<h1>{{ $t("sharedPageTitle") }}</h1>
	<p class="description">{{ $t("sharedPageDescription") }}</p>
	<div :class="isMobile ? '' : 'hidden'">
		<hr />
		<div class="line flex">
			<p>{{ $t("userAgentSwitch") }}</p>
			<Switch
				v-model="settings.Video.userAgent"
				class="ml-auto"
			></Switch>
		</div>
		<p class="description">{{ $t("userAgentDescription") }}</p>
	</div>
	<hr />
	<div class="line flex">
		<p>{{ $t("affiliateSwitch") }}</p>
		<Switch
			v-model="settings.General.affiliate"
			class="ml-auto"
		></Switch>
	</div>
	<p class="description">{{ $t("affiliateDescription") }}</p>
	<OptionsPageSettingsTable></OptionsPageSettingsTable>
	<OptionalPermission />
	<hr />
	<div class="line flex">
		<p>{{ $t("fullscreenSwitch") }}</p>
		<Switch
			v-model="fullScreen"
			class="ml-auto"
		></Switch>
	</div>
	<p class="description">
		{{ $t("fullscreenDescription") }}
	</p>
	<hr />
	<div class="line flex">
		<p>{{ $t("doubleClickSwitch") }}</p>
		<Switch
			v-model="settings.Video.doubleClick"
			class="ml-auto"
		></Switch>
	</div>
	<p class="description">
		{{ $t("doubleClickDescription") }}
	</p>
	<hr />
	<div class="line flex">
		<p>{{ $t("scrollVolumeSwitch") }}</p>
		<Switch
			v-model="settings.Video.scrollVolume"
			class="ml-auto"
		></Switch>
	</div>
	<p class="description">
		{{ $t("scrollVolumeDescription") }}
	</p>
	<hr />
	<div class="line flex">
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
	<div class="line flex">
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
	<div class="line flex">
		<p>{{ $t("sliderSwitch") }}</p>
		<Switch
			v-model="speedSlider"
			class="ml-auto"
		></Switch>
	</div>
	<p class="description">
		{{ $t("sliderDescription") }}
	</p>
	<p>{{ $t("sliderOptions") }}</p>
	<table>
		<tbody>
			<tr>
				<td>
					<p>{{ $t("sliderStepSize") }}</p>
				</td>
				<td>
					<input
						v-model="settings.General.sliderSteps"
						type="number"
						class="input border-inherit"
					/>
				</td>
			</tr>
			<tr>
				<td>
					<p>{{ $t("sliderMin") }}</p>
				</td>
				<td>
					<input
						v-model="settings.General.sliderMin"
						type="number"
						class="input border-inherit"
					/>
				</td>
			</tr>
			<tr>
				<td>
					<p>{{ $t("sliderMax") }}</p>
				</td>
				<td>
					<input
						v-model="settings.General.sliderMax"
						type="number"
						class="input border-inherit"
					/>
				</td>
			</tr>
			<tr>
				<td>
					<p>{{ $t("sliderPreview") }}</p>
				</td>
				<td>
					<div class="flex">
						<input
							v-model="SliderPreview"
							type="range"
							:min="settings.General.sliderMin"
							:max="settings.General.sliderMax"
							value="1.0"
							:step="settings.General.sliderSteps"
							style="background: rgb(221, 221, 221); width: 200px"
						/>
						<p>{{ SliderPreview / 10 + "x" }}</p>
					</div>
				</td>
			</tr>
		</tbody>
	</table>
	<!-- <div style="margin-top: 5%"></div> -->
</template>
