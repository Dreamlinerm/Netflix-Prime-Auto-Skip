import { chromium } from "@playwright/test"
import fs from "node:fs"
import path from "node:path"

const projectRoot = process.cwd()

const extensionPath = path.resolve(projectRoot, "dist/chrome")
if (!fs.existsSync(extensionPath)) {
	throw new Error(`Extension build not found at ${extensionPath}. Run "pnpm build:chrome" first.`)
}

const userDataDir = path.resolve(projectRoot, ".playwright/user-data")

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
