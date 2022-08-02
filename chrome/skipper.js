// old matches but because of domain ending not matching, it is not used
// match all amazon pages
// *://*.amazon.de/*/video/*

// console.log(window.hasRun);
let url = window.location;
// test url with regex for video
let isAmazon = /amazon/i.test(url);
let isVideo = /video/i.test(url);
let isNetflix = /netflix.com/i.test(url);
let ua = navigator.userAgent;
let language = "en";
const version = "1.0.1";
if (/de/i.test(ua) || /de/i.test(url)) {
  language = "de";
} else {
  language = "en";
}
const SkipAdTranslation = {
  en: "Skip",
  de: "Überspringen",
};
let settings;
if ((isAmazon && isVideo) || isNetflix) {
  // global variables
  const defaultSettings = {
    settings: {
      Amazon: { skipIntro: true, skipAd: true },
      Netflix: { skipIntro: true, skipCredits: true, skipRecap: true, skipBlocked: false },
    },
  };
  chrome.storage.sync.get("settings", function (result) {
    settings = result.settings;
    if (typeof settings !== "object") {
      chrome.storage.sync.set(defaultSettings, function () {
        // console.log("prime:Value is set to ", defaultSettings);
      });
      chrome.storage.sync.get("settings", function (result) {
        // console.log("prime:Value currently is ", result.settings);
        settings = result.settings;
      });
    }
    console.log("%cNetflix%c/%cPrime%c Auto-Skip: ", "color:#e60010;font-size:1.5em;", "color:white;;font-size:1.5em;", "color:#00aeef;font-size:1.5em;", "color:white;;font-size:1.5em;");
    console.log("version: ", version);
    console.log("Settings", result.settings);
    console.log("Page", isAmazon ? "Amazon" : "Netflix");
    if (isNetflix) {
      // console.log(
      //   "started observing| intro",
      //   result.settings.Netflix.skipIntro,
      //   "|Recap",
      //   result.settings.Netflix.skipRecap,
      //   "|Credits",
      //   result.settings.Netflix.skipCredits,
      //   "|Blocked",
      //   result.settings.Netflix.skipBlocked
      // );
      // start Observers
      if (settings.Netflix.skipIntro) {
        // works on Intro
        startNetflixSkipIntroObserver();
      }
      if (settings.Netflix.skipRecap) {
        // works on Recap
        startNetflixSkipRecapObserver();
      }
      if (result.settings.Netflix.skipCredits) {
        // works on Credits
        startNetflixSkipCreditsObserver();
      }
      if (settings.Netflix.skipBlocked) {
        // doesnt work for blocked need to find the button
        NetflixSkipBlockedObserver.observe(document, config);
      }
    } else {
      // console.log("started observing| intro", result.settings.Amazon.skipIntro, "|Ad", result.settings.Amazon.skipAd);
      if (settings.Amazon.skipIntro) {
        // functionality checked
        startAmazonSkipIntroObserver();
      }
      // skip ads
      if (settings.Amazon.skipAd) {
        // currently only works for en/de
        // TODO: add support for other languages
        // TODO: add dropdown for language
        // TODO: add textfield for buttonContent
        //translate Überspringen || skip
        //https://stackoverflow.com/questions/37098405/javascript-queryselector-find-div-by-innertext

        // works but skips more often than needed
        startAmazonSkipAdObserver();
      }
    }
  });

  chrome.storage.sync.onChanged.addListener(function (changes, namespace) {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (key == "settings") {
        settings = newValue;
        console.log(key, ": changed.", "Old value was ", oldValue, ", new value is ", newValue, ".");
        if (isNetflix) {
          // if value is changed then check if it is enabled or disabled
          if (newValue.Netflix.skipIntro !== oldValue.Netflix.skipIntro) {
            startNetflixSkipIntroObserver();
          }
          if (newValue.Netflix.skipRecap !== oldValue.Netflix.skipRecap) {
            startNetflixSkipRecapObserver();
          }
          if (newValue.Netflix.skipCredits !== oldValue.Netflix.skipCredits) {
            startNetflixSkipCreditsObserver();
          }
          if (newValue.Netflix.skipBlocked !== oldValue.Netflix.skipBlocked) {
            startNetflixSkipBlockedObserver();
          }
        } else {
          if (newValue.Amazon.skipIntro !== oldValue.Amazon.skipIntro) {
            startAmazonSkipIntroObserver();
          }
          if (newValue.Amazon.skipAd !== oldValue.Amazon.skipAd) {
            startAmazonSkipAdObserver();
          }
        }
      }
    }
  });
}
// for(var sec=2; sec>0; sec--){
//     found.textContent = "Skipping in "+sec+"seconds...";
//     setTimeout(function(){
//        found.click();
//         }, 1000*sec);
//    }

