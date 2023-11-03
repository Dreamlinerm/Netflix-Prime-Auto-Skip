/*
 * Streaming enhanced
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
/* global chrome */

// find out if on settings page or on popup page
// if document.title is "Streaming enhanced" then it is not the popup page
// if (window?.outerWidth > 400) {
//   AmazonSettings();
//   NetflixSettings();
//   // Statistics();
//   document.querySelector("#Export").style.display = "block";
// }

/**
 * Localize by replacing __MSG_***__ meta tags
 * @returns {void}
 */
function localizeHtmlPage() {
  // https://stackoverflow.com/questions/25467009/internationalization-of-html-pages-for-my-google-chrome-extension
  // innerHTML triggers warnings so changed functions
  // i18n tag
  let translations = document.getElementsByTagName("i18n");
  for (let trans of translations) {
    let Translated = chrome.i18n.getMessage.apply(null, trans.textContent.split(";"));
    trans.textContent = Translated;
  }
  // i18n attribute
  translations = document.querySelectorAll("[i18n]");
  for (let trans of translations) {
    let Translated = chrome.i18n.getMessage.apply(null, trans.textContent.split(";"));
    trans.textContent = Translated;
  }
}
localizeHtmlPage();

// remove everything before # in window.location
let url = window.location.href;
if (url.includes("#")) Menu(url.split("#")[1]);

