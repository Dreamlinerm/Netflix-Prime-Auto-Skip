// global variables in localStorage
let settings;
const defaultSettings = {
  settings: {
    Amazon: { skipIntro: true, skipCredits: true, skipAd: true },
    Netflix: { skipIntro: true, skipRecap: true, skipCredits: true, skipBlocked: true },
  },
};
browser.storage.local.get("settings", function (result) {
  settings = result.settings;
  if (typeof settings !== "object") {
    browser.storage.local.set(defaultSettings, function () {});
  } else {
    console.log("settings:Value currently is ", settings);
    setCheckboxesToSettings();
  }
});
browser.storage.local.onChanged.addListener(function (changes, namespace) {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    if (key == "settings") {
      settings = newValue;
      console.log(key, ": changed.", "Old value was ", oldValue, ", new value is ", newValue, ".");
      setCheckboxesToSettings();
    }
  }
});
function setCheckboxesToSettings() {
  let button = document.querySelector("#AmazonIntro");
  if (button) button.checked = settings?.Amazon.skipIntro;
  button = document.querySelector("#AmazonCredits");
  if (button) button.checked = settings?.Amazon.skipCredits;
  button = document.querySelector("#AmazonAds");
  if (button) button.checked = settings?.Amazon.skipAd;
  button = document.querySelector("#NetflixIntro");
  if (button) button.checked = settings?.Netflix.skipIntro;
  button = document.querySelector("#NetflixRecap");
  if (button) button.checked = settings?.Netflix.skipRecap;
  button = document.querySelector("#NetflixCredits");
  if (button) button.checked = settings?.Netflix.skipCredits;
  button = document.querySelector("#NetflixBlocked");
  if (button) button.checked = settings?.Netflix.skipBlocked;
}
/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {
  let listener = document.addEventListener("click", (e) => {
    if (e.target.classList.contains("reset")) {
      console.log("settings resetted to", defaultSettings);
      browser.storage.local.set(defaultSettings, function () {});
    } else if (e.target.id === "AmazonCredits") {
      settings.Amazon.skipCredits = !settings.Amazon.skipCredits;
      console.log("settings.AmazonCredits", settings);
      browser.storage.local.set({ settings: settings }, function () {});
    } else if (e.target.id === "AmazonIntro") {
      settings.Amazon.skipIntro = !settings.Amazon.skipIntro;
      console.log("settings.AmazonIntro", settings);
      browser.storage.local.set({ settings: settings }, function () {});
    } else if (e.target.id === "AmazonAds") {
      settings.Amazon.skipAd = !settings.Amazon.skipAd;
      console.log("settings.AmazonAd", settings);
      browser.storage.local.set({ settings: settings }, function () {});
    } else if (e.target.id === "NetflixIntro") {
      settings.Netflix.skipIntro = !settings.Netflix.skipIntro;
      console.log("settings.NetflixIntro", settings);
      browser.storage.local.set({ settings: settings }, function () {});
    } else if (e.target.id === "NetflixRecap") {
      settings.Netflix.skipRecap = !settings.Netflix.skipRecap;
      console.log("settings.NetflixRecap", settings);
      browser.storage.local.set({ settings: settings }, function () {});
    } else if (e.target.id === "NetflixCredits") {
      settings.Netflix.skipCredits = !settings.Netflix.skipCredits;
      console.log("settings.NetflixCredits", settings);
      browser.storage.local.set({ settings: settings }, function () {});
    } else if (e.target.id === "NetflixBlocked") {
      settings.Netflix.skipBlocked = !settings.Netflix.skipBlocked;
      console.log("settings.NetflixBlocked", settings);
      browser.storage.local.set({ settings: settings }, function () {});
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
 * When the popup loads, add a click handler.
 * If we couldn't inject the script, handle the error.
 */
try {
  listenForClicks();
} catch (e) {
  reportExecuteScriptError(e);
}
