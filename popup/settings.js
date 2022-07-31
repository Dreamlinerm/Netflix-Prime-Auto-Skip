/**
 * CSS to hide everything on the page,
 * except for elements that have the "beastify-image" class.
 */
const hidePage = `body > :not(.beastify-image) {
                    display: none;
                  }`;
console.log("settings.js");

// TODO: send settings to primeskip.js
// global variables
let settings;
const defaultSettings = { primeSettings: { skipIntro: true, skipAd: true } };
browser.storage.local.get("primeSettings", function (result) {
  console.log("settings:Value currently is ", result.primeSettings);
  settings = result.primeSettings;
  if (typeof settings !== "object") {
    browser.storage.local.set(defaultSettings, function () {
      // console.log("settings:Value is set to ", defaultSettings);
    });
    browser.storage.local.get("primeSettings", function (result) {
      // console.log("settings:Value currently is ", result.primeSettings);
      settings = result.primeSettings;
    });
  }
  document.querySelector("#intro").checked = settings.skipIntro;
  document.querySelector("#ads").checked = settings.skipAd;
});

// document.querySelector("#intro").checked = toBool(skipVideos);
// document.querySelector("#ads").checked = toBool(skipAds);

/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {
  var listener = document.addEventListener("click", (e) => {
    // function skipAd(tabs) {
    //   const adsCheckbox = document.querySelector("#ads");
    //   browser.tabs.sendMessage(tabs[0].id, {
    //     command: "skipAd",
    //     skipAd: adsCheckbox.checked,
    //   });
    // }
    /**
     * Get the active tab,
     * then call "beastify()" or "reset()" as appropriate.
     */
    if (e.target.classList.contains("reset")) {
      // browser.tabs
      //   .query({ active: true, currentWindow: true })
      //   .then(reset)
      //   .catch(reportError);
    } else if (e.target.classList.contains("intro")) {
      settings.skipIntro = !settings.skipIntro;
      console.log("settings.skipIntro", settings);
      browser.storage.local.set(
        {
          primeSettings: {
            skipIntro: settings.skipIntro,
            skipAd: settings.skipAd,
          },
        },
        function () {}
      );
    } else if (e.target.classList.contains("ads")) {
      settings.skipAd = !settings.skipAd;
      console.log("settings.skipIntro", settings);
      browser.storage.local.set(
        {
          primeSettings: {
            skipIntro: settings.skipIntro,
            skipAd: settings.skipAd,
          },
        },
        function () {}
      );
    }
  });
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  console.error(`Failed to execute primeskip content script: ${error.message}`);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
// browser.tabs
//   .executeScript({ file: "/content_scripts/options.js" })
//   .then(listenForClicks)
//   .catch(reportExecuteScriptError);

listenForClicks().catch(reportExecuteScriptError);
