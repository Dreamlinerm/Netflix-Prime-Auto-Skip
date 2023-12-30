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
/* global browser */
const defaultSettings = {
  settings: {
    Amazon: { skipIntro: true, skipCredits: true, watchCredits: false, skipAd: true, blockFreevee: true, speedSlider: true, filterPaid: false, showRating: true },
    Netflix: { skipIntro: true, skipRecap: true, skipCredits: true, watchCredits: false, skipBlocked: true, skipAd: true, speedSlider: true, profile: true, showRating: true },
    Disney: { skipIntro: true, skipCredits: true, watchCredits: false, speedSlider: true, showRating: true },
    Crunchyroll: { skipIntro: true, speedSlider: true, releaseCalendar: true },
    Video: { playOnFullScreen: true, epilepsy: false },
    Statistics: { AmazonAdTimeSkipped: 0, NetflixAdTimeSkipped: 0, IntroTimeSkipped: 0, RecapTimeSkipped: 0, SegmentsSkipped: 0 },
    General: { profileName: null, profilePicture: null, sliderSteps: 1, sliderMin: 5, sliderMax: 20, filterDub: true, filterQueued: true },
  },
};
let settings = defaultSettings.settings;
const version = "1.0.70";
browser.storage.sync.get("settings", function (result) {
  console.log("%cNetflix%c/%cPrime%c Auto-Skip", "color: #e60010;font-size: 2em;", "color: white;font-size: 2em;", "color: #00aeef;font-size: 2em;", "color: white;font-size: 2em;");
  console.log("version:", version);
  settings = { ...defaultSettings.settings, ...result.settings };
  CrunchyrollObserver.observe(document, config);
  if (settings?.Video?.playOnFullScreen) startPlayOnFullScreen();
});
browser.storage.sync.onChanged.addListener(function (changes) {
  if (changes?.settings) {
    const { oldValue, newValue } = changes.settings;
    settings = newValue;
    if (!oldValue || newValue.Video.playOnFullScreen !== oldValue?.Video?.playOnFullScreen) startPlayOnFullScreen();
  }
});
const config = { attributes: true, childList: true, subtree: true };
const CrunchyrollObserver = new MutationObserver(Crunchyroll);
function Crunchyroll() {
  let video = document.querySelector("video");
  const time = video?.currentTime;
  if (settings.Crunchyroll?.skipIntro) Crunchyroll_Intro(video, time);
  if (settings.Crunchyroll?.speedSlider) Crunchyroll_SpeedSlider(video);
}
const date = new Date();
function log(...args) {
  console.log(date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(), ...args);
}
async function addSkippedTime(startTime, endTime, key) {
  if (typeof startTime === "number" && typeof endTime === "number" && endTime > startTime) {
    log(key, endTime - startTime);
    settings.Statistics[key] += endTime - startTime;
    increaseBadge();
  }
}
function OnFullScreenChange() {
  let video = document.querySelector("video");
  if (window.fullScreen && video) {
    video.play();
    log("auto-played on fullscreen");
    increaseBadge();
  }
}
async function startPlayOnFullScreen() {
  if (settings.Video?.playOnFullScreen) {
    log("started observing| PlayOnFullScreen");
    addEventListener("fullscreenchange", OnFullScreenChange);
  } else {
    log("stopped observing| PlayOnFullScreen");
    removeEventListener("fullscreenchange", OnFullScreenChange);
  }
}
async function Crunchyroll_Intro(video, time) {
  if (!reverseButtonClicked) {
    const button = document.querySelector('[data-testid="skipIntroText"]');
    if (button) {
      button?.click();
      log("Intro skipped", button);
      setTimeout(function () {
        CrunchyrollGobackbutton(video, time, video?.currentTime);
        addSkippedTime(time, video?.currentTime, "IntroTimeSkipped");
      }, 600);
    }
  } else if (!document.querySelector(".reverse-button")) {
    addButton(video, reverseButtonStartTime, reverseButtonEndTime);
  }
}

let reverseButtonClicked = false;
let reverseButtonStartTime;
let reverseButtonEndTime;
function addButton(video, startTime, endTime) {
  if (reverseButtonClicked) return;
  const button = document.createElement("div");
  button.setAttribute("class", "reverse-button css-1dbjc4n r-1awozwy r-lj0ial r-1jd5jdk r-1loqt21 r-18u37iz r-eu3ka r-1777fci r-kuhrb7 r-ymttw5 r-u8s1d r-1ff5aok r-1otgn73");
  button.style = "color:white;";
  button.textContent = "Watch skipped ?";

  let buttonTimeout = setTimeout(() => {
    button.remove();
  }, 5000);
  button.onclick = function () {
    reverseButtonClicked = true;
    video.currentTime = startTime;
    button.remove();
    clearTimeout(buttonTimeout);
    const waitTime = endTime - startTime + 2;
    //log("waiting for:", waitTime);
    setTimeout(function () {
      reverseButtonClicked = false;
    }, waitTime * 1000);
  };
  let position = document.querySelector("#velocity-overlay-package");
  if (position) position.appendChild(button);
}

async function CrunchyrollGobackbutton(video, startTime, endTime) {
  reverseButtonStartTime = startTime;
  reverseButtonEndTime = endTime;
  addButton(video, startTime, endTime);
}

let videoSpeed;
async function setVideoSpeed(speed) {
  videoSpeed = speed;
}
async function Crunchyroll_SpeedSlider(video) {
  if (video) {
    let alreadySlider = document.querySelector("#videoSpeedSlider");
    if (!alreadySlider) {
      // infobar position for the slider to be added
      // console.log(document.querySelector("#settingsControl"));
      const position = document.querySelector("#settingsControl")?.parentElement;
      if (position) {
        videoSpeed = videoSpeed || video.playbackRate;

        let slider = document.createElement("input");
        slider.id = "videoSpeedSlider";
        slider.type = "range";
        slider.min = settings.General.sliderMin;
        slider.max = settings.General.sliderMax;
        slider.value = videoSpeed * 10;
        slider.step = settings.General.sliderSteps;
        slider.style = "display: none;width:200px;";

        let speed = document.createElement("p");
        speed.id = "videoSpeed";
        speed.textContent = videoSpeed ? videoSpeed + "x" : "1.0x";
        // makes the button clickable
        // speed.setAttribute("class", "control-icon-btn");
        speed.style = "color:white;margin: auto;padding: 0 5px;";
        position.insertBefore(speed, position.firstChild);
        position.insertBefore(slider, position.firstChild);

        if (videoSpeed) video.playbackRate = videoSpeed;
        speed.onclick = function (event) {
          event.stopPropagation();
          slider.style.display = slider.style.display === "block" ? "none" : "block";
        };
        slider.onclick = function (event) {
          event.stopPropagation();
        };
        slider.oninput = function (event) {
          event.stopPropagation();
          speed.textContent = (this.value / 10).toFixed(1) + "x";
          video.playbackRate = this.value / 10;
          setVideoSpeed(this.value / 10);
        };
      }
    }
  }
}
// Badge Functions
function increaseBadge() {
  settings.Statistics.SegmentsSkipped++;
  browser.storage.sync.set({ settings });
  browser.runtime.sendMessage({
    type: "increaseBadge",
  });
}
