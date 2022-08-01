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
if ((isAmazon && isVideo) || isNetflix) {
  // global variables
  let settings;
  const defaultSettings = {
    settings: {
      Amazon: { skipIntro: true, skipAd: true },
      Netflix: { skipIntro: true, skipCredits: true, skipRecap: true },
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
    console.log("Skip Ad Button Translation:", SkipAdTranslation[language]);

    // Options for the observer (which mutations to observe)
    const config = { attributes: true, childList: true, subtree: true };
    // Create Button observers
    // Netflix observers
    const NetflixSkipIntroObserver = getNetflixObserver('[data-uia="player-skip-intro"]');
    const NetflixSkipCreditsObserver = getNetflixObserver('[data-uia="next-episode-seamless-button"]');
    // const NetflixWatchCreditsObserver = getNetflixObserver('[data-uia="watch-credits-seamless-button"]');
    const NetflixSkipRecapObserver = getNetflixObserver('[data-uia="player-skip-recap"]');
    // Amazon observers
    const AmazonSkipIntro = new RegExp("skipelement", "i");
    const AmazonSkipIntroObserver = getAmazonClassObserver(AmazonSkipIntro);
    const AmazonSkipAdObserver = getAmazonAdObserver(SkipAdTranslation[language]);
    // mutationObserver.disconnect();
    if (isNetflix) {
      console.log("is observing Netflix intro", result.settings.Netflix.skipIntro, result.settings.Netflix.skipCredits);
      if (result.settings.Netflix.skipIntro) {
        // works for intro
        NetflixSkipIntroObserver.observe(document.documentElement, config);
      }
      if (result.settings.Netflix.skipCredits) {
        // TODO: not working
        NetflixSkipCreditsObserver.observe(document.documentElement, config);
      }
      if (result.settings.Netflix.skipRecap) {
        // works for Recap
        NetflixSkipRecapObserver.observe(document.documentElement, config);
      }
    } else {
      if (settings.Amazon.skipIntro) {
        // functionality checked
        AmazonSkipIntroObserver.observe(document.documentElement, config);
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
        AmazonSkipAdObserver.observe(document.documentElement, config);
      }
    }
  });

  browser.storage.local.onChanged.addListener(function (changes, namespace) {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (key == "settings") {
        settings = newValue;
        console.log(key, ": changed.", "Old value was ", oldValue, ", new value is ", newValue, ".");
        if (isNetflix) {
          if (oldValue.Netflix.skipIntro !== newValue.Netflix.skipIntro) {
            if (newValue.Netflix.skipIntro) {
              console.log("started observing Netflix intro");
              NetflixSkipIntroObserver.observe(document.documentElement, config);
            } else {
              console.log("stopped observing Netflix intro");
              NetflixSkipIntroObserver.disconnect();
            }
          }
          if (oldValue.Netflix.skipCredits !== newValue.Netflix.skipCredits) {
            if (newValue.Netflix.skipCredits) {
              console.log("started observing Netflix credits");
              NetflixSkipCreditsObserver.observe(document.documentElement, config);
            } else {
              console.log("stopped observing Netflix credits");
              NetflixSkipCreditsObserver.disconnect();
            }
          }
          if (oldValue.Netflix.skipRecap !== newValue.Netflix.skipRecap) {
            if (newValue.Netflix.skipRecap) {
              console.log("started observing Netflix recap");
              NetflixSkipRecapObserver.observe(document.documentElement, config);
            } else {
              console.log("stopped observing Netflix recap");
              NetflixSkipRecapObserver.disconnect();
            }
          }
        } else {
          if (oldValue.Amazon.skipIntro !== newValue.Amazon.skipIntro) {
            if (newValue.Amazon.skipIntro) {
              console.log("started observing Amazon intro");
              AmazonSkipIntroObserver.observe(document.documentElement, config);
            } else {
              console.log("stopped observing Amazon intro");
              AmazonSkipIntroObserver.disconnect();
            }
          }
          if (oldValue.Amazon.skipAd !== newValue.Amazon.skipAd) {
            if (newValue.Amazon.skipAd) {
              console.log("started observing Amazon ad");
              AmazonSkipAdObserver.observe(document.documentElement, config);
            } else {
              console.log("stopped observing Amazon ad");
              AmazonSkipAdObserver.disconnect();
            }
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

// getObserver
function getNetflixObserver(target) {
  return (mutationObserver = new MutationObserver(function (mutations) {
    // document.querySelector('[data-uia="player-skip-intro"]').click();
    for (let mutation of mutations) {
      for (let node of mutation.addedNodes) {
        // alternative button.watch-video--skip-content-button
        let button = node.querySelector(target)?.firstChild;
        if (button) {
          console.log("Netflix skipped", target);
          button.click();
        }
        // node.querySelector(target)?.click();
      }
    }
  }));
}
function getAmazonClassObserver(searchTerm) {
  return (mutationObserver = new MutationObserver(function (mutations) {
    for (let mutation of mutations) {
      if (searchTerm.test(mutation.target.classList)) {
        console.log("Amazon skipped", searchTerm);
        mutation.target.click();
      }
      // skipSearchTerm.test(Tag.classList)
    }
  }));
}
function getAmazonAdObserver(searchTerm) {
  return (mutationObserver = new MutationObserver(function (mutations) {
    // console.log("evaluate3", document.evaluate("//div[text()='" + SkipAdTranslation[language] + "']", document, null, XPathResult.ANY_TYPE, null).iterateNext());
    // get dv-web-player
    let webPlayer = document.querySelector(".dv-player-fullscreen");
    // if the webPlayer is shown on screen
    // console.log("getComputedStyle(webPlayer).display", getComputedStyle(webPlayer).display);
    if (webPlayer && getComputedStyle(webPlayer).display !== "none") {
      let skipButton = document.evaluate("//div[text()='" + searchTerm + "']", document, null, XPathResult.ANY_TYPE, null).iterateNext();
      if (skipButton) {
        console.log("Amazon skipped Ad", skipButton);
        skipButton.click();
      }
    }
  }));
}
