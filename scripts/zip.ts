// create a zip file of every file and folder in ../ directory except list of exceptions
import * as fs from "fs"
import * as path from "path"
// import * as archiver from "archiver"
import * as archiverModule from "archiver"
const archiver = archiverModule.default
const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:\/)/, "$1"))
const output = fs.createWriteStream(path.join(__dirname, "../dist/archive.zip"))
const archive = archiver("zip", {
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

const exceptions = [
	".git",
	".github",
	".translation",
	".vscode",
	"android-app",
	"chrome",
	"dist",
	"graph",
	"node_modules",
	"releases",
]
const baseDir = path.join(__dirname, "../")
fs.readdirSync(baseDir).forEach((file) => {
	if (!exceptions.includes(file)) {
		const filePath = path.join(baseDir, file)
		const stats = fs.statSync(filePath)
		if (stats.isFile()) {
			archive.file(filePath, { name: file })
		} else if (stats.isDirectory()) {
			archive.directory(filePath, file)
		}
	}
})

archive.finalize()
