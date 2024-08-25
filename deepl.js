require("dotenv").config();
const { exec } = require("child_process");

exec("jsontt Publish/translate.json -m deepl -n deepl -fb yes -cl 3 -f EN -t DE FR ES PT IT JA PL SV ZH KO TR", (error, stdout, stderr) => {
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
