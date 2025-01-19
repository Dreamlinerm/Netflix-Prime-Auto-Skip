import fs from "fs"
import path from "path"

const storeDescriptionsPath = path.join(path.join("docs", "storeDescriptions"), "en.md")
console.log("test")
console.log(storeDescriptionsPath)

fs.readFile(storeDescriptionsPath, "utf8", function (err, data) {
	if (err) return console.log(err)
	const storeDescriptions = data
		.replace("☔", "## ☔")
		.replace("💕", "## 💕")
		.replace("\r\n✨ Features\r\n", "")
		.replace("Disclaimer", "## Disclaimer")
	fs.readFile("README.md", "utf8", function (err, data) {
		if (err) return console.log(err)
		// replace the text between <!-- description --> and <!-- descriptionEnd -->
		// with the content of the storeDescriptionsPath
		const descriptionText = "<!-- description -->"
		const descriptionEndText = "<!-- descriptionEnd -->"
		const descriptionStart = data.indexOf(descriptionText) + descriptionText.length + 2
		const descriptionEnd = data.indexOf("<!-- descriptionEnd -->") - descriptionEndText.length

		const description = data.slice(descriptionStart, descriptionEnd)
		const newData = data.replace(description, storeDescriptions)

		fs.writeFile("README.md", newData, "utf8", function (err) {
			if (err) return console.log(err)
		})
	})
})

console.log("\n")
