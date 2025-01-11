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
chrome.tabs.query(query, callback)
</script>

<template>
	<div class="min-h-[600px]">
		<AppHeader />

		<div class="p-4">
			<RouterView />
		</div>

		<Notivue v-slot="item">
			<Notification :item="item" />
		</Notivue>
	</div>
</template>

<style scoped></style>
