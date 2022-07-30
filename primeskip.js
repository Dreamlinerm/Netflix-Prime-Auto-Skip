var url = window.location;
// var path = window.location.pathname;
// test url with regex for video
var isVideo = /video/i.test(url);
// alert(url + "\n" + isVideo);
if (isVideo) {
  alert("test1");
  setInterval(function () {
    // execute script
    skipVideo();
  }, 500); //1000 = 1000ms = 1s
  function skipVideo() {
    var aTags = document.getElementsByTagName("button");
    var searchText = new RegExp("Skip", "i");
    var found;
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
