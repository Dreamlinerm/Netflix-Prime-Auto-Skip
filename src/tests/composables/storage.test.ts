import { knownBug } from "../helpers/known-bug"
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest"
import { effectScope, nextTick } from "vue"
import * as browser from "webextension-polyfill"
import { useBrowserLocalStorage, useBrowserSyncStorage } from "../../composables/useBrowserStorage"
let scope: ReturnType<typeof effectScope>
beforeEach(() => {
	vi.clearAllMocks()
	scope = effectScope()
	vi.mocked(browser.storage.sync.get).mockResolvedValue({})
	vi.mocked(browser.storage.local.get).mockResolvedValue({})
})
afterEach(() => scope.stop())
const changed = async (value: unknown, area = "sync", key = "settings") => {
	const callback = vi.mocked(browser.storage.onChanged.addListener).mock.calls.at(-1)![0]
	await callback({ [key]: { newValue: value } }, area)
}
describe("Browser storage adapter", () => {
	it("keeps defaults usable after a failed read and handles failed writes", async () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {})
		vi.mocked(browser.storage.sync.get).mockRejectedValueOnce(new Error("read failed"))
		const result = scope.run(() => useBrowserSyncStorage("settings", { enabled: true }))!
		await result.promise
		expect(result.data.value).toEqual({ enabled: true })
		vi.mocked(browser.storage.sync.set).mockRejectedValueOnce(new Error("quota"))
		result.data.value.enabled = false
		await nextTick()
		await Promise.resolve()
		expect(error).toHaveBeenCalledTimes(2)
		error.mockRestore()
	})
	it("does not let a delayed initial read overwrite a newer broadcast", async () => {
		let resolve!: (value: any) => void
		vi.mocked(browser.storage.sync.get).mockReturnValueOnce(
			new Promise((r) => {
				resolve = r
			}),
		)
		const result = scope.run(() => useBrowserSyncStorage("settings", 0))!
		await changed(2)
		resolve({ settings: 1 })
		await result.promise
		expect(result.data.value).toBe(2)
		expect(browser.storage.sync.set).not.toHaveBeenCalled()
	})
	it("ignores pending reads and stale listener calls after scope disposal", async () => {
		let resolve!: (value: any) => void
		vi.mocked(browser.storage.sync.get).mockReturnValueOnce(
			new Promise((r) => {
				resolve = r
			}),
		)
		const result = scope.run(() => useBrowserSyncStorage("settings", 0))!
		scope.stop()
		await changed(2)
		resolve({ settings: 1 })
		await result.promise
		expect(result.data.value).toBe(0)
		expect(browser.storage.sync.set).not.toHaveBeenCalled()
	})
	it("applies simultaneous broadcasts without echoing either update", async () => {
		const result = scope.run(() => useBrowserSyncStorage("settings", 0))!
		await result.promise
		await Promise.all([changed(1), changed(2)])
		expect(result.data.value).toBe(2)
		expect(browser.storage.sync.set).not.toHaveBeenCalled()
		result.data.value = 3
		await nextTick()
		expect(browser.storage.sync.set).toHaveBeenCalledOnce()
	})
	it("restores a pristine nested default after local edits and a deletion", async () => {
		const defaults = { nested: { enabled: true }, arr: [1] }
		const result = scope.run(() => useBrowserSyncStorage("settings", defaults))!
		await result.promise
		result.data.value.arr.push(2)
		result.data.value.nested.enabled = false
		await nextTick()
		await changed(undefined)
		expect(result.data.value).toEqual(defaults)
		expect(defaults).toEqual({ nested: { enabled: true }, arr: [1] })
	})
	it("preserves an explicitly nullable field while rejecting null for a required object", async () => {
		vi.mocked(browser.storage.sync.get).mockResolvedValueOnce({ settings: { nullable: null, nested: null } })
		const result = scope.run(() => useBrowserSyncStorage("settings", { nullable: null, nested: { enabled: true } }))!
		await result.promise
		expect(result.data.value).toEqual({ nullable: null, nested: { enabled: true } })
	})
	it("loads defaults without writing them back on hydration", async () => {
		const result = scope.run(() => useBrowserSyncStorage("settings", { enabled: true }))!
		await result.promise
		expect(result.data.value).toEqual({ enabled: true })
		expect(browser.storage.sync.set).not.toHaveBeenCalled()
		result.data.value.enabled = false
		await nextTick()
		expect(browser.storage.sync.set).toHaveBeenCalledWith({ settings: { enabled: false } })
	})
	it("merges old objects, rejects wrong primitive types, preserves arrays and adds new defaults", async () => {
		vi.mocked(browser.storage.sync.get).mockResolvedValue({
			settings: { nested: { enabled: false, count: "bad" }, arr: [2], flag: 1, extra: "discard" },
		})
		const result = scope.run(() =>
			useBrowserSyncStorage("settings", { nested: { enabled: true, count: 2, newFlag: true }, arr: [1], flag: false }),
		)!
		await result.promise
		expect(result.data.value).toEqual({ nested: { enabled: false, count: 2, newFlag: true }, arr: [2], flag: false })
	})
	it.each([null, false, 4, "x", []])(
		"keeps a default object for invalid top-level input %j including null",
		async (value) => {
			vi.mocked(browser.storage.sync.get).mockResolvedValue({ settings: value })
			const result = scope.run(() => useBrowserSyncStorage("settings", { enabled: true }))!
			await result.promise
			expect(result.data.value).toEqual({ enabled: true })
		},
	)
	it("can load an unmerged dictionary and persist local updates", async () => {
		vi.mocked(browser.storage.local.get).mockResolvedValue({ settings: { title: { platform: "Amazon" } } })
		const result = scope.run(() => useBrowserLocalStorage("settings", {}, false))!
		await result.promise
		expect(result.data.value).toEqual({ title: { platform: "Amazon" } })
		result.data.value = { another: true }
		await nextTick()
		expect(browser.storage.local.set).toHaveBeenCalledWith({ settings: { another: true } })
	})
	it.each([true, "it", 2, [1, 2]])("loads matching primitive/array values (%j)", async (value) => {
		vi.mocked(browser.storage.sync.get).mockResolvedValue({ settings: value })
		const result = scope.run(() => useBrowserSyncStorage("settings", value, false))!
		await result.promise
		expect(result.data.value).toEqual(value)
	})
	it("accepts a value when the default is undefined", async () => {
		vi.mocked(browser.storage.sync.get).mockResolvedValue({ settings: "value" })
		const result = scope.run(() => useBrowserSyncStorage("settings", undefined))!
		await result.promise
		expect(result.data.value).toBe("value")
	})
	it("does not echo changes from storage or react to unrelated areas and keys", async () => {
		const result = scope.run(() => useBrowserSyncStorage("settings", { enabled: true }))!
		await result.promise
		await changed({ enabled: false }, "local")
		expect(result.data.value.enabled).toBe(true)
		await changed({ enabled: false }, "sync", "other")
		expect(result.data.value.enabled).toBe(true)
		await changed({ enabled: false })
		expect(result.data.value.enabled).toBe(false)
		expect(browser.storage.sync.set).not.toHaveBeenCalled()
		result.data.value.enabled = true
		await nextTick()
		expect(browser.storage.sync.set).toHaveBeenCalledOnce()
	})
	it("rejects a user update of the wrong top-level type", async () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {})
		const result = scope.run(() => useBrowserSyncStorage("settings", true))!
		await result.promise
		result.data.value = "wrong" as any
		await nextTick()
		expect(browser.storage.sync.set).not.toHaveBeenCalled()
		expect(spy).toHaveBeenCalled()
		spy.mockRestore()
	})
	knownBug("BUG S01: a settings deletion must restore defaults instead of exposing undefined", async () => {
		const result = scope.run(() => useBrowserSyncStorage("settings", { enabled: true }))!
		await result.promise
		await changed(undefined)
		expect(result.data.value).toEqual({ enabled: true })
	})
	knownBug("BUG S02: partial external settings must be merged like initial hydration", async () => {
		const result = scope.run(() => useBrowserSyncStorage("settings", { enabled: true, other: true }))!
		await result.promise
		await changed({ enabled: false })
		expect(result.data.value).toEqual({ enabled: false, other: true })
	})
	knownBug("BUG S03: independent consumers must not mutate their shared defaults", async () => {
		const defaults = { nested: { enabled: true } }
		const a = scope.run(() => useBrowserSyncStorage("settings", defaults))!
		await a.promise
		a.data.value.nested.enabled = false
		await nextTick()
		expect(defaults.nested.enabled).toBe(true)
	})
	knownBug("BUG S04: nullable invalid settings must not replace a required object", async () => {
		vi.mocked(browser.storage.sync.get).mockResolvedValue({ settings: null })
		const result = scope.run(() => useBrowserSyncStorage("settings", { enabled: true }))!
		await result.promise
		expect(result.data.value).toEqual({ enabled: true })
	})
	knownBug("BUG S05: disposing a component must unsubscribe its storage listener", async () => {
		const result = scope.run(() => useBrowserSyncStorage("settings", true))!
		await result.promise
		scope.stop()
		expect(browser.storage.onChanged.removeListener).toHaveBeenCalled()
	})
})
