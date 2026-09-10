import { vi } from "vitest"
import { ref, nextTick } from "vue"
import { defaultSettings } from "../../stores/storeTypes"

export function makeSettings() {
	const value = structuredClone(defaultSettings)
	for (const group of Object.values(value)) {
		const fields = group as Record<string, unknown>
		for (const key of Object.keys(fields)) if (typeof fields[key] === "boolean") fields[key] = false
	}
	value.General.GCdate = value.General.MALGCdate = new Date().toISOString().slice(0, 10)
	return ref(value)
}
export async function settle() {
	for (let i = 0; i < 8; i++) {
		await Promise.resolve()
		await nextTick()
	}
}

export function playerEnvironment(url = "https://www.primevideo.com/storefront/home") {
	vi.useFakeTimers()
	// Content scripts can append controls outside body; reset the entire page tree.
	document.documentElement.replaceChildren(document.createElement("head"), document.createElement("body"))
	const oldLocation = globalThis.location
	vi.stubGlobal("location", new URL(url))
	const windowAdd = globalThis.addEventListener
	const windowRemove = globalThis.removeEventListener
	const windowListeners: any[] = []
	const listeners: [EventTarget, string, EventListener, any][] = []
	const originalRemove = EventTarget.prototype.removeEventListener
	const originalAdd = EventTarget.prototype.addEventListener
	vi.spyOn(EventTarget.prototype, "addEventListener").mockImplementation(function (
		this: EventTarget,
		type,
		callback,
		options,
	) {
		listeners.push([this, type, callback as EventListener, options])
		return originalAdd.call(this, type, callback, options)
	})
	vi.stubGlobal(
		"addEventListener",
		(type: string, callback: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
			windowListeners.push([type, callback, options])
			windowAdd(type, callback, options)
		},
	)
	vi.stubGlobal(
		"removeEventListener",
		(type: string, callback: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) =>
			windowRemove(type, callback, options),
	)
	const observers: { callback: MutationCallback; active: boolean }[] = []
	vi.stubGlobal(
		"MutationObserver",
		class {
			row: { callback: MutationCallback; active: boolean }
			constructor(callback: MutationCallback) {
				this.row = { callback, active: false }
				observers.push(this.row)
			}
			observe() {
				this.row.active = true
			}
			disconnect() {
				this.row.active = false
			}
			takeRecords() {
				return []
			}
		},
	)
	// jsdom has no layout. Visibility is explicitly controlled by fixture attributes.
	const originalVisibility = Object.getOwnPropertyDescriptor(Element.prototype, "checkVisibility")
	Object.defineProperty(Element.prototype, "checkVisibility", {
		configurable: true,
		value: function () {
			return !this.hasAttribute("hidden") && this.style?.display !== "none"
		},
	})
	vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(async function (this: HTMLMediaElement) {
		Object.defineProperty(this, "paused", { configurable: true, value: false })
	})
	vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (this: HTMLMediaElement) {
		Object.defineProperty(this, "paused", { configurable: true, value: true })
	})
	return {
		async mutate() {
			for (const o of [...observers]) if (o.active) o.callback([], {} as MutationObserver)
			await settle()
		},
		cleanup() {
			for (const [target, type, callback, options] of listeners) originalRemove.call(target, type, callback, options)
			for (const [type, callback, options] of windowListeners) windowRemove(type, callback, options)
			document.ondblclick = null
			vi.clearAllTimers()
			vi.useRealTimers()
			vi.restoreAllMocks()
			vi.stubGlobal("location", oldLocation)
			vi.unstubAllGlobals()
			if (originalVisibility) Object.defineProperty(Element.prototype, "checkVisibility", originalVisibility)
			else Reflect.deleteProperty(Element.prototype, "checkVisibility")
		},
	}
}
export function videoFixture(html = "", prime = true) {
	document.body.innerHTML = `${prime ? '<div class="dv-player-fullscreen" id="dv-web-player">' : "<div>"}<video></video>${html}</div>`
	const video = document.querySelector("video")!
	video.currentTime = 10
	Object.defineProperty(video, "paused", { configurable: true, value: false })
	Object.defineProperty(video, "duration", { configurable: true, value: 1200 })
	return video
}
