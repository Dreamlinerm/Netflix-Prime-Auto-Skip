// Package only reproducible extension sources, without local credentials or artifacts.
import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "node:url"
import { ZipArchive } from "archiver"
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const output = fs.createWriteStream(path.join(__dirname, "../dist/archive.zip"))
const archive = new ZipArchive({
	zlib: { level: 9 }, // Sets the compression level.
})

output.on("close", function () {
	console.log(archive.pointer() + " total bytes")
	console.log("archiver has been finalized and the output file descriptor has closed.")
})
archive.on("error", function (err) {
	throw err
})
archive.pipe(output)

// Only package the files needed to inspect and reproduce the extension build.
// Local reports, credentials, profiles and unrelated files are never root entries.
const sourceEntries = new Set([
	"src",
	"scripts",
	"graph",
	".env.example",
	"License",
	"README.md",
	"CHANGELOG.md",
	"develop.md",
	"TESTING.md",
	"TESTING-tools.md",
	"package.json",
	"package-lock.json",
	"define.config.mjs",
	"tailwind.config.js",
	"manifest.config.ts",
	"manifest.chrome.config.ts",
	"manifest.firefox.config.ts",
	"vite.config.ts",
	"vite.chrome.config.ts",
	"vite.firefox.config.ts",
	"tsconfig.json",
	"tsconfig.node.json",
	"tsconfig.audit.json",
	"vitest.config.ts",
	"vitest.tools.config.ts",
	"vitest.setup.ts",
	"eslint.config.js",
	"eslint.config.mjs",
	".prettierrc",
	".prettierignore",
	".gitignore",
	".gitattributes",
])
const baseDir = path.join(__dirname, "../")
function addSource(relative: string) {
	const filePath = path.join(baseDir, relative)
	const stats = fs.lstatSync(filePath)
	if (stats.isFile()) archive.file(filePath, { name: relative })
	else if (stats.isDirectory()) {
		for (const name of fs.readdirSync(filePath)) {
			if (name.startsWith(".") || name === "node_modules" || /\.(log|pem|key|p12|tsbuildinfo)$/.test(name)) continue
			addSource(path.join(relative, name))
		}
	}
	// Do not follow symlinks: they can escape the source tree.
}
for (const entry of fs.readdirSync(baseDir)) {
	if (sourceEntries.has(entry)) addSource(entry)
}

archive.finalize()
