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
const defaultSettings = {
  settings: {
    Amazon: { skipIntro: true, skipAd: true },
    Netflix: { skipIntro: true, skipCredits: true, skipRecap: true, skipBlocked: true },
  },
};
browser.storage.local.get("settings", function (result) {
  console.log("settings:Value currently is ", result.settings);
  settings = result.settings;
  if (typeof settings !== "object") {
    browser.storage.local.set(defaultSettings, function () {
      // console.log("settings:Value is set to ", defaultSettings);
    });
    browser.storage.local.get("settings", function (result) {
      // console.log("settings:Value currently is ", result.settings);
      settings = result.settings;
    });
  }
  document.querySelector("#AmazonIntro").checked = settings.Amazon.skipIntro;
  document.querySelector("#AmazonAds").checked = settings.Amazon.skipAd;
  document.querySelector("#NetflixIntro").checked = settings.Netflix.skipIntro;
  document.querySelector("#NetflixRecap").checked = settings.Netflix.skipRecap;
  document.querySelector("#NetflixCredits").checked = settings.Netflix.skipCredits;
  document.querySelector("#NetflixBlocked").checked = settings.Netflix.skipBlocked;
});

/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {
  var listener = document.addEventListener("click", (e) => {
    /**
     * Get the active tab,
     * then call "beastify()" or "reset()" as appropriate.
     */
    if (e.target.classList.contains("reset")) {
      browser.storage.local.set(defaultSettings, function () {});
      settings = defaultSettings;
      document.querySelector("#AmazonIntro").checked = defaultSettings.settings.Amazon.skipIntro;
      // document.querySelector("#AmazonRecap").checked = defaultSettings.settings.Amazon.skipRecap;
      document.querySelector("#AmazonAds").checked = defaultSettings.settings.Amazon.skipAd;

      document.querySelector("#NetflixIntro").checked = defaultSettings.settings.Netflix.skipIntro;
      document.querySelector("#NetflixRecap").checked = defaultSettings.settings.Netflix.skipRecap;
      document.querySelector("#NetflixCredits").checked = defaultSettings.settings.Netflix.skipCredits;
      document.querySelector("#NetflixBlocked").checked = defaultSettings.settings.Netflix.skipBlocked;
    } else if (e.target.classList.contains("AmazonIntro")) {
      settings.Amazon.skipIntro = !settings.Amazon.skipIntro;
      console.log("settings.skipIntro", settings);
      browser.storage.local.set(
        {
          settings: settings,
        },
        function () {}
      );
    } else if (e.target.classList.contains("AmazonAds")) {
      settings.Amazon.skipAd = !settings.Amazon.skipAd;
      console.log("settings.skipIntro", settings);
      browser.storage.local.set(
        {
          settings: settings,
        },
        function () {}
      );
    } else if (e.target.classList.contains("NetflixIntro")) {
      settings.Netflix.skipIntro = !settings.Netflix.skipIntro;
      console.log("settings.skipIntro", settings);
      browser.storage.local.set(
        {
          settings: settings,
        },
        function () {}
      );
    } else if (e.target.classList.contains("NetflixRecap")) {
      settings.Netflix.skipRecap = !settings.Netflix.skipRecap;
      console.log("settings.skipRecap", settings);
      browser.storage.local.set(
        {
          settings: settings,
        },
        function () {}
      );
    } else if (e.target.classList.contains("NetflixCredits")) {
      settings.Netflix.skipCredits = !settings.Netflix.skipCredits;
      console.log("settings.skipIntro", settings);
      browser.storage.local.set(
        {
          settings: settings,
        },
        function () {}
      );
    } else if (e.target.classList.contains("NetflixBlocked")) {
      settings.Netflix.skipBlocked = !settings.Netflix.skipBlocked;
      console.log("settings.skipIntro", settings);
      browser.storage.local.set(
        {
          settings: settings,
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

listenForClicks().catch(reportExecuteScriptError);
