import { knownBug } from "../helpers/known-bug"
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest"
import { ref } from "vue"
import browser from "webextension-polyfill"
import { onMessage } from "webext-bridge/background"
import { makeSettings, settle } from "../helpers/player"
let settings: ReturnType<typeof makeSettings>
vi.mock("../../composables/useBrowserStorage", () => ({
	useBrowserSyncStorage: () => ({ data: settings, promise: Promise.resolve() }),
}))
const messages: Record<string, (...args: any[]) => any> = {}
const originalAction = browser.action
beforeEach(() => {
	vi.resetModules()
	vi.clearAllMocks()
	settings = makeSettings()
	for (const key of Object.keys(messages)) delete messages[key]
	vi.mocked(onMessage).mockImplementation(((name: string, cb: (...args: any[]) => any) => {
		messages[name] = cb
	}) as any)
	vi.mocked(browser.storage.sync.get).mockResolvedValue({})
	vi.mocked(browser.storage.local.get).mockResolvedValue({})
	vi.stubGlobal("fetch", vi.fn())
	vi.stubEnv("NODE_ENV", "production")
})
afterEach(() => {
	vi.restoreAllMocks()
	vi.unstubAllEnvs()
	;(browser as any).action = originalAction
	delete (browser as any).webRequest
	delete (browser as any).browserAction
})
async function start() {
	await import("../../background/index")
	await settle()
}
const installed = async (reason: string) =>
	vi
		.mocked(browser.runtime.onInstalled.addListener)
		.mock.calls.at(-1)![0]({ reason } as any)
