import fs from "fs"
import path from "path"

// Copy markdown translation files
const storeDescriptionsPath = path.join("docs", "storeDescriptions")
const ChromeStoreDescriptionsPath = path.join("docs", "ChromeStoreDescriptions")
const storeDescriptions = fs.readdirSync(storeDescriptionsPath)
const replacesForDescription = [
	["    - ", "      • "],
	["- ", "  • "],
]
// pick last file
storeDescriptions.forEach((file) => {
	console.log(ChromeStoreDescriptionsPath + "\\" + file)
	fs.readFile(path.join(storeDescriptionsPath, file), "utf8", function (err, data) {
		if (err) return console.log(err)
		for (const replace of replacesForDescription) {
			data = data.replaceAll(replace[0], replace[1] as string)
		}
		fs.writeFile(path.join(ChromeStoreDescriptionsPath, file), data, "utf8", function (err) {
			if (err) return console.log(err)
		})
	})
})

console.log("\n")

console.log("copying en.md to README.md")

fs.readFile(path.join(storeDescriptionsPath, "en.md"), "utf8", function (err, data) {
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
		const descriptionStart = data.indexOf(descriptionText) + descriptionText.length + 2
		const descriptionEnd = data.indexOf("<!-- descriptionEnd -->") - 2

		const description = data.slice(descriptionStart, descriptionEnd)
		const newData = data.replace(description, storeDescriptions)

		fs.writeFile("README.md", newData, "utf8", function (err) {
			if (err) return console.log(err)
		})
	})
})
