#!/usr/bin/env node
import { config } from "dotenv"
import { exec } from "child_process"
import fs from "fs"
import path from "path"

config()
console.log("process.env", process.env.DEEPL_API_KEY)
// set DEEPL_API_KEY=... in terminal
if (process.argv.length === 2) {
	exec(
		"jsontt .translation/deepl.EN.json -m deepl -n deepl -fb yes -cl 3 -f EN -t DE ES FR IT JA KO PL PT SV TR ZH",
		(error, stdout, stderr) => {
			if (error) {
				console.error(`Error: ${error.message}`)
				return
			}
			if (stderr) {
				console.error(`Stderr: ${stderr}`)
				return
			}
			console.log(`Output: ${stdout}`)
		},
	)
}

if (process.argv.length === 3) {
	console.log("Update the language files")
	// read the deepl.Lang.json files and copy the new keys into the language files in the folder firefox _locales

	const localesPath = "src\\locales"

	// Step 1: Read the deepl.Lang.json file
	const deepLang = ["DE", "EN", "ES", "FR", "IT", "JA", "KO", "PL", "PT", "PT", "SV", "TR", "ZH"]
	// const locales = fs.readdirSync(localesPath);
	const firefoxLocales = ["de", "en", "es", "fr", "it", "ja", "ko", "pl", "pt", "pt_BR", "sv", "tr", "zh_CN"]
	deepLang.forEach((trans, index) => {
		fs.readFile(path.join(".translation\\", "deepl." + trans + ".json"), "utf8", function (err, newKeys) {
			console.log("lang:", trans)
			if (err) return console.log(err)

			// Append the new keys to the language files
			console.log(firefoxLocales[index])
			fs.readFile(localesPath + "\\" + firefoxLocales[index] + ".json", "utf8", function (err, oldKeys) {
				if (err) return console.log(err)
				const newTranslation = { ...JSON.parse(oldKeys), ...JSON.parse(newKeys) }
				fs.writeFile(
					localesPath + "\\" + firefoxLocales[index] + ".json",
					JSON.stringify(newTranslation, null, 2),
					"utf8",
					function (err) {
						if (err) return console.log(err)
					},
				)
			})
		})
	})
}
