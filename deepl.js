#!/usr/bin/env node
if (process.argv.length === 2) {
  require("dotenv").config();
  const { exec } = require("child_process");

  exec("jsontt Publish/deepl.EN.json -m deepl -n deepl -fb yes -cl 3 -f EN -t DE ES FR IT JA KO PL PT SV TR ZH", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(`Output: ${stdout}`);
  });
}

if (process.argv.length === 3) {
  // read the deepl.Lang.json files and copy the new keys into the language files in the folder firefox _locales

  const fs = require("fs");
  const path = require("path");
  const firefoxPath = path.join("firefox", "_locales");

  // Step 1: Read the deepl.Lang.json file
  const deepLang = ["DE", "EN", "ES", "FR", "IT", "JA", "KO", "PL", "PT", "PT", "SV", "TR", "ZH"];
  // const locales = fs.readdirSync(firefoxPath);
  const firefoxLocales = ["de", "en", "es", "fr", "it", "ja", "ko", "pl", "pt", "pt_BR", "sv", "tr", "zh_CN"];
  deepLang.forEach((trans, index) => {
    fs.readFile(path.join("Publish", "deepl." + trans + ".json"), "utf8", function (err, newKeys) {
      console.log(path.join("Publish", trans));
      if (err) return console.log(err);

      // Append the new keys to the language files
      console.log(firefoxLocales[index]);
      fs.readFile(firefoxPath + "\\" + firefoxLocales[index] + "\\messages.json", "utf8", function (err, oldKeys) {
        if (err) return console.log(err);
        const newTranslation = { ...JSON.parse(oldKeys), ...JSON.parse(newKeys) };
        fs.writeFile(firefoxPath + "\\" + firefoxLocales[index] + "\\messages.json", JSON.stringify(newTranslation, null, 2), "utf8", function (err) {
          if (err) return console.log(err);
        });
      });
    });
  });
}
