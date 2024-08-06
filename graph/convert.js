const fs = require("fs");
const path = require("path");
function convertCsv(name) {
  let file = fs
    .readFileSync(path.join(__dirname, name + ".csv"), "utf-8")
    .split("\n")
    // remove the first two lines
    .slice(2)
    .map((line) => line.split(","))
    .map((line) => {
      return {
        date: line[0],
        count: parseInt(line[1]),
      };
    });
  // remove all entries until count is greater than 0
  while (file[0].count === 0) {
    file.shift();
  }
  // delete last two entries
  file.pop();
  file.pop();
  console.log(file);
  fs.writeFileSync(path.join(__dirname, name + ".js"), "let " + name + " = " + JSON.stringify(file));
}
convertCsv("chromeUsers");
convertCsv("chromeDownloads");
