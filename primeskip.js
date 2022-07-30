// old matches but because of domain ending not matching, it is not used
// match all amazon pages
// *://*.amazon.de/*/video/*

let url = window.location;
// test url with regex for video
let isAmazon = /amazon/i.test(url);
let isVideo = /video/i.test(url);
// if (isAmazon) {
//   alert("isAmazon");
// }
if (isAmazon && isVideo) {
  //alert("isVideo");
  setInterval(function () {
    // execute script
    // skip intro in video
    skipVideo();
    //skipAd();
  }, 500); //1000 = 1000ms = 1s
  let Tags;
  let searchText = new RegExp("Skip", "i");
  let found;
  function skipVideo() {
    Tags = document.getElementsByTagName("button");
    // for (var i = 0; i < Tags.length; i++) {
    for (const Tag of Tags) {
      if (searchText.test(Tag.textContent)) {
        found = Tag;
        break;
      }
    }
    found.click();
  }
  function skipAd() {
    Tags = document.getElementsByTagName("div");
    // for (var i = 0; i < Tags.length; i++) {
    for (const Tag of Tags) {
      if (searchText.test(Tag.textContent)) {
        found = Tag;
        break;
      }
    }
    // click div element
    found.click();
  }
}
// for(var sec=2; sec>0; sec--){
//     found.textContent = "Skipping in "+sec+"seconds...";
//     setTimeout(function(){
//        found.click();
//         }, 1000*sec);
//    }
