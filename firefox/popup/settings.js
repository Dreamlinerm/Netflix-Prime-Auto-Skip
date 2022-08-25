// global variables in localStorage
const defaultSettings = {
  settings: {
    Amazon: { skipIntro: true, skipCredits: true, skipAd: true, blockFreevee: true },
    Netflix: { skipIntro: true, skipRecap: true, skipCredits: true, skipBlocked: true },
  },
};
let settings = defaultSettings.settings;
browser.storage.sync.get("settings", function (result) {
  settings = result.settings;
  if (typeof settings !== "object") {
    browser.storage.sync.set(defaultSettings);
  } else {
    console.log("settings:", settings);
    // if there is an undefined setting, set it to the default
    let changedSettings = false;
    for (const key in defaultSettings.settings) {
      if (typeof settings[key] === "undefined") {
        console.log("undefined Setting:", key);
        changedSettings = true;
        settings[key] = defaultSettings.settings[key];
      } else {
        for (const subkey in defaultSettings.settings[key]) {
          if (typeof settings[key][subkey] === "undefined") {
            console.log("undefined Setting:", key, subkey);
            changedSettings = true;
            settings[key][subkey] = defaultSettings.settings[key][subkey];
          }
        }
      }
    }
    setCheckboxesToSettings();
    if (changedSettings) {
      browser.storage.sync.set({ settings });
    }
  }
});
browser.storage.sync.onChanged.addListener(function (changes, namespace) {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    if (key == "settings") {
      settings = newValue;
      console.log(key, "Old value:", oldValue, ", new value:", newValue);
      setCheckboxesToSettings();
    }
  }
});
function setCheckboxesToSettings() {
  let button = document.querySelector("#AmazonSkips");
  if (button) button.checked = settings?.Amazon.skipIntro && settings?.Amazon.skipCredits && settings?.Amazon.skipAd && settings?.Amazon.blockFreevee;
  button = document.querySelector("#AmazonIntro");
  if (button) button.checked = settings?.Amazon.skipIntro;
  button = document.querySelector("#AmazonCredits");
  if (button) button.checked = settings?.Amazon.skipCredits;
  button = document.querySelector("#AmazonAds");
  if (button) button.checked = settings?.Amazon.skipAd;
  button = document.querySelector("#AmazonFreevee");
  if (button) button.checked = settings?.Amazon.blockFreevee;

  button = document.querySelector("#NetflixSkips");
  if (button) button.checked = settings?.Netflix.skipIntro && settings?.Netflix.skipRecap && settings?.Netflix.skipCredits && settings?.Netflix.skipBlocked;
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
      browser.storage.sync.set(defaultSettings);
    } else if (e.target.id === "AmazonSkips") {
      const AmazonSkips = !(settings.Amazon.skipIntro && settings.Amazon.skipCredits && settings.Amazon.skipAd && settings.Amazon.blockFreevee);
      settings.Amazon.skipIntro = AmazonSkips;
      settings.Amazon.skipCredits = AmazonSkips;
      settings.Amazon.skipAd = AmazonSkips;
      settings.Amazon.blockFreevee = AmazonSkips;
      console.log("settings.AmazonSkips", settings);
      browser.storage.sync.set({ settings });
    } else if (e.target.id === "openAmazonSettings") {
      let AmazonSettings = document.getElementById("AmazonSettings");
      if (AmazonSettings.style.display === "none") {
        AmazonSettings.style.display = "block";
        document.getElementsByClassName("AmazonDownArrow")[0].style.display = "none";
        document.getElementsByClassName("AmazonUpArrow")[0].style.display = "block";
      } else {
        AmazonSettings.style.display = "none";
        document.getElementsByClassName("AmazonDownArrow")[0].style.display = "block";
        document.getElementsByClassName("AmazonUpArrow")[0].style.display = "none";
      }
    } else if (e.target.id === "AmazonCredits") {
      settings.Amazon.skipCredits = !settings.Amazon.skipCredits;
      console.log("settings.AmazonCredits", settings);
      browser.storage.sync.set({ settings });
    } else if (e.target.id === "AmazonIntro") {
      settings.Amazon.skipIntro = !settings.Amazon.skipIntro;
      console.log("settings.AmazonIntro", settings);
      browser.storage.sync.set({ settings });
    } else if (e.target.id === "AmazonAds") {
      settings.Amazon.skipAd = !settings.Amazon.skipAd;
      console.log("settings.AmazonAd", settings);
      browser.storage.sync.set({ settings });
    } else if (e.target.id === "AmazonFreevee") {
      settings.Amazon.blockFreevee = !settings.Amazon.blockFreevee;
      console.log("settings.blockFreevee", settings);
      browser.storage.sync.set({ settings });
    }
    //  -------------      Netflix        ---------------------------------------
    else if (e.target.id === "NetflixSkips") {
      const NetflixSkips = !(settings.Netflix.skipIntro && settings.Netflix.skipRecap && settings.Netflix.skipCredits && settings.Netflix.skipBlocked);
      settings.Netflix.skipIntro = NetflixSkips;
      settings.Netflix.skipRecap = NetflixSkips;
      settings.Netflix.skipCredits = NetflixSkips;
      settings.Netflix.skipBlocked = NetflixSkips;
      console.log("settings.NetflixSkips", settings);
      browser.storage.sync.set({ settings });
    } else if (e.target.id === "openNetflixSettings") {
      let NetflixSettings = document.getElementById("NetflixSettings");
      if (NetflixSettings.style.display == "none") {
        NetflixSettings.style.display = "block";
        document.getElementsByClassName("NetflixDownArrow")[0].style.display = "none";
        document.getElementsByClassName("NetflixUpArrow")[0].style.display = "block";
      } else {
        NetflixSettings.style.display = "none";
        document.getElementsByClassName("NetflixDownArrow")[0].style.display = "block";
        document.getElementsByClassName("NetflixUpArrow")[0].style.display = "none";
      }
    } else if (e.target.id === "NetflixIntro") {
      settings.Netflix.skipIntro = !settings.Netflix.skipIntro;
      console.log("settings.NetflixIntro", settings);
      browser.storage.sync.set({ settings });
    } else if (e.target.id === "NetflixRecap") {
      settings.Netflix.skipRecap = !settings.Netflix.skipRecap;
      console.log("settings.NetflixRecap", settings);
      browser.storage.sync.set({ settings });
    } else if (e.target.id === "NetflixCredits") {
      settings.Netflix.skipCredits = !settings.Netflix.skipCredits;
      console.log("settings.NetflixCredits", settings);
      browser.storage.sync.set({ settings });
    } else if (e.target.id === "NetflixBlocked") {
      settings.Netflix.skipBlocked = !settings.Netflix.skipBlocked;
      console.log("settings.NetflixBlocked", settings);
      browser.storage.sync.set({ settings });
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
