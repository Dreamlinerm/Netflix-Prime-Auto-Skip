async function Amazon_addSubtitles() {
  const position = document.querySelector("#dv-web-player");
  if (position) {
    addSubtitles(position);
  }
}

async function addSubtitles(position = document.body) {
  if (document.getElementById("uploadSubtitles") !== null) document.getElementById("uploadSubtitles").remove();
  let div = document.createElement("div");
  div.style = "z-index:9999999;position: absolute;top: 200px;left: 200px;";
  let divHeader = document.createElement("div");
  divHeader.textContent = "Click here to Move";
  divHeader.id = "subtitlesHeader";
  div.appendChild(divHeader);

  let uploadButton = document.createElement("input");
  uploadButton.id = "uploadSubtitles";
  uploadButton.type = "file";
  uploadButton.accept = ".srt";
  uploadButton.textContent = "Upload Subtitles";
  uploadButton.style =
    "pointer-events: all;display: block;z-index:9999999;position: absolute;top: 0;left: 0;background: white;color: black;font-size: 3em;";
  div.appendChild(uploadButton);
  position.appendChild(div);

  uploadButton.addEventListener("change", function () {
    // get the file from #file and console.log it
    const file = uploadButton.files[0];
    console.log("file", file);
    if (file !== undefined && file.name.endsWith(".srt")) {
      // read contents of file
      const reader = new FileReader();
      // reader.onload = (e) => {
      reader.addEventListener("load", (e) => {
        parseSrtFile(e.target.result, position);
      });
      reader.readAsText(file);
    } else {
      alert("The file you uploaded is not a valid file.");
      return;
    }
    div.removeChild(uploadButton);
  });
}
function parseSrtFile(text, position) {
  console.log("parseSrtFile");
  var srt_array = fromSrt(text);
  console.log("srt_array", srt_array);
  let subtitles = document.createElement("div");
  subtitles.id = "subtitles";
  subtitles.style = "z-index:9999999;position: absolute;top: 50%;left: 50%;  font-size: 3em;";
  position.appendChild(subtitles);
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
