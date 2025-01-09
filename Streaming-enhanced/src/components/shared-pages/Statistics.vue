<template>
	<div class="flex items-center">
		<RouterLinkUp />
		<h2>
			{{ $t("skippedTime") }}
		</h2>
	</div>
	<div class="line flex flex-between">
		<p>{{ $t("statisticAd", ["Amazon"]) }}</p>
		<p>{{ getTimeFormatted(settings.Statistics.AmazonAdTimeSkipped) }}</p>
	</div>
	<div class="line flex flex-between">
		<p>{{ $t("statisticAd", ["Netflix"]) }}</p>
		<p>{{ getTimeFormatted(settings.Statistics.NetflixAdTimeSkipped) }}</p>
	</div>
	<div class="line flex flex-between">
		<p>{{ $t("statisticAd", ["Disney"]) }}</p>
		<p>{{ getTimeFormatted(settings.Statistics.DisneyAdTimeSkipped) }}</p>
	</div>
	<div class="line flex flex-between">
		<p>{{ $t("statisticIntro") }}</p>
		<p>{{ getTimeFormatted(settings.Statistics.IntroTimeSkipped) }}</p>
	</div>
	<div class="line flex flex-between">
		<p>{{ $t("statisticRecap") }}</p>
		<p>{{ getTimeFormatted(settings.Statistics.RecapTimeSkipped) }}</p>
	</div>
	<div class="line flex flex-between">
		<p>{{ $t("statisticSegments") }}</p>
		<p>{{ settings.Statistics.SegmentsSkipped }}</p>
	</div>
</template>
<script setup lang="ts">
const optionsStore = useOptionsStore()
const { settings } = storeToRefs(optionsStore)

function getTimeFormatted(sec = 0) {
	if (typeof sec !== "number") return "0s"
	let days = Math.floor(sec / 86400)
	let hours = Math.floor((sec % 86400) / 3600)
	let minutes = Math.floor(((sec % 86400) % 3600) / 60)
	let seconds = Math.floor(((sec % 86400) % 3600) % 60)
	let text
	if (days > 0) text = `${days}d ${hours}h ${minutes}m`
	else if (hours > 0) text = `${hours}h ${minutes}m ${seconds}s`
	else if (minutes > 0) text = `${minutes}m ${seconds}s`
	else text = `${seconds}s`
	return text
}
const props = defineProps({
	advancedSettings: {
		type: Boolean,
		default: false,
	},
})
</script>
<style scoped></style>
