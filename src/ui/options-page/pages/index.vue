<script setup lang="ts">
// go to Shared Setting Page
const optionsStore = useOptionsStore()
const { settings } = storeToRefs(optionsStore)
type StreamingService = "Amazon" | "Netflix" | "Disney" | "Crunchyroll" | "HBO" | "Video"
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
if (hasDisabledSetting.value) router.push("/options-page/disabledSettings")
else router.push("/options-page/SharedSettings")
</script>
<template>You found my easter egg! 🐣</template>
