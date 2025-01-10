import {
	log,
	increaseBadge,
	date,
	optionsStore,
	checkStoreReady,
	Platforms,
	logStartOfAddon,
	config,
	addSkippedTime,
} from "@/utils/helper"
logStartOfAddon(Platforms.HBO)
// Global Variables

const { settings } = storeToRefs(optionsStore)
