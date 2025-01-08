const fs = require("fs");
const path = require("path");
const firefoxPath = path.join("firefox", "_locales");
const OutputPath = "Streaming-enhanced" + "\\" + "src" + "\\" + "locales";

const firefoxLocales = ["de", "en", "es", "fr", "it", "ja", "ko", "pl", "pt", "pt_BR", "sv", "tr", "zh_CN"];
firefoxLocales.forEach((lang, index) => {
  fs.readFile(firefoxPath + "\\" + lang + "\\messages.json", "utf8", function (err, oldKeys) {
    if (err) return console.log(err);
    let keys = JSON.parse(oldKeys);
    let newTranslation = {};
    Object.keys(keys).forEach((key) => {
      newTranslation[key] = keys[key].message;
    });
    // create file

    fs.writeFile(OutputPath + "\\" + lang + ".json", JSON.stringify(newTranslation, null, 2), "utf8", function (err) {
      if (err) return console.log(err);
    });
  });
});