// global variables in localStorage
const defaultSettings = {
  settings: {
    Amazon: { skipIntro: true, skipCredits: true, watchCredits: false, skipAd: true, blockFreevee: true, speedSlider: true, filterPaid: false, showRating: true },
    Netflix: { skipIntro: true, skipRecap: true, skipCredits: true, watchCredits: false, skipBlocked: true, skipAd: true, speedSlider: true, profile: true, showRating: true },
    Disney: { skipIntro: true, skipCredits: true, watchCredits: false, speedSlider: true, showRating: true },
    Crunchyroll: { skipIntro: true, speedSlider: true, releaseCalendar: true },
    Video: { playOnFullScreen: true },
    Statistics: { AmazonAdTimeSkipped: 0, NetflixAdTimeSkipped: 0, IntroTimeSkipped: 0, RecapTimeSkipped: 0, SegmentsSkipped: 0 },
    General: { profileName: null, profilePicture: null, sliderSteps: 1, sliderMin: 5, sliderMax: 20, filterDub: true, filterQueued: true },
  },
};
let settings = defaultSettings.settings;
chrome.storage.sync.get("settings", function (result) {
  settings = result.settings;
  if (typeof settings !== "object") {
    chrome.storage.sync.set(defaultSettings);
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
    // delete every setting that is not in defaultSettings
    for (const key in settings) {
      for (const subkey in settings[key]) {
        if (typeof defaultSettings.settings[key][subkey] === "undefined") {
          console.log("delete Setting:", key, subkey);
          changedSettings = true;
          delete settings[key][subkey];
        }
      }
    }
    setCheckboxesToSettings();
    if (changedSettings) {
      chrome.storage.sync.set({ settings });
    }
  }
});
chrome.storage.sync.onChanged.addListener(function (changes) {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    if (key == "settings") {
      settings = newValue;
      console.log(key, "Old value:", oldValue, ", new value:", newValue);
      setCheckboxesToSettings();
    }
  }
});
//global variables
let sliderValue = settings.General.sliderMax;
// ------------------- functions --------------------
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
// for all services get the shared boolean of the category
function getBooleanOfCategory(category) {
  let bool = true;
  if (settings?.Amazon?.[category] !== undefined) bool &= settings?.Amazon[category];
  if (settings?.Netflix?.[category] !== undefined) bool &= settings?.Netflix[category];
  if (settings?.Disney?.[category] !== undefined) bool &= settings?.Disney[category];
  if (settings?.Crunchyroll?.[category] !== undefined) bool &= settings?.Crunchyroll[category];
  return bool;
}
function setCategoryToBoolean(category, bool) {
  if (settings?.Amazon?.[category] !== undefined) settings.Amazon[category] = bool;
  if (settings?.Netflix?.[category] !== undefined) settings.Netflix[category] = bool;
  if (settings?.Disney?.[category] !== undefined) settings.Disney[category] = bool;
  if (settings?.Crunchyroll?.[category] !== undefined) settings.Crunchyroll[category] = bool;
}
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function lowerCaseFirstLetter(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}
function setCheckboxesOfService(service) {
  Object.keys(settings[service]).forEach((key) => {
    const buttons = document.querySelectorAll("#" + service + capitalizeFirstLetter(key));
    // console.log(service + capitalizeFirstLetter(key), buttons);
    buttons.forEach((button) => {
      if (service === "Statistics") {
        if (key != "SegmentsSkipped") button.textContent = getTimeFormatted(settings[service][key]);
        else button.textContent = settings[service][key];
      } else button.checked = settings[service][key];
    });
  });
}
function setButtonChecked(id, condition) {
  const buttons = document.querySelectorAll(`#${id}`);
  buttons.forEach((button) => {
    // console.log(button, condition);
    button.checked = condition;
  });
}
function setCheckboxesToSettings() {
  let button;
  button = document.querySelector("#VideoSkips");
  if (button)
    button.checked =
      getBooleanOfCategory("skipIntro") &&
      getBooleanOfCategory("skipCredits") &&
      // Ads
      settings?.Amazon.blockFreevee &&
      settings?.Netflix.skipAd &&
      getBooleanOfCategory("showRating") &&
      getBooleanOfCategory("speedSlider") &&
      // playOnFullScreen
      settings?.Video.playOnFullScreen;
  let VideoCheckboxes = ["skipIntro", "skipCredits", "watchCredits", "showRating", "speedSlider"];
  VideoCheckboxes.forEach((key) => {
    setButtonChecked("Video" + capitalizeFirstLetter(key), getBooleanOfCategory(key));
  });
  setButtonChecked("VideoAds", settings?.Amazon.blockFreevee && settings?.Netflix.skipAd);
  setButtonChecked("VideoFullScreen", settings?.Video.playOnFullScreen);
  //  -------------      Default        ---------------------------------------
  setButtonChecked("DefaultSkips", settings?.Amazon.filterPaid);
  // -------------      global buttons        ---------------------------------------
  setButtonChecked("AmazonSkips", settings?.Amazon.skipAd && settings?.Amazon.filterPaid);
  setButtonChecked("NetflixSkips", settings?.Netflix.skipRecap && settings?.Netflix.skipBlocked && settings?.Netflix.profile);
  setButtonChecked("DisneySkips", settings?.Disney.skipIntro);
  setButtonChecked("CrunchyrollSkips", settings?.Crunchyroll.skipIntro && settings?.Crunchyroll.releaseCalendar);
  //  -------------      Individual Checkboxes        ---------------------------------------
  setCheckboxesOfService("Amazon");
  setCheckboxesOfService("Netflix");
  setCheckboxesOfService("Disney");
  setCheckboxesOfService("Statistics");
  setCheckboxesOfService("Crunchyroll");
  //  -------------      Netflix other        ---------------------------------------
  button = document.querySelector("#profileName");
  if (button) button.textContent = settings?.General.profileName;
  button = document.querySelector("#profilePicture");
  if (button && settings.General.profilePicture) {
    button.setAttribute("src", settings?.General.profilePicture);
    button.style.display = "block";
  }
  //  -------------      Slider Options        ---------------------------------------
  button = document.querySelector("#SliderSteps");
  if (button) button.value = settings?.General.sliderSteps;
  button = document.querySelector("#SliderMin");
  if (button) button.value = settings?.General.sliderMin;
  button = document.querySelector("#SliderMax");
  if (button) button.value = settings?.General.sliderMax;
  button = document.querySelector("#SliderPreview");
  if (button) {
    button.step = settings?.General.sliderSteps;
    button.min = settings?.General.sliderMin;
    button.max = settings?.General.sliderMax;
  }
  button = document.querySelector("#SliderValue");
  if (button) button.textContent = sliderValue / 10 + "x";

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
  const Pages = ["Video", "Amazon", "Netflix", "Disney", "Crunchyroll", "Statistics", "Other", "Changelog", "Default"];
  const noButton = ["Default"];
  for (const page of Pages) {
    document.getElementById(page + "Settings").style.display = "none";
    if (!noButton.includes(page)) document.getElementById("Menu" + page).style.setProperty("background-color", "");
  }
  document.getElementById(setting + "Settings").style.display = "block";
  if (!noButton.includes(setting)) document.getElementById("Menu" + setting).style.setProperty("background-color", "#e60010");
}
/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function setSettings(log) {
  console.log(log, settings);
  chrome.storage.sync.set({ settings });
}
/**
 * for inverse Settings
 * @param {*} setting  the setting that should be set
 * @param {*} target   the setting that should be unset if setting is set
 */
