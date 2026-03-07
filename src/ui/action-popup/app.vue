<script setup lang="ts">
import { Notivue, Notification } from "notivue"
const router = useRouter()
// if on streaming page open settings for page
const query = { active: true, currentWindow: true }
function callback(tabs: chrome.tabs.Tab[]) {
	const currentUrl = tabs?.[0]?.url || ""
	const isPrimeVideo = /.amazon.|.primevideo./i.test(currentUrl)
	const isNetflix = /.netflix./i.test(currentUrl)
	const isDisney = /.disneyplus.|.starplus.|.hotstar./i.test(currentUrl)
	const isCrunchyroll = /.crunchyroll./i.test(currentUrl)
	// const isHBO = /max/i.test(currentUrl);
	if (isPrimeVideo) router.push("/action-popup/Amazon")
	else if (isNetflix) router.push("/action-popup/Netflix")
	else if (isDisney) router.push("/action-popup/Disney")
	else if (isCrunchyroll) router.push("/action-popup/Crunchyroll")
	// else if (isHBO) Menu("HBO");
}
const isMobile = /mobile|streamingEnhanced/i.test(navigator.userAgent)
const optionsStore = useOptionsStore()
const { settings } = storeToRefs(optionsStore)
chrome.tabs.query(query, callback)
</script>

<template>
	<div class="w-[470px] max-w-[470px] h-fit max-h-[700px]">
		<AppHeader />
		<div class="p-4 pt-0 flex-1">
			<div
				class="line flex"
				:class="isMobile ? '' : 'hidden'"
			>
				<p>{{ $t("userAgentSwitch") }}</p>
				<Switch
					v-model="settings.Video.userAgent"
					class="ml-auto"
				></Switch>
			</div>
			<RouterView />
		</div>

		<Notivue v-slot="item">
			<Notification :item="item" />
		</Notivue>
	</div>
</template>

<style>
@import "@/assets/base.css";
</style>
