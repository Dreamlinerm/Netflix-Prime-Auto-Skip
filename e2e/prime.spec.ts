import { expect, test } from "./fixtures/extensionTest"

test("test goto prime", async ({ context }) => {
	const page = await context.newPage()
	await page.goto(`https://www.amazon.de/gp/video/detail/B0G3DCX3YN/ref=atv_hm_hom_c_pEHQ18_6_1?jic=8%7CEgNhbGw%3D`)
})
