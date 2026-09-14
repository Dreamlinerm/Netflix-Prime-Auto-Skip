import { beforeEach, expect, it, vi } from "vitest"
const io = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn() }))
vi.mock("fs", () => ({ default: { readFileSync: io.read, writeFileSync: io.write } }))
beforeEach(() => {
	vi.resetModules()
	vi.clearAllMocks()
	io.read.mockImplementation((file: string) =>
		file.includes("edge") ? "date,userCount\n2026-01-01,7" : "header\nheader\n2026-01-01,0\n2026-01-02,5\n\n",
	)
})
it("converts Chrome and Edge counts, removing initial Chrome zero rows", async () => {
	await import("../../../graph/convert")
	expect(io.write).toHaveBeenCalledTimes(5)
	expect(io.write).toHaveBeenCalledWith(
		expect.stringContaining("chromeUsers.js"),
		'let chromeUsers = [{"date":"2026-01-02","count":5}]',
	)
	expect(io.write).toHaveBeenCalledWith(
		expect.stringContaining("edgeUsers.js"),
		'let edgeUsers = [{"date":"2026-01-01","count":7}]',
	)
})
it("BUG G01: an empty Chrome CSV must produce an empty dataset without crashing", async () => {
	io.read.mockReturnValue("header\nheader\n")
	await expect(import("../../../graph/convert")).resolves.toBeDefined()
})
it("BUG G02: an Edge CSV trailing newline must not create a null count", async () => {
	io.read.mockImplementation((file: string) =>
		file.includes("edge") ? "date,userCount\n2026-01-01,7\n" : "header\nheader\n2026-01-01,5",
	)
	await import("../../../graph/convert")
	const output = io.write.mock.calls.find(([path]) => path.endsWith("edgeUsers.js"))![1]
	expect(JSON.parse(output.slice(output.indexOf("[")))).toHaveLength(1)
})
