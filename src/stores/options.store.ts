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

// 8KB item
const { data: hideTitles, promise: hideTitlesPromise } = useBrowserSyncStorage<BooleanObject>("hideTitles", {}, false)
export const useHideTitlesStore = defineStore("hideTitles", () => {
	return {
		hideTitles,
	}
})
