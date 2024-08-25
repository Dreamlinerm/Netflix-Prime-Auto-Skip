require("dotenv").config();
const { exec } = require("child_process");

exec("jsontt firefox/_locales/en/messages.json -m deepl -n myApp -fb yes -cl 3 -f EN -t DE FR NL ES IT PT SV RU ZH JA", (error, stdout, stderr) => {
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
