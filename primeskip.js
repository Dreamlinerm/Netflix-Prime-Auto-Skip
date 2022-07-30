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
  //   alert("isVideo");
  setInterval(function () {
    // skip intro in video
    skipVideo();
    // skip ads
    skipAd();
  }, 500); //1000 = 1000ms = 1s
  let Tags;
  let SkipButtonClass = new RegExp("skipelement", "i");
  let SkipButtonText = new RegExp("Skip", "i");
  let AdSkipClass = new RegExp("fu4rd6c f1cw2swo", "i");
  //   document.getElementsByClassName("fu4rd6c f1cw2swo")[0].click();", "i");
  let found;
  function skipVideo() {
    Tags = document.getElementsByTagName("button");
    // for (var i = 0; i < Tags.length; i++) {
    for (const Tag of Tags) {
      // Search for textcontent instead of classname
      //  if (SkipButtonText.test(Tag.textContent)) {
      if (
        SkipButtonClass.test(Tag.classList) ||
        SkipButtonText.test(Tag.textContent)
      ) {
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
      if (
        AdSkipClass.test(Tag.classList) ||
        SkipButtonText.test(Tag.textContent)
      ) {
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
