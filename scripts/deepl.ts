#!/usr/bin/env node
import { config } from "dotenv"
import { exec } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

config()
console.log("Imported env variables:", process.env.DEEPL_API_KEY ? "DEEPL_API_KEY: ✅" : "DEEPL_API_KEY; ❌")
// set DEEPL_API_KEY=... in terminal
if (process.argv.length === 2) {
	console.log("Starting the translation process")
	exec(
		"jsontt .translation/deepl.EN.json -m deepl -n deepl -fb yes -cl 3 -c no -f EN -t DE ES FR IT JA KO PL PT SV TR ZH",
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

	const localesPath = path.join("src", "locales")
	const translationPath = ".translation"

	// Step 1: Read the deepl.Lang.json file
	const deepLang = ["DE", "EN", "ES", "FR", "IT", "JA", "KO", "PL", "PT", "PT", "SV", "TR", "ZH"]
	const firefoxLocales = ["de", "en", "es", "fr", "it", "ja", "ko", "pl", "pt", "pt_BR", "sv", "tr", "zh_CN"]
	deepLang.forEach((trans, index) => {
		fs.readFile(path.join(translationPath, `deepl.${trans}.json`), "utf8", function (err, newKeys) {
			console.log("lang:", trans)
			if (err) return console.log(err)

			// Append the new keys to the language files
			console.log(firefoxLocales[index])
			const localeFilePath = path.join(localesPath, `${firefoxLocales[index]}.json`)
			fs.readFile(localeFilePath, "utf8", function (err, oldKeys) {
				if (err) return console.log(err)
				const newTranslation = { ...JSON.parse(oldKeys), ...JSON.parse(newKeys) }
				fs.writeFile(localeFilePath, JSON.stringify(newTranslation, null, 2), "utf8", function (err) {
					if (err) return console.log(err)
				})
			})
		})
	})
}
