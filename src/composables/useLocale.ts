import { watch } from "vue"
import { useBrowserLocalStorage } from "./useBrowserStorage"
import { i18n } from "@/utils/i18n" // Adjust the import path according to your project structure

export function useLocale() {
	let defaultLocale = "en"
	const localeKey = "user-locale"
	chrome.storage.local.get(localeKey, async (result) => {
		if (result?.[localeKey] == undefined) {
			// browser lang
			const lang = navigator.language.split("-")[0]
			defaultLocale = i18n?.global?.availableLocales?.includes(lang) ? lang : defaultLocale
			i18n.global.locale.value = defaultLocale
		}
	})

	// Use the useBrowserLocalStorage composable to persist the locale
	const { data: currentLocale } = useBrowserLocalStorage<string>(localeKey, defaultLocale, false)

	// Initialize the locale from i18n
	// currentLocale.value = i18n.global.locale.value

	// Watch for changes in the locale and update i18n
	watch(currentLocale, (newLocale) => {
		i18n.global.locale.value = newLocale
	})

	return currentLocale
}
