const fs = require("fs");
const path = require("path");

// Check if 'chrome' folder exists, if not, create it
if (!fs.existsSync("chrome")) {
  fs.mkdirSync("chrome");
}

// Read the file
fs.readFile(path.join("firefox", "skipper.js"), "utf8", function (err, data) {
  if (err) {
    return console.log(err);
  }

  // Replace 'browser' with 'chrome'
  let result = data.replace(/browser([^-])/g, "chrome$1");

  // Write the updated content to a new file in the 'chrome' folder
  fs.writeFile(path.join("chrome", "skipper.js"), result, "utf8", function (err) {
    if (err) return console.log(err);
  });
});
