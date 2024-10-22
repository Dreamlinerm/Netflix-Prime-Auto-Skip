async function addSubtitles() {
  if (document.getElementById("uploadSubtitles") !== null) document.getElementById("uploadSubtitles").remove();
  console.log("subtitles.js");
  const div = document.createElement("div");
  div.style = "z-index:999;position: absolute;top: 50%;left: 50%;";

  let uploadButton = document.createElement("input");
  uploadButton.id = "uploadSubtitles";
  uploadButton.type = "file";
  uploadButton.accept = ".srt";
  uploadButton.textContent = "Upload Subtitles";
  uploadButton.style =
    "pointer-events: all;display: block;z-index:999;position: absolute;top: 0;left: 0;background: white;color: black;font-size: 3em;";
  div.appendChild(uploadButton);
  document.body.appendChild(div);

  uploadButton.addEventListener("change", function () {
    console.log("uploadButton.addEventListener", "subtitles.js");
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
    div.removeChild(uploadButton);
  });
}

function parseSrtFile(text) {
  console.log("parseSrtFile");
  var srt_array = fromSrt(text);
  console.log("srt_array", srt_array);
  let subtitles = document.createElement("div");
  subtitles.id = "subtitles";
  subtitles.style = "z-index:999;position: absolute;top: 50%;left: 50%;  font-size: 3em;";
  document.body.appendChild(subtitles);
  let video = document.querySelector("video");

  video.addEventListener("timeupdate", function () {
    console.log("timeupdate", video.currentTime);
    const currentTime = video.currentTime;
    // find currentTime in subtitles
    let currentSubtitle =
      srt_array.find((subtitle, index) => {
        return currentTime >= subtitle.startSeconds && currentTime <= subtitle.endSeconds;
      }) || "";
    subtitles.innerHTML = currentSubtitle?.text || "";
  });
}
