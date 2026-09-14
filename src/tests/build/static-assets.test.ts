import { readFileSync, readdirSync, existsSync } from "node:fs"
import path from "node:path"
import { expect, it } from "vitest"
const root = process.cwd()
it("all localization files contain parseable string messages", () => {
	const directory = path.join(root, "src/locales")
	const files = readdirSync(directory).filter((p) => p.endsWith(".json"))
	expect(files.length).toBeGreaterThan(10)
	for (const file of files) {
		const value = JSON.parse(readFileSync(path.join(directory, file), "utf8"))
		expect(Object.keys(value).length, file).toBeGreaterThan(0)
		for (const [key, message] of Object.entries(value)) expect(typeof message, `${file}:${key}`).toBe("string")
	}
})
it("both extension HTML entrypoints have a mount point and an existing module", () => {
	for (const page of ["action-popup", "options-page"]) {
		const dir = path.join(root, "src/ui", page),
			html = readFileSync(path.join(dir, "index.html"), "utf8")
		expect(html).toContain('id="app"')
		expect(existsSync(path.join(dir, "index.ts"))).toBe(true)
	}
})
it("BUG G03: graph script paths must match repository filename case on Linux", () => {
	const files = readdirSync(path.join(root, "graph")),
		html = readFileSync(path.join(root, "graph/chart.html"), "utf8")
	for (const match of html.matchAll(/<script src="([^"/:]+\.js)"><\/script>/g))
		expect(files, match[1]).toContain(match[1])
})
