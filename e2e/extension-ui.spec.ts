import { expect, test } from "./fixtures/extensionTest"

// test("options page mounts", async ({ context, extensionBaseUrl }) => {
// 	const page = await context.newPage()
// 	await page.goto(`${extensionBaseUrl}/src/ui/options-page/index.html`)
// 	await expect(page).toHaveTitle(/settings/i)
// 	await expect(page.locator("#app")).not.toBeEmpty()
// })

// test("action popup mounts", async ({ context, extensionBaseUrl }) => {
// 	const page = await context.newPage()
// 	await page.goto(`${extensionBaseUrl}/src/ui/action-popup/index.html`)
// 	await expect(page.locator("#app")).not.toBeEmpty()
// })

test("test goto netflix", async ({ context }) => {
	const page = await context.newPage()
	await page.goto(`https://www.netflix.com/browse`)
})
