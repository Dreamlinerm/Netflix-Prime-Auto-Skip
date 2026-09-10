import { watch } from "vue"
import { useBrowserLocalStorage } from "./useBrowserStorage"
import { i18n } from "@/utils/i18n"

export function useLocale() {
	const language = navigator.language.split("-")[0]
	const supported = (locale: string) => i18n.global.availableLocales.includes(locale)
	const defaultLocale = supported(language) ? language : "en"
	const { data: currentLocale } = useBrowserLocalStorage<string>("user-locale", defaultLocale, false)
	watch(
		currentLocale,
		(locale) => {
			i18n.global.locale.value = supported(locale) ? locale : defaultLocale
		},
		{ immediate: true },
	)
	return currentLocale
}
