import type { StreamingService } from "@/constants/streamingServices"

// 8KB item
const { data: settings, promise } = useBrowserSyncStorage<settingsType>("settings", defaultSettings)
export const useOptionsStore = defineStore("options", () => {
	return {
		settings,
	}
})
export const SettingsPromise = promise

// Sync Data 8KB per item in firefox storage sync
const { data: crunchyList, promise: crunchyListPromise } = useBrowserSyncStorage<CrunchyList>("crunchyList", [], false)
export const crunchyListStore = defineStore("crunchyList", () => {
	return {
		crunchyList,
	}
})

export const useFrontendStore = defineStore("frontend", () => {
	const { isDark, toggleDark } = useTheme()
	const currentLocale = useLocale()
	return {
		isDark,
		toggleDark,
		currentLocale,
	}
})
export type BooleanObject = {
	[key: string]: boolean
}
export type MediaType = "tv" | "movie" | null
export type BlockedTitleEntry = {
	platform: StreamingService | "Unknown"
	mediaType: MediaType
	posterPath: string | null
	dateAdded: string
}
export type HiddenTitles = {
	[title: string]: BlockedTitleEntry
}

const { data: hiddenTitles, promise: hiddenTitlesPromise } = useBrowserLocalStorage<HiddenTitles>(
	"hiddenTitles",
	{},
	false,
)
export const useHiddenTitlesStore = defineStore("hiddenTitles", () => {
	return {
		hiddenTitles,
	}
})
export const HiddenTitlesPromise = hiddenTitlesPromise
