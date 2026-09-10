import { beforeEach, it, expect, vi } from "vitest"
const mocks = vi.hoisted(() => ({
	files: [
		"src",
		"package.json",
		".env",
		".env.example",
		"private-notes.txt",
		".git",
		"node_modules",
		"dist",
		"coverage",
		"audit",
	],
	file: vi.fn(),
	directory: vi.fn(),
	pipe: vi.fn(),
	finalize: vi.fn(),
	onArchive: vi.fn(),
	onOutput: vi.fn(),
}))
vi.mock("fs", () => ({
	createWriteStream: vi.fn(() => ({ on: mocks.onOutput })),
	readdirSync: vi.fn((path) =>
		path.endsWith("/src")
			? [
					"index.ts",
					".env",
					".env.production",
					"debug.log",
					"private.pem",
					"client.key",
					"profile.p12",
					"tsconfig.tsbuildinfo",
					"node_modules",
					"external-link",
				]
			: mocks.files,
	),
	lstatSync: vi.fn((path) => ({
		isFile: () => /package\.json$|\.env\.example$|index\.ts$/.test(path),
		isDirectory: () => /\/src$/.test(path),
	})),
}))
vi.mock("archiver", () => ({
	ZipArchive: class {
		file = mocks.file
		directory = mocks.directory
		pipe = mocks.pipe
		finalize = mocks.finalize
		on = mocks.onArchive
		pointer = () => 123
	},
}))
beforeEach(() => {
	vi.resetModules()
	vi.clearAllMocks()
})
it("archives source files and excludes dependencies, git and compiled output", async () => {
	await import("../../../scripts/zip")
	expect(mocks.file).toHaveBeenCalledWith(expect.stringContaining("/src/index.ts"), { name: "src/index.ts" })
	expect(mocks.file.mock.calls.map((call) => call[1].name).sort()).toEqual([
		".env.example",
		"package.json",
		"src/index.ts",
	])
	expect(mocks.file).toHaveBeenCalledWith(expect.stringContaining("/package.json"), { name: "package.json" })
	expect(mocks.directory).not.toHaveBeenCalledWith(expect.anything(), "node_modules")
	expect(mocks.finalize).toHaveBeenCalledOnce()
	mocks.onOutput.mock.calls[0][1]()
	expect(() => mocks.onArchive.mock.calls[0][1](new Error("archive failed"))).toThrow("archive failed")
})
it("BUG Z01: source archive must never include the local .env credential file", async () => {
	await import("../../../scripts/zip")
	expect(mocks.file).not.toHaveBeenCalledWith(expect.stringContaining("/.env"), { name: ".env" })
})
