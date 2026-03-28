<script setup lang="ts">
import type { StreamingService as BaseStreamingService } from "@/constants/streamingServices"

// go to Shared Setting Page
const optionsStore = useOptionsStore()
const { settings } = storeToRefs(optionsStore)
type StreamingService = BaseStreamingService | "Video"
const settingsCategories: Array<StreamingService> = ["Video", "Amazon", "Netflix", "Disney", "Crunchyroll", "HBO"]
const hasDisabledSetting = computed(() => {
	return settingsCategories.some((category) => {
		return Object.keys(settings.value[category]).some((setting) => {
			return (
				!settings.value[category][setting] &&
				setting != "watchCredits" &&
				setting != "epilepsy" &&
				typeof settings.value[category][setting] === "boolean"
			)
		})
	})
})

const router = useRouter()
openSettings()
async function openSettings() {
	await SettingsPromise
	if (hasDisabledSetting.value) router.push("/options-page/disabledSettings")
	else router.push("/options-page/SharedSettings")
}
</script>
<template>You found my easter egg! 🐣</template>
