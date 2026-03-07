import { test as base, chromium, type BrowserContext } from "@playwright/test"
import fs from "node:fs"
import path from "node:path"

type ExtensionFixtures = {
	context: BrowserContext
	extensionId: string
	extensionBaseUrl: string
}

export const test = base.extend<ExtensionFixtures>({
	context: async ({}, use) => {
		const extensionPath = path.resolve(process.cwd(), "dist/chrome")
		if (!fs.existsSync(extensionPath)) {
			throw new Error(`Extension build not found at ${extensionPath}. Run "pnpm build:chrome" first.`)
		}

		// Keep a persistent Chrome profile in the repo-local folder.
		// This makes it easy to stay signed-in between runs.
		const userDataDir = path.resolve(process.cwd(), ".playwright/user-data")
		fs.mkdirSync(userDataDir, { recursive: true })

		const context = await chromium.launchPersistentContext(userDataDir, {
			headless: false,
			channel: "chrome",
			args: [
				`--disable-extensions-except=${extensionPath}`,
				`--load-extension=${extensionPath}`,
				"--no-first-run",
				"--no-default-browser-check",
			],
		})

		try {
			await use(context)
		} finally {
			await context.close()
		}
	},

	extensionId: async ({ context }, use) => {
		let [worker] = context.serviceWorkers()
		if (!worker) {
			worker = await context.waitForEvent("serviceworker")
		}

		const extensionId = new URL(worker.url()).host
		await use(extensionId)
	},

	extensionBaseUrl: async ({ extensionId }, use) => {
		await use(`chrome-extension://${extensionId}`)
	},
})

export const expect = test.expect
