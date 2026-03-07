import { test as base, chromium, type BrowserContext } from "@playwright/test"
import fs from "node:fs"
import path from "node:path"

const projectRoot = process.cwd()
const extensionPath = path.resolve(projectRoot, "dist/chrome")

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const normalizeFsPath = (filePath: string) => path.normalize(filePath).toLowerCase()

function getUserDataDir(): { userDataDir: string; isExternal: boolean } {
	const envDir = process.env.PLAYWRIGHT_CHROME_USER_DATA_DIR?.trim()
	if (envDir) {
		return { userDataDir: path.resolve(envDir), isExternal: true }
	}

	return { userDataDir: path.resolve(projectRoot, ".playwright/user-data"), isExternal: false }
}

function getPreferenceCandidatePaths(userDataDir: string): string[] {
	const profileDirFromEnv = process.env.PLAYWRIGHT_CHROME_PROFILE_DIR?.trim()
	const candidates = new Set<string>([
		// If userDataDir points at a specific profile folder.
		path.join(userDataDir, "Preferences"),
		// Common when userDataDir is the Chrome "User Data" root.
		path.join(userDataDir, "Default", "Preferences"),
		path.join(userDataDir, "Profile 1", "Preferences"),
		path.join(userDataDir, "Profile 2", "Preferences"),
	])
	if (profileDirFromEnv) {
		candidates.add(path.join(userDataDir, profileDirFromEnv, "Preferences"))
	}

	try {
		if (fs.existsSync(userDataDir) && fs.statSync(userDataDir).isDirectory()) {
			for (const name of fs.readdirSync(userDataDir)) {
				if (name === "Default" || /^Profile \d+$/.test(name)) {
					candidates.add(path.join(userDataDir, name, "Preferences"))
				}
			}
		}
	} catch {
		// Ignore; caller will still try common candidates.
	}

	return [...candidates]
}

function tryGetExtensionIdFromPreferencesFile(params: {
	preferencesPath: string
	expectedExtensionPath: string
}): string | undefined {
	const { preferencesPath, expectedExtensionPath } = params
	if (!fs.existsSync(preferencesPath)) return undefined

	const raw = fs.readFileSync(preferencesPath, "utf-8")
	const json = JSON.parse(raw) as {
		extensions?: { settings?: Record<string, { path?: string }> }
	}

	const settings = json.extensions?.settings
	if (!settings) return undefined

	for (const [id, setting] of Object.entries(settings)) {
		if (!setting?.path) continue
		if (normalizeFsPath(setting.path) === expectedExtensionPath) return id
	}

	return undefined
}

async function getExtensionIdFromChromePreferences(params: {
	userDataDir: string
	extensionPath: string
	timeoutMs: number
}): Promise<string | undefined> {
	const { userDataDir, extensionPath, timeoutMs } = params
	const deadline = Date.now() + timeoutMs
	const expectedPath = normalizeFsPath(extensionPath)
	const preferenceCandidates = getPreferenceCandidatePaths(userDataDir)

	while (Date.now() < deadline) {
		for (const preferencesPath of preferenceCandidates) {
			try {
				const id = tryGetExtensionIdFromPreferencesFile({
					preferencesPath,
					expectedExtensionPath: expectedPath,
				})
				if (id) return id
			} catch {
				// Preferences may be mid-write; retry.
			}
		}

		await sleep(250)
	}

	return undefined
}

type ExtensionFixtures = {
	context: BrowserContext
	extensionId: string
	extensionBaseUrl: string
}

export const test = base.extend<ExtensionFixtures>({
	context: async ({ browserName: _browserName }, use) => {
		if (!fs.existsSync(extensionPath)) {
			throw new Error(`Extension build not found at ${extensionPath}. Run "pnpm build:chrome" first.`)
		}

		const { userDataDir, isExternal } = getUserDataDir()
		if (!fs.existsSync(userDataDir)) {
			if (isExternal) {
				throw new Error(
					`PLAYWRIGHT_CHROME_USER_DATA_DIR points to a non-existent folder: ${userDataDir}`,
				)
			}
			fs.mkdirSync(userDataDir, { recursive: true })
		}

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
		// MV3: service worker URL is usually chrome-extension://<id>/...
		const existingWorker = context
			.serviceWorkers()
			.find((w) => w.url().startsWith("chrome-extension://"))
		if (existingWorker) {
			await use(new URL(existingWorker.url()).host)
			return
		}

		try {
			const worker = await context.waitForEvent("serviceworker", { timeout: 5_000 })
			if (worker.url().startsWith("chrome-extension://")) {
				await use(new URL(worker.url()).host)
				return
			}
		} catch {
			// Not fatal; fall back to other strategies.
		}

		// Last resort: read the unpacked extension ID from the persistent profile.
		const { userDataDir } = getUserDataDir()
		const idFromPreferences = await getExtensionIdFromChromePreferences({
			userDataDir,
			extensionPath,
			timeoutMs: 15_000,
		})
		if (!idFromPreferences) {
			throw new Error(
				[
					"Failed to determine extensionId.",
					"The extension service worker/background page did not appear, and Chrome profile Preferences did not contain an entry for the unpacked extension.",
					"If you are using a real Chrome profile, close all running Chrome windows and try again.",
					"If you are using the Playwright profile, try deleting .playwright/user-data and re-running the test.",
				].join(" "),
			)
		}

		await use(idFromPreferences)
	},

	extensionBaseUrl: async ({ extensionId }, use) => {
		await use(`chrome-extension://${extensionId}`)
	},
})

export const expect = test.expect
