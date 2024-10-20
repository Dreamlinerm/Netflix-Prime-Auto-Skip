async function addSubtitles() {
  console.log("subtitles.js");
  // add Upload button to website
  const UploadButtonPosition = document.body;
  if (UploadButtonPosition) {
    let uploadButton = document.querySelector("#uploadSubtitles");
    if (!uploadButton) {
      uploadButton = document.createElement("input");
      /* <div id="upload">UploadSettings</div> */
      uploadButton.id = "uploadSubtitles";
      uploadButton.type = "file";
      uploadButton.accept = ".srt";
      uploadButton.textContent = "Upload Subtitles";
      UploadButtonPosition.insertBefore(uploadButton, UploadButtonPosition.firstChild);
      uploadButton.onclick = function () {
        console.log("uploadButton.onclick", "subtitles.js");
        // get the file from #file and console.log it
      };
      // selected file
      uploadButton.addEventListener("change", function () {
        // get the file from #file and console.log it
        const file = uploadButton.files[0];
        console.log("file", file);
        if (file !== undefined && file.name.endsWith(".srt")) {
          // read contents of file
          const reader = new FileReader();
          // reader.onload = (e) => {
          reader.addEventListener("load", (e) => {
            parseSrtFile(e.target.result);
          });
          reader.readAsText(file);
        } else {
          alert("The file you uploaded is not a valid file.");
          return;
        }
      });

      //   uploadButton.onclick = function () {
      //     // get the file from #file and console.log it
      //     const file = document.getElementById("file").files[0];
      //     if (file !== undefined && "application/json" === file.type) {
      //       if (confirm(file.name + " will replace the Settings.\n\nAre you sure you want to do this?")) {
      //         // read contents of file
      //         const reader = new FileReader();
      //         // reader.onload = (e) => {
      //         reader.addEventListener("load", (e) => {
      //           try {
      //             // parse the JSON
      //             const data = JSON.parse(e.target.result);
      //             // set the settings to the parsed JSON
      //             settings = data;
      //             // save the settings to the storage
      //             browser.storage.sync.set({ settings });
      //             // reload the page
      //             location.reload();
      //             // };
      //           } catch (e) {
      //             alert("The file you uploaded is not a valid JSON file.");
      //             return;
      //           }
      //         });
      //         reader.readAsText(file);
      //       }
      //     } else {
      //       alert("The file you uploaded is not a valid JSON file.");
      //       return;
      //     }
      //   };
    }
  }
}

function parseSrtFile(text) {
  console.log("parseSrtFile");
  var srt_array = fromSrt(text);
  console.log("srt_array", srt_array);
}