function toggleSetting(service, target, setting) {
  settings[service][setting] = !settings[service]?.[setting];
  if (settings[service][setting]) settings[service][target] = false;
}
function toggleCategoryBoolean(target, setting) {
  const value = getBooleanOfCategory(setting);
  setCategoryToBoolean(setting, !value);
  if (!value) setCategoryToBoolean(target, false);
}
function listenForClicks() {
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("reset")) {
      if (confirm("Are you sure to reset every Setting including Statistics?")) {
        console.log("settings resetted to default");
        chrome.storage.sync.set(defaultSettings);
      }
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
              chrome.storage.sync.set({ settings });
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
    //  -------------      Menu        ---------------------------------------
    else if (e.target.id.startsWith("Menu")) Menu(e.target.id.replace("Menu", ""));
    //  -------------      openSettings        ---------------------------------------
    else if (e.target.id.startsWith("open")) openIndividualSettings(e.target.id.replace("open", "").replace("Settings", ""));
    // all buttons changing settings
    else {
      //  -------------      Video        ---------------------------------------
      const currentSettings = { ...settings };
      if (e.target.id === "VideoSkips") {
        const VideoSkips = !(
          getBooleanOfCategory("skipIntro") &&
          getBooleanOfCategory("skipCredits") &&
          // Ads
          settings?.Amazon.blockFreevee &&
          settings?.Netflix.skipAd &&
          getBooleanOfCategory("showRating") &&
          getBooleanOfCategory("speedSlider") &&
          // playOnFullScreen
          settings?.Video.playOnFullScreen
        );
        let VideoSkipTypes = ["skipIntro", "skipCredits", "showRating", "speedSlider"];
        VideoSkipTypes.forEach((key) => {
          setCategoryToBoolean(key, VideoSkips);
        });
        settings.Amazon.blockFreevee = settings.Netflix.skipAd = settings.Video.playOnFullScreen = VideoSkips;
        if (VideoSkips) setCategoryToBoolean("watchCredits", false);
      } else if (e.target.id === "VideoAds") settings.Amazon.blockFreevee = settings.Netflix.skipAd = !(settings?.Amazon.blockFreevee && settings?.Netflix.skipAd);
      else if (e.target.id === "VideoFullScreen") settings.Video.playOnFullScreen = !settings.Video.playOnFullScreen;
      else if (e.target.id.startsWith("Video")) {
        let key = lowerCaseFirstLetter(e.target.id.replace("Video", ""));
        if (key === "skipCredits" || key === "watchCredits") {
          toggleCategoryBoolean(key === "skipCredits" ? "watchCredits" : "skipCredits", key);
        } else {
          setCategoryToBoolean(key, !getBooleanOfCategory(key));
        }
      }
      // -------------      Default        ---------------------------------------
      else if (e.target.id === "DefaultSkips") settings.Amazon.filterPaid = !settings?.Amazon.filterPaid;
      //  -------------      Amazon        ---------------------------------------
      else if (e.target.id === "AmazonSkips") settings.Amazon.skipAd = settings.Amazon.filterPaid = !(settings.Amazon.skipAd && settings.Amazon.filterPaid);
      else if (e.target.id === "NetflixSkips")
        settings.Netflix.skipRecap = settings.Netflix.skipBlocked = settings.Netflix.profile = !(settings?.Netflix.skipRecap && settings?.Netflix.skipBlocked && settings?.Netflix.profile);
      // else if (e.target.id === "DisneySkips") settings.Disney.skipIntro = !settings?.Disney.skipIntro
      else if (e.target.id === "CrunchyrollSkips") settings.Crunchyroll.skipIntro = settings.Crunchyroll.releaseCalendar = !(settings?.Crunchyroll.skipIntro && settings?.Crunchyroll.releaseCalendar);
      else {
        const services = ["Amazon", "Netflix", "Disney", "Crunchyroll"];
        for (const service of services) {
          if (e.target.id.startsWith(service)) {
            let key = lowerCaseFirstLetter(e.target.id.replace(service, ""));
            if (key === "skipCredits" || key === "watchCredits") {
              toggleSetting(service, key === "skipCredits" ? "watchCredits" : "skipCredits", key);
            } else {
              settings[service][key] = !settings[service]?.[key];
            }
          }
        }
      }
      // check if settings changed
      if (JSON.stringify(settings) !== JSON.stringify(currentSettings)) {
        setSettings(e.target.id);
      }
    }
  });
}

function listenForInput() {
  document.addEventListener("input", (e) => {
    if (e.target.id === "SliderPreview") {
      sliderValue = Number(e.target.value);
      setCheckboxesToSettings();
    } else {
      if (e.target.id === "SliderSteps") settings.General.sliderSteps = Number(e.target.value);
      else if (e.target.id === "SliderMin") {
        settings.General.sliderMin = Number(e.target.value);
        sliderValue = settings.General.sliderMin;
      } else if (e.target.id === "SliderMax") {
        settings.General.sliderMax = Number(e.target.value);
        sliderValue = settings.General.sliderMax;
      }
      setCheckboxesToSettings();
      setSettings(e.target.id);
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
  listenForInput();
} catch (e) {
  reportExecuteScriptError(e);
}
