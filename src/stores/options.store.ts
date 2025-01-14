export const useOptionsStore = defineStore("options", () => {
	const { data: settings, promise } = useBrowserSyncStorage<settingsType>("settings", defaultSettings)
	return {
		settings,
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
