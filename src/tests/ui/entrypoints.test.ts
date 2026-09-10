import { it, expect, beforeEach, afterEach, vi } from "vitest"
let app: any
beforeEach(() => {
	vi.resetModules()
	document.body.innerHTML = '<div id="app"></div>'
	vi.spyOn(console, "warn").mockImplementation(() => {})
})
afterEach(() => {
	app?.unmount()
	vi.restoreAllMocks()
	document.body.innerHTML = ""
})
it.each(["options-page", "action-popup"])("starts the %s entrypoint", async (page) => {
	const entry =
		page === "options-page" ? await import("../../ui/options-page/index") : await import("../../ui/action-popup/index")
	app = entry.default
	expect(document.querySelector("#app")?.childNodes.length).toBeGreaterThan(0)
	const spy = vi.spyOn(console, "info")
	;(self.onerror as NonNullable<OnErrorEventHandler>)("error", "entry.js", 1, 2, new Error("test"))
	expect(spy).toHaveBeenCalledWith("Source: entry.js")
})
