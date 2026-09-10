import { knownBug } from "../helpers/known-bug"
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest"
import { createApp, defineComponent, h, nextTick, ref, type App } from "vue"
import { createPinia, setActivePinia } from "pinia"
import { createRouter, createMemoryHistory } from "vue-router"
import browser from "webextension-polyfill"
import { defaultSettings } from "../../stores/storeTypes"
import { i18n } from "../../utils/i18n"
import { useOptionsStore, useHiddenTitlesStore, crunchyListStore } from "../../stores/options.store"
import Switch from "../../components/Switch.vue"

vi.mock("@ckpack/vue-color", () => ({
	Sketch: defineComponent({
		emits: ["update:modelValue"],
		setup:
			(_, { emit }) =>
			() =>
				h(
					"button",
					{
						"data-test-sketch": true,
						onClick: () => emit("update:modelValue", { hex8: "#12345678" }),
						onDblclick: () => emit("update:modelValue", "#abcdef"),
					},
					"Choose color",
				),
	}),
}))

const components = import.meta.glob(["../../components/**/*.vue", "../../ui/**/*.vue"])
let apps: App[] = []
let router: ReturnType<typeof createRouter>
let store: ReturnType<typeof useOptionsStore>
const blank = defineComponent({ render: () => h("div") })
async function mount(path: string, props: Record<string, any> = {}) {
	const C = (await components[path]()) as { default: any }
	const root = document.createElement("div")
	document.body.append(root)
	const app = createApp(C.default, path.endsWith("/ColorPicker.vue") ? { modelValue: "#112233", ...props } : props)
		.use(createPinia())
		.use(router)
		.use(i18n)
	app.config.warnHandler = () => {}
	// The production templates use this exact registered component name.
	// eslint-disable-next-line vue/no-reserved-component-names
	app.component("Switch", Switch)
	app.component(
		"ColorPicker",
		defineComponent({
			emits: ["update:modelValue"],
			setup:
				(_, { emit }) =>
				() =>
					h("button", { "data-test-color": true, onClick: () => emit("update:modelValue", "#123456") }, "Choose color"),
		}),
	)
	const vm = app.mount(root)
	apps.push(app)
	await flush()
	return { root, app, vm }
}
async function flush() {
	for (let i = 0; i < 6; i++) {
		await Promise.resolve()
		await nextTick()
	}
}
async function toggle(input: HTMLInputElement, value: boolean) {
	input.checked = value
	input.dispatchEvent(new Event("input", { bubbles: true }))
	await flush()
}
beforeEach(async () => {
	vi.clearAllMocks()
	setActivePinia(createPinia())
	store = useOptionsStore()
	store.settings = structuredClone(defaultSettings)
	useHiddenTitlesStore().hiddenTitles = {}
	router = createRouter({ history: createMemoryHistory(), routes: [{ path: "/:pathMatch(.*)*", component: blank }] })
	await router.push("/test")
	await router.isReady()
	vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test")
	vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})
	vi.stubGlobal("alert", vi.fn())
	vi.stubGlobal(
		"confirm",
		vi.fn(() => false),
	)
	vi.stubGlobal(
		"fetch",
		vi.fn(async () => ({ json: async () => ({ results: [] }) })),
	)
})
afterEach(() => {
	for (const app of apps) app.unmount()
	apps = []
	document.body.innerHTML = ""
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

describe("all web UI components compile and mount", () => {
	it.each(Object.keys(components))("%s", async (path) => {
		const { root } = await mount(path)
		expect(root.childNodes.length).toBeGreaterThan(0)
	})
})
describe("settings behavior", () => {
	it("shared credit switches enforce exclusivity without adding unsupported options", async () => {
		const { root } = await mount("../../ui/action-popup/pages/SharedOptions.vue")
		const inputs = root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
		expect("watchCredits" in store.settings.Crunchyroll).toBe(false)
		await toggle(inputs[2], true)
		expect(store.settings.Amazon.watchCredits).toBe(true)
		expect(store.settings.Amazon.skipCredits).toBe(false)
		await toggle(inputs[2], false)
		expect(store.settings.Paramount.watchCredits).toBe(false)
		await toggle(inputs[1], true)
		expect(store.settings.Amazon.watchCredits).toBe(false)
		expect(store.settings.Paramount.skipCredits).toBe(true)
		expect("watchCredits" in store.settings.Crunchyroll).toBe(false)
		await toggle(inputs[1], false)
		expect(store.settings.Crunchyroll.skipCredits).toBe(false)
	})
	it.each(["Amazon", "Netflix", "Crunchyroll"])("toggles every %s-specific setting both ways", async (name) => {
		for (const advancedSettings of [false, true]) {
			const { root } = await mount(`../../components/shared-pages/${name}.vue`, { advancedSettings })
			const inputs = Array.from(root.querySelectorAll<HTMLInputElement>("input[type=checkbox]"))
			expect(inputs.length).toBeGreaterThan(0)
			for (const input of inputs) {
				await toggle(input, false)
				expect(input.checked).toBe(false)
				await toggle(input, true)
				expect(input.checked).toBe(true)
			}
		}
	})
	it("updates all shared settings from the popup", async () => {
		const { root } = await mount("../../ui/action-popup/pages/SharedOptions.vue")
		const inputs = Array.from(root.querySelectorAll<HTMLInputElement>("input[type=checkbox]"))
		for (const input of inputs) {
			await toggle(input, false)
			await toggle(input, true)
		}
		expect(store.settings.Amazon.skipIntro).toBe(true)
		expect(store.settings.Amazon.skipAd).toBe(true)
		expect(store.settings.Video.scrollVolume).toBe(true)
	})
	knownBug("BUG U01: popup hide-titles switch must include Prime Video", async () => {
		store.settings.Amazon.hideTitles = false
		const { root } = await mount("../../ui/action-popup/pages/SharedOptions.vue")
		const inputs = root.querySelectorAll<HTMLInputElement>("input[type=checkbox]")
		await toggle(inputs[8], false)
		await toggle(inputs[8], true)
		expect(store.settings.Amazon.hideTitles).toBe(true)
	})
	it("enforces mutually exclusive credit options for Netflix, Amazon, Disney and HBO in the table", async () => {
		const { root } = await mount("../../components/options-page/SettingsTable.vue")
		const rows = root.querySelectorAll("tbody tr")
		const skip = rows[1].querySelectorAll<HTMLInputElement>("input")
		const watch = rows[2].querySelectorAll<HTMLInputElement>("input")
		for (const i of [1, 2, 3, 4]) {
			await toggle(watch[i], true)
			await toggle(skip[i === 4 ? 5 : i], true)
			expect(watch[i].checked).toBe(false)
		}
		for (const row of Array.from(rows))
			for (const input of Array.from(row.querySelectorAll<HTMLInputElement>("input"))) {
				await toggle(input, false)
				await toggle(input, true)
			}
	})
	knownBug("BUG U02: Paramount credit switches in the table must be mutually exclusive", async () => {
		const { root } = await mount("../../components/options-page/SettingsTable.vue")
		const rows = root.querySelectorAll("tbody tr")
		await toggle(rows[1].querySelectorAll<HTMLInputElement>("input")[6], true)
		await toggle(rows[2].querySelectorAll<HTMLInputElement>("input")[5], true)
		expect(store.settings.Paramount.skipCredits && store.settings.Paramount.watchCredits).toBe(false)
	})
	it("toggles optional installation settings", async () => {
		const { root } = await mount("../../ui/options-page/pages/install.vue")
		const inputs = root.querySelectorAll<HTMLInputElement>("input")
		for (const input of Array.from(inputs)) {
			await toggle(input, false)
			await toggle(input, true)
		}
		expect(store.settings.Amazon.filterPaid).toBe(true)
		expect(store.settings.Video.showYear).toBe(true)
	})
	it("formats durations in seconds, minutes, hours and days", async () => {
		for (const [seconds, expected] of [
			[0, "0s"],
			[59, "59s"],
			[90, "1m 30s"],
			[3661, "1h 1m 1s"],
			[90000, "1d 1h 0m"],
			["bad", "0s"],
		] as const) {
			store.settings.Statistics.AmazonAdTimeSkipped = seconds as any
			const { root } = await mount("../../components/shared-pages/Statistics.vue", { advancedSettings: true })
			expect(root.textContent).toContain(expected)
		}
	})
	it("requests missing optional permissions, preserving a denied request", async () => {
		vi.mocked(browser.permissions.contains).mockResolvedValue(false)
		vi.mocked(browser.permissions.request).mockResolvedValueOnce(false).mockResolvedValueOnce(true)
		const { root } = await mount("../../components/OptionalPermission.vue")
		const button = root.querySelector("button")!
		button.click()
		await flush()
		expect(root.querySelector("button")).not.toBeNull()
		button.click()
		await flush()
		expect(root.querySelector("button")).toBeNull()
		vi.mocked(browser.permissions.contains).mockResolvedValue(true)
	})
	it("opens settings using the extension URL", async () => {
		const { root } = await mount("../../components/AppHeader.vue")
		;(root.querySelector("a.cursor-pointer") as HTMLElement).click()
		expect(browser.tabs.create).toHaveBeenCalledWith(
			expect.objectContaining({ url: expect.stringContaining("options-page/index.html") }),
		)
	})
	it("navigates the back button to the popup when history is empty", async () => {
		const { root } = await mount("../../components/RouterLinkUp.vue")
		root.querySelector("button")!.click()
		await vi.waitFor(() => expect(router.currentRoute.value.path).toBe("/action-popup"))
	})
	it("navigates to shared settings", async () => {
		const { root } = await mount("../../components/OpenSettingsButton.vue")
		root.querySelector("button")!.click()
		await vi.waitFor(() => expect(router.currentRoute.value.path).toBe("/action-popup/SharedOptions"))
	})
	it("clamps invalid Crunchyroll skip delays to zero", async () => {
		const { root } = await mount("../../components/shared-pages/Crunchyroll.vue")
		const input = root.querySelector<HTMLInputElement>("input[type=number]")!
		for (const [value, expected] of [
			["20", 20],
			["-2", 0],
			["", 0],
		] as const) {
			input.value = value
			input.dispatchEvent(new Event("change", { bubbles: true }))
			await flush()
			expect(store.settings.General.Crunchyroll_skipTimeout).toBe(expected)
		}
	})
})

describe("settings import/export and reset", () => {
	function fileInput(root: HTMLElement, content: string, type = "application/json") {
		vi.stubGlobal(
			"FileReader",
			class extends EventTarget {
				result: string = ""
				readAsText() {
					this.result = content
					this.dispatchEvent(new Event("load"))
				}
			},
		)
		const input = root.querySelector<HTMLInputElement>("input[type=file]")!
		Object.defineProperty(input, "files", {
			configurable: true,
			value: [new File([content], "settings.json", { type })],
		})
		input.dispatchEvent(new Event("change", { bubbles: true }))
		return input
	}
	it("exports settings and imports a valid settings object", async () => {
		const { root } = await mount("../../ui/options-page/pages/Backup.vue")
		expect(root.querySelector("a")?.download).toBe("settings.json")
		const value = structuredClone(defaultSettings)
		value.Amazon.skipAd = false
		fileInput(root, JSON.stringify(value))
		await flush()
		expect(store.settings.Amazon.skipAd).toBe(false)
	})
	it.each([
		["{broken", "application/json"],
		["{}", "text/plain"],
	])("rejects a broken or unsupported settings file", async (content, type) => {
		const { root } = await mount("../../ui/options-page/pages/Backup.vue")
		fileInput(root, content, type)
		await flush()
		expect(alert).toHaveBeenCalled()
	})
	it("handles cancellation of the file picker", async () => {
		const { root } = await mount("../../ui/options-page/pages/Backup.vue")
		root.querySelector("input")!.dispatchEvent(new Event("change"))
		expect(alert).toHaveBeenCalled()
	})
	knownBug("BUG U03: a JSON object without settings groups must not replace working settings", async () => {
		const { root } = await mount("../../ui/options-page/pages/Backup.vue")
		fileInput(root, "{}")
		await flush()
		expect(store.settings.Amazon).toEqual(defaultSettings.Amazon)
	})
	it("resets only after confirmation and reloads after both storage areas clear", async () => {
		const reload = vi.fn()
		vi.stubGlobal("location", { reload })
		const { root } = await mount("../../ui/options-page/pages/Backup.vue")
		;(root.querySelector(".reset") as HTMLElement).click()
		await flush()
		expect(browser.storage.local.clear).not.toHaveBeenCalled()
		vi.mocked(confirm).mockReturnValue(true)
		;(root.querySelector(".reset") as HTMLElement).click()
		await flush()
		expect(browser.storage.local.clear).toHaveBeenCalledOnce()
		expect(browser.storage.sync.clear).toHaveBeenCalledOnce()
		expect(reload).toHaveBeenCalledOnce()
	})
})

describe("hidden titles management", () => {
	const titles = () => ({
		Alpha: { platform: "Amazon", mediaType: "movie", posterPath: "/alpha", dateAdded: "2026-01-01" },
		Beta: { platform: "Netflix", mediaType: "tv", posterPath: "", dateAdded: "2026-02-01" },
		Gamma: { platform: "Unknown", mediaType: null, posterPath: "", dateAdded: "2026-03-01" },
	})
	const button = (root: HTMLElement, text: string) =>
		Array.from(root.querySelectorAll("button")).find((b) => b.textContent?.includes(text))!
	const seed = () => {
		useHiddenTitlesStore().hiddenTitles = titles() as any
	}
	it("filters by search, platform and media type", async () => {
		seed()
		const { root } = await mount("../../ui/options-page/pages/HiddenTitles.vue")
		expect(root.querySelectorAll(".block-card")).toHaveLength(3)
		const input = root.querySelector<HTMLInputElement>("input[type=text]")!
		input.value = "alpha"
		input.dispatchEvent(new Event("input"))
		await flush()
		expect(root.querySelectorAll(".block-card")).toHaveLength(1)
		input.value = ""
		input.dispatchEvent(new Event("input"))
		const selects = root.querySelectorAll("select")
		selects[0].value = "Netflix"
		selects[0].dispatchEvent(new Event("change"))
		await flush()
		expect(root.querySelector(".card-title")?.textContent).toBe("Beta")
		selects[0].value = "all"
		selects[0].dispatchEvent(new Event("change"))
		selects[1].value = "movie"
		selects[1].dispatchEvent(new Event("change"))
		await flush()
		expect(root.querySelector(".card-title")?.textContent).toBe("Alpha")
	})
	it("sorts list view by title, platform and date in either direction", async () => {
		seed()
		const { root } = await mount("../../ui/options-page/pages/HiddenTitles.vue")
		;(root.querySelector(".join button:nth-child(2)") as HTMLElement).click()
		await flush()
		expect(root.querySelectorAll("tbody tr")).toHaveLength(3)
		for (const th of Array.from(root.querySelectorAll<HTMLElement>("th.cursor-pointer"))) {
			th.click()
			await flush()
			th.click()
			await flush()
			expect(root.querySelectorAll("tbody tr")).toHaveLength(3)
		}
		;(root.querySelector('button[title="Z-A"],button[title="A-Z"]') as HTMLElement).click()
		await flush()
	})
	it("selects visible titles and unblocks the selection", async () => {
		seed()
		const { root } = await mount("../../ui/options-page/pages/HiddenTitles.vue")
		const all = root.querySelector<HTMLInputElement>(".toolbar input[type=checkbox]")!
		all.checked = true
		all.dispatchEvent(new Event("change"))
		await flush()
		expect(root.querySelectorAll(".select-checkbox:checked")).toHaveLength(3)
		;(root.querySelector("button.btn-error") as HTMLElement).click()
		await flush()
		expect(useHiddenTitlesStore().hiddenTitles).toEqual({})
	})
	it("unblocks individual cards and asks before unblocking all", async () => {
		seed()
		const { root } = await mount("../../ui/options-page/pages/HiddenTitles.vue")
		;(root.querySelector(".unblock-btn") as HTMLElement).click()
		await flush()
		expect(Object.keys(useHiddenTitlesStore().hiddenTitles)).toHaveLength(2)
		const all = root.querySelector<HTMLElement>("button.btn-outline.btn-error")!
		all.click()
		await flush()
		expect(Object.keys(useHiddenTitlesStore().hiddenTitles)).toHaveLength(2)
		vi.mocked(confirm).mockReturnValue(true)
		all.click()
		await flush()
		expect(useHiddenTitlesStore().hiddenTitles).toEqual({})
	})
	it("exports current titles and releases the blob URL", async () => {
		seed()
		vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
		const { root } = await mount("../../ui/options-page/pages/HiddenTitles.vue")
		const download =
			root.querySelector<HTMLElement>("button[title] i-mdi-download")?.parentElement ??
			root.querySelectorAll<HTMLElement>(".toolbar button")[6]
		download!.click()
		await flush()
		expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test")
	})
	it("merges imported titles, skips duplicates and rejects malformed input", async () => {
		seed()
		const { root } = await mount("../../ui/options-page/pages/HiddenTitles.vue")
		let data = ""
		vi.stubGlobal(
			"FileReader",
			class extends EventTarget {
				result = ""
				readAsText() {
					this.result = data
					this.dispatchEvent(new Event("load"))
				}
			},
		)
		const input = root.querySelector<HTMLInputElement>("input[type=file]")!
		Object.defineProperty(input, "files", { configurable: true, value: [new File([""], "titles.json")] })
		data = JSON.stringify({
			Alpha: { platform: "Disney", dateAdded: "2020" },
			New: { platform: "Disney", dateAdded: "2026" },
			bad: false,
		})
		input.dispatchEvent(new Event("change"))
		await flush()
		expect(useHiddenTitlesStore().hiddenTitles.Alpha.platform).toBe("Amazon")
		expect(useHiddenTitlesStore().hiddenTitles.New.platform).toBe("Disney")
		expect(useHiddenTitlesStore().hiddenTitles.bad).toBeUndefined()
		for (const invalid of ["null", "[]", "{broken"]) {
			data = invalid
			input.dispatchEvent(new Event("change"))
			await flush()
			expect(alert).toHaveBeenCalled()
		}
	})
	it("fetches missing posters and preserves the stored media type", async () => {
		useHiddenTitlesStore().hiddenTitles = {
			Alpha: { platform: "Amazon", mediaType: "movie", posterPath: null, dateAdded: "2026" },
		}
		vi.mocked(fetch).mockResolvedValue({
			json: async () => ({ results: [{ poster_path: "/poster", media_type: "tv" }] }),
		} as Response)
		await mount("../../ui/options-page/pages/HiddenTitles.vue")
		await vi.waitFor(() => expect(useHiddenTitlesStore().hiddenTitles.Alpha.posterPath).toBe("/poster"))
		expect(useHiddenTitlesStore().hiddenTitles.Alpha.mediaType).toBe("movie")
	})
})

describe("remaining UI interactions", () => {
	it("toggles theme both ways and selects a locale", async () => {
		const { root: theme } = await mount("../../components/ThemeSwitch.vue")
		theme.querySelector("a")!.click()
		await flush()
		expect(document.body.getAttribute("data-theme")).toBe("light")
		theme.querySelector("a")!.click()
		await flush()
		expect(document.body.getAttribute("data-theme")).toBe("dark")
		const { root: locale } = await mount("../../components/LocaleSwitch.vue")
		Array.from(locale.querySelectorAll("button"))
			.find((b) => b.textContent === "Italiano")!
			.click()
		await flush()
		expect(i18n.global.locale.value).toBe("it")
	})
	it("edits shared switches and numeric slider settings", async () => {
		const { root } = await mount("../../ui/options-page/pages/SharedSettings.vue")
		for (const input of Array.from(root.querySelectorAll<HTMLInputElement>("input[type=checkbox]"))) {
			await toggle(input, false)
			await toggle(input, true)
		}
		const numeric = root.querySelectorAll<HTMLInputElement>("input[type=number]")
		for (const input of Array.from(numeric)) {
			if (!input.disabled) {
				input.value = "6"
				input.dispatchEvent(new Event("input"))
				await flush()
			}
		}
		const preview = root.querySelector<HTMLInputElement>("input[type=range]")!
		preview.value = "12"
		preview.dispatchEvent(new Event("input"))
		await flush()
		for (const reset of Array.from(root.querySelectorAll<HTMLElement>("button.btn-error"))) {
			reset.click()
			await flush()
		}
		expect(store.settings.Video.scrollVolume).toBe(true)
	})
	it("enables all disabled controls and redirects when none remain", async () => {
		for (const group of Object.values(store.settings))
			for (const [key, value] of Object.entries(group))
				if (typeof value === "boolean" && key !== "watchCredits" && key !== "epilepsy") (group as any)[key] = false
		const { root } = await mount("../../ui/options-page/pages/disabledSettings.vue")
		expect(root.querySelectorAll("section").length).toBeGreaterThan(1)
		for (let i = 0; i < 100; i++) {
			const input = root.querySelector<HTMLInputElement>("input[type=checkbox]")
			if (!input) break
			await toggle(input, true)
		}
		await vi.waitFor(() => expect(router.currentRoute.value.path).toBe("/options-page/SharedSettings"))
	})
	it("opens hidden titles from the popup home", async () => {
		const { root } = await mount("../../ui/action-popup/pages/index.vue")
		;(root.querySelector("div.popupMenuButton") as HTMLElement).click()
		expect(browser.tabs.create).toHaveBeenCalledWith({ url: expect.stringContaining("/options-page/HiddenTitles") })
	})
	it.each([
		["https://www.primevideo.com/", "Amazon"],
		["https://www.netflix.com/", "Netflix"],
		["https://www.crunchyroll.com/", "Crunchyroll"],
		["https://example.test/", "SharedOptions"],
	])("opens the popup page for %s", async (url, page) => {
		vi.mocked(browser.tabs.query).mockResolvedValue([{ url }] as any)
		await mount("../../ui/action-popup/app.vue")
		await vi.waitFor(() => expect(router.currentRoute.value.path).toBe(`/action-popup/${page}`))
	})
	it("selects cards individually and unblocks from list view", async () => {
		useHiddenTitlesStore().hiddenTitles = {
			Alpha: { platform: "Amazon", mediaType: "tv", posterPath: "", dateAdded: "2026" },
		}
		const { root } = await mount("../../ui/options-page/pages/HiddenTitles.vue")
		const checkbox = root.querySelector<HTMLInputElement>(".select-checkbox")!
		checkbox.dispatchEvent(new Event("change"))
		await flush()
		expect(checkbox.checked).toBe(true)
		;(root.querySelector(".join button:nth-child(2)") as HTMLElement).click()
		await flush()
		root.querySelector<HTMLInputElement>("tbody input")!.dispatchEvent(new Event("change"))
		await flush()
		expect(root.querySelector<HTMLInputElement>("tbody input")!.checked).toBe(false)
		;(root.querySelector("tbody button") as HTMLElement).click()
		await flush()
		expect(useHiddenTitlesStore().hiddenTitles).toEqual({})
	})
})

describe("additional form and navigation flows", () => {
	it("does not resurrect a removed hidden title when a poster request finishes later", async () => {
		let resolve!: (value: Response) => void
		vi.mocked(fetch).mockReturnValueOnce(
			new Promise((r) => {
				resolve = r
			}),
		)
		const hidden = useHiddenTitlesStore()
		hidden.hiddenTitles = { Example: { platform: "Amazon", mediaType: "movie", posterPath: null, dateAdded: "2026" } }
		await mount("../../ui/options-page/pages/HiddenTitles.vue")
		hidden.hiddenTitles = {}
		resolve({ json: async () => ({ results: [{ poster_path: "/poster" }] }) } as Response)
		await flush()
		expect(hidden.hiddenTitles).toEqual({})
	})
	it("leaves hidden titles unchanged when file selection is cancelled and switches sort direction both ways", async () => {
		const { root } = await mount("../../ui/options-page/pages/HiddenTitles.vue")
		root.querySelector<HTMLInputElement>('input[type="file"]')!.dispatchEvent(new Event("change"))
		expect(alert).not.toHaveBeenCalled()
		const sort = root.querySelector<HTMLButtonElement>('button[title="A-Z"],button[title="Z-A"]')!
		const original = sort.title
		sort.click()
		await flush()
		expect(sort.title).not.toBe(original)
		sort.click()
		await flush()
		expect(sort.title).toBe(original)
	})
	it("handles shared settings supported by only some services and newly disabled options", async () => {
		for (const group of Object.values(store.settings))
			for (const [key, value] of Object.entries(group)) if (typeof value === "boolean") (group as any)[key] = true
		const { root } = await mount("../../ui/options-page/pages/disabledSettings.vue")
		store.settings.Paramount.skipAd = false
		await flush()
		expect(root.querySelectorAll('input[type="checkbox"]')).toHaveLength(1)
		expect(router.currentRoute.value.path).toBe("/test")
	})
	it.each(["Firefox/130", "Edg/130"])("links to the correct extension store on %s", async (ua) => {
		vi.spyOn(navigator, "userAgent", "get").mockReturnValue(ua)
		for (const path of ["../../components/AppHeader.vue", "../../ui/options-page/app.vue"]) {
			const { root } = await mount(path)
			const link = root.querySelector<HTMLAnchorElement>(
				'a[href*="addons.mozilla.org"],a[href*="chromewebstore.google.com"]',
			)!
			expect(link.hostname).toBe(ua.startsWith("Firefox") ? "addons.mozilla.org" : "chromewebstore.google.com")
		}
	})
	it("shows mobile settings and saved profile pictures", async () => {
		vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mobile streamingEnhanced")
		store.settings.General.profilePicture = "https://example.test/netflix.png"
		store.settings.General.Crunchyroll_profilePicture = "https://example.test/crunchyroll.png"
		for (const path of [
			"../../ui/action-popup/app.vue",
			"../../ui/options-page/pages/SharedSettings.vue",
			"../../components/shared-pages/Netflix.vue",
			"../../components/shared-pages/Crunchyroll.vue",
		]) {
			const { root } = await mount(path)
			expect(root.childNodes.length).toBeGreaterThan(0)
			if (path.includes("shared-pages/")) expect(root.querySelector('img[src^="https://example.test/"]')).not.toBeNull()
		}
	})
	it("highlights each active options navigation route", async () => {
		const { root } = await mount("../../ui/options-page/app.vue")
		for (const page of [
			"SharedSettings",
			"Amazon",
			"Netflix",
			"Crunchyroll",
			"HiddenTitles",
			"Backup",
			"Statistics",
			"Changelog",
		]) {
			await router.push(`/options-page/${page}`)
			await flush()
			const active = root.querySelector<HTMLAnchorElement>(`a[href$="/${page}"]`)
			expect(active?.classList.contains("bg-netflix")).toBe(true)
		}
	})
	it("refreshes the settings download and releases replaced URLs", async () => {
		await mount("../../ui/options-page/pages/Backup.vue")
		const initial = vi.mocked(URL.createObjectURL).mock.calls.length
		store.settings.Amazon.skipAd = !store.settings.Amazon.skipAd
		await flush()
		expect(URL.createObjectURL).toHaveBeenCalledTimes(initial + 1)
		expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test")
	})
	it("rating threshold resets do not alias the shared defaults", async () => {
		const original = defaultSettings.General.RatingThresholds[0].color
		const { root } = await mount("../../ui/options-page/pages/SharedSettings.vue")
		root.querySelector<HTMLButtonElement>("button.btn-error")!.click()
		await flush()
		store.settings.General.RatingThresholds[0].color = "#abcdef"
		expect(defaultSettings.General.RatingThresholds[0].color).toBe(original)
	})
	it("propagates the color chosen by the external picker", async () => {
		const changed = vi.fn()
		const { root } = await mount("../../components/ColorPicker.vue", { "onUpdate:modelValue": changed })
		root.querySelector<HTMLButtonElement>("[data-test-sketch]")!.click()
		await flush()
		expect(changed).toHaveBeenLastCalledWith("#12345678")
		root.querySelector<HTMLButtonElement>("[data-test-sketch]")!.dispatchEvent(new MouseEvent("dblclick"))
		await flush()
		expect(changed).toHaveBeenLastCalledWith("#abcdef")
	})
	it("stores edited rating colors", async () => {
		const { root } = await mount("../../ui/options-page/pages/SharedSettings.vue")
		root.querySelector<HTMLButtonElement>("[data-test-color]")!.click()
		await flush()
		expect(store.settings.General.RatingThresholds[0].color).toBe("#123456")
	})
	it("updates the Crunchyroll numeric model during input", async () => {
		const { root } = await mount("../../components/shared-pages/Crunchyroll.vue")
		const input = root.querySelector<HTMLInputElement>("input[type=number]")!
		input.value = "12"
		input.dispatchEvent(new Event("input"))
		await flush()
		expect(store.settings.General.Crunchyroll_skipTimeout).toBe(12)
	})
	it("persists the Crunchyroll watch list", async () => {
		const list = crunchyListStore()
		list.crunchyList = [{ name: "A show", href: "/show/a", time: "10:00" }]
		await flush()
		expect(browser.storage.sync.set).toHaveBeenCalledWith({
			crunchyList: [{ name: "A show", href: "/show/a", time: "10:00" }],
		})
	})
	it("uses history when a previous distinct page exists", async () => {
		await router.push("/previous")
		await router.push("/current")
		router.options.history.state.back = "/previous"
		const back = vi.spyOn(router, "back")
		const { root } = await mount("../../components/RouterLinkUp.vue")
		root.querySelector("button")!.click()
		expect(back).toHaveBeenCalledOnce()
	})
	it("opens shared settings directly when all applicable switches are enabled", async () => {
		for (const group of Object.values(store.settings))
			for (const [key, value] of Object.entries(group)) if (typeof value === "boolean") (group as any)[key] = true
		await mount("../../ui/options-page/pages/index.vue")
		await vi.waitFor(() => expect(router.currentRoute.value.path).toBe("/options-page/SharedSettings"))
	})
	it("updates the mobile user-agent switch in the popup", async () => {
		const { root } = await mount("../../ui/action-popup/app.vue")
		const input = root.querySelector<HTMLInputElement>("input[type=checkbox]")!
		await toggle(input, true)
		expect(store.settings.Video.userAgent).toBe(true)
	})
	it("opens title import and switches between sort and display modes", async () => {
		useHiddenTitlesStore().hiddenTitles = {
			Alpha: { platform: "Amazon", mediaType: "tv", posterPath: "", dateAdded: "2026" },
		}
		const { root } = await mount("../../ui/options-page/pages/HiddenTitles.vue")
		const file = root.querySelector<HTMLInputElement>("input[type=file]")!
		const click = vi.spyOn(file, "click").mockImplementation(() => {})
		root.querySelector("i-mdi-upload")!.parentElement!.click()
		expect(click).toHaveBeenCalledOnce()
		const select = root.querySelectorAll<HTMLSelectElement>("select")[2]
		select.value = "title"
		select.dispatchEvent(new Event("change"))
		await flush()
		expect(root.querySelectorAll(".block-card")).toHaveLength(1)
		root.querySelectorAll<HTMLButtonElement>(".join button")[1].click()
		await flush()
		root.querySelectorAll<HTMLButtonElement>(".join button")[0].click()
		await flush()
		expect(root.querySelectorAll(".block-card")).toHaveLength(1)
	})
})
