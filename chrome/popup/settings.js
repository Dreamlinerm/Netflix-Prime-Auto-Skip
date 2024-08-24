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
const isPopup = document.title === "Popup";
/**
 * Localize by replacing __MSG_***__ meta tags
 * @returns {void}
 */
function localizeHtmlPage() {
  // https://stackoverflow.com/questions/25467009/internationalization-of-html-pages-for-my-google-chrome-extension
  // innerHTML triggers warnings so changed functions
  // i18n tag
  let translations = document.getElementsByTagName("i-18n");
  for (let trans of translations) {
    trans.textContent = chrome.i18n.getMessage.apply(null, trans.textContent.split(";"));
  }
  // i18n attribute
  translations = document.querySelectorAll("[data-i18n]");
  for (let trans of translations) {
    trans.textContent = chrome.i18n.getMessage.apply(null, trans.textContent.split(";"));
  }
}
localizeHtmlPage();
// firefox inline settings change minheight;
if (window.name == "addon-inline-options") {
  document.querySelector("body").style.minHeight = "700px";
}

let backButtonHistory = ["Popup"];
// remove everything before # in window.location
let url = window.location.href;
if (url.includes("#")) Menu(url.split("#")[1]);

// if on streaming page open settings for page
const query = { active: true, currentWindow: true };
function callback(tabs) {
  const currentUrl = tabs[0].url;
  const isPrimeVideo = /.amazon.|.primevideo./i.test(currentUrl);
  const isNetflix = /.netflix./i.test(currentUrl);
  const isDisney = /.disneyplus.|.starplus.|.hotstar./i.test(currentUrl);
  const isCrunchyroll = /.crunchyroll./i.test(currentUrl);
  // const isHBO = /max/i.test(currentUrl);
  if (isPrimeVideo) Menu("Amazon");
  else if (isNetflix) Menu("Netflix");
  else if (isDisney) Menu("Disney");
  else if (isCrunchyroll) Menu("Crunchyroll");
  // else if (isHBO) Menu("HBO");
}
chrome.tabs.query(query, callback);

