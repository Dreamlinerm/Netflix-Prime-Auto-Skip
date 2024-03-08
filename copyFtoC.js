/* global require */
const fs = require("fs");
const path = require("path");

// Check if 'chrome' folder exists, if not, create it
if (!fs.existsSync("chrome")) {
  fs.mkdirSync("chrome");
}

// Read all the firefox files and replace the chrome files
const files = [
  "skipper.js",
  "cr.js",
  path.join("popup", "settings.js"),
  path.join("popup", "settings.css"),
  path.join("popup", "popup.html"),
  path.join("popup", "settings.html"),

  path.join("_locales", path.join("de", "messages.json")),
  path.join("_locales", path.join("en", "messages.json")),
  path.join("_locales", path.join("mk", "messages.json")),
  path.join("_locales", path.join("pt_BR", "messages.json")),
];
// all regex replacements
const replaces = [
  [/browser([^-])/g, "chrome$1"],
  [
    "https://addons.mozilla.org/firefox/addon/netflix-prime-auto-skip/",
    "https://chrome.google.com/webstore/detail/netflixprime-auto-skip/akaimhgappllmlkadblbdknhbfghdgle",
  ],
  [
    "https://img.shields.io/amo/stars/NetflixPrime@Autoskip.io?color=e60010",
    "https://img.shields.io/chrome-web-store/stars/akaimhgappllmlkadblbdknhbfghdgle?color=e60010",
  ],
  ["Streaming enhanced: Netflix Disney+ Prime Video", "Streaming enhanced Netflix Disney Prime Video"],
];
console.log("Copy Files from Firefox to Chrome:");
for (let file of files) {
  console.log(path.join("chrome", file));
  fs.readFile(path.join("firefox", file), "utf8", function (err, data) {
    if (err) return console.log(err);
    for (let replace of replaces) {
      data = data.replaceAll(replace[0], replace[1]);
    }

    // Write the updated content to a new file in the 'chrome' folder
    fs.writeFile(path.join("chrome", file), data, "utf8", function (err) {
      if (err) return console.log(err);
    });
  });
}
console.log("\n");
