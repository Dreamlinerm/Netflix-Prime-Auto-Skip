/* global require */
/* global process */
const fs = require("fs");
const path = require("path");

// open AuthorHours.txt and write time into JSON file

const hours = fs.readFileSync("AuthorHours.txt", "utf8");
console.log(hours.split("\n")[0].split(": ")[1]);
const json = { time: hours.split("\n")[0].split(": ")[1] };

fs.writeFile("AuthorHours.json", JSON.stringify(json), "utf8", function (err) {
  if (err) return console.log(err);
});
