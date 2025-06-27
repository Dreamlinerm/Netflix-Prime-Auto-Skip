<script setup lang="ts">
import { Sketch } from "@ckpack/vue-color"
const optionsStore = useOptionsStore()
const { settings } = storeToRefs(optionsStore)

type StreamingService = "Amazon" | "Netflix" | "Disney" | "Crunchyroll" | "HBO"

const streamingServices: Array<StreamingService> = ["Amazon", "Netflix", "Disney", "Crunchyroll", "HBO"]

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

const hideTitlesStore = useHideTitlesStore()
const { hideTitles } = storeToRefs(hideTitlesStore)
function removeTitle(title: string) {
	delete hideTitles.value[title]
}
function removeAllTitles() {
	hideTitles.value = {}
}
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
	<!-- <hr />
	<div class="line flex">
		<p>{{ $t("affiliateSwitch") }}</p>
		<Switch
			v-model="settings.General.affiliate"
			class="ml-auto"
		></Switch>
	</div>
	<p class="description">{{ $t("affiliateDescription") }}</p> -->
	<OptionsPageSettingsTable></OptionsPageSettingsTable>
	<OptionalPermission />
	<hr />
	<div>
		<div class="line flex">
			<p>{{ $t("dimLowRatings") }}</p>
			<Switch
				v-model="settings.Video.dimLowRatings"
				class="ml-auto"
			></Switch>
		</div>
		<p class="description">
			{{ $t("dimmDescription") }}
		</p>
		<hr />
		<p>{{ $t("editRatings") }}</p>
		<table>
			<thead>
				<tr>
					<th>{{ $t("pickColor") }}</th>
					<th>{{ $t("pickRating") }}</th>
				</tr>
			</thead>
			<tbody>
				<tr
					v-for="(threshold, index) in settings.General.RatingThresholds"
					:key="index"
				>
					<td>
						<div class="dropdown">
							<div
								style="width: 30px; height: 30px"
								:style="{ backgroundColor: threshold.color }"
								tabindex="0"
								role="button"
							></div>
							<div
								tabindex="0"
								class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm z-10"
							>
								<ColorPicker v-model="threshold.color" />
								<button
									@click="threshold.color = defaultSettings.General.RatingThresholds[index].color"
									class="btn btn-error"
								>
									{{ $t("reset") }}
								</button>
							</div>
						</div>
					</td>
					<td>
						<=
						<input
							v-model="threshold.value"
							type="number"
							class="input border-inherit"
							:disabled="threshold.value === 10"
						/>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
	<hr />
	<div class="line flex">
		<p>{{ $t("fullscreenSwitch") }}</p>
		<Switch
			v-model="settings.Video.playOnFullScreen"
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
		<p>{{ $t("speedSliderSwitch") }}</p>
		<Switch
			v-model="speedSlider"
			class="ml-auto"
		></Switch>
	</div>
	<p class="description">
		{{ $t("speedSliderDescription") }}
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
	<hr />
	<p>{{ $t("hiddenTitles") }}</p>
	<button
		class="btn btn-sm btn-error mb-2"
		@click="removeAllTitles"
	>
		{{ $t("removeAllHiddenTitles") }}
	</button>
	<div class="grid-container">
		<div
			v-for="(title, index) in Object.keys(hideTitles)"
			:key="index"
			class="grid-item"
		>
			{{ title }}
			<i-mdi-delete
				class="text-error cursor-pointer min-w-6"
				@click="removeTitle(title)"
			/>
		</div>
	</div>
	<!-- <div style="margin-top: 5%"></div> -->
</template>
<style scoped>
.grid-container {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
	gap: 10px;
	max-height: 24rem; /* Adjust height as needed */
	overflow-y: auto;
}
.grid-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 5px;
	border: 1px solid #ccc;
	border-radius: 5px;
}
</style>
