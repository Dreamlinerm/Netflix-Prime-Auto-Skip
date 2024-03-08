/* global require */
const fs = require("fs");
const path = require("path");

// Read the files where 'browser' is used
const browserFiles = ["skipper.js", "cr.js", path.join("popup", "settings.js"), path.join("popup", "settings.css")];
for (let file of browserFiles) {
  console.log(path.join("firefox", file) + ":");
  fs.readFile(path.join("firefox", file), "utf8", function (err, data) {
    if (err) {
      return console.log(err);
    }

    // Replace 'browser' with 'chrome'
    let result = data.replace(/browser([^-])/g, "chrome$1");

    // Write the updated content to a new file in the 'chrome' folder
    fs.writeFile(path.join("chrome", file), result, "utf8", function (err) {
      if (err) return console.log(err);
    });
  });
}

// Read the files where html is used
const htmlFiles = [path.join("popup", "popup.html"), path.join("popup", "settings.html")];
for (let file of htmlFiles) {
  console.log(path.join("firefox", file) + ":");
  fs.readFile(path.join("firefox", file), "utf8", function (err, data) {
    if (err) {
      return console.log(err);
    }

    // Replace 'browser' with 'chrome'
    let result = data
      .replace(
        "https://addons.mozilla.org/firefox/addon/netflix-prime-auto-skip/",
        "https://chrome.google.com/webstore/detail/netflixprime-auto-skip/akaimhgappllmlkadblbdknhbfghdgle"
      )
      .replace(
        "https://img.shields.io/amo/stars/NetflixPrime@Autoskip.io?color=e60010",
        "https://img.shields.io/chrome-web-store/stars/akaimhgappllmlkadblbdknhbfghdgle?color=e60010"
      );

    // Write the updated content to a new file in the 'chrome' folder
    fs.writeFile(path.join("chrome", file), result, "utf8", function (err) {
      if (err) return console.log(err);
    });
  });
}
