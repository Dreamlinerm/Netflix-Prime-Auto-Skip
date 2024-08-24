/* global require */
const fs = require("fs");
const path = require("path");

// copy zip form web-ext-artifacts to home folder as a xpi file
const source = path.join("docs", "storeDescriptions");
const target = path.join("docs", "ChromeStoreDescriptions");
const files = fs.readdirSync(source);
const replaces = [
  [/.*ul>\r?\n/g, ""],
  ["<li>", "  • "],
  // only /li in line
  [/\n<\/li>\r?\n/g, ""],
  ["</li>", ""],
  // change link to markdown
  [/<a href=\"(.*)\" .*>(.*)<\/a>/g, "[$2]($1)"],
];
// pick last file
files.forEach((file) => {
  console.log(file);
  fs.readFile(path.join(source, file), "utf8", function (err, data) {
    if (err) return console.log(err);
    for (let replace of replaces) {
      console.log(replace[0]);
      data = data.replaceAll(replace[0], replace[1]);
    }
    fs.writeFile(path.join(target, file), data, "utf8", function (err) {
      if (err) return console.log(err);
    });
  });
});
