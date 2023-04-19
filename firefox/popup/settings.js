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
// if (window?.outerWidth > 400) {
//   AmazonSettings();
//   NetflixSettings();
//   // Statistics();
//   document.querySelector("#Export").style.display = "block";
// }

// global variables in localStorage
const defaultSettings = {
  settings: {
    Amazon: { skipIntro: true, skipCredits: true, skipAd: true, blockFreevee: true, speedSlider: true, filterPaid: false },
    Netflix: { skipIntro: true, skipRecap: true, skipCredits: true, skipBlocked: true, NetflixAds: true, profile: true },
    Video: { playOnFullScreen: true },
    Statistics: { AmazonAdTimeSkipped: 0, NetflixAdTimeSkipped: 0, IntroTimeSkipped: 0, RecapTimeSkipped: 0, SegmentsSkipped: 0 },
    General: { profileName: null, profilePicture: null },
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
  let button;
  button = document.querySelector("#VideoSkips");
  if (button)
    button.checked =
      settings?.Amazon.skipIntro &&
      settings?.Netflix.skipIntro &&
      settings?.Amazon.skipCredits &&
      settings?.Netflix.skipCredits &&
      settings?.Amazon.skipAd &&
      settings?.Netflix.NetflixAds &&
      settings?.Video.playOnFullScreen;
  button = document.querySelector("#VideoIntro");
  if (button) button.checked = settings?.Amazon.skipIntro && settings?.Netflix.skipIntro;
  button = document.querySelector("#VideoCredits");
  if (button) button.checked = settings?.Amazon.skipCredits && settings?.Netflix.skipCredits;
  button = document.querySelector("#VideoAds");
  if (button) button.checked = settings?.Amazon.skipAd && settings?.Netflix.NetflixAds;
  button = document.querySelector("#VideoFullScreen");
  if (button) button.checked = settings?.Video.playOnFullScreen;

  //  -------------      Amazon        ---------------------------------------
  button = document.querySelector("#AmazonSkips");
  if (button)
    button.checked =
      settings?.Amazon.skipIntro && settings?.Amazon.skipCredits && settings?.Amazon.skipAd && settings?.Amazon.blockFreevee && settings?.Amazon.speedSlider && settings?.Amazon.filterPaid;
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
  button = document.querySelector("#AmazonfilterPaid");
  if (button) button.checked = settings?.Amazon.filterPaid;
  //  -------------      Netflix        ---------------------------------------
  button = document.querySelector("#NetflixSkips");
  if (button)
    button.checked =
      settings?.Netflix.skipIntro && settings?.Netflix.skipRecap && settings?.Netflix.skipCredits && settings?.Netflix.skipBlocked && settings?.Netflix.NetflixAds && settings?.Netflix.profile;
  button = document.querySelector("#NetflixIntro");
  if (button) button.checked = settings?.Netflix.skipIntro;
  button = document.querySelector("#NetflixRecap");
  if (button) button.checked = settings?.Netflix.skipRecap;
  button = document.querySelector("#NetflixCredits");
  if (button) button.checked = settings?.Netflix.skipCredits;
  button = document.querySelector("#NetflixBlocked");
  if (button) button.checked = settings?.Netflix.skipBlocked;
  button = document.querySelector("#NetflixAds");
  if (button) button.checked = settings?.Netflix.NetflixAds;
  button = document.querySelector("#NetflixProfile");
  if (button) button.checked = settings?.Netflix.profile;

  button = document.querySelector("#profileName");
  if (button) button.textContent = settings?.General.profileName;
  button = document.querySelector("#profilePicture");
  if (button && settings.General.profilePicture) {
    button.setAttribute("src", settings?.General.profilePicture);
    button.style.display = "block";
  }

  // general video settings
  button = document.querySelector("#playOnFullScreen");
  if (button) button.checked = settings?.Video.playOnFullScreen;

  // Statistics
  button = document.querySelector("#AmazonAdTime");
  if (button) button.textContent = getTimeFormatted(settings?.Statistics.AmazonAdTimeSkipped);
  button = document.querySelector("#NetflixAdTime");
  if (button) button.textContent = getTimeFormatted(settings?.Statistics.NetflixAdTimeSkipped);
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
function openIndividualSettings(setting) {
  const open = document.getElementById(setting + "Settings").style.display === "none";
  document.getElementById(setting + "Settings").style.display = open ? "block" : "none";
  document.getElementsByClassName(setting + "DownArrow")[0].style.display = open ? "none" : "block";
  document.getElementsByClassName(setting + "UpArrow")[0].style.display = open ? "block" : "none";
}
function Menu(setting) {
  document.getElementById("VideoSettings").style.display = "none";
  document.getElementById("MenuVideo").style.setProperty("background-color", "");

  document.getElementById("AmazonSettings").style.display = "none";
  document.getElementById("MenuAmazon").style.setProperty("background-color", "");

  document.getElementById("NetflixSettings").style.display = "none";
  document.getElementById("MenuNetflix").style.setProperty("background-color", "");

  document.getElementById("StatisticsSettings").style.display = "none";
  document.getElementById("MenuStatistics").style.setProperty("background-color", "");

  document.getElementById("OtherSettings").style.display = "none";
  document.getElementById("MenuOther").style.setProperty("background-color", "");

  document.getElementById(setting + "Settings").style.display = "block";
  document.getElementById("Menu" + setting).style.setProperty("background-color", "#e60010");
}
/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function setSettings(log) {
  console.log(log, settings);
  browser.storage.sync.set({ settings });
}
function listenForClicks() {
  let listener = document.addEventListener("click", (e) => {
    if (e.target.classList.contains("reset")) {
      console.log("settings resetted to default");
      browser.storage.sync.set(defaultSettings);
    }
    //  -------------      Menu        ---------------------------------------
    else if (e.target.id === "MenuVideo") {
      Menu("Video");
    } else if (e.target.id === "MenuAmazon") {
      Menu("Amazon");
    } else if (e.target.id === "MenuNetflix") {
      Menu("Netflix");
    } else if (e.target.id === "MenuStatistics") {
      Menu("Statistics");
    } else if (e.target.id === "MenuOther") {
      Menu("Other");
    }
    //  -------------      openSettings        ---------------------------------------
    else if (e.target.id === "openVideoSettings") {
      openIndividualSettings("Video");
    } else if (e.target.id === "openAmazonSettings") {
      openIndividualSettings("Amazon");
    } else if (e.target.id === "openNetflixSettings") {
      openIndividualSettings("Netflix");
    } else if (e.target.id === "openStatistics") {
      openIndividualSettings("Statistics");
    }
    //  -------------      Video        ---------------------------------------
    else if (e.target.id === "VideoSkips") {
      const VideoSkips = !(
        settings?.Amazon.skipIntro &&
        settings?.Netflix.skipIntro &&
        settings?.Amazon.skipCredits &&
        settings?.Netflix.skipCredits &&
        settings?.Amazon.skipAd &&
        settings?.Netflix.NetflixAds &&
        settings?.Video.playOnFullScreen
      );
      settings.Amazon.skipIntro = VideoSkips;
      settings.Netflix.skipIntro = VideoSkips;
      settings.Amazon.skipCredits = VideoSkips;
      settings.Netflix.skipCredits = VideoSkips;
      settings.Amazon.skipAd = VideoSkips;
      settings.Netflix.NetflixAds = VideoSkips;
      settings.Video.playOnFullScreen = VideoSkips;
      setSettings("All VideoSkips");
    } else if (e.target.id === "VideoIntro") {
      settings.Amazon.skipIntro = !settings.Amazon.skipIntro;
      settings.Netflix.skipIntro = !settings.Netflix.skipIntro;
      setSettings("VideoIntro");
    } else if (e.target.id === "VideoCredits") {
      settings.Amazon.skipCredits = !settings.Amazon.skipCredits;
      settings.Netflix.skipCredits = !settings.Netflix.skipCredits;
      setSettings("VideoCredits");
    } else if (e.target.id === "VideoAds") {
      settings.Amazon.skipAd = !settings.Amazon.skipAd;
      settings.Netflix.NetflixAds = !settings.Netflix.NetflixAds;
      setSettings("VideoAd");
    } else if (e.target.id === "VideoFullScreen") {
      settings.Video.playOnFullScreen = !settings.Video.playOnFullScreen;
      setSettings("playOnFullScreen");
    }
    //  -------------      Amazon        ---------------------------------------
    else if (e.target.id === "AmazonSkips") {
      const AmazonSkips = !(
        settings.Amazon.skipIntro &&
        settings.Amazon.skipCredits &&
        settings.Amazon.skipAd &&
        settings.Amazon.blockFreevee &&
        settings.Amazon.speedSlider &&
        settings.Amazon.filterPaid
      );
      for (let key in settings.Amazon) {
        settings.Amazon[key] = AmazonSkips;
      }
      setSettings("All AmazonSkips");
    } else if (e.target.id === "AmazonCredits") {
      settings.Amazon.skipCredits = !settings.Amazon.skipCredits;
      setSettings("AmazonCredits");
    } else if (e.target.id === "AmazonIntro") {
      settings.Amazon.skipIntro = !settings.Amazon.skipIntro;
      setSettings("AmazonIntro");
    } else if (e.target.id === "AmazonAds") {
      settings.Amazon.skipAd = !settings.Amazon.skipAd;
      setSettings("AmazonAd");
    } else if (e.target.id === "AmazonFreevee") {
      settings.Amazon.blockFreevee = !settings.Amazon.blockFreevee;
      setSettings("blockFreevee");
    } else if (e.target.id === "AmazonSpeedSlider") {
      settings.Amazon.speedSlider = !settings.Amazon.speedSlider;
      setSettings("AmazonSpeedSlider");
    } else if (e.target.id === "AmazonfilterPaid") {
      settings.Amazon.filterPaid = !settings.Amazon.filterPaid;
      setSettings("filterPaid");
    }
    //  -------------      Netflix        ---------------------------------------
    else if (e.target.id === "NetflixSkips") {
      const NetflixSkips = !(
        settings?.Netflix.skipIntro &&
        settings?.Netflix.skipRecap &&
        settings?.Netflix.skipCredits &&
        settings?.Netflix.skipBlocked &&
        settings?.Netflix.NetflixAds &&
        settings?.Netflix.profile
      );
      for (let key in settings.Netflix) {
        settings.Netflix[key] = NetflixSkips;
      }
      setSettings("All NetflixSkips");
    } else if (e.target.id === "NetflixIntro") {
      settings.Netflix.skipIntro = !settings.Netflix.skipIntro;
      setSettings("NetflixIntro");
    } else if (e.target.id === "NetflixRecap") {
      settings.Netflix.skipRecap = !settings.Netflix.skipRecap;
      setSettings("NetflixRecap");
    } else if (e.target.id === "NetflixCredits") {
      settings.Netflix.skipCredits = !settings.Netflix.skipCredits;
      setSettings("NetflixCredits");
    } else if (e.target.id === "NetflixBlocked") {
      settings.Netflix.skipBlocked = !settings.Netflix.skipBlocked;
      setSettings("NetflixBlocked");
    } else if (e.target.id === "NetflixAds") {
      settings.Netflix.NetflixAds = !settings.Netflix.NetflixAds;
      setSettings("NetflixAds");
    } else if (e.target.id === "NetflixProfile") {
      settings.Netflix.profile = !settings.Netflix.profile;
      setSettings("profile");
    }
    //  -------------      Video        ---------------------------------------
    else if (e.target.id === "playOnFullScreen") {
      settings.video.playOnFullScreen = !settings.video.playOnFullScreen;
      setSettings("playOnFullScreen");
    }
    //  -------------      Statistics        ---------------------------------------
    else if (e.target.id === "upload") {
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
