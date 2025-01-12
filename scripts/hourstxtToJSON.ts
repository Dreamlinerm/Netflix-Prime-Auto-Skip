/* global require */
/* global process */
// requires https://github.com/lazypic/git-hours to be installed globally
import fs from "fs"
import path from "path"
// open AuthorHours.txt and write time into JSON file

const authorHoursFilePath = "authorHours.json"
const hours = fs.readFileSync(authorHoursFilePath, "utf8")
const json = { time: hours.split("\n")[0].split(": ")[1] }

fs.writeFile(authorHoursFilePath, JSON.stringify(json), "utf8", function (err) {
	if (err) return console.log(err)
})
