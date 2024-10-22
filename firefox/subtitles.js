async function Amazon_addSubtitles() {
  const position = document.querySelector("#dv-web-player");
  if (position) {
    addSubtitles(position);
  }
}

async function addSubtitles(position = document.body) {
  if (document.getElementById("uploadSubtitles") !== null) document.getElementById("uploadSubtitles").remove();
  let div = document.createElement("div");
  div.style =
    "z-index:9999999;position: absolute;top: 200px;left: 200px;background: white;color: black;font-size: 3em;line-height:auto;line-height: initial;";
  div.id = "uploadSubtitles";
  let divHeader = document.createElement("div");
  divHeader.textContent = "Click here to Move";
  divHeader.id = "subtitlesHeader";
  div.appendChild(divHeader);
  let divClose = document.createElement("div");
  divClose.textContent = "X";
  divClose.style = "position: absolute;top: 0;right: 0;cursor: pointer;";
  divClose.addEventListener("click", function () {
    div.remove();
  });
  div.appendChild(divClose);

  let uploadButton = document.createElement("input");
  uploadButton.type = "file";
  uploadButton.accept = ".srt";
  uploadButton.textContent = "Upload Subtitles";
  uploadButton.style = "pointer-events: all;display: block;z-index:9999999;";
  div.appendChild(uploadButton);
  position.appendChild(div);
  dragElement(div, divHeader);

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
  });
}
function parseSrtFile(text, position) {
  console.log("parseSrtFile");
  var srt_array = fromSrt(text);
  console.log("srt_array", srt_array);
  let subtitles = document.createElement("div");
  subtitles.id = "subtitles";
  subtitles.style = "z-index:9999999;position: absolute;top: 50%;left: 50%;  font-size: 3em;color:white;";
  position.appendChild(subtitles);
  let video = document.querySelector("video");

  video.addEventListener("timeupdate", function (evt) {
    console.log("timeupdate", evt);
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

function dragElement(elmnt, divHeader) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  divHeader.onmousedown = dragMouseDown;
  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
