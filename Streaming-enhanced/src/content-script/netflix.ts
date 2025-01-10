import { log, increaseBadge, date, optionsStore, checkStoreReady, Platforms, logStartOfAddon } from "@/utils/helper"
logStartOfAddon(Platforms.Netflix)
// Global Variables

const { settings } = storeToRefs(optionsStore)
