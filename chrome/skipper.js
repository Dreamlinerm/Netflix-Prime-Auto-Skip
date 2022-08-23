// matches all amazon urls under https://en.wikipedia.org/wiki/Amazon_(company)#Website
let hostname = window.location.hostname;
let title = document.title;
let url = window.location.href;
let isAmazon = /amazon|primevideo/i.test(hostname);
let isVideo = /video/i.test(title) || /video/i.test(url);
let isNetflix = /netflix/i.test(hostname);
const version = "1.0.6";

if (isVideo || isNetflix) {
  // global variables in localStorage
  const defaultSettings = {
    settings: {
      Amazon: { skipIntro: true, skipCredits: true, skipAd: true, blockFreevee: true },
      Netflix: { skipIntro: true, skipRecap: true, skipCredits: true, skipBlocked: true },
    },
  };
  let settings = defaultSettings.settings;
  chrome.storage.sync.get("settings", function (result) {
    settings = result.settings;
    console.log("%cNetflix%c/%cPrime%c Auto-Skip", "color: #e60010;font-size: 2em;", "color: white;font-size: 2em;", "color: #00aeef;font-size: 2em;", "color: white;font-size: 2em;");
    console.log("version: ", version);
    console.log("Settings", settings);
    console.log("Page %cNetflix%cAmazon", isNetflix ? "color: #e60010;" : "display:none;", !isNetflix ? "color: #00aeef;" : "display:none;");
    if (typeof settings !== "object") {
      chrome.storage.sync.set(defaultSettings, function () {});
    } else {
      if (isNetflix) {
        // start Observers depending on the settings
        if (settings.Netflix.skipIntro === undefined || settings.Netflix.skipIntro) {
          startNetflixSkipIntroObserver();
        }
        if (settings.Netflix.skipRecap === undefined || settings.Netflix.skipRecap) {
          startNetflixSkipRecapObserver();
        }
        if (result.settings.Netflix.skipCredits === undefined || result.settings.Netflix.skipCredits) {
          startNetflixSkipCreditsObserver();
        }
        if (settings.Netflix.skipBlocked === undefined || settings.Netflix.skipBlocked) {
          startNetflixSkipBlockedObserver();
        }
      } else {
        if (settings.Amazon.skipIntro === undefined || settings.Amazon.skipIntro) {
          startAmazonSkipIntroObserver();
        }
        if (settings.Amazon.skipCredits === undefined || settings.Amazon.skipCredits) {
          startAmazonSkipCreditsObserver();
        }
        if (settings.Amazon.skipAd === undefined || settings.Amazon.skipAd) {
          startAmazonSkipAdObserver();
        }
        if (settings.Amazon.blockFreevee === undefined || settings.Amazon.blockFreevee) {
          // timeout of 100 ms because the ad is not loaded fast enough and the video will crash
          setTimeout(function () {
            startAmazonBlockFreeveeObserver();
          }, 200);
        }
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
          if (oldValue === undefined || newValue.Netflix.skipIntro !== oldValue.Netflix.skipIntro) {
            startNetflixSkipIntroObserver();
          }
          if (oldValue === undefined || newValue.Netflix.skipRecap !== oldValue.Netflix.skipRecap) {
            startNetflixSkipRecapObserver();
          }
          if (oldValue === undefined || newValue.Netflix.skipCredits !== oldValue.Netflix.skipCredits) {
            startNetflixSkipCreditsObserver();
          }
          if (oldValue === undefined || newValue.Netflix.skipBlocked !== oldValue.Netflix.skipBlocked) {
            startNetflixSkipBlockedObserver();
          }
        } else {
          if (oldValue === undefined || newValue.Amazon.skipIntro !== oldValue.Amazon.skipIntro) {
            startAmazonSkipIntroObserver();
          }
          if (oldValue === undefined || newValue.Amazon.skipCredits !== oldValue.Amazon.skipCredits) {
            startAmazonSkipCreditsObserver();
          }
          if (oldValue === undefined || newValue.Amazon.skipAd !== oldValue.Amazon.skipAd) {
            startAmazonSkipAdObserver();
          }
          if (oldValue === undefined || newValue.Amazon.blockFreevee !== oldValue.Amazon.blockFreevee) {
            startAmazonBlockFreeveeObserver();
          }
        }
      }
    }
  });

  // Observers
  // default Options for the observer (which mutations to observe)
  const config = { attributes: true, childList: true, subtree: true };
  // Netflix Observers
  const NetflixConfig = { attributes: true, attributeFilter: ["data-uia"], subtree: true, childList: true, attributeOldValue: false };
  const NetflixSkipIntroObserver = new MutationObserver(Netflix_intro);
  function Netflix_intro(mutations, observer) {
    for (let mutation of mutations) {
      for (let node of mutation.addedNodes) {
        let button = node.querySelector('[data-uia="player-skip-intro"]');
        if (button) {
          button.click();
          console.log("intro skipped", button);
        }
      }
    }
  }

  const NetflixSkipRecapObserver = new MutationObserver(Netflix_Recap);
  function Netflix_Recap(mutations, observer) {
    for (let mutation of mutations) {
      for (let node of mutation.addedNodes) {
        let button = node.querySelector('[data-uia="player-skip-recap"]') || node.querySelector('[data-uia="player-skip-preplay"]');
        if (button) {
          button.click();
          console.log("Recap skipped", button);
        }
      }
    }
  }

  const NetflixSkipCreditsObserver = new MutationObserver(Netflix_Credits);
  function Netflix_Credits(mutations, observer) {
    let button = document.querySelector('[data-uia="next-episode-seamless-button"]');
    if (button) {
      button.click();
      console.log("Credits skipped", button);
    }
  }

  const NetflixSkipBlockedObserver = new MutationObserver(Netflix_Blocked);
  function Netflix_Blocked(mutations, observer) {
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

  const AmazonSkipIntroConfig = { attributes: true, attributeFilter: [".skipelement"], subtree: true, childList: true, attributeOldValue: false };
  const AmazonSkipIntro = new RegExp("skipelement", "i");
  const AmazonSkipIntroObserver = new MutationObserver(Amazon_Intro);
  function Amazon_Intro(mutations, observer) {
    for (let mutation of mutations) {
      if (AmazonSkipIntro.test(mutation.target.firstChild.classList)) {
        mutation.target.firstChild.click();
        console.log("Intro skipped", mutation.target.firstChild);
      }
    }
  }

  const AmazonSkipCreditsConfig = { attributes: true, attributeFilter: [".nextupcard"], subtree: true, childList: true, attributeOldValue: false };
  const AmazonSkipCredits = new RegExp("nextupcard", "i");
  const AmazonSkipCredits2 = new RegExp("nextupcard-button", "i");
  const AmazonSkipCreditsObserver = new MutationObserver(Amazon_Credits);
  function Amazon_Credits(mutations, observer) {
    for (let mutation of mutations) {
      if (AmazonSkipCredits.test(mutation.target.classList.toString())) {
        for (let button of mutation?.target?.firstChild?.childNodes) {
          if (button && AmazonSkipCredits2.test(button.classList.toString())) {
            button.click();
            console.log("skipped Credits", button);
          }
        }
      }
    }
  }

  const FreeVeeConfig = { attributes: true, attributeFilter: [".atvwebplayersdk-adtimeindicator-text"], subtree: true, childList: true, attributeOldValue: false };
  const AmazonFreeVeeObserver = new MutationObserver(AmazonFreeVee);
  function AmazonFreeVee(mutations, observer) {
    // if (document.querySelector("[class*=infobar-container]").classList.contains("show")) {
    let video = document.querySelector("#dv-web-player > div > div:nth-child(1) > div > div > div.scalingVideoContainer > div.scalingVideoContainerBottom > div > video");
    let adTimeText = document.querySelector(".atvwebplayersdk-adtimeindicator-text");
    // !document.querySelector(".fu4rd6c.f1cw2swo")
    if (adTimeText.textContent.length > 7 && video != null && adTimeText != null) {
      video.currentTime += parseInt(adTimeText.textContent.match(/\d+/)[0]);
      console.log("FreeVee Ad skipped", adTimeText, video);
    }
    // }
  }

  const AmazonSkipAdObserver = new MutationObserver(Amazon_Ad);
  async function Amazon_Ad(mutations, observer) {
    for (let mutation of mutations) {
      if (mutation.target.classList.contains("atvwebplayersdk-infobar-container")) {
        if (mutation.target.classList.contains("show")) {
          let button = mutation.target.querySelector(".fu4rd6c.f1cw2swo");
          if (button) {
            button.click();
            console.log("Self Ad skipped", button);
          }
        }
      }
    }
  }

  // a little to intense to do this every time but it works, not currently used
  async function Amazon_AdTimeout() {
    // set loop every 0.5 sec and check if ad is there
    setInterval(function () {
      // if infobar is shown
      if (document.querySelector("[class*=infobar-container]").classList.contains("show")) {
        // the button classes are class="fu4rd6c f1cw2swo" but im not sure they are changed may need to refresh
        // adtimeindicator-text might be an alternative like here
        // document.querySelector(".atvwebplayersdk-adtimeindicator-text").parentNode.parentNode.querySelector("div:nth-child(3) > div:nth-child(2)")
        let button = document.querySelector(".fu4rd6c.f1cw2swo");
        if (button) {
          button.click();
          console.log("Self Ad skipped", button);
        }
      }
      if (!settings.Amazon.skipAd) {
        return;
      }
    }, 500);
  }
  // start/stop the observers depending on settings
  async function startNetflixSkipIntroObserver() {
    if (settings.Netflix.skipIntro === undefined || settings.Netflix.skipIntro) {
      console.log("started observing| intro");
      let button = document.querySelector('[data-uia="player-skip-intro"]');
      if (button) {
        button.click();
        console.log("intro skipped", button);
      }
      NetflixSkipIntroObserver.observe(document, NetflixConfig);
    } else {
      console.log("stopped observing | intro");
      NetflixSkipIntroObserver.disconnect();
    }
  }
  async function startNetflixSkipRecapObserver() {
    if (settings.Netflix.skipRecap === undefined || settings.Netflix.skipRecap) {
      console.log("started observing| Recap");
      let button = document.querySelector('[data-uia="player-skip-recap"]') || document.querySelector('[data-uia="player-skip-preplay"]');
      if (button) {
        button.click();
        console.log("Recap skipped", button);
      }
      NetflixSkipRecapObserver.observe(document, NetflixConfig);
    } else {
      console.log("stopped observing| Recap");
      NetflixSkipRecapObserver.disconnect();
    }
  }
  async function startNetflixSkipCreditsObserver() {
    if (settings.Netflix.skipCredits === undefined || settings.Netflix.skipCredits) {
      console.log("started observing| Credits");
      let button = document.querySelector('[data-uia="next-episode-seamless-button"]');
      if (button) {
        button.click();
        console.log("Credits skipped", button);
      }
      NetflixSkipCreditsObserver.observe(document, NetflixConfig);
    } else {
      console.log("stopped observing| Credits");
      NetflixSkipCreditsObserver.disconnect();
    }
  }
  async function startNetflixSkipBlockedObserver() {
    if (settings.Netflix.skipBlocked === undefined || settings.Netflix.skipBlocked) {
      console.log("started observing| Blocked");
      let button = document.querySelector('[data-uia="interrupt-autoplay-continue"]');
      if (button) {
        button.click();
        console.log("Blocked skipped", button);
      }
      NetflixSkipBlockedObserver.observe(document, NetflixConfig);
    } else {
      console.log("stopped observing| Blocked");
      NetflixSkipBlockedObserver.disconnect();
    }
  }
  async function startAmazonSkipIntroObserver() {
    if (settings.Amazon.skipIntro === undefined || settings.Amazon.skipIntro) {
      console.log("started observing| Intro");
      let button = document.querySelector("[class*=skipelement]");
      if (button) {
        button.click();
        console.log("Intro skipped", button);
      }
      AmazonSkipIntroObserver.observe(document, AmazonSkipIntroConfig);
    } else {
      console.log("stopped observing| Intro");
      AmazonSkipIntroObserver.disconnect();
    }
  }
  async function startAmazonSkipCreditsObserver() {
    if (settings.Amazon.skipCredits === undefined || settings.Amazon.skipCredits) {
      console.log("started observing| Credits");
      let button = document.querySelector("[class*=nextupcard-button]");
      if (button) {
        button.click();
        console.log("Credits skipped", button);
      }
      AmazonSkipCreditsObserver.observe(document, AmazonSkipCreditsConfig);
    } else {
      console.log("stopped observing| Credits");
      AmazonSkipCreditsObserver.disconnect();
    }
  }
  async function startAmazonSkipAdObserver() {
    if (settings.Amazon.skipAd === undefined || settings.Amazon.skipAd) {
      console.log("started observing| Self Ad");
      // Amazon_AdTimeout();
      AmazonSkipAdObserver.observe(document, config);
    } else {
      console.log("stopped observing| Self Ad");
      AmazonSkipAdObserver.disconnect();
    }
  }
  async function startAmazonBlockFreeveeObserver() {
    if (settings.Amazon.blockFreevee === undefined || settings.Amazon.blockFreevee) {
      console.log("started observing| FreeVee Ad");
      let video = document.querySelector("#dv-web-player > div > div:nth-child(1) > div > div > div.scalingVideoContainer > div.scalingVideoContainerBottom > div > video");
      let adTimeText = document.querySelector(".atvwebplayersdk-adtimeindicator-text");
      if (!document.querySelector(".fu4rd6c.f1cw2swo") && video != null && adTimeText != null) {
        video.currentTime += parseInt(adTimeText.textContent.match(/\d+/)[0]);
        console.log("FreeVee Ad skipped", adTimeText, video);
      }
      AmazonFreeVeeObserver.observe(document, FreeVeeConfig);
    } else {
      console.log("stopped observing| FreeVee Ad");
      AmazonFreeVeeObserver.disconnect();
    }
  }
}
