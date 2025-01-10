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
logStartOfAddon(Platforms.HBO)
// Global Variables

const { settings } = storeToRefs(optionsStore)
