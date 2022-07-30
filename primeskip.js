let url = window.location;
// test url with regex for video
let isVideo = /video/i.test(url);
if (isVideo) {
  //   alert("isVideo");
  setInterval(function () {
    // execute script
    skipVideo();
  }, 500); //1000 = 1000ms = 1s
  let aTags;
  let searchText = new RegExp("Skip", "i");
  let found;
  function skipVideo() {
    aTags = document.getElementsByTagName("button");
    // for (var i = 0; i < aTags.length; i++) {
    for (const Tag of aTags) {
      if (searchText.test(Tag.textContent)) {
        found = Tag;
        break;
      }
    }
    found.click();
  }
}
// for(var sec=2; sec>0; sec--){
//     found.textContent = "Skipping in "+sec+"seconds...";
//     setTimeout(function(){
//        found.click();
//         }, 1000*sec);
//    }
