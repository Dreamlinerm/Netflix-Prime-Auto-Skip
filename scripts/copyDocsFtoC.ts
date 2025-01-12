import fs from "fs"
import path from "path"

// Copy markdown translation files
// copy zip form web-ext-artifacts to home folder as a xpi file
const storeDescriptionsPath = path.join("docs", "storeDescriptions")
const ChromeStoreDescriptionsPath = path.join("docs", "ChromeStoreDescriptions")
const storeDescriptions = fs.readdirSync(storeDescriptionsPath)
const replacesForDescription = [
	[/.*ul>\r?\n/g, ""],
	["<li>", "  • "],
	// only /li in line
	[/\n<\/li>\r?\n/g, ""],
	["</li>", ""],
	// change link to markdown
	[/<a href="(.*)" .*>(.*)<\/a>/g, "[$2]($1)"],
	[/<a href='(.*)' .*>(.*)<\/a>/g, "[$2]($1)"],
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