describe("extension background", () => {
	it("opens the setup page on installation, clearing only local data", async () => {
		await start()
		await installed("install")
		expect(browser.storage.local.clear).toHaveBeenCalledOnce()
		expect(browser.storage.sync.clear).not.toHaveBeenCalled()
		expect(browser.tabs.create).toHaveBeenCalledWith(
			expect.objectContaining({ active: true, url: expect.stringContaining("/options-page/install") }),
		)
	})
	it.each(["install", "update", "browser_update"])("does not open a setup tab for development %s", async (reason) => {
		vi.stubEnv("NODE_ENV", "development")
		await start()
		await installed(reason)
		expect(browser.tabs.create).not.toHaveBeenCalled()
	})
	it.each([null, undefined, {}, false, ""])("handles absent legacy titles: %j", async (hideTitles) => {
		vi.mocked(browser.storage.sync.get).mockResolvedValue({ hideTitles })
		await start()
		await installed("update")
		expect(browser.storage.sync.remove).not.toHaveBeenCalled()
	})
	it("migrates legacy titles without replacing existing metadata", async () => {
		const old = { platform: "Amazon", dateAdded: "2025-01-01", mediaType: "tv", posterPath: "/p" }
		vi.mocked(browser.storage.sync.get).mockResolvedValue({ hideTitles: { Old: true, New: true } })
		vi.mocked(browser.storage.local.get).mockResolvedValue({ hiddenTitles: { Old: old } })
		await start()
		await installed("update")
		expect(browser.storage.local.set).toHaveBeenCalledWith({
			hiddenTitles: {
				Old: old,
				New: { platform: "Unknown", dateAdded: expect.any(String), mediaType: null, posterPath: null },
			},
		})
		expect(browser.storage.sync.remove).toHaveBeenCalledWith("hideTitles")
	})
	it("creates a new local dictionary during migration", async () => {
		vi.mocked(browser.storage.sync.get).mockResolvedValue({ hideTitles: { Title: true } })
		await start()
		await installed("update")
		expect(browser.storage.local.set).toHaveBeenCalledWith({
			hiddenTitles: { Title: expect.objectContaining({ platform: "Unknown" }) },
		})
	})
	it("keeps legacy data when migration cannot be saved", async () => {
		vi.mocked(browser.storage.sync.get).mockResolvedValue({ hideTitles: { Title: true } })
		vi.mocked(browser.storage.local.set).mockRejectedValueOnce(new Error("quota"))
		await start()
		await expect(installed("update")).rejects.toThrow("quota")
		expect(browser.storage.sync.remove).not.toHaveBeenCalled()
	})
	it("counts, sets and resets per-tab badges independently", async () => {
		await start()
		await messages.increaseBadge({ sender: { tabId: 7 } })
		await messages.increaseBadge({ sender: { tabId: 7 } })
		expect(browser.action.setBadgeText).toHaveBeenLastCalledWith({ text: "2", tabId: 7 })
		await messages.increaseBadge({ sender: { tabId: 8 } })
		expect(browser.action.setBadgeText).toHaveBeenLastCalledWith({ text: "1", tabId: 8 })
		await messages.setBadgeText({ sender: { tabId: 7 }, data: { text: "Ready" } })
		expect(browser.action.setBadgeText).toHaveBeenLastCalledWith({ text: "Ready", tabId: 7 })
		await messages.increaseBadge({ sender: { tabId: 7 } })
		expect(browser.action.setBadgeText).toHaveBeenLastCalledWith({ text: "1", tabId: 7 })
		await messages.resetBadge({ sender: { tabId: 7 } })
		expect(browser.action.setBadgeText).toHaveBeenLastCalledWith({ text: "", tabId: 7 })
		await messages.resetBadge({ sender: { tabId: 9 } })
		const n = vi.mocked(browser.action.setBadgeText).mock.calls.length
		await messages.increaseBadge({})
		await messages.resetBadge({ sender: {} })
		await messages.setBadgeText({ data: { text: "x" } })
		expect(browser.action.setBadgeText).toHaveBeenCalledTimes(n)
	})
	knownBug("BUG B01: tab id zero is a valid tab and must receive badge updates", async () => {
		await start()
		await messages.increaseBadge({ sender: { tabId: 0 } })
		expect(browser.action.setBadgeText).toHaveBeenCalledWith({ text: "1", tabId: 0 })
	})
	it("supports legacy browserAction", async () => {
		;(browser as any).browserAction = originalAction
		;(browser as any).action = undefined
		await start()
		expect(originalAction.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: "#e60010" })
	})
	it.each([
		["tmdb", "Authorization", "Bearer test-token"],
		["mal", "X-MAL-CLIENT-ID", "test-client"],
		["noAuth", "accept", "application/json"],
	])("fetches %s JSON with the appropriate headers", async (type, key, value) => {
		vi.mocked(fetch).mockResolvedValue({ json: async () => ({ results: [1] }) } as Response)
		await start()
		expect(await messages.fetch({ data: { url: "https://api.example.test/data", type } })).toEqual({ results: [1] })
		expect(fetch).toHaveBeenCalledWith(
			"https://api.example.test/data",
			expect.objectContaining({ headers: expect.objectContaining({ [key]: value }), method: "GET" }),
		)
	})
	it("reports unknown fetch types and network/JSON failures", async () => {
		await start()
		expect(await messages.fetch({ data: { url: "https://example.test", type: "bad" } })).toEqual({
			error: "Unknown fetch type: bad",
		})
		expect(fetch).not.toHaveBeenCalled()
		vi.mocked(fetch).mockRejectedValue(new Error("offline"))
		expect(await messages.fetch({ data: { url: "https://example.test", type: "noAuth" } })).toEqual({
			error: "offline",
		})
	})
	it("logs uncaught errors with their source location", async () => {
		const spy = vi.spyOn(console, "info")
		await start()
		;(self.onerror as (...args: any[]) => any)("broken", "test.js", 2, 3, new Error("broken"))
		expect(spy).toHaveBeenCalledWith("Source: test.js")
		expect(spy).toHaveBeenCalledTimes(5)
	})
	it.each([true, false])("rewrites the User-Agent only for enabled Firefox Android (%s)", async (enabled) => {
		vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Firefox Android")
		const listener = vi.fn()
		;(browser as any).webRequest = { onBeforeSendHeaders: { addListener: listener } }
		settings.value.Video.userAgent = enabled
		await start()
		expect(listener).toHaveBeenCalledOnce()
		const modify = listener.mock.calls[0][0]
		const headers = [
			{ name: "Accept", value: "x" },
			{ name: "User-Agent", value: "mobile" },
		]
		expect(modify({ requestHeaders: headers }).requestHeaders[1].value).toBe(
			enabled
				? "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0 streamingEnhanced"
				: "mobile",
		)
		expect(modify({ requestHeaders: [] }).requestHeaders).toEqual([])
	})
})
