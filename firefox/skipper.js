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
// matches all amazon urls under https://en.wikipedia.org/wiki/Amazon_(company)#Website
let hostname = window.location.hostname;
let title = document.title;
let url = window.location.href;
let isAmazon = /amazon|primevideo/i.test(hostname);
let isVideo = /video/i.test(title) || /video/i.test(url);
let isNetflix = /netflix/i.test(hostname);
const version = "1.0.38";

if (isVideo || isNetflix) {
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
  let lastAdTimeText = "";
  resetBadge();
  browser.storage.sync.get("settings", function (result) {
    settings = result.settings;
    console.log("%cNetflix%c/%cPrime%c Auto-Skip", "color: #e60010;font-size: 2em;", "color: white;font-size: 2em;", "color: #00aeef;font-size: 2em;", "color: white;font-size: 2em;");
    console.log("version:", version);
    console.log("Settings", settings);
    if (isNetflix) console.log("Page %cNetflix", "color: #e60010;");
    else console.log("Page %cAmazon", "color: #00aeef;");
    if (typeof settings !== "object") {
      browser.storage.sync.set(defaultSettings);
    } else {
      if (isNetflix) {
        // start Observers depending on the settings
        if (settings.Netflix?.profile) startNetflixProfileObserver();
        if (settings.Netflix?.skipIntro) startNetflixSkipIntroObserver();
        if (settings.Netflix?.skipRecap) startNetflixSkipRecapObserver();
        if (settings.Netflix?.skipCredits) startNetflixSkipCreditsObserver();
        if (settings.Netflix?.skipBlocked) startNetflixSkipBlockedObserver();
        if (settings.Netflix?.NetflixAds) startNetflixAdTimeout();
      } else {
        if (settings.Amazon?.skipIntro) startAmazonSkipIntroObserver();
        if (settings.Amazon?.skipCredits) startAmazonSkipCreditsObserver();
        if (settings.Amazon?.skipAd) startAmazonSkipAdObserver();
        if (settings.Amazon?.blockFreevee) {
          // timeout of 100 ms because the ad is not loaded fast enough and the video will crash
          setTimeout(function () {
            startAmazonBlockFreeveeObserver();
          }, 200);
        }
        if (settings.Amazon?.speedSlider) startAmazonSpeedSliderObserver();
        if (settings.Amazon?.filterPaid) startAmazonFilterPaidObserver();
      }
      if (settings.Video.playOnFullScreen) startPlayOnFullScreen(isNetflix);
      // if there is an undefined setting, set it to the default
      let changedSettings = false;
      for (const key in defaultSettings.settings) {
        if (typeof settings[key] === "undefined") {
          log("undefined Setting:", key);
          changedSettings = true;
          settings[key] = defaultSettings.settings[key];
        } else {
          for (const subkey in defaultSettings.settings[key]) {
            if (typeof settings[key][subkey] === "undefined") {
              log("undefined Setting:", key, subkey);
              changedSettings = true;
              settings[key][subkey] = defaultSettings.settings[key][subkey];
            }
          }
        }
      }
      if (changedSettings) {
        browser.storage.sync.set({ settings });
      }
    }
  });

  browser.storage.sync.onChanged.addListener(function (changes, namespace) {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (key == "settings") {
        settings = newValue;
        log(key, "Old value:", oldValue, ", new value:", newValue);
        if (isNetflix) {
          // if value is changed then check if it is enabled or disabled
          if (oldValue === undefined || newValue.Netflix.profile !== oldValue.Netflix?.profile) startNetflixProfileObserver();
          if (oldValue === undefined || newValue.Netflix.skipIntro !== oldValue.Netflix?.skipIntro) startNetflixSkipIntroObserver();
          if (oldValue === undefined || newValue.Netflix.skipRecap !== oldValue.Netflix?.skipRecap) startNetflixSkipRecapObserver();
          if (oldValue === undefined || newValue.Netflix.skipCredits !== oldValue.Netflix?.skipCredits) startNetflixSkipCreditsObserver();
          if (oldValue === undefined || newValue.Netflix.skipBlocked !== oldValue.Netflix?.skipBlocked) startNetflixSkipBlockedObserver();
          if (oldValue === undefined || newValue.Netflix.NetflixAds !== oldValue.Netflix?.NetflixAds) startNetflixAdTimeout();
        } else {
          if (oldValue === undefined || newValue.Amazon.skipIntro !== oldValue.Amazon?.skipIntro) startAmazonSkipIntroObserver();
          if (oldValue === undefined || newValue.Amazon.skipCredits !== oldValue.Amazon?.skipCredits) startAmazonSkipCreditsObserver();
          if (oldValue === undefined || newValue.Amazon.skipAd !== oldValue.Amazon?.skipAd) startAmazonSkipAdObserver();
          if (oldValue === undefined || newValue.Amazon.blockFreevee !== oldValue.Amazon?.blockFreevee) startAmazonBlockFreeveeObserver();
          if (oldValue === undefined || newValue.Amazon.speedSlider !== oldValue.Amazon?.speedSlider) startAmazonSpeedSliderObserver();
          if (oldValue === undefined || newValue.Amazon.filterPaid !== oldValue.Amazon?.filterPaid) startAmazonFilterPaidObserver();
        }
        if (oldValue === undefined || newValue.Video.playOnFullScreen !== oldValue.Video?.playOnFullScreen) startPlayOnFullScreen(isNetflix);
        if (oldValue === undefined || settings.Statistics.SegmentsSkipped === 0) {
          resetBadge();
        }
      }
    }
  });
  function addIntroTimeSkipped(startTime, endTime) {
    if (typeof startTime === "number" && typeof endTime === "number" && endTime > startTime) {
      log("Intro Time skipped", endTime - startTime);
      settings.Statistics.IntroTimeSkipped += endTime - startTime;
      increaseBadge();
    }
  }
  function addRecapTimeSkipped(startTime, endTime) {
    if (typeof startTime === "number" && typeof endTime === "number" && endTime > startTime) {
      log("Recap Time skipped", endTime - startTime);
      settings.Statistics.RecapTimeSkipped += endTime - startTime;
      increaseBadge();
    }
  }
  function log(a1, a2 = " ", a3 = " ", a4 = " ", a5 = " ") {
    const date = new Date();
    console.log(date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(), a1, a2, a3, a4, a5);
  }

  // Observers
  // default Options for the observer (which mutations to observe)
  const config = { attributes: true, childList: true, subtree: true };
  // Netflix Observers
  const NetflixConfig = { attributes: true, attributeFilter: ["data-uia"], subtree: true, childList: true, attributeOldValue: false };

  const NetflixProfileObserver = new MutationObserver(Netflix_profile);
  function Netflix_profile(mutations, observer) {
    // AutoPickProfile();
    let currentProfile = document.querySelector("[href*='/YourAccount']");
    if (currentProfile) {
      // there is a space before the - thats why slice -1
      const currentProfileName = currentProfile?.getAttribute("aria-label")?.split("–")?.[0].slice(0, -1);
      if (currentProfileName && currentProfileName !== settings.General.profileName) {
        // small profile picture
        settings.General.profilePicture = currentProfile?.firstChild?.firstChild?.src;

        settings.General.profileName = currentProfileName;
        browser.storage.sync.set({ settings });
        log("Profile switched to", currentProfileName);
      }
    }
  }
  function AutoPickProfile() {
    if (!window.location.pathname.includes("Profile") && !window.location.pathname.includes("profile")) {
      let profileButtons = document.querySelectorAll(".profile-name");
      profileButtons.forEach((button) => {
        if (button.textContent === settings.General.profileName) {
          // big profile picture
          // slice(4, -1) to remove the url(" ") from the string
          settings.General.profilePicture = button?.parentElement?.firstChild?.firstChild?.style?.backgroundImage?.slice(5, -2);
          button?.parentElement.click();
          log("Profile automatically chosen:", settings.General.profileName);
          increaseBadge();
        }
      });
    }
  }

  const NetflixSkipIntroObserver = new MutationObserver(Netflix_intro);
  function Netflix_intro(mutations, observer) {
    let button = document.querySelector('[data-uia="player-skip-intro"]');
    if (button) {
      let video = document.querySelector("video");
      const time = video.currentTime;
      button.click();
      log("intro skipped", button);
      setTimeout(function () {
        addIntroTimeSkipped(time, video.currentTime);
      }, 600);
    }
  }

  const NetflixSkipRecapObserver = new MutationObserver(Netflix_Recap);
  function Netflix_Recap(mutations, observer) {
    let button = document.querySelector('[data-uia="player-skip-recap"]') || document.querySelector('[data-uia="player-skip-preplay"]');
    if (button) {
      let video = document.querySelector("video");
      const time = video.currentTime;
      button.click();
      log("Recap skipped", button);
      setTimeout(function () {
        addRecapTimeSkipped(time, video.currentTime);
      }, 600);
    }
  }

  const NetflixSkipCreditsObserver = new MutationObserver(Netflix_Credits);
  function Netflix_Credits(mutations, observer) {
    let button = document.querySelector('[data-uia="next-episode-seamless-button"]');
    if (button) {
      button.click();
      log("Credits skipped", button);
      increaseBadge();
    }
  }

  const NetflixSkipBlockedObserver = new MutationObserver(Netflix_Blocked);
  function Netflix_Blocked(mutations, observer) {
    let button = document.querySelector('[data-uia="interrupt-autoplay-continue"]');
    if (button) {
      button.click();
      log("Blocked skipped", button);
      increaseBadge();
    }
  }

  function Netflix_SkipAdInterval() {
    let AdInterval = setInterval(() => {
      if (!settings.Netflix?.NetflixAds) {
        log("stopped observing| Ad");
        clearInterval(AdInterval);
        return;
      }
      const video = document.querySelector("video");
      const adLength = Number(document.querySelector(".ltr-puk2kp")?.textContent);
      if (video) {
        if (adLength && video.playbackRate != 16) {
          log("Ad skipped, length:", adLength, "s");
          settings.Statistics.NetflixAdTimeSkipped += adLength;
          increaseBadge();
          video.playbackRate = 16;
        } else if (adLength && video.paused) {
          video.play();
        } else if (video.playbackRate == 16 && !adLength) {
          video.playbackRate = 1;
        }
      }
    }, 100);
  }

  // Amazon Observers
  const AmazonVideoClass = "#dv-web-player > div > div:nth-child(1) > div > div > div.scalingVideoContainer > div.scalingVideoContainerBottom > div > video";

  const AmazonSpeedSliderConfig = { attributes: true, attributeFilter: ["video"], subtree: true, childList: true, attributeOldValue: false };
  const AmazonSpeedSliderObserver = new MutationObserver(Amazon_SpeedSlider);
  function Amazon_SpeedSlider(mutations, observer) {
    let video = document.querySelector(AmazonVideoClass);
    let alreadySlider = document.querySelector("#videoSpeedSlider");

    // remove bad background hue which is annoying
    //document.querySelector(".fkpovp9.f8hspre").style.background = "rgba(0, 0, 0, 0.25)";
    let b = document.querySelector(".fkpovp9.f8hspre");
    if (b && b.style.background != "rgba(0, 0, 0, 0.25)") {
      b.style.background = "rgba(0, 0, 0, 0.25)";
    }

    if (video) {
      if (!alreadySlider) {
        // infobar position for the slider to be added
        let position = document.querySelector("[class*=infobar-container]")?.firstChild?.children[2];
        if (position) {
          let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("style", "width:1.2vw;height:1.2vw");
          svg.setAttribute("viewBox", "0 0 24 24");
          svg.setAttribute("id", "speedbutton");
          let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute(
            "d",
            "M17.6427 7.43779C14.5215 4.1874 9.47851 4.1874 6.35734 7.43779C3.21422 10.711 3.21422 16.0341 6.35734 19.3074L4.91474 20.6926C1.02842 16.6454 1.02842 10.0997 4.91474 6.05254C8.823 1.98249 15.177 1.98249 19.0853 6.05254C22.9716 10.0997 22.9716 16.6454 19.0853 20.6926L17.6427 19.3074C20.7858 16.0341 20.7858 10.711 17.6427 7.43779ZM14 14C14 15.1046 13.1046 16 12 16C10.8954 16 10 15.1046 10 14C10 12.8954 10.8954 12 12 12C12.1792 12 12.3528 12.0236 12.518 12.0677L15.7929 8.79289L17.2071 10.2071L13.9323 13.482C13.9764 13.6472 14 13.8208 14 14Z"
          );
          path.setAttribute("fill", "rgb(221, 221, 221)");
          svg.setAttribute("fill", "rgb(221, 221, 221)");
          svg.appendChild(path);
          position.insertBefore(svg, position.firstChild);

          let slider = document.createElement("input");
          slider.id = "videoSpeedSlider";
          slider.type = "range";
          slider.min = "5";
          slider.max = "15";
          slider.value = "10";
          slider.step = "1";
          // slider.setAttribute("list", "markers");
          slider.style = "height: 0.1875vw;background: rgb(221, 221, 221);display: none;";
          position.insertBefore(slider, position.firstChild);

          svg.onclick = function () {
            if (slider.style.display === "block") slider.style.display = "none";
            else slider.style.display = "block";
          };

          let speed = document.createElement("p");
          speed.id = "videoSpeed";
          speed.textContent = "1.0x";
          position.insertBefore(speed, position.firstChild);
          speed.onclick = function () {
            if (slider.style.display === "block") slider.style.display = "none";
            else slider.style.display = "block";
          };
          slider.oninput = function () {
            speed.textContent = this.value / 10 + "x";
            video.playbackRate = this.value / 10;
          };
        }
      } else {
        // need to resync the slider with the video sometimes
        speed = document.querySelector("#videoSpeed");
        if (video.playbackRate != alreadySlider.value / 10) {
          video.playbackRate = alreadySlider.value / 10;
        }
        alreadySlider.oninput = function () {
          speed.textContent = this.value / 10 + "x";
          video.playbackRate = this.value / 10;
        };
      }
    }
  }
  const AmazonFilterPaidConfig = { attributes: true, attributeFilter: [".o86fri"], subtree: true, childList: true, attributeOldValue: false };
  const AmazonFilterPaidObserver = new MutationObserver(Amazon_FilterPaid);
  async function deletePaidCategory(a) {
    // don't iterate too long too much performance impact
    let maxSectionDepth = 10;
    let SectionCount = 0;
    while (a?.parentElement && SectionCount < 2 && maxSectionDepth > 0) {
      a = a.parentElement;
      maxSectionDepth--;
      if (a.tagName == "SECTION") {
        SectionCount++;
      }
    }
    // fixes if no 2. section is found it will remove the hole page
    if (a.tagName == "SECTION") {
      log("Filtered paid Element", a.parentElement);
      a.remove();
      increaseBadge();
    }
  }
  function Amazon_FilterPaid(mutations, observer) {
    // if not on the shop page or homepremiere
    if (!window.location.href.includes("contentId=store") && !window.location.href.includes("contentId=homepremiere")) {
      // yellow headline is not everywhere the same
      document.querySelectorAll(".o86fri").forEach((a) => {
        deletePaidCategory(a);
      });
      // Mehr > is .GnSDwP //if (getComputedStyle(a).color == "rgb(255, 204, 0)")
      document.querySelectorAll(".c3svnh a.Xa7aAK, .c3svnh a.Xa7aAK:link, .c3svnh a.Xa7aAK:visited").forEach((a) => {
        deletePaidCategory(a);
      });
    }
  }

  const AmazonSkipIntroConfig = { attributes: true, attributeFilter: [".skipelement"], subtree: true, childList: true, attributeOldValue: false };
  // const AmazonSkipIntro = new RegExp("skipelement", "i");
  const AmazonSkipIntroObserver = new MutationObserver(Amazon_Intro);
  function Amazon_Intro(mutations, observer) {
    let button = document.querySelector("[class*=skipelement]");
    if (button) {
      let video = document.querySelector(AmazonVideoClass);
      const time = video.currentTime;
      button.click();
      log("Intro skipped", button);
      //delay where the video is loaded
      setTimeout(function () {
        AmazonGobackbutton(video, time, video.currentTime);
        addIntroTimeSkipped(time, video.currentTime);
      }, 50);
    }
  }
  reverseButton = false;
  function AmazonGobackbutton(video, startTime, endTime) {
    if (!reverseButton) {
      reverseButton = true;
      // go back button
      const button = document.createElement("button");
      button.style = "padding: 0px 22px; line-height: normal; min-width: 0px";
      button.setAttribute("class", "fqye4e3 f1ly7q5u fk9c3ap fz9ydgy f1xrlb00 f1hy0e6n fgbpje3 f1uteees f1h2a8xb  f1cg7427 fiqc9rt fg426ew f1ekwadg");
      button.setAttribute("data-uia", "reverse-button");
      button.textContent = "Watch skipped ?";
      document.querySelector(".f18oq18q.f6suwnu.fhxjtbc.f1ngx5al").appendChild(button);
      buttonInHTML = document.querySelector('[data-uia="reverse-button"]');
      function goBack() {
        video.currentTime = startTime;
        buttonInHTML.remove();
        log("stopped observing| Intro");
        AmazonSkipIntroObserver.disconnect();
        waitTime = endTime - startTime + 2;
        //log("waiting for:", waitTime);
        setTimeout(function () {
          log("restarted observing| Intro");
          AmazonSkipIntroObserver.observe(document, AmazonSkipIntroConfig);
        }, waitTime * 1000);
      }
      buttonInHTML.addEventListener("click", goBack);
      setTimeout(() => {
        buttonInHTML.remove();
        reverseButton = false;
      }, 5000);
    }
  }

  const AmazonSkipCreditsConfig = { attributes: true, attributeFilter: [".nextupcard"], subtree: true, childList: true, attributeOldValue: false };
  const AmazonSkipCredits = new RegExp("nextupcard", "i");
  const AmazonSkipCredits2 = new RegExp("nextupcard-button", "i");
  const AmazonSkipCreditsObserver = new MutationObserver(Amazon_Credits);
  function Amazon_Credits(mutations, observer) {
    for (let mutation of mutations) {
      if (AmazonSkipCredits.test(mutation.target.classList.toString())) {
        for (let button of mutation?.target?.firstChild?.childNodes) {
          if (button && AmazonSkipCredits2.test(button.classList.toString())) {
            // only skipping to next episode not an entirely new series
            let newEpNumber = document.querySelector("[class*=nextupcard-episode]");
            if (newEpNumber && !newEpNumber.textContent.match(/(?<!\S)1(?!\S)/)) {
              button.click();
              increaseBadge();
              log("skipped Credits", button);
            }
            return;
          }
        }
      }
    }
  }

  function skipAd(video) {
    let adTimeText = document.querySelector(".atvwebplayersdk-adtimeindicator-text");
    if (adTimeText) {
      const adTime = parseInt(adTimeText.textContent.match(/\d+/)[0]);
      // adTimeText.textContent.length > 7 so it doesn't try to skip when the self ad is playing
      // !document.querySelector(".fu4rd6c.f1cw2swo") so it doesn't try to skip when the self ad is playing
      if (!document.querySelector(".fu4rd6c.f1cw2swo") && lastAdTimeText != adTime) {
        resetLastATimeText();
        if (typeof adTime === "number" && adTime > 1) {
          // getting stuck loading when skipping ad longer than 100 seconds i think
          let skipTime = adTime < 20 ? adTime - 1 : 20;
          video.currentTime += skipTime;
          log("FreeVee Ad skipped, length:", skipTime, "s");
          settings.Statistics.AmazonAdTimeSkipped += skipTime + 1;
          increaseBadge();
          // video.removeEventListener("playing", skipAd);
        }
      }
    }
  }

  async function Amazon_FreeveeTimeout() {
    // set loop every 1 sec and check if ad is there
    let AdInterval = setInterval(function () {
      if (!settings.Amazon.blockFreevee) {
        log("stopped observing| FreeVee Ad");
        clearInterval(AdInterval);
        return;
      }
      let video = document.querySelector(AmazonVideoClass);
      if (video && !video.paused && video.currentTime > 0) {
        // && !video.paused
        skipAd(video);
      }
    }, 100);
  }

  async function resetLastATimeText(time = 1000) {
    // timeout of 1 second to make sure the button is not pressed too fast, it will crash or slow the website otherwise
    setTimeout(() => {
      lastAdTimeText = "";
    }, time);
  }

  async function Amazon_AdTimeout() {
    // set loop every 1 sec and check if ad is there
    let AdInterval = setInterval(function () {
      if (!settings.Amazon.skipAd) {
        log("stopped observing| Self Ad");
        clearInterval(AdInterval);
        return;
      }
      let video = document.querySelector(AmazonVideoClass);
      if (video) {
        video.onplay = function () {
          //log("started playing video");
          // if video is playing
          if (getComputedStyle(document.querySelector("#dv-web-player")).display != "none") {
            let button = document.querySelector(".fu4rd6c.f1cw2swo");
            if (button) {
              // only getting the time after :08
              let adTime = parseInt(
                document
                  .querySelector(".atvwebplayersdk-adtimeindicator-text")
                  .innerHTML.match(/[:]\d+/)[0]
                  .substring(1)
              );
              // wait for 100ms before skipping to make sure the button is not pressed too fast, or there will be infinite loading
              setTimeout(() => {
                if (button) {
                  button.click();
                  if (typeof adTime === "number") settings.Statistics.AmazonAdTimeSkipped += adTime;
                  increaseBadge();
                  log("Self Ad skipped, length:", adTime, button);
                }
              }, 150);
            }
          }
        };
      }
    }, 100);
  }

  // start/stop the observers depending on settings

  // Common functions
  async function startPlayOnFullScreen(isNetflix) {
    if (settings.Video?.playOnFullScreen === undefined || settings.Video?.playOnFullScreen) {
      log("started observing| PlayOnFullScreen");
      function OnFullScreenChange() {
        let video;
        if (isNetflix) video = document.querySelector("video");
        else video = document.querySelector(AmazonVideoClass);
        if (window.fullScreen && video) {
          video.play();
          console.log("auto-played on fullscreen");
          increaseBadge();
        }
      }
      addEventListener("fullscreenchange", OnFullScreenChange);
    } else {
      log("stopped observing| PlayOnFullScreen");
      removeEventListener("fullscreenchange", OnFullScreenChange);
    }
  }

  // Netflix
  async function startNetflixProfileObserver() {
    if (settings.Netflix?.profile === undefined || settings.Netflix.profile) {
      log("started observing| Profile");
      AutoPickProfile();
      NetflixProfileObserver.observe(document, config);
    } else {
      log("stopped observing| Profile");
      NetflixProfileObserver.disconnect();
    }
  }

  async function startNetflixSkipIntroObserver() {
    if (settings.Netflix?.skipIntro === undefined || settings.Netflix.skipIntro) {
      log("started observing| Intro");
      let button = document.querySelector('[data-uia="player-skip-intro"]');
      if (button) {
        let video = document.querySelectorAll("video")[0];
        const time = video.currentTime;
        button.click();
        log("intro skipped", button);
        setTimeout(function () {
          addIntroTimeSkipped(time, video.currentTime);
        }, 600);
      }
      NetflixSkipIntroObserver.observe(document, NetflixConfig);
    } else {
      log("stopped observing| Intro");
      NetflixSkipIntroObserver.disconnect();
    }
  }
  async function startNetflixSkipRecapObserver() {
    if (settings.Netflix?.skipRecap === undefined || settings.Netflix.skipRecap) {
      log("started observing| Recap");
      let button = document.querySelector('[data-uia="player-skip-recap"]') || document.querySelector('[data-uia="player-skip-preplay"]');
      if (button) {
        let video = document.querySelectorAll("video")[0];
        const time = video.currentTime;
        button.click();
        log("Recap skipped", button);
        setTimeout(function () {
          addRecapTimeSkipped(time, video.currentTime);
        }, 600);
      }
      NetflixSkipRecapObserver.observe(document, NetflixConfig);
    } else {
      log("stopped observing| Recap");
      NetflixSkipRecapObserver.disconnect();
    }
  }
  async function startNetflixSkipCreditsObserver() {
    if (settings.Netflix?.skipCredits === undefined || settings.Netflix.skipCredits) {
      log("started observing| Credits");
      let button = document.querySelector('[data-uia="next-episode-seamless-button"]');
      if (button) {
        button.click();
        log("Credits skipped", button);
      }
      NetflixSkipCreditsObserver.observe(document, NetflixConfig);
    } else {
      log("stopped observing| Credits");
      NetflixSkipCreditsObserver.disconnect();
    }
  }
  async function startNetflixSkipBlockedObserver() {
    if (settings.Netflix?.skipBlocked === undefined || settings.Netflix.skipBlocked) {
      log("started observing| Blocked");
      let button = document.querySelector('[data-uia="interrupt-autoplay-continue"]');
      if (button) {
        button.click();
        log("Blocked skipped", button);
      }
      NetflixSkipBlockedObserver.observe(document, NetflixConfig);
    } else {
      log("stopped observing| Blocked");
      NetflixSkipBlockedObserver.disconnect();
    }
  }
  async function startNetflixAdTimeout() {
    if (settings.Netflix?.NetflixAds === undefined || settings.Netflix.NetflixAds) {
      log("started observing| Ad");
      Netflix_SkipAdInterval();
    }
  }

  async function startAmazonSpeedSliderObserver() {
    if (settings.Amazon?.speedSlider === undefined || settings.Amazon.speedSlider) {
      let video = document.querySelector(AmazonVideoClass);
      let alreadySlider = document.querySelector("#videoSpeedSlider");

      // remove bad background document.querySelector(".fkpovp9.f8hspre").style.background = "rgba(0, 0, 0, 0.25)";
      let b = document.querySelector(".fkpovp9.f8hspre");
      if (b && b.style.background != "rgba(0, 0, 0, 0.25)") {
        b.style.background = "rgba(0, 0, 0, 0.25)";
      }

      if (video) {
        if (!alreadySlider) {
          // infobar position for the slider to be added
          let position = document.querySelector("[class*=infobar-container]")?.firstChild?.children[2];
          if (position) {
            let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("style", "width:1.2vw;height:1.2vw");
            svg.setAttribute("viewBox", "0 0 24 24");
            svg.setAttribute("id", "speedbutton");
            let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute(
              "d",
              "M17.6427 7.43779C14.5215 4.1874 9.47851 4.1874 6.35734 7.43779C3.21422 10.711 3.21422 16.0341 6.35734 19.3074L4.91474 20.6926C1.02842 16.6454 1.02842 10.0997 4.91474 6.05254C8.823 1.98249 15.177 1.98249 19.0853 6.05254C22.9716 10.0997 22.9716 16.6454 19.0853 20.6926L17.6427 19.3074C20.7858 16.0341 20.7858 10.711 17.6427 7.43779ZM14 14C14 15.1046 13.1046 16 12 16C10.8954 16 10 15.1046 10 14C10 12.8954 10.8954 12 12 12C12.1792 12 12.3528 12.0236 12.518 12.0677L15.7929 8.79289L17.2071 10.2071L13.9323 13.482C13.9764 13.6472 14 13.8208 14 14Z"
            );
            path.setAttribute("fill", "rgb(221, 221, 221)");
            svg.setAttribute("fill", "rgb(221, 221, 221)");
            svg.appendChild(path);
            position.insertBefore(svg, position.firstChild);

            let slider = document.createElement("input");
            slider.id = "videoSpeedSlider";
            slider.type = "range";
            slider.min = "5";
            slider.max = "15";
            slider.value = "10";
            slider.step = "1";
            // slider.setAttribute("list", "markers");
            slider.style = "height: 0.1875vw;background: rgb(221, 221, 221);display: none;";
            position.insertBefore(slider, position.firstChild);

            svg.onclick = function () {
              if (slider.style.display === "block") slider.style.display = "none";
              else slider.style.display = "block";
            };

            let speed = document.createElement("p");
            speed.id = "videoSpeed";
            speed.textContent = "1.0x";
            position.insertBefore(speed, position.firstChild);
            speed.onclick = function () {
              if (slider.style.display === "block") slider.style.display = "none";
              else slider.style.display = "block";
            };
            slider.oninput = function () {
              speed.textContent = this.value / 10 + "x";
              video.playbackRate = this.value / 10;
            };
          }
        }
      }
      log("started adding| SpeedSlider");
      AmazonSpeedSliderObserver.observe(document, AmazonSpeedSliderConfig);
    } else {
      log("stopped adding| SpeedSlider");
      AmazonSpeedSliderObserver.disconnect();
      document.querySelector("#videoSpeed")?.remove();
      document.querySelector("#videoSpeedSlider")?.remove();
      document.querySelector("#speedbutton")?.remove();
    }
  }
  async function startAmazonFilterPaidObserver() {
    if (settings.Amazon?.filterPaid === undefined || settings.Amazon.filterPaid) {
      log("started filtering| Paid films");

      AmazonFilterPaidObserver.observe(document, AmazonFilterPaidConfig);
    } else {
      log("stopped filtering| Paid films");
      AmazonFilterPaidObserver.disconnect();
    }
  }

  async function startAmazonSkipIntroObserver() {
    if (settings.Amazon?.skipIntro === undefined || settings.Amazon.skipIntro) {
      log("started observing| Intro");
      let button = document.querySelector("[class*=skipelement]");
      if (button) {
        let video = document.querySelector(AmazonVideoClass);
        const time = video.currentTime;
        button.click();
        log("Intro skipped", button);
        //delay where the video is loaded
        setTimeout(function () {
          addIntroTimeSkipped(time, video.currentTime);
        }, 50);
      }
      AmazonSkipIntroObserver.observe(document, AmazonSkipIntroConfig);
    } else {
      log("stopped observing| Intro");
      AmazonSkipIntroObserver.disconnect();
    }
  }
  async function startAmazonSkipCreditsObserver() {
    if (settings.Amazon?.skipCredits === undefined || settings.Amazon.skipCredits) {
      log("started observing| Credits");
      let button = document.querySelector("[class*=nextupcard-button]");
      if (button) {
        // only skipping to next episode not an entirely new series
        // this not skipping between seasons, which is fine i think because amazon is still doing it
        let newEpNumber = document.querySelector("[class*=nextupcard-episode]");
        if (newEpNumber && !newEpNumber.textContent.match(/(?<!\S)1(?!\S)/)) {
          button.click();
          log("Credits skipped", button);
        }
      }
      AmazonSkipCreditsObserver.observe(document, AmazonSkipCreditsConfig);
    } else {
      log("stopped observing| Credits");
      AmazonSkipCreditsObserver.disconnect();
    }
  }
  async function startAmazonSkipAdObserver() {
    if (settings.Amazon?.skipAd === undefined || settings.Amazon.skipAd) {
      log("started observing| Self Ad");
      Amazon_AdTimeout();
    }
  }
  async function startAmazonBlockFreeveeObserver() {
    if (settings.Amazon?.blockFreevee === undefined || settings.Amazon.blockFreevee) {
      log("started observing| FreeVee Ad");
      // AmazonFreeVeeObserver.observe(document, FreeVeeConfig);
      Amazon_FreeveeTimeout();
    }
  }

  // Badge functions
  function setBadgeText(text) {
    browser.runtime.sendMessage({
      type: "setBadgeText",
      content: text,
    });
  }
  function increaseBadge() {
    settings.Statistics.SegmentsSkipped++;
    browser.storage.sync.set({ settings });
    browser.runtime.sendMessage({
      type: "increaseBadge",
    });
  }
  function resetBadge() {
    browser.runtime.sendMessage({
      type: "resetBadge",
    });
  }
}
