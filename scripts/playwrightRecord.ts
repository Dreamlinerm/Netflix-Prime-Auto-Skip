import { chromium } from "@playwright/test"
import fs from "node:fs"
import path from "node:path"

process.env.PWDEBUG ??= "1"

const projectRoot = process.cwd()

const extensionPath = path.resolve(projectRoot, process.env.EXTENSION_PATH ?? "dist/chrome")
if (!fs.existsSync(extensionPath)) {
	throw new Error(
		`Extension build not found at ${extensionPath}. Run "pnpm build:chrome" first (or set EXTENSION_PATH).`,
	)
}

const userDataDir = path.resolve(projectRoot, (process.env.PW_USER_DATA_DIR?.trim() || ".playwright/user-data").trim())
const channel = process.env.PW_CHANNEL?.trim() || undefined

fs.mkdirSync(userDataDir, { recursive: true })

const context = await chromium.launchPersistentContext(userDataDir, {
	headless: false,
	channel,
	args: [
		`--disable-extensions-except=${extensionPath}`,
		`--load-extension=${extensionPath}`,
		"--no-first-run",
		"--no-default-browser-check",
	],
})

try {
	const page = await context.newPage()

	console.log("\nPlaywright Recorder")
	console.log(`- Profile: ${userDataDir}`)
	console.log(`- Extension: ${extensionPath}`)
	console.log("\nThe Playwright inspector should open now.")
	console.log("Use it to pick locators / record actions, then click Resume to exit.")

	await page.pause()
} finally {
	await context.close()
}
