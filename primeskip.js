// old matches but because of domain ending not matching, it is not used
// match all amazon pages
// *://*.amazon.de/*/video/*

// console.log(window.hasRun);
let url = window.location;
// test url with regex for video
let isAmazon = /amazon/i.test(url);
let isVideo = /video/i.test(url);

if (isAmazon && isVideo) {
  console.log("primeskip.js");
  // global variables
  let settings;
  const defaultSettings = { primeSettings: { skipIntro: true, skipAd: true } };
  browser.storage.local.get("primeSettings", function (result) {
    console.log("prime:Value currently is ", result.primeSettings);
    settings = result.primeSettings;
    if (typeof settings !== "object") {
      browser.storage.local.set(defaultSettings, function () {
        // console.log("prime:Value is set to ", defaultSettings);
      });
      browser.storage.local.get("primeSettings", function (result) {
        // console.log("prime:Value currently is ", result.primeSettings);
        settings = result.primeSettings;
      });
    }
  });

  browser.storage.local.onChanged.addListener(function (changes, namespace) {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (key == "primeSettings") {
        settings = newValue;
        console.log("settings = newValue", newValue);
      }
      console.log(
        "Storage key ",
        key,
        " in namespace ",
        namespace,
        " changed.",
        "Old value was ",
        oldValue,
        ", new value is ",
        newValue,
        "."
      );
    }
  });
  setInterval(function () {
    // console.log("skipVideo: ", skipVideos, "skipAd: ", skipAds);
    // skip intro in video
    if (settings.skipIntro) {
      skipVideo();
    }
    // skip ads
    if (settings.skipAd) {
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
      if (SkipButtonClass.test(Tag.classList)) {
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
