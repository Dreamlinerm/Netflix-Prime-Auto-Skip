// old matches but because of domain ending not matching, it is not used
// match all amazon pages
// *://*.amazon.de/*/video/*

// console.log(window.hasRun);
let url = window.location;
// test url with regex for video
let isAmazon = /amazon/i.test(url);
let isVideo = /video/i.test(url);
let isNetflix = /netflix.com/i.test(url);
if ((isAmazon && isVideo) || isNetflix) {
  console.log("primeskip.js");
  // global variables
  let settings;
  const defaultSettings = {
    settings: {
      Amazon: { skipIntro: true, skipAd: true },
      Netflix: { skipIntro: true, skipCredits: true },
    },
  };
  browser.storage.local.get("settings", function (result) {
    console.log("prime:Value currently is ", result.settings);
    settings = result.settings;
    if (typeof settings !== "object") {
      browser.storage.local.set(defaultSettings, function () {
        // console.log("prime:Value is set to ", defaultSettings);
      });
      browser.storage.local.get("settings", function (result) {
        // console.log("prime:Value currently is ", result.settings);
        settings = result.settings;
      });
    }
  });

  browser.storage.local.onChanged.addListener(function (changes, namespace) {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (key == "settings") {
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
    if (isAmazon) {
      // skip intro in video
      if (settings.Amazon.skipIntro) {
        genericSkip(AmazonSkipIntro, "button");
      }
      // skip ads
      if (settings.Amazon.skipAd) {
        // does not currently work properly
        // skipAd();
      }
    } else if (isNetflix) {
      // skip intro in video
      if (settings.Netflix.skipIntro) {
        genericSkip(NetflixSkipIntro, "button");
      }
      if (settings.Netflix.skipCredits) {
        genericSkipQuerySelector(NetflixSkipCredits);
      }
      // genericSkipQuerySelector(NetflixWatchCredits);
    }
  }, 500); //1000 = 1000ms = 1s
  const AmazonSkipIntro = new RegExp("skipelement", "i");
  const SkipButtonText = new RegExp("Skip", "i");
  const AdSkipClass = new RegExp("fu4rd6c f1cw2swo", "i");
  const NetflixSkipIntro = new RegExp("watch-video--skip-content-button", "i");
  const NetflixWatchCredits = '[data-uia="watch-credits-seamless-button"]';
  const NetflixSkipCredits = '[data-uia="next-episode-seamless-button"]';
  //   document.getElementsByClassName("fu4rd6c f1cw2swo")[0].click();", "i");
  async function genericSkip(skipSearchTerm, TagName) {
    let IntroTags = document.getElementsByTagName(TagName);
    let foundIntro;
    // for (var i = 0; i < Tags.length; i++) {
    for (const Tag of IntroTags) {
      // Search for textcontent instead of classname
      //  if (SkipButtonText.test(Tag.textContent)) {
      if (skipSearchTerm.test(Tag.classList)) {
        foundIntro = Tag;
        break;
      }
    }
    if (foundIntro) {
      console.log("generic skipped Intro");
      foundIntro.click();
    }
  }
  async function genericSkipQuerySelector(querySelector) {
    let found = document.querySelector(querySelector);
    console.log("found", found);
    if (found) {
      console.log("generic skipped Intro");
      found.click();
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
