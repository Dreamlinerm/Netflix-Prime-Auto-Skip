import {
	log,
	increaseBadge,
	date,
	optionsStore,
	checkStoreReady,
	Platforms,
	logStartOfAddon,
	config,
} from "@/utils/helper"
logStartOfAddon(Platforms.Amazon)
// Global Variables

const { settings } = storeToRefs(optionsStore)
