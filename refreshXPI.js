/* global require */
const fs = require("fs");
const path = require("path");

// copy zip form web-ext-artifacts to home folder as a xpi file
const source = path.join("firefox", "web-ext-artifacts");
const target = "";
const files = fs.readdirSync(source);
// pick last file
const file = files[files.length - 1];
console.log(file);
if (file.endsWith(".zip")) {
  fs.copyFileSync(path.join(source, file), path.join(target, "NetflixPrime@Autoskip.io.xpi"));
}
