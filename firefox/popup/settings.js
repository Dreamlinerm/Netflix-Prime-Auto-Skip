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
  // let objects = document.getElementsByTagName("html");
  // for (obj of objects) {
  //   let valStrH = obj.innerHTML.toString();
  //   let valNewH = valStrH.replace(/__MSG_((?!\_).*)__/g, function (match, v1) {
  //     let messages = v1.split(";");
  //     return messages ? browser.i18n.getMessage.apply(null, messages) : "";
  //   });

  //   if (valNewH != valStrH) {
  //     obj.innerHTML = valNewH;
  //   }
  // }

  //innerHTML triggers warnings so changed functions

  // i18n tag
  let translations = document.getElementsByTagName("i18n");
  for (trans of translations) {
    let Translated = browser.i18n.getMessage.apply(null, trans.textContent.split(";"));
    trans.textContent = Translated;
  }
  // i18n attribute
  translations = document.querySelectorAll("[i18n]");
  for (trans of translations) {
    let Translated = browser.i18n.getMessage.apply(null, trans.textContent.split(";"));
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
    Amazon: { skipIntro: true, skipCredits: true, watchCredits: false, skipAd: true, blockFreevee: true, speedSlider: true, filterPaid: false, showRating: true, streamLinks: true },
    Netflix: { skipIntro: true, skipRecap: true, skipCredits: true, watchCredits: false, skipBlocked: true, NetflixAds: true, speedSlider: true, profile: true, showRating: true },
    Disney: { skipIntro: true, skipCredits: true, watchCredits: false, speedSlider: true, showRating: true },
    Video: { playOnFullScreen: true },
    Statistics: { AmazonAdTimeSkipped: 0, NetflixAdTimeSkipped: 0, IntroTimeSkipped: 0, RecapTimeSkipped: 0, SegmentsSkipped: 0 },
    General: { profileName: null, profilePicture: null, sliderSteps: 1, sliderMin: 5, sliderMax: 20 },
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
let sliderValue = settings.General.sliderMax;
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
      // intro
      settings?.Amazon.skipIntro &&
      settings?.Netflix.skipIntro &&
      settings?.Disney.skipIntro &&
      // Credits
      settings?.Amazon.skipCredits &&
      settings?.Netflix.skipCredits &&
      settings?.Disney.skipCredits &&
      // Ads
      settings?.Amazon.blockFreevee &&
      settings?.Netflix.NetflixAds &&
      // showRating
      settings?.Netflix.showRating &&
      settings?.Disney.showRating &&
      // SpeedSlider
      settings?.Amazon.speedSlider &&
      settings?.Netflix.speedSlider &&
      settings?.Disney.speedSlider &&
      // playOnFullScreen
      settings?.Video.playOnFullScreen;
  button = document.querySelector("#VideoIntro");
  if (button) button.checked = settings?.Amazon.skipIntro && settings?.Netflix.skipIntro && settings?.Disney.skipIntro;
  button = document.querySelector("#VideoCredits");
  if (button) button.checked = settings?.Amazon.skipCredits && settings?.Netflix.skipCredits && settings?.Disney.skipCredits;
  button = document.querySelectorAll("#VideoWatchCredits");
  for (const b of button) {
    b.checked = settings?.Amazon.watchCredits && settings?.Netflix.watchCredits && settings?.Disney.watchCredits;
  }
  button = document.querySelector("#VideoAds");
  if (button) button.checked = settings?.Amazon.blockFreevee && settings?.Netflix.NetflixAds;
  button = document.querySelector("#VideoShowRating");
  if (button) button.checked = settings?.Netflix.showRating && settings?.Disney.showRating;
  button = document.querySelector("#VideoSpeedSlider");
  if (button) button.checked = settings?.Amazon.speedSlider && settings?.Netflix.speedSlider && settings?.Disney.speedSlider;
  button = document.querySelector("#VideoFullScreen");
  if (button) button.checked = settings?.Video.playOnFullScreen;

  //  -------------      Default        ---------------------------------------
  button = document.querySelector("#DefaultSkips");
  if (button) button.checked = settings?.Amazon.filterPaid;

  //  -------------      Amazon        ---------------------------------------
  button = document.querySelector("#AmazonSkips");
  if (button) button.checked = settings?.Amazon.skipAd && settings?.Amazon.filterPaid && settings?.Amazon.streamLinks;
  button = document.querySelector("#AmazonIntro");
  if (button) button.checked = settings?.Amazon.skipIntro;
  button = document.querySelector("#AmazonCredits");
  if (button) button.checked = settings?.Amazon.skipCredits;
  button = document.querySelector("#AmazonWatchCredits");
  if (button) button.checked = settings?.Amazon.watchCredits;
  button = document.querySelector("#AmazonAds");
  if (button) button.checked = settings?.Amazon.skipAd;
  button = document.querySelector("#AmazonFreevee");
  if (button) button.checked = settings?.Amazon.blockFreevee;
  button = document.querySelector("#AmazonSpeedSlider");
  if (button) button.checked = settings?.Amazon.speedSlider;
  button = document.querySelectorAll("#AmazonfilterPaid");
  for (const b of button) {
    b.checked = settings?.Amazon.filterPaid;
  }
  button = document.querySelector("#AmazonStreamLinks");
  if (button) button.checked = settings?.Amazon.streamLinks;

  //  -------------      Netflix        ---------------------------------------
  button = document.querySelector("#NetflixSkips");
  if (button) button.checked = settings?.Netflix.skipRecap && settings?.Netflix.skipBlocked && settings?.Netflix.profile;
  button = document.querySelector("#NetflixIntro");
  if (button) button.checked = settings?.Netflix.skipIntro;
  button = document.querySelector("#NetflixRecap");
  if (button) button.checked = settings?.Netflix.skipRecap;
  button = document.querySelector("#NetflixCredits");
  if (button) button.checked = settings?.Netflix.skipCredits;
  button = document.querySelector("#NetflixWatchCredits");
  if (button) button.checked = settings?.Netflix.watchCredits;
  button = document.querySelector("#NetflixBlocked");
  if (button) button.checked = settings?.Netflix.skipBlocked;
  button = document.querySelector("#NetflixAds");
  if (button) button.checked = settings?.Netflix.NetflixAds;
  button = document.querySelector("#NetflixSpeedSlider");
  if (button) button.checked = settings?.Netflix.speedSlider;
  button = document.querySelector("#NetflixProfile");
  if (button) button.checked = settings?.Netflix.profile;
  button = document.querySelector("#NetflixShowRating");
  if (button) button.checked = settings?.Netflix.showRating;

  button = document.querySelector("#profileName");
  if (button) button.textContent = settings?.General.profileName;
  button = document.querySelector("#profilePicture");
  if (button && settings.General.profilePicture) {
    button.setAttribute("src", settings?.General.profilePicture);
    button.style.display = "block";
  }

  //  -------------      Disney        ---------------------------------------
  button = document.querySelector("#DisneySkips");
  if (button) button.checked = settings?.Disney.skipIntro;
  button = document.querySelector("#DisneyIntro");
  if (button) button.checked = settings?.Disney.skipIntro;
  button = document.querySelector("#DisneyCredits");
  if (button) button.checked = settings?.Disney.skipCredits;
  button = document.querySelector("#DisneyWatchCredits");
  if (button) button.checked = settings?.Disney.watchCredits;
  button = document.querySelector("#DisneySpeedSlider");
  if (button) button.checked = settings?.Disney.speedSlider;
  button = document.querySelector("#DisneyShowRating");
  if (button) button.checked = settings?.Disney.showRating;

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
  const Pages = ["Video", "Amazon", "Netflix", "Disney", "Statistics", "Other", "Changelog", "Default"];
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
  browser.storage.sync.set({ settings });
}
// for all services get the shared boolean of the category
function getBooleanOfCategory(category) {
  return settings?.Amazon[category] && settings?.Netflix[category] && settings?.Disney[category];
}

