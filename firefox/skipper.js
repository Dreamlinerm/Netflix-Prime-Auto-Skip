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
      Amazon: { skipIntro: true, skipCredits: true, skipAd: false },
      Netflix: { skipIntro: true, skipRecap: true, skipCredits: true, skipBlocked: true },
    },
  };
  browser.storage.local.get("settings", function (result) {
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
        startNetflixSkipIntroObserver();
      }
      if (settings.Netflix.skipRecap) {
        startNetflixSkipRecapObserver();
      }
      if (result.settings.Netflix.skipCredits) {
        startNetflixSkipCreditsObserver();
      }
      if (settings.Netflix.skipBlocked) {
        startNetflixSkipBlockedObserver();
      }
    } else {
      // console.log("started observing| intro", result.settings.Amazon.skipIntro, "|Ad", result.settings.Amazon.skipAd);
      if (settings.Amazon.skipIntro) {
        startAmazonSkipIntroObserver();
      }
      if (settings.Amazon.skipCredits) {
        startAmazonSkipCreditsObserver();
      }
      if (settings.Amazon.skipAd) {
        // currently only works for en/de
        // TODO: add support for other languages
        // TODO: add dropdown for language
        // TODO: add textfield for buttonContent

        // works but skips more often than needed i think
        startAmazonSkipAdObserver();
      }
    }
  });

  browser.storage.local.onChanged.addListener(function (changes, namespace) {
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
          if (newValue.Amazon.skipCredits !== oldValue.Amazon.skipCredits) {
            startAmazonSkipCreditsObserver();
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
      // node.querySelector('[data-uia="player-skip-intro"]')?.click();
      let button = node.querySelector('[data-uia="player-skip-intro"]');
      if (button) {
        button.click();
        console.log("intro skipped", button);
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
      // node.querySelector('[data-uia="player-skip-recap"]')?.click();
      let button = node.querySelector('[data-uia="player-skip-recap"]');
      if (button) {
        button.click();
        console.log("Recap skipped", button);
      }
    }
  }
}
// works on credits
const NetflixSkipCreditsObserver = new MutationObserver(Netflix_Credits);
function Netflix_Credits(mutations, observer) {
  // console.log("observing credits", settings.Netflix.skipCredits);
  // document.querySelector('[data-uia="next-episode-seamless-button"]')?.click();
  let button = document.querySelector('[data-uia="next-episode-seamless-button"]');
  if (button) {
    button.click();
    console.log("Credits skipped", button);
  }
}
// TODO: find button for skipping
const NetflixSkipBlockedObserver = new MutationObserver(Netflix_Blocked);
function Netflix_Blocked(mutations, observer) {
  // console.log("observing Netflix Blocked", settings.Netflix.skipBlocked);
  for (let mutation of mutations) {
    for (let node of mutation.addedNodes) {
      let button = node.querySelector('[data-uia="interrupt-autoplay-continue"]');
      if (button) {
        button.click();
        console.log("Blocked skipped", button);
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
      console.log("Intro skipped", mutation.target);
    }
    // skipSearchTerm.test(Tag.classList)
  }
}

const AmazonSkipCredits = new RegExp("skipelement", "i");
const AmazonSkipCreditsObserver = new MutationObserver(Amazon_Credits);
function Amazon_Credits(mutations, observer) {
  for (let mutation of mutations) {
    if (mutation.target.className == "nextUp show") mutation.target.lastChild.lastChild.click();
    if (mutation.target.className == "bottomPanelItem") if (mutation.target.lastChild.lastChild.lastChild.className != "nextTitleButton") mutation.target.lastChild.lastChild.lastChild.click();
  }
}
// works for english/german ads
// TODO: textaree for button content
// atvwebplayersdk-infobar-container show
const AmazonSkipAdObserver = new MutationObserver(Amazon_Ad);
async function Amazon_Ad(mutations, observer) {
  // the button calsses are class="fu4rd6c f1cw2swo" but im not sure they are the same each time
  let button = document.querySelector(".fu4rd6c.f1cw2swo");
  if (button) {
    // button.click();
    console.log("Ad skipped", button);
  }
  // alternative
  // let buttons = document.querySelector("[class*=webplayersdk-infobar-container]").getElementsByTagName("div");
  // for (let i = 0; i < buttons.length; i++) {
  //   if (buttons[i]?.firstChild?.textContent == SkipAdTranslation[language]) {
  //     console.log("Ad skipped", buttons[i]);
  //     buttons[i].click();
  //     setTimeout(function () {
  //       console.log("Hello World");
  //     }, 2000);
  //   }
  // }
}
async function Amazon_AdTimeout() {
  // set loop ever 1 sec
  setInterval(function () {
    // check if ad is still there
    let button = document.querySelector(".fu4rd6c.f1cw2swo");
    if (button) {
      button.click();
      console.log("Ad skipped", button);
    }
    if (!settings.Amazon.skipAd) {
      return;
    }
  }, 500);
}
async function startNetflixSkipIntroObserver(observer, started) {
  if (settings.Netflix.skipIntro) {
    console.log("started observing | intro");
    // document.querySelector('[data-uia="player-skip-intro"]')?.click();
    let button = document.querySelector('[data-uia="player-skip-intro"]');
    if (button) {
      button.click();
      console.log("intro skipped", button);
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
    // document.querySelector('[data-uia="player-skip-recap"]')?.click();
    let button = document.querySelector('[data-uia="player-skip-recap"]');
    if (button) {
      button.click();
      console.log("Recap skipped", button);
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
    // document.querySelector('[data-uia="next-episode-seamless-button"]')?.click();
    let button = document.querySelector('[data-uia="next-episode-seamless-button"]');
    if (button) {
      button.click();
      console.log("Credits skipped", button);
    }
    NetflixSkipCreditsObserver.observe(document, config);
  } else {
    console.log("stopped observing| Credits");
    NetflixSkipCreditsObserver.disconnect();
  }
}
//data-uia="interrupt-autoplay-continue"
async function startNetflixSkipBlockedObserver() {
  if (settings.Netflix.skipBlocked) {
    console.log("started observing| Blocked");
    let button = document.querySelector('[data-uia="interrupt-autoplay-continue"]');
    if (button) {
      button.click();
      console.log("Blocked skipped", button);
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
      console.log("Intro skipped", button);
    }
    AmazonSkipIntroObserver.observe(document, config);
  } else {
    console.log("stopped observing| Intro");
    AmazonSkipIntroObserver.disconnect();
  }
}
async function startAmazonSkipCreditsObserver() {
  if (settings.Amazon.skipCredits) {
    console.log("started observing| Credits");
    let button = document.querySelector("[class*=not-the-right-class]");
    if (button) {
      button.click();
      console.log("Credits skipped", button);
    }
    AmazonSkipCreditsObserver.observe(document, config);
  } else {
    console.log("stopped observing| Credits");
    AmazonSkipCreditsObserver.disconnect();
  }
}
async function startAmazonSkipAdObserver() {
  if (settings.Amazon.skipAd) {
    console.log("started observing| Ad with", SkipAdTranslation[language]);
    Amazon_AdTimeout();
    // AmazonSkipAdObserver.observe(document, config);
  } else {
    console.log("stopped observing| Ad");
    // AmazonSkipAdObserver.disconnect();
  }
}
