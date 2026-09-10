import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { effectScope, nextTick } from "vue"
import browser from "webextension-polyfill"
import { useLocale } from "../../composables/useLocale"
import { i18n } from "../../utils/i18n"
let scope: ReturnType<typeof effectScope>
beforeEach(() => {
	scope = effectScope()
	vi.mocked(browser.storage.local.get).mockResolvedValue({})
})
afterEach(() => {
	scope.stop()
	vi.restoreAllMocks()
})
async function flush() {
	for (let i = 0; i < 6; i++) await nextTick()
}
it.each([
	["it-IT", "it"],
	["xx-ZZ", "en"],
])("uses %s browser language when there is no saved preference", async (language, expected) => {
	vi.spyOn(navigator, "language", "get").mockReturnValue(language)
	const value = scope.run(useLocale)!
	await flush()
	expect(value.value).toBe(expected)
	expect(i18n.global.locale.value).toBe(expected)
})
it("preserves a saved preference and falls back for an unsupported external locale", async () => {
	vi.spyOn(navigator, "language", "get").mockReturnValue("en-US")
	vi.mocked(browser.storage.local.get).mockResolvedValue({ "user-locale": "it" })
	const value = scope.run(useLocale)!
	await flush()
	expect(i18n.global.locale.value).toBe("it")
	value.value = "unsupported"
	await flush()
	expect(i18n.global.locale.value).toBe("en")
})
