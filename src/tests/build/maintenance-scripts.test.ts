import { beforeEach, afterEach, it, expect, vi } from "vitest"
const io = vi.hoisted(() => ({
	read: vi.fn(),
	write: vi.fn(),
	sync: vi.fn(),
	list: vi.fn(),
	exec: vi.fn(),
}))
vi.mock("fs", () => ({
	default: { readFile: io.read, writeFile: io.write, readFileSync: io.sync, readdirSync: io.list },
}))
vi.mock("node:fs", () => ({
	default: { readFile: io.read, writeFile: io.write, readFileSync: io.sync, readdirSync: io.list },
}))
vi.mock("node:child_process", () => ({ default: { exec: io.exec }, exec: io.exec }))
vi.mock("dotenv", () => ({ config: vi.fn() }))
const originalArgv = process.argv
beforeEach(() => {
	vi.resetModules()
	vi.clearAllMocks()
	process.argv = ["node", "script"]
	io.write.mockImplementation((_p, _data, _encoding, cb) => cb(null))
	io.read.mockImplementation((path, _encoding, cb) =>
		cb(
			null,
			path === "README.md"
				? "Before\n<!-- description -->\nold\n<!-- descriptionEnd -->\nAfter"
				: "- Feature\nDisclaimer",
		),
	)
	io.list.mockReturnValue(["en.md"])
	io.sync.mockReturnValue("Total: 1h2m3s")
	io.exec.mockImplementation((_cmd, cb) => cb(null, "translated", ""))
})
afterEach(() => {
	process.argv = originalArgv
	vi.unstubAllEnvs()
})
it("converts documentation bullets and replaces the README description", async () => {
	await import("../../../scripts/copyDocsFtoC")
	expect(io.write).toHaveBeenCalledWith(
		expect.stringContaining("ChromeStoreDescriptions/en.md"),
		"  • Feature\nDisclaimer",
		"utf8",
		expect.any(Function),
	)
	expect(io.write).toHaveBeenCalledWith(
		"README.md",
		expect.stringContaining("## Disclaimer"),
		"utf8",
		expect.any(Function),
	)
})
it.each(["docs/storeDescriptions/en.md", "README.md"])(
	"handles a documentation read failure at %s",
	async (failing) => {
		io.read.mockImplementation((path, _encoding, cb) =>
			cb(path === failing ? new Error("read failed") : null, "<!-- description -->\nold\n<!-- descriptionEnd -->"),
		)
		await import("../../../scripts/copyDocsFtoC")
		expect(io.read).toHaveBeenCalled()
	},
)
it("handles documentation output errors", async () => {
	io.write.mockImplementation((_p, _data, _encoding, cb) => cb(new Error("write failed")))
	await import("../../../scripts/copyDocsFtoC")
	expect(io.write).toHaveBeenCalled()
})
it.each([false, true])("writes adjusted author hours (write failure %s)", async (fail) => {
	if (fail) io.write.mockImplementation((_p, _data, _encoding, cb) => cb(new Error("write failed")))
	await import("../../../scripts/hourstxtToJSON")
	expect(io.write).toHaveBeenCalledWith("authorHours.json", '{"time":"90h2m3s"}', "utf8", expect.any(Function))
})
it.each(["ok", "error", "stderr"])("handles the translation subprocess result %s", async (result) => {
	io.exec.mockImplementation((_cmd, cb) =>
		cb(result === "error" ? new Error("process failed") : null, "translated", result === "stderr" ? "warning" : ""),
	)
	await import("../../../scripts/deepl")
	expect(io.exec).toHaveBeenCalledWith(expect.stringContaining("jsontt"), expect.any(Function))
})
it.each(["ok", "new-read", "old-read", "write"])("merges translated keys, handling %s", async (result) => {
	process.argv.push("update")
	vi.stubEnv("DEEPL_API_KEY", "test-only")
	io.read.mockImplementation((path, _encoding, cb) => {
		const isNew = path.includes(".translation/")
		const failed = (result === "new-read" && isNew) || (result === "old-read" && !isNew)
		cb(
			failed ? new Error("read failed") : null,
			isNew ? '{"new":"translated","same":"new"}' : '{"old":"preserved","same":"old"}',
		)
	})
	if (result === "write") io.write.mockImplementation((_p, _data, _encoding, cb) => cb(new Error("write failed")))
	await import("../../../scripts/deepl")
	if (["new-read", "old-read"].includes(result)) expect(io.write).not.toHaveBeenCalled()
	else {
		expect(io.write).toHaveBeenCalledTimes(13)
		expect(JSON.parse(io.write.mock.calls[0][1])).toEqual({ old: "preserved", same: "new", new: "translated" })
	}
})
