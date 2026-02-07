import { sendMessage } from "webext-bridge/content-script"
import { onMessage } from "webext-bridge/background"
import { vi } from "vitest"

vi.mock("webextension-polyfill", () => {
	console.log("Global mock for webextension-polyfill applied")
	return {
		runtime: {
			sendMessage: vi.fn(),
		},
		storage: {
			local: {
				get: vi.fn(),
				set: vi.fn(),
				onChanged: {
					addListener: vi.fn(),
				},
			},
		},
	}
})

const chromeMock = {
	tabs: {
		create: vi.fn(),
	},
	runtime: {
		getURL: vi.fn((path) => `chrome-extension://mock/${path}`),
	},
	storage: {
		local: {
			get: vi.fn((key, callback) => callback({ [key]: "mockValue" })),
			set: vi.fn((items, callback) => callback && callback()),
			onChanged: {
				addListener: vi.fn((callback) => {
					// Simulate a change event
					callback({ key: { newValue: "mockValue" } })
				}),
			},
		},
		sync: {
			get: vi.fn((key, callback) => callback({ [key]: "mockValue" })),
			set: vi.fn((items, callback) => callback && callback()),
			onChanged: {
				addListener: vi.fn((callback) => {
					// Simulate a change event
					callback({ key: { newValue: "mockValue" } })
				}),
			},
		},
	},
}

global.chrome = chromeMock
global.$t = (key) => key // Mock the $t function to return the key itself