function listenForClicks() {
  let listener = document.addEventListener("click", (e) => {
    if (e.target.classList.contains("reset")) {
      if (confirm("Are you sure to reset every Setting including Statistics?")) {
        console.log("settings resetted to default");
        browser.storage.sync.set(defaultSettings);
      }
    }
    //  -------------      Menu        ---------------------------------------
    else if (e.target.id.startsWith("Menu")) Menu(e.target.id.replace("Menu", ""));
    //  -------------      openSettings        ---------------------------------------
    else if (e.target.id.startsWith("open")) openIndividualSettings(e.target.id.replace("open", "").replace("Settings", ""));
    //  -------------      Video        ---------------------------------------
    else if (e.target.id === "VideoSkips") {
      const VideoSkips = !(
        getBooleanOfCategory("skipIntro") &&
        getBooleanOfCategory("skipCredits") &&
        // Ads
        settings?.Amazon.blockFreevee &&
        settings?.Netflix.NetflixAds &&
        getBooleanOfCategory("showRating") &&
        getBooleanOfCategory("speedSlider") &&
        // playOnFullScreen
        settings?.Video.playOnFullScreen
      );
      settings.Amazon.skipIntro =
        settings.Netflix.skipIntro =
        settings.Disney.skipIntro =
        // Credits
        settings.Amazon.skipCredits =
        settings.Netflix.skipCredits =
        settings.Disney.skipCredits =
        // Ads
        settings.Amazon.blockFreevee =
        settings.Netflix.NetflixAds =
        // showRating
        settings.Amazon.showRating =
        settings.Netflix.showRating =
        settings.Disney.showRating =
        // SpeedSlider
        settings.Amazon.speedSlider =
        settings.Netflix.speedSlider =
        settings.Disney.speedSlider =
        // playOnFullScreen
        settings.Video.playOnFullScreen =
          VideoSkips;
      if (VideoSkips) settings.Amazon.watchCredits = settings.Netflix.watchCredits = settings.Disney.watchCredits = false;
      setSettings("All VideoSkips");
    } else if (e.target.id === "VideoIntro") {
      settings.Amazon.skipIntro = settings.Netflix.skipIntro = settings.Disney.skipIntro = !getBooleanOfCategory("skipIntro");
      setSettings("VideoIntro");
    } else if (e.target.id === "VideoCredits") {
      const skipCredits = getBooleanOfCategory("skipCredits");
      settings.Amazon.skipCredits = settings.Netflix.skipCredits = settings.Disney.skipCredits = !skipCredits;
      if (!skipCredits) {
        settings.Amazon.watchCredits = settings.Netflix.watchCredits = settings.Disney.watchCredits = false;
      }
      setSettings("VideoCredits");
    } else if (e.target.id === "VideoWatchCredits") {
      const watchCredits = getBooleanOfCategory("watchCredits");
      settings.Amazon.watchCredits = settings.Netflix.watchCredits = settings.Disney.watchCredits = !watchCredits;
      if (!watchCredits) {
        settings.Amazon.skipCredits = settings.Netflix.skipCredits = settings.Disney.skipCredits = false;
      }
      setSettings("VideoWatchCredits");
    } else if (e.target.id === "VideoAds") {
      const skipAd = settings?.Amazon.blockFreevee && settings?.Netflix.NetflixAds;
      settings.Amazon.blockFreevee = settings.Netflix.NetflixAds = !skipAd;
      setSettings("VideoAd");
    } else if (e.target.id === "VideoShowRating") {
      settings.Amazon.showRating = settings.Netflix.showRating = settings.Disney.showRating = !getBooleanOfCategory("showRating");
      setSettings("VideoSpeedSlider");
    } else if (e.target.id === "VideoSpeedSlider") {
      settings.Amazon.speedSlider = settings.Netflix.speedSlider = settings.Disney.speedSlider = !getBooleanOfCategory("speedSlider");
      setSettings("VideoSpeedSlider");
    } else if (e.target.id === "VideoFullScreen") {
      settings.Video.playOnFullScreen = !settings.Video.playOnFullScreen;
      setSettings("playOnFullScreen");
    }

    // -------------      Default        ---------------------------------------
    else if (e.target.id === "DefaultSkips") {
      const DefaultSkips = !settings?.Amazon.filterPaid;
      settings.Amazon.filterPaid = DefaultSkips;
      setSettings("All DefaultSkips");
    }
    //  -------------      Amazon        ---------------------------------------
    else if (e.target.id === "AmazonSkips") {
      const AmazonSkips = !(settings.Amazon.skipAd && settings.Amazon.filterPaid && settings.Amazon.streamLinks);
      settings.Amazon.skipAd = settings.Amazon.filterPaid = settings.Amazon.streamLinks = AmazonSkips;
      setSettings("All AmazonSkips");
    } else if (e.target.id === "AmazonCredits") {
      settings.Amazon.skipCredits = !settings.Amazon.skipCredits;
      if (settings.Amazon.skipCredits) {
        settings.Amazon.watchCredits = false;
      }
      setSettings("AmazonCredits");
    } else if (e.target.id === "AmazonWatchCredits") {
      settings.Amazon.watchCredits = !settings.Amazon.watchCredits;
      if (settings.Amazon.watchCredits) {
        settings.Amazon.skipCredits = false;
      }
      setSettings("AmazonWatchCredits");
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
    } else if (e.target.id === "AmazonStreamLinks") {
      settings.Amazon.streamLinks = !settings.Amazon.streamLinks;
      setSettings("streamLinks");
    }
    //  -------------      Netflix        ---------------------------------------
    else if (e.target.id === "NetflixSkips") {
      const NetflixSkips = !(settings?.Netflix.skipRecap && settings?.Netflix.skipBlocked && settings?.Netflix.profile);
      settings.Netflix.skipRecap = settings.Netflix.skipBlocked = settings.Netflix.profile = NetflixSkips;
      setSettings("All NetflixSkips");
    } else if (e.target.id === "NetflixIntro") {
      settings.Netflix.skipIntro = !settings.Netflix.skipIntro;
      setSettings("NetflixIntro");
    } else if (e.target.id === "NetflixRecap") {
      settings.Netflix.skipRecap = !settings.Netflix.skipRecap;
      setSettings("NetflixRecap");
    } else if (e.target.id === "NetflixCredits") {
      settings.Netflix.skipCredits = !settings.Netflix.skipCredits;
      if (settings.Netflix.skipCredits) {
        settings.Netflix.watchCredits = false;
      }
      setSettings("NetflixCredits");
    } else if (e.target.id === "NetflixWatchCredits") {
      settings.Netflix.watchCredits = !settings.Netflix.watchCredits;
      if (settings.Netflix.watchCredits) {
        settings.Netflix.skipCredits = false;
      }
      setSettings("NetflixWatchCredits");
    } else if (e.target.id === "NetflixBlocked") {
      settings.Netflix.skipBlocked = !settings.Netflix.skipBlocked;
      setSettings("NetflixBlocked");
    } else if (e.target.id === "NetflixAds") {
      settings.Netflix.NetflixAds = !settings.Netflix.NetflixAds;
      setSettings("NetflixAds");
    } else if (e.target.id === "NetflixSpeedSlider") {
      settings.Netflix.speedSlider = !settings.Netflix.speedSlider;
      setSettings("NetflixSpeedSlider");
    } else if (e.target.id === "NetflixProfile") {
      settings.Netflix.profile = !settings.Netflix.profile;
      setSettings("profile");
    } else if (e.target.id === "NetflixShowRating") {
      settings.Netflix.showRating = !settings.Netflix.showRating;
      setSettings("showRating");
    }
    //  -------------      Disney        ---------------------------------------
    else if (e.target.id === "DisneySkips") {
      // const DisneySkips = !settings?.Disney.skipIntro;
      // settings.Disney.skipIntro = DisneySkips;
      // setSettings("All DisneySkips");
    } else if (e.target.id === "DisneyIntro") {
      settings.Disney.skipIntro = !settings.Disney.skipIntro;
      setSettings("DisneyIntro");
    } else if (e.target.id === "DisneyCredits") {
      settings.Disney.skipCredits = !settings.Disney.skipCredits;
      if (settings.Disney.skipCredits) {
        settings.Disney.watchCredits = false;
      }
      setSettings("DisneyCredits");
    } else if (e.target.id === "DisneyWatchCredits") {
      settings.Disney.watchCredits = !settings.Disney.watchCredits;
      if (settings.Disney.watchCredits) {
        settings.Disney.skipCredits = false;
      }
      setSettings("DisneyWatchCredits");
    } else if (e.target.id === "DisneySpeedSlider") {
      settings.Disney.speedSlider = !settings.Disney.speedSlider;
      setSettings("DisneySpeedSlider");
    } else if (e.target.id === "DisneyShowRating") {
      settings.Disney.showRating = !settings.Disney.showRating;
      setSettings("DisneyShowRating");
    }
    //  -------------      Statistics        ---------------------------------------
    if (e.target.id === "upload") {
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

function listenForInput() {
  document.addEventListener("input", (e) => {
    if (e.target.id === "SliderSteps") {
      settings.General.sliderSteps = Number(e.target.value);
      setCheckboxesToSettings();
      setSettings("SliderSteps");
    } else if (e.target.id === "SliderMin") {
      settings.General.sliderMin = Number(e.target.value);
      sliderValue = settings.General.sliderMin;
      setCheckboxesToSettings();
      setSettings("SliderMin");
    } else if (e.target.id === "SliderMax") {
      settings.General.sliderMax = Number(e.target.value);
      sliderValue = settings.General.sliderMax;
      setCheckboxesToSettings();
      setSettings("SliderMax");
    } else if (e.target.id === "SliderPreview") {
      sliderValue = Number(e.target.value);
      setCheckboxesToSettings();
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
