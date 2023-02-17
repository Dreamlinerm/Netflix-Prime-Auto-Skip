/*
 * Netflix/Prime Auto-Skip
 * Copyright (c) 2022 Marvin Krebber
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the  GNU General Public License v3.0.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License v3.0 for more details.
 */

// find out if on settings page or on popup page
if (window?.outerWidth > 50) {
  AmazonSettings();
  NetflixSettings();
  // Statistics();
  document.querySelector("#Export").style.display = "block";
}

// global variables in localStorage
const defaultSettings = {
  settings: {
    Amazon: { skipIntro: true, skipCredits: true, skipAd: true, blockFreevee: true, speedSlider: true },
    Netflix: { skipIntro: true, skipRecap: true, skipCredits: true, skipBlocked: true },
    Statistics: { AmazonAdTimeSkipped: 0, IntroTimeSkipped: 0, RecapTimeSkipped: 0, SegmentsSkipped: 0 },
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
function getTimeFormatted(sec = 0) {
  if (typeof sec !== "number") return "0s";
  let days = Math.floor(sec / 86400);
  let hours = Math.floor((sec % 86400) / 3600);
  let minutes = Math.floor(((sec % 86400) % 3600) / 60);
  let seconds = Math.floor(((sec % 86400) % 3600) % 60);
  let text;
  if (days > 0) text = `${days}d ${hours}h ${minutes}m`;
  else if (hours > 0) text = `${hours}h ${minutes}m ${seconds}s`;
  else if (minutes > 0) text = `${minutes}m ${seconds}s`;
  else text = `${seconds}s`;
  return text;
}
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
  button = document.querySelector("#AmazonSpeedSlider");
  if (button) button.checked = settings?.Amazon.speedSlider;

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
  // Statistics
  button = document.querySelector("#AmazonAdTime");
  if (button) button.textContent = getTimeFormatted(settings?.Statistics.AmazonAdTimeSkipped);
  button = document.querySelector("#IntroTimeSkipped");
  if (button) button.textContent = getTimeFormatted(settings?.Statistics.IntroTimeSkipped);
  button = document.querySelector("#RecapTimeSkipped");
  if (button) button.textContent = getTimeFormatted(settings?.Statistics.RecapTimeSkipped);
  button = document.querySelector("#SegmentsSkipped");
  if (button) button.textContent = settings?.Statistics.SegmentsSkipped;
  // import/export buttons
  button = document.querySelector("#save");
  if (button) {
    let file = new Blob([JSON.stringify(settings)], { type: "text/json" });
    button.href = URL.createObjectURL(file);
    button.download = "settings.json";
  }
}
// open and close the Amazon and Netflix Individual Settings
function AmazonSettings(open = true) {
  if (open) {
    document.getElementById("AmazonSettings").style.display = "block";
    document.getElementsByClassName("AmazonDownArrow")[0].style.display = "none";
    document.getElementsByClassName("AmazonUpArrow")[0].style.display = "block";
  } else {
    document.getElementById("AmazonSettings").style.display = "none";
    document.getElementsByClassName("AmazonDownArrow")[0].style.display = "block";
    document.getElementsByClassName("AmazonUpArrow")[0].style.display = "none";
  }
}
function NetflixSettings(open = true) {
  if (open) {
    document.getElementById("NetflixSettings").style.display = "block";
    document.getElementsByClassName("NetflixDownArrow")[0].style.display = "none";
    document.getElementsByClassName("NetflixUpArrow")[0].style.display = "block";
  } else {
    document.getElementById("NetflixSettings").style.display = "none";
    document.getElementsByClassName("NetflixDownArrow")[0].style.display = "block";
    document.getElementsByClassName("NetflixUpArrow")[0].style.display = "none";
  }
}
function Statistics(open = true) {
  if (open) {
    document.getElementById("Statistics").style.display = "block";
    document.getElementsByClassName("StatisticsDownArrow")[0].style.display = "none";
    document.getElementsByClassName("StatisticsUpArrow")[0].style.display = "block";
  } else {
    document.getElementById("Statistics").style.display = "none";
    document.getElementsByClassName("StatisticsDownArrow")[0].style.display = "block";
    document.getElementsByClassName("StatisticsUpArrow")[0].style.display = "none";
  }
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
      settings.Amazon.speedSlider = AmazonSkips;
      console.log("settings.AmazonSkips", settings);
      browser.storage.sync.set({ settings });
    } else if (e.target.id === "openAmazonSettings") {
      AmazonSettings(document.getElementById("AmazonSettings").style.display === "none");
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
    } else if (e.target.id === "AmazonSpeedSlider") {
      settings.Amazon.speedSlider = !settings.Amazon.speedSlider;
      console.log("settings.AmazonSpeedSlider", settings);
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
      NetflixSettings(document.getElementById("NetflixSettings").style.display == "none");
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
    // Statistics
    else if (e.target.id === "openStatistics") {
      Statistics(document.getElementById("Statistics").style.display === "none");
    } else if (e.target.id === "upload") {
      // get the file from #file and console.log it
      const file = document.getElementById("file").files[0];
      if (file !== undefined && "application/json" === file.type) {
        if (confirm(file.name + " will replace the Settings.\n\nAre you sure you want to do this?")) {
          // read contents of file
          const reader = new FileReader();
          // reader.onload = (e) => {
          reader.addEventListener("load", (e) => {
            try {
              // parse the JSON
              const data = JSON.parse(e.target.result);
              // set the settings to the parsed JSON
              settings = data;
              // save the settings to the storage
              browser.storage.sync.set({ settings });
              // reload the page
              location.reload();
              // };
            } catch (e) {
              alert("The file you uploaded is not a valid JSON file.");
              return;
            }
          });
          reader.readAsText(file);
        }
      } else {
        alert("The file you uploaded is not a valid JSON file.");
        return;
      }
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