// Observers
// Options for the observer (which mutations to observe)
const config = { attributes: true, childList: true, subtree: true };
// Netflix Observers
// works for intro
const NetflixSkipIntroObserver = new MutationObserver(Netflix_intro);
function Netflix_intro(mutations, observer) {
  // console.log("observing intro", settings.Netflix.skipIntro);
  for (let mutation of mutations) {
    for (let node of mutation.addedNodes) {
      // node.querySelector('[data-uia="player-skip-intro"]')?.firstChild.click();
      let button = node.querySelector('[data-uia="player-skip-intro"]')?.firstChild;
      if (button) {
        button.click();
        console.log("intro skipped");
      }
    }
  }
}
// works for Recap
const NetflixSkipRecapObserver = new MutationObserver(Netflix_Recap);
function Netflix_Recap(mutations, observer) {
  // console.log("observing Recap", settings.Netflix.skipRecap);
  for (let mutation of mutations) {
    for (let node of mutation.addedNodes) {
      // node.querySelector('[data-uia="player-skip-recap"]')?.firstChild.click();
      let button = node.querySelector('[data-uia="player-skip-recap"]')?.firstChild;
      if (button) {
        button.click();
        console.log("Recap skipped");
      }
    }
  }
}
// works on credits
const NetflixSkipCreditsObserver = new MutationObserver(Netflix_Credits);
function Netflix_Credits(mutations, observer) {
  // console.log("observing credits", settings.Netflix.skipCredits);
  // document.querySelector('[data-uia="next-episode-seamless-button"]')?.firstChild.click();
  let button = document.querySelector('[data-uia="next-episode-seamless-button"]')?.firstChild;
  if (button) {
    button.click();
    console.log("Credits skipped");
  }
}
// TODO: find button for skipping
const NetflixSkipBlockedObserver = new MutationObserver(Netflix_Blocked);
function Netflix_Blocked(mutations, observer) {
  // console.log("observing Netflix Blocked", settings.Netflix.skipBlocked);
  for (let mutation of mutations) {
    for (let node of mutation.addedNodes) {
      // node.querySelector('[data-uia="player-blocked-play"]')?.firstChild.click();
      let button = node.querySelector('[data-uia="player-blocked-play"]')?.firstChild;
      if (button) {
        button.click();
        console.log("Blocked skipped");
      }
    }
  }
}

// Amazon Observers
// works for intro
const AmazonSkipIntro = new RegExp("skipelement", "i");
const AmazonSkipIntroObserver = new MutationObserver(Amazon_Intro);
function Amazon_Intro(mutations, observer) {
  // console.log("observing Intro", settings.Amazon.skipIntro);
  for (let mutation of mutations) {
    if (AmazonSkipIntro.test(mutation.target.classList)) {
      mutation.target.click();
      console.log("Intro skipped");
    }
    // skipSearchTerm.test(Tag.classList)
  }
}
// works for english/german ads
// TODO: textaree for button content
const AmazonSkipAdObserver = new MutationObserver(Amazon_Ad);
function Amazon_Ad(mutations, observer) {
  // console.log("observing Ad", settings.Amazon.skipAd);
  // get dv-web-player
  let webPlayer = document.querySelector(".dv-player-fullscreen");
  // if the webPlayer is shown on screen
  // console.log("getComputedStyle(webPlayer).display", getComputedStyle(webPlayer).display);
  if (webPlayer && getComputedStyle(webPlayer).display !== "none") {
    let button = document.evaluate("//div[text()='" + SkipAdTranslation[language] + "']", document, null, XPathResult.ANY_TYPE, null)?.iterateNext();
    if (button) {
      button.click();
      console.log("Amazon skipped Ad");
    }
  }
}
async function startNetflixSkipIntroObserver(observer, started) {
  if (settings.Netflix.skipIntro) {
    console.log("started observing | intro");
    // document.querySelector('[data-uia="player-skip-intro"]')?.firstChild.click();
    let button = document.querySelector('[data-uia="player-skip-intro"]')?.firstChild;
    if (button) {
      button.click();
      console.log("intro skipped");
    }
    NetflixSkipIntroObserver.observe(document, config);
  } else {
    console.log("stopped observing | intro");
    NetflixSkipIntroObserver.disconnect();
  }
}
async function startNetflixSkipRecapObserver() {
  if (settings.Netflix.skipRecap) {
    console.log("started observing| Recap");
    // document.querySelector('[data-uia="player-skip-recap"]')?.firstChild.click();
    let button = document.querySelector('[data-uia="player-skip-recap"]')?.firstChild;
    if (button) {
      button.click();
      console.log("Recap skipped");
    }
    NetflixSkipRecapObserver.observe(document, config);
  } else {
    console.log("stopped observing| Recap");
    NetflixSkipRecapObserver.disconnect();
  }
}
async function startNetflixSkipCreditsObserver() {
  if (settings.Netflix.skipCredits) {
    console.log("started observing| Credits");
    // document.querySelector('[data-uia="next-episode-seamless-button"]')?.firstChild.click();
    let button = document.querySelector('[data-uia="next-episode-seamless-button"]')?.firstChild;
    if (button) {
      button.click();
      console.log("Credits skipped");
    }
    NetflixSkipCreditsObserver.observe(document, config);
  } else {
    console.log("stopped observing| Credits");
    NetflixSkipCreditsObserver.disconnect();
  }
}
async function startNetflixSkipBlockedObserver() {
  if (settings.Netflix.skipBlocked) {
    console.log("started observing| Blocked");
    let button = document.querySelector('[data-uia="player-blocked-play"]')?.firstChild;
    if (button) {
      button.click();
      console.log("Blocked skipped");
    }
    NetflixSkipBlockedObserver.observe(document, config);
  } else {
    console.log("stopped observing| Blocked");
    NetflixSkipBlockedObserver.disconnect();
  }
}
async function startAmazonSkipIntroObserver() {
  if (settings.Amazon.skipIntro) {
    console.log("started observing| Intro");
    let button = document.querySelector("[class*=skipelement]");
    if (button) {
      button.click();
      console.log("Intro skipped");
    }
    AmazonSkipIntroObserver.observe(document, config);
  } else {
    console.log("stopped observing| Intro");
    AmazonSkipIntroObserver.disconnect();
  }
}
async function startAmazonSkipAdObserver() {
  if (settings.Amazon.skipAd) {
    console.log("started observing| Ad with", SkipAdTranslation[language]);
    AmazonSkipAdObserver.observe(document, config);
  } else {
    console.log("stopped observing| Ad");
    AmazonSkipAdObserver.disconnect();
  }
}
