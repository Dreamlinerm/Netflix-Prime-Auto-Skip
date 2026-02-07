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

global.chrome = {
	runtime: {
		onInstalled: {
			addListener: vi.fn(),
		},
		onMessage: {
			addListener: vi.fn(),
		},
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
		sync: {
			get: vi.fn(),
			set: vi.fn(),
			onChanged: {
				addListener: vi.fn(),
			},
		},
	},
} as any
