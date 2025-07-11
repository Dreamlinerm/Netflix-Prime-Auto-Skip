/* global require */
/* global process */
// requires https://github.com/lazypic/git-hours to be installed globally
import fs from "fs"
import path from "path"
// open AuthorHours.txt and write time into JSON file

const authorHoursFilePath = "authorHours.json"
const authorHoursFile = fs.readFileSync(authorHoursFilePath, "utf8")
const time = authorHoursFile.split("\n")[0].split(": ")[1]
const hours = parseInt(time.split("h")[0]) + 67 + 10 + 4 // refactor vue3 branch, hideTitles branch, paramount new
const minutes = time.split("h")[1].split("m")[0]
const seconds = time.split("h")[1].split("m")[1].split("s")[0]
const json = { time: hours + "h" + minutes + "m" + seconds + "s" }

fs.writeFile(authorHoursFilePath, JSON.stringify(json), "utf8", function (err) {
	if (err) return console.log(err)
})
