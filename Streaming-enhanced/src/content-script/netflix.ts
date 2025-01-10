import {
	log,
	increaseBadge,
	optionsStore,
	checkStoreReady,
	Platforms,
	logStartOfAddon,
	config,
	addSkippedTime,
	parseAdTime,
	createSlider,
} from "@/utils/helper"
logStartOfAddon(Platforms.Netflix)
// Global Variables

const { settings } = storeToRefs(optionsStore)
