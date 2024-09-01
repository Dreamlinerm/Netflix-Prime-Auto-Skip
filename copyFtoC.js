/* global require */
/* global process */
const fs = require("fs");
const path = require("path");

// Check if 'chrome' folder exists, if not, create it
if (!fs.existsSync("chrome")) {
  fs.mkdirSync("chrome");
}

// Read all the firefox files and replace the chrome files
let files = [
  "skipper.js",
  "cr.js",
  path.join("popup", "settings.js"),
  path.join("popup", "settings.css"),
  path.join("popup", "popup.html"),
  path.join("popup", "settings.html"),
];
const locales = fs.readdirSync(path.join("firefox", "_locales"));
for (let locale of locales) {
  // console.log(locsale);
  files.push(path.join("_locales", path.join(locale, "messages.json")));
}
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
  fs.readFile(path.join("firefox", file), "utf8", function (err, data) {
    console.log(path.join("chrome", file));
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

// Copy markdown translation files
// copy zip form web-ext-artifacts to home folder as a xpi file
const storeDescriptionsPath = path.join("docs", "storeDescriptions");
const ChromeStoreDescriptionsPath = path.join("docs", "ChromeStoreDescriptions");
const storeDescriptions = fs.readdirSync(storeDescriptionsPath);
const replacesForDescription = [
  [/.*ul>\r?\n/g, ""],
  ["<li>", "  • "],
  // only /li in line
  [/\n<\/li>\r?\n/g, ""],
  ["</li>", ""],
  // change link to markdown
  [/<a href=\"(.*)\" .*>(.*)<\/a>/g, "[$2]($1)"],
  [/<a href=\'(.*)\' .*>(.*)<\/a>/g, "[$2]($1)"],
];
// pick last file
storeDescriptions.forEach((file) => {
  console.log(ChromeStoreDescriptionsPath + "\\" + file);
  fs.readFile(path.join(storeDescriptionsPath, file), "utf8", function (err, data) {
    if (err) return console.log(err);
    for (let replace of replacesForDescription) {
      data = data.replaceAll(replace[0], replace[1]);
    }
    fs.writeFile(path.join(ChromeStoreDescriptionsPath, file), data, "utf8", function (err) {
      if (err) return console.log(err);
    });
  });
});

console.log("\n");
