// matches all amazon urls under https://en.wikipedia.org/wiki/Amazon_(company)#Website
let hostname = window.location.hostname;
let title = document.title;
let url = window.location.href;
let isAmazon = /amazon|primevideo/i.test(hostname);
let isVideo = /video/i.test(title) || /video/i.test(url);
let isNetflix = /netflix/i.test(hostname);
const version = "1.0.4";

if (isVideo || isNetflix) {
  // global variables in localStorage
  let settings;
  const defaultSettings = {
    settings: {
      Amazon: { skipIntro: true, skipCredits: true, skipAd: true },
      Netflix: { skipIntro: true, skipRecap: true, skipCredits: true, skipBlocked: true },
    },
  };
  chrome.storage.sync.get("settings", function (result) {
    settings = result.settings;
    console.log("%cNetflix%c/%cPrime%c Auto-Skip: ", "color:#e60010;font-size:1.5em;", "color:white;;font-size:1.5em;", "color:#00aeef;font-size:1.5em;", "color:white;;font-size:1.5em;");
    console.log("version: ", version);
    console.log("Settings", settings);
    console.log("Page", isAmazon ? "Amazon" : "Netflix");
    if (typeof settings !== "object") {
      chrome.storage.sync.set(defaultSettings, function () {});
    } else {
      if (isNetflix) {
        // start Observers depending on the settings
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
        if (settings.Amazon.skipIntro) {
          startAmazonSkipIntroObserver();
        }
        if (settings.Amazon.skipCredits) {
          startAmazonSkipCreditsObserver();
        }
        if (settings.Amazon.skipAd) {
          startAmazonSkipAdObserver();
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
        }
      }
    }
  });

  // Observers
  // Options for the observer (which mutations to observe)
  const config = { attributes: true, childList: true, subtree: true };
  // Netflix Observers
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
        let button = node.querySelector('[data-uia="player-skip-recap"]');
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
  const AmazonSkipIntro = new RegExp("skipelement", "i");
  const AmazonSkipIntroObserver = new MutationObserver(Amazon_Intro);
  function Amazon_Intro(mutations, observer) {
    for (let mutation of mutations) {
      if (AmazonSkipIntro.test(mutation.target.classList)) {
        mutation.target.click();
        console.log("Intro skipped", mutation.target);
      }
    }
  }

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

  // const SkipAdTranslation = {
  //   en: "Skip",
  //   de: "Überspringen",
  // };
  // const AmazonSkipAdObserver = new MutationObserver(Amazon_Ad);
  // async function Amazon_Ad(mutations, observer) {
  //   // the button classes are class="fu4rd6c f1cw2swo" but im not sure they are changed may need to refresh
  //   let button = document.querySelector(".fu4rd6c.f1cw2swo");
  //   if (button) {
  //     button.click();
  //     console.log("Ad skipped", button);
  //   }
  //   // alternative
  //   // let buttons = document.querySelector("[class*=webplayersdk-infobar-container]").getElementsByTagName("div");
  //   // for (let i = 0; i < buttons.length; i++) {
  //   //   if (buttons[i]?.firstChild?.textContent == SkipAdTranslation[language]) {
  //   //     console.log("Ad skipped", buttons[i]);
  //   //     buttons[i].click();
  //   //     setTimeout(function () {
  //   //       console.log("Hello World");
  //   //     }, 2000);
  //   //   }
  //   // }
  // }

  async function Amazon_AdTimeout() {
    // set loop every 0.5 sec and check if ad is there
    setInterval(function () {
      // the button classes are class="fu4rd6c f1cw2swo" but im not sure they are changed may need to refresh
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
  // start/stop the observers depending on settings
  async function startNetflixSkipIntroObserver() {
    if (settings.Netflix.skipIntro) {
      console.log("started observing| intro");
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
      console.log("started observing| Ad");
      Amazon_AdTimeout();
    } else {
      console.log("stopped observing| Ad");
    }
  }
}
