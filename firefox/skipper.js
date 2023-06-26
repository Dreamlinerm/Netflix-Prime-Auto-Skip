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
// only on prime video pages
let isPrimeVideo = /amazon|primevideo/i.test(hostname) && (/video/i.test(title) || /video/i.test(url));
let isNetflix = /netflix/i.test(hostname);
let isDisney = /disneyplus/i.test(hostname);
const version = "1.0.45";

if (isPrimeVideo || isNetflix || isDisney) {
  // global variables in localStorage
  const defaultSettings = {
    settings: {
      Amazon: { skipIntro: true, skipCredits: true, skipAd: true, blockFreevee: true, speedSlider: true, filterPaid: false },
      Netflix: { skipIntro: true, skipRecap: true, skipCredits: true, skipBlocked: true, NetflixAds: true, speedSlider: true, profile: true },
      Disney: { skipRecap: true, skipCredits: true, speedSlider: true },
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
    else if (isPrimeVideo) console.log("Page %cAmazon", "color: #00aeef;");
    else if (isDisney) console.log("Page %cDisney", "color: #0682f0;");
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
        if (settings.Netflix?.speedSlider) startNetflixSpeedSliderObserver();
      } else if (isPrimeVideo) {
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
      } else if (isDisney) {
        if (settings.Disney?.skipRecap) startDisneySkipRecapObserver();
        if (settings.Disney?.skipCredits) startDisneySkipCreditsObserver();
        if (settings.Disney?.speedSlider) startDisneySpeedSliderObserver();
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
          if (oldValue === undefined || newValue.Netflix.speedSlider !== oldValue.Netflix?.speedSlider) startNetflixSpeedSliderObserver();
        } else if (isPrimeVideo) {
          if (oldValue === undefined || newValue.Amazon.skipIntro !== oldValue.Amazon?.skipIntro) startAmazonSkipIntroObserver();
          if (oldValue === undefined || newValue.Amazon.skipCredits !== oldValue.Amazon?.skipCredits) startAmazonSkipCreditsObserver();
          if (oldValue === undefined || newValue.Amazon.skipAd !== oldValue.Amazon?.skipAd) startAmazonSkipAdObserver();
          if (oldValue === undefined || newValue.Amazon.blockFreevee !== oldValue.Amazon?.blockFreevee) startAmazonBlockFreeveeObserver();
          if (oldValue === undefined || newValue.Amazon.speedSlider !== oldValue.Amazon?.speedSlider) startAmazonSpeedSliderObserver();
          if (oldValue === undefined || newValue.Amazon.filterPaid !== oldValue.Amazon?.filterPaid) startAmazonFilterPaidObserver();
        } else if (isDisney) {
          // if value is changed then check if it is enabled or disabled
          if (oldValue === undefined || newValue.Disney.skipRecap !== oldValue.Disney?.skipRecap) startDisneySkipRecapObserver();
          if (oldValue === undefined || newValue.Disney.skipCredits !== oldValue.Disney?.skipCredits) startDisneySkipCreditsObserver();
          if (oldValue === undefined || newValue.Disney.speedSlider !== oldValue.Disney?.speedSlider) startDisneySpeedSliderObserver();
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

  // Disney Observers
  const DisneySkipRecapObserver = new MutationObserver(Disney_Recap);
  function Disney_Recap(mutations, observer) {
    let button = document.querySelector(".skip__button");
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

  const DisneySkipCreditsObserver = new MutationObserver(Disney_Credits);
  function Disney_Credits(mutations, observer) {
    let button = document.querySelector('[data-gv2elementkey="playNext"]');
    if (button) {
      // only skip if the next video is the next episode of a series (there is a timer)
      let time = button.textContent.match(/\d+/)?.[0];
      if (time && lastAdTimeText != time) {
        button.click();
        lastAdTimeText = time;
        log("Credits skipped", button);
        increaseBadge();
        resetLastATimeText();
      }
    }
  }

  const DisneySpeedSliderConfig = { attributes: true, attributeFilter: ["video"], subtree: true, childList: true, attributeOldValue: false };
  const DisneySpeedSliderObserver = new MutationObserver(Disney_SpeedSlider);
  function Disney_SpeedSlider(mutations, observer) {
    let video = document.querySelector("video");
    let alreadySlider = document.querySelector("#videoSpeedSlider");
    if (video) {
      if (!alreadySlider) {
        // infobar position for the slider to be added
        let position = document.querySelector(".controls__right");
        if (position) {
          let slider = document.createElement("input");
          slider.id = "videoSpeedSlider";
          slider.type = "range";
          slider.min = "5";
          slider.max = "20";
          slider.value = "10";
          slider.step = "1";
          slider.style = "pointer-events: auto;background: rgb(221, 221, 221);display: none;width:200px;";
          position.insertBefore(slider, position.firstChild);

          let speed = document.createElement("p");
          speed.id = "videoSpeed";
          speed.textContent = "1x";
          // makes the button clickable
          // speed.setAttribute("class", "control-icon-btn");
          speed.style = "height:10px;color:#f9f9f9;pointer-events: auto;position: relative;bottom: 8px;padding: 0 5px;";
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

  const NetflixSkipIntroObserver = new MutationObserver(Netflix_Intro);
  function Netflix_Intro(mutations, observer) {
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
  // only add speed slider on lowest subscription tier
  const NetflixSpeedSliderConfig = { attributes: true, attributeFilter: ["video"], subtree: true, childList: true, attributeOldValue: false };
  const NetflixSpeedSliderObserver = new MutationObserver(Netflix_SpeedSlider);
  function Netflix_SpeedSlider(mutations, observer) {
    let video = document.querySelector("video");
    let alreadySlider = document.querySelector("#videoSpeedSlider");
    if (video && !document.querySelector('[data-uia="control-speed"]')) {
      if (!alreadySlider) {
        // infobar position for the slider to be added
        let p = document.querySelector('[data-uia="controls-standard"]')?.firstChild.children;
        let position;
        if (p) position = p[p.length - 2].firstChild.lastChild;
        if (position) {
          let slider = document.createElement("input");
          slider.id = "videoSpeedSlider";
          slider.type = "range";
          slider.min = "5";
          slider.max = "20";
          slider.value = "10";
          slider.step = "1";
          slider.style = "position:relative;bottom:20px;display: none;width:200px;";
          position.insertBefore(slider, position.firstChild);

          let speed = document.createElement("p");
          speed.id = "videoSpeed";
          speed.textContent = "1x";
          // makes the button clickable
          // speed.setAttribute("class", "control-icon-btn");
          speed.style = "position:relative;bottom:20px;font-size: 3em;padding: 0 5px;";
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
          let slider = document.createElement("input");
          slider.id = "videoSpeedSlider";
          slider.type = "range";
          slider.min = "5";
          slider.max = "20";
          slider.value = "10";
          slider.step = "1";
          // slider.setAttribute("list", "markers");
          slider.style = "height: 0.1875vw;background: rgb(221, 221, 221);display: none;width:200px;";
          position.insertBefore(slider, position.firstChild);

          let speed = document.createElement("p");
          speed.id = "videoSpeed";
          speed.textContent = "1x";
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
          let skipTime = adTime < 20 ? adTime - 0.1 : 20;
          video.currentTime += skipTime;
          log("FreeVee Ad skipped, length:", skipTime, "s");
          settings.Statistics.AmazonAdTimeSkipped += skipTime;
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
        if (isNetflix || isDisney) video = document.querySelector("video");
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
  // Disney
  async function startDisneySkipRecapObserver() {
    if (settings.Disney?.skipRecap === undefined || settings.Disney.skipRecap) {
      log("started observing| Recap");
      Disney_Recap();
      DisneySkipRecapObserver.observe(document, config);
    } else {
      log("stopped observing| Recap");
      DisneySkipRecapObserver.disconnect();
    }
  }

  async function startDisneySkipCreditsObserver() {
    if (settings.Netflix?.skipCredits === undefined || settings.Netflix.skipCredits) {
      log("started observing| Credits");
      Disney_Credits();
      DisneySkipCreditsObserver.observe(document, config);
    } else {
      log("stopped observing| Credits");
      DisneySkipCreditsObserver.disconnect();
    }
  }
  async function startDisneySpeedSliderObserver() {
    if (settings.Disney?.speedSlider === undefined || settings.Disney.speedSlider) {
      Disney_SpeedSlider();
      log("started adding   | SpeedSlider");
      DisneySpeedSliderObserver.observe(document, DisneySpeedSliderConfig);
    } else {
      log("stopped adding   | SpeedSlider");
      DisneySpeedSliderObserver.disconnect();
      document.querySelector("#videoSpeed")?.remove();
      document.querySelector("#videoSpeedSlider")?.remove();
    }
  }

  // Netflix
  async function startNetflixProfileObserver() {
    if (settings.Netflix?.profile === undefined || settings.Netflix.profile) {
      AutoPickProfile();
      log("started observing| Profile");
      NetflixProfileObserver.observe(document, config);
    } else {
      log("stopped observing| Profile");
      NetflixProfileObserver.disconnect();
    }
  }

  async function startNetflixSkipIntroObserver() {
    if (settings.Netflix?.skipIntro === undefined || settings.Netflix.skipIntro) {
      Netflix_Intro();
      log("started observing| Intro");
      NetflixSkipIntroObserver.observe(document, NetflixConfig);
    } else {
      log("stopped observing| Intro");
      NetflixSkipIntroObserver.disconnect();
    }
  }
  async function startNetflixSkipRecapObserver() {
    if (settings.Netflix?.skipRecap === undefined || settings.Netflix.skipRecap) {
      Netflix_Recap();
      log("started observing| Recap");
      NetflixSkipRecapObserver.observe(document, NetflixConfig);
    } else {
      log("stopped observing| Recap");
      NetflixSkipRecapObserver.disconnect();
    }
  }
  async function startNetflixSkipCreditsObserver() {
    if (settings.Netflix?.skipCredits === undefined || settings.Netflix.skipCredits) {
      Netflix_Credits();
      log("started observing| Credits");
      NetflixSkipCreditsObserver.observe(document, NetflixConfig);
    } else {
      log("stopped observing| Credits");
      NetflixSkipCreditsObserver.disconnect();
    }
  }
  async function startNetflixSkipBlockedObserver() {
    if (settings.Netflix?.skipBlocked === undefined || settings.Netflix.skipBlocked) {
      Netflix_Blocked();
      log("started observing| Blocked");
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
  async function startNetflixSpeedSliderObserver() {
    if (settings.Netflix?.speedSlider === undefined || settings.Netflix.speedSlider) {
      Netflix_SpeedSlider();
      log("started adding   | SpeedSlider");
      NetflixSpeedSliderObserver.observe(document, NetflixSpeedSliderConfig);
    } else {
      log("stopped adding   | SpeedSlider");
      NetflixSpeedSliderObserver.disconnect();
      document.querySelector("#videoSpeed")?.remove();
      document.querySelector("#videoSpeedSlider")?.remove();
    }
  }
  // -------------  Amazon -------------
  async function startAmazonSpeedSliderObserver() {
    if (settings.Amazon?.speedSlider === undefined || settings.Amazon.speedSlider) {
      log("started adding   | SpeedSlider");
      Amazon_SpeedSlider();
      AmazonSpeedSliderObserver.observe(document, AmazonSpeedSliderConfig);
    } else {
      log("stopped adding   | SpeedSlider");
      AmazonSpeedSliderObserver.disconnect();
      document.querySelector("#videoSpeed")?.remove();
      document.querySelector("#videoSpeedSlider")?.remove();
    }
  }
  async function startAmazonFilterPaidObserver() {
    if (settings.Amazon?.filterPaid === undefined || settings.Amazon.filterPaid) {
      log("started filtering| Paid films");
      Amazon_FilterPaid();
      AmazonFilterPaidObserver.observe(document, AmazonFilterPaidConfig);
    } else {
      log("stopped filtering| Paid films");
      AmazonFilterPaidObserver.disconnect();
    }
  }

  async function startAmazonSkipIntroObserver() {
    if (settings.Amazon?.skipIntro === undefined || settings.Amazon.skipIntro) {
      log("started observing| Intro");
      Amazon_Intro();
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
      Amazon_AdTimeout();
      log("started observing| Self Ad");
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
