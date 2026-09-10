import { afterEach, vi } from "vitest"

const mocks = vi.hoisted(() => {
	const event = () => ({ addListener: vi.fn(), removeListener: vi.fn(), hasListener: vi.fn() })
	const area = () => ({
		get: vi.fn(async () => ({})),
		set: vi.fn(async () => {}),
		remove: vi.fn(async () => {}),
		clear: vi.fn(async () => {}),
		onChanged: event(),
	})
	return {
		browser: {
			browserAction: undefined as unknown,
			webRequest: undefined as unknown,
			runtime: {
				sendMessage: vi.fn(),
				getURL: vi.fn((path) => `chrome-extension://test/${path}`),
				onInstalled: event(),
				openOptionsPage: vi.fn(),
				getManifest: vi.fn(() => ({ version: "1.1.107" })),
			},
			storage: { local: area(), sync: area(), onChanged: event() },
			tabs: { create: vi.fn(), query: vi.fn(async () => []), onRemoved: event() },
			action: { setBadgeBackgroundColor: vi.fn(), setBadgeText: vi.fn() },
			permissions: { contains: vi.fn(async () => true), request: vi.fn(async () => true) },
			i18n: { getMessage: vi.fn((key) => key) },
		},
		sendMessage: vi.fn(async () => undefined),
		onMessage: vi.fn(),
	}
})
vi.mock("webextension-polyfill", () => ({
	...mocks.browser,
	default: mocks.browser,
	get action() {
		return mocks.browser.action
	},
	get browserAction() {
		return mocks.browser.browserAction
	},
	get webRequest() {
		return mocks.browser.webRequest
	},
}))
vi.mock("webext-bridge/content-script", () => ({ sendMessage: mocks.sendMessage, onMessage: mocks.onMessage }))
vi.mock("webext-bridge/background", () => ({ onMessage: mocks.onMessage }))
vi.stubGlobal("chrome", mocks.browser)
vi.stubGlobal("$t", (key: string) => key)
// No real API calls, account access or playback in deterministic tests.
vi.stubGlobal(
	"fetch",
	vi.fn(() => Promise.reject(new Error("Unexpected network access in test"))),
)
afterEach(() => {
	vi.useRealTimers()
})