// global variables in localStorage
const defaultSettings = {
  settings: {
    Amazon: {
      skipIntro: true,
      skipCredits: true,
      watchCredits: false,
      skipAd: true,
      blockFreevee: true,
      speedSlider: true,
      filterPaid: false,
      continuePosition: true,
      showRating: true,
      xray: true,
    },
    Netflix: {
      skipIntro: true,
      skipRecap: true,
      skipCredits: true,
      watchCredits: false,
      skipBlocked: true,
      skipAd: true,
      speedSlider: true,
      profile: true,
      showRating: true,
    },
    Disney: { skipIntro: true, skipCredits: true, watchCredits: false, speedSlider: true, showRating: true, selfAd: true },
    Crunchyroll: { skipIntro: true, speedSlider: true, releaseCalendar: true, dubLanguage: null, profile: true, bigPlayer: true },
    HBO: { skipIntro: true, skipCredits: true, watchCredits: false, speedSlider: true, showRating: true },
    Video: { playOnFullScreen: true, epilepsy: false, userAgent: true },
    Statistics: { AmazonAdTimeSkipped: 0, NetflixAdTimeSkipped: 0, IntroTimeSkipped: 0, RecapTimeSkipped: 0, SegmentsSkipped: 0 },
    General: {
      Crunchyroll_profilePicture: null,
      profileName: null,
      profilePicture: null,
      sliderSteps: 1,
      sliderMin: 5,
      sliderMax: 20,
      filterDub: true,
      filterQueued: true,
      savedCrunchyList: [],
    },
  },
};
const isMobile = /mobile|streamingEnhanced/i.test(navigator.userAgent);
console.log("isMobile", isMobile, navigator.userAgent);
let settings = { ...defaultSettings.settings };
chrome.storage.sync.get("settings", function (result) {
  // overwrite default settings with user settings
  // List of keys to merge individually
  settings.Amazon = { ...defaultSettings.settings.Amazon, ...result?.settings?.Amazon };
  settings.Netflix = { ...defaultSettings.settings.Netflix, ...result?.settings?.Netflix };
  settings.Disney = { ...defaultSettings.settings.Disney, ...result?.settings?.Disney };
  settings.Crunchyroll = { ...defaultSettings.settings.Crunchyroll, ...result?.settings?.Crunchyroll };
  settings.HBO = { ...defaultSettings.settings.HBO, ...result?.settings?.HBO };
  settings.Video = { ...defaultSettings.settings.Video, ...result?.settings?.Video };
  settings.Statistics = { ...defaultSettings.settings.Statistics, ...result?.settings?.Statistics };
  settings.General = { ...defaultSettings.settings.General, ...result?.settings?.General };

  // delete every setting that is not in defaultSettings
  let changedSettings;
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
});
chrome.storage.sync.onChanged.addListener(function (changes) {
  if (changes?.settings) {
    const { oldValue, newValue } = changes.settings;
    settings = newValue;
    console.log("settings", "Old value:", oldValue, ", new value:", newValue);
    setCheckboxesToSettings();
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
  if (settings?.HBO?.[category] !== undefined) bool &= settings?.HBO[category];
  return bool;
}
function setCategoryToBoolean(category, bool) {
  if (settings?.Amazon?.[category] !== undefined) settings.Amazon[category] = bool;
  if (settings?.Netflix?.[category] !== undefined) settings.Netflix[category] = bool;
  if (settings?.Disney?.[category] !== undefined) settings.Disney[category] = bool;
  if (settings?.Crunchyroll?.[category] !== undefined) settings.Crunchyroll[category] = bool;
  if (settings?.HBO?.[category] !== undefined) settings.HBO[category] = bool;
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
  setButtonChecked("VideoEpilepsy", settings?.Video.epilepsy);
  setButtonChecked("VideoUserAgent", settings?.Video.userAgent);
  button = document.querySelector(".categoryMobile");
  if (button) button.style.display = isMobile ? "block" : "none";
  //  -------------      Default        ---------------------------------------
  setButtonChecked("DefaultSkips", settings?.Amazon.filterPaid);
  // -------------      global buttons        ---------------------------------------
  setButtonChecked(
    "AmazonSkips",
    settings?.Amazon.skipAd && settings?.Amazon.filterPaid && settings?.Amazon.continuePosition && settings?.Amazon.xray
  );
  setButtonChecked("NetflixSkips", settings?.Netflix.skipRecap && settings?.Netflix.skipBlocked && settings?.Netflix.profile);
  setButtonChecked("DisneySkips", settings?.Disney.selfAd);
  setButtonChecked("CrunchyrollSkips", settings?.Crunchyroll.skipIntro && settings?.Crunchyroll.releaseCalendar && settings?.Crunchyroll.profile);
  setButtonChecked("HBOSkips", true);
  //  -------------      Individual Checkboxes        ---------------------------------------
  setCheckboxesOfService("Amazon");
  setCheckboxesOfService("Netflix");
  setCheckboxesOfService("Disney");
  setCheckboxesOfService("Statistics");
  setCheckboxesOfService("Crunchyroll");
  setCheckboxesOfService("HBO");
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
  if (button) button.textContent = (sliderValue / 10).toFixed(1) + "x";
  const optionalPermissions = ["tabs"];
  optionalPermissions.forEach((permission) => {
    showPermissionRequest(permission);
  });

  // import/export buttons
  button = document.querySelector("#save");
  if (button) {
    let file = new Blob([JSON.stringify(settings)], { type: "text/json" });
    button.href = URL.createObjectURL(file);
    button.download = "settings.json";
  }
}
async function showPermissionRequest(permission) {
  const PermissionButtons = document.querySelectorAll("#Permission" + permission + "Div");
  const permissionStatus = await chrome.permissions.contains({ permissions: [permission] });
  if (!permissionStatus) {
    PermissionButtons.forEach((button) => {
      console.log(permissionStatus, button.parentNode);
      button.style.display = "block";
    });
  }
}

function Menu(setting, isBackButton = false) {
  if (!isBackButton) backButtonHistory.push(setting);
  console.log(backButtonHistory);
  const Pages = isPopup
    ? ["Video", "Amazon", "Netflix", "Disney", "Crunchyroll", "Statistics", "Popup"]
    : ["Video", "Amazon", "Netflix", "Disney", "Crunchyroll", "Statistics", "Other", "Changelog", "Default"];
  const noButton = ["Default", "Popup"];
  for (const page of Pages) {
    document.getElementById(page + "Settings").style.display = "none";
    if (!noButton.includes(page)) document.getElementById("Menu" + page).style.setProperty("background-color", "");
  }
  document.getElementById(setting + "Settings").style.display = setting == "Popup" ? "flex" : "block";
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
    else if (e.target.id === "backButton") {
      if (backButtonHistory.length > 0) {
        backButtonHistory.pop();
        Menu(backButtonHistory[backButtonHistory.length - 1], true);
      } else Menu("Popup", true);
    } else if (e.target.id.startsWith("Permission")) {
      chrome.permissions.request({ permissions: [e.target.id.replace("Permission", "")] });
    }
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
      } else if (e.target.id === "VideoAds")
        settings.Amazon.blockFreevee = settings.Netflix.skipAd = !(settings?.Amazon.blockFreevee && settings?.Netflix.skipAd);
      else if (e.target.id === "VideoFullScreen") settings.Video.playOnFullScreen = !settings.Video.playOnFullScreen;
      else if (e.target.id === "VideoEpilepsy") settings.Video.epilepsy = !settings.Video.epilepsy;
      else if (e.target.id === "VideoUserAgent") settings.Video.userAgent = !settings.Video.userAgent;
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
      else if (e.target.id === "AmazonSkips")
        settings.Amazon.skipAd =
          settings.Amazon.filterPaid =
          settings.Amazon.continuePosition =
          settings.Amazon.xray =
            !(settings.Amazon.skipAd && settings.Amazon.filterPaid && settings.Amazon.continuePosition && settings?.Amazon.xray);
      else if (e.target.id === "NetflixSkips")
        settings.Netflix.skipRecap =
          settings.Netflix.skipBlocked =
          settings.Netflix.profile =
            !(settings?.Netflix.skipRecap && settings?.Netflix.skipBlocked && settings?.Netflix.profile);
      else if (e.target.id === "DisneySkips") settings.Disney.selfAd = !settings?.Disney.selfAd;
      else if (e.target.id === "CrunchyrollSkips")
        settings.Crunchyroll.skipIntro =
          settings.Crunchyroll.releaseCalendar =
          settings.Crunchyroll.profile =
            !(settings?.Crunchyroll.skipIntro && settings?.Crunchyroll.releaseCalendar && settings.Crunchyroll.profile);
      // else if (e.target.id === "HBOSkips")
      else {
        const services = ["Amazon", "Netflix", "Disney", "Crunchyroll", "HBO"];
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
