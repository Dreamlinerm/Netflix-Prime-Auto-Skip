import { test as base, chromium, type BrowserContext } from "@playwright/test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

type ExtensionFixtures = {
	context: BrowserContext
	extensionId: string
	extensionBaseUrl: string
}

export const test = base.extend<ExtensionFixtures>({
	context: async ({}, use) => {
		const extensionPath = path.resolve(process.cwd(), process.env.EXTENSION_PATH ?? "dist/chrome")
		if (!fs.existsSync(extensionPath)) {
			throw new Error(
				`Extension build not found at ${extensionPath}. Run \"pnpm build:chrome\" first (or set EXTENSION_PATH).`,
			)
		}

		const explicitUserDataDir = process.env.PW_USER_DATA_DIR?.trim()
		const usePersistentProfile = process.env.PW_PERSISTENT === "1"
		const shouldKeepProfile = Boolean(explicitUserDataDir || usePersistentProfile)

		const userDataDir = explicitUserDataDir
			? path.resolve(process.cwd(), explicitUserDataDir)
			: path.resolve(process.cwd(), ".playwright/user-data")

		if (shouldKeepProfile) {
			fs.mkdirSync(userDataDir, { recursive: true })
		}

		const channel = process.env.PW_CHANNEL?.trim() || undefined

		const context = await chromium.launchPersistentContext(userDataDir, {
			headless: process.env.PW_HEADLESS === "1",
			channel,
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
			if (!shouldKeepProfile) {
				fs.rmSync(userDataDir, { recursive: true, force: true })
			}
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
