import fs from "fs"
import path from "path"
const __dirname = path.resolve()
function convertCsv(name) {
	const file = fs
		.readFileSync(path.join(__dirname, name + ".csv"), "utf-8")
		.split("\n")
		// remove the first two lines
		.slice(2)
		.map((line) => line.split(","))
		.map((line) => {
			return {
				date: line[0],
				count: parseInt(line[1]),
			}
		})
	// remove all entries until count is greater than 0
	while (file[0].count === 0) {
		file.shift()
	}
	// // delete last two entries
	// file.pop();
	// file.pop();
	// console.log(file);
	fs.writeFileSync(path.join(__dirname, name + ".js"), "let " + name + " = " + JSON.stringify(file))
}
convertCsv("chromeUsers")
convertCsv("chromeDownloads")

function convertEdgeCsv(name) {
	const file = fs.readFileSync(path.join(__dirname, name + ".csv"), "utf-8")
	const firstLine = file.split("\n")[0]
	const userCountPosition = firstLine.split(",").indexOf("userCount")
	const datePosition = firstLine.split(",").indexOf("date")

	const fileText = file
		.split("\n")
		// remove the first line
		.slice(1)
		.map((line) => line.split(","))
		.map((line) => {
			return {
				date: line[datePosition],
				count: parseInt(line[userCountPosition]),
			}
		})
	fs.writeFileSync(path.join(__dirname, name + ".js"), "let " + name + " = " + JSON.stringify(fileText))
}

convertEdgeCsv("edgeUsers")
convertEdgeCsv("edgeDownloads")
