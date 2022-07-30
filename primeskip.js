// old matches but because of domain ending not matching, it is not used
// match all amazon pages
// *://*.amazon.de/*/video/*

let url = window.location;
// test url with regex for video
let isAmazon = /amazon/i.test(url);
let isVideo = /video/i.test(url);
if (isAmazon && isVideo) {
  // localStorage
  // let localStorage = window.localStorage;
  // localStorage.setItem("skipVideo", "true");
  // localStorage.setItem("skipAd", "true");
  let skipVideos = localStorage.getItem("skipVideo");
  let skipAds = localStorage.getItem("skipAd");
  if (skipVideo == null) {
    localStorage.setItem("skipVideo", "true");
  }
  if (skipAd == null) {
    localStorage.setItem("skipAd", "true");
  }
  console.log("skipVideo: ", skipVideos, "skipAd: ", skipAds);
  setInterval(function () {
    // skip intro in video
    if (skipVideos) {
      skipVideo();
    }
    // skip ads
    if (skipAds) {
      // does not currently work properly
      // skipAd();
    }
  }, 500); //1000 = 1000ms = 1s
  let SkipButtonClass = new RegExp("skipelement", "i");
  let SkipButtonText = new RegExp("Skip", "i");
  let AdSkipClass = new RegExp("fu4rd6c f1cw2swo", "i");
  //   document.getElementsByClassName("fu4rd6c f1cw2swo")[0].click();", "i");

  async function skipVideo() {
    let IntroTags = document.getElementsByTagName("button");
    let foundIntro;
    // for (var i = 0; i < Tags.length; i++) {
    for (const Tag of IntroTags) {
      // Search for textcontent instead of classname
      //  if (SkipButtonText.test(Tag.textContent)) {
      if (
        SkipButtonClass.test(Tag.classList) ||
        SkipButtonText.test(Tag.textContent)
      ) {
        foundIntro = Tag;
        break;
      }
    }
    if (foundIntro) {
      console.log("skipped Intro");
      foundIntro.click();
    }
  }
  async function skipAd() {
    let AdTags = document.getElementsByTagName("div");
    let foundAd;
    // for (var i = 0; i < Tags.length; i++) {
    for (const Tag of AdTags) {
      if (
        AdSkipClass.test(Tag.classList) ||
        SkipButtonText.test(Tag.textContent)
      ) {
        foundAd = Tag;
        break;
      }
    }
    // click div element
    if (foundAd) {
      console.log("skipped Ad");
      foundAd.click();
    }
  }
}
// for(var sec=2; sec>0; sec--){
//     found.textContent = "Skipping in "+sec+"seconds...";
//     setTimeout(function(){
//        found.click();
//         }, 1000*sec);
//    }
