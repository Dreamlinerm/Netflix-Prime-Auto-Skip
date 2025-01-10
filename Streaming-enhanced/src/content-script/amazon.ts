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
logStartOfAddon(Platforms.Amazon)
// Global Variables

const { settings } = storeToRefs(optionsStore)
