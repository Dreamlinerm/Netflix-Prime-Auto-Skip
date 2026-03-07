import { chromium } from "@playwright/test"
import fs from "node:fs"
import path from "node:path"
import { createInterface } from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"

const projectRoot = process.cwd()

const userDataDir = path.resolve(projectRoot, ".playwright/user-data")

fs.mkdirSync(userDataDir, { recursive: true })

const context = await chromium.launchPersistentContext(userDataDir, {
	headless: false,
	channel: "chrome",
	args: ["--no-first-run", "--no-default-browser-check"],
})

try {
	const page = await context.newPage()
	await page.goto("https://www.netflix.com")
	const page2 = await context.newPage()
	await page2.goto("https://www.amazon.de")
	const page3 = await context.newPage()
	await page3.goto("https://www.disneyplus.com")
	const page4 = await context.newPage()
	await page4.goto("https://www.crunchyroll.com")

	console.log("\nLogin Helper")
	console.log(`- Browser profile: ${userDataDir}`)
	console.log("\n1) Log into your Streaming service in the opened browser window")
	console.log("2) When you see you're logged in, come back here and press Enter")

	const rl = createInterface({ input, output })
	await rl.question("\nPress Enter to finish and close the browser... ")
	rl.close()
} finally {
	await context.close()
}
