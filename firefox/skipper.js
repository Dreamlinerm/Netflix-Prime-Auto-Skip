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
const version = "1.0.25";

if (isVideo || isNetflix) {
  // global variables in localStorage
  const defaultSettings = {
    settings: {
      Amazon: { skipIntro: true, skipCredits: true, skipAd: true, blockFreevee: true, speedSlider: true },
      Netflix: { skipIntro: true, skipRecap: true, skipCredits: true, skipBlocked: true },
      Statistics: { AmazonAdTimeSkipped: 0, IntroTimeSkipped: 0, RecapTimeSkipped: 0, SegmentsSkipped: 0 },
    },
  };
  let settings = defaultSettings.settings;
  let lastAdTimeText = "";
  resetBadge();
  browser.storage.sync.get("settings", function (result) {
    settings = result.settings;
    console.log("%cNetflix%c/%cPrime%c Auto-Skip", "color: #e60010;font-size: 2em;", "color: white;font-size: 2em;", "color: #00aeef;font-size: 2em;", "color: white;font-size: 2em;");
    console.log("version: ", version);
    console.log("Settings", settings);
    console.log("Page %cNetflix%cAmazon", isNetflix ? "color: #e60010;" : "display:none;", !isNetflix ? "color: #00aeef;" : "display:none;");
    if (typeof settings !== "object") {
      browser.storage.sync.set(defaultSettings);
    } else {
      if (isNetflix) {
        // start Observers depending on the settings
        if (settings.Netflix?.skipIntro) startNetflixSkipIntroObserver();
        if (settings.Netflix?.skipRecap) startNetflixSkipRecapObserver();
        if (settings.Netflix?.skipCredits) startNetflixSkipCreditsObserver();
        if (settings.Netflix?.skipBlocked) startNetflixSkipBlockedObserver();
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
      }
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
        if (isNetflix) {
          // if value is changed then check if it is enabled or disabled
          if (oldValue === undefined || newValue.Netflix.skipIntro !== oldValue.Netflix.skipIntro) startNetflixSkipIntroObserver();
          if (oldValue === undefined || newValue.Netflix.skipRecap !== oldValue.Netflix.skipRecap) startNetflixSkipRecapObserver();
          if (oldValue === undefined || newValue.Netflix.skipCredits !== oldValue.Netflix.skipCredits) startNetflixSkipCreditsObserver();
          if (oldValue === undefined || newValue.Netflix.skipBlocked !== oldValue.Netflix.skipBlocked) startNetflixSkipBlockedObserver();
        } else {
          if (oldValue === undefined || newValue.Amazon.skipIntro !== oldValue.Amazon.skipIntro) startAmazonSkipIntroObserver();
          if (oldValue === undefined || newValue.Amazon.skipCredits !== oldValue.Amazon.skipCredits) startAmazonSkipCreditsObserver();
          if (oldValue === undefined || newValue.Amazon.skipAd !== oldValue.Amazon.skipAd) startAmazonSkipAdObserver();
          if (oldValue === undefined || newValue.Amazon.blockFreevee !== oldValue.Amazon.blockFreevee) startAmazonBlockFreeveeObserver();
          if (oldValue === undefined || newValue.Amazon.speedSlider !== oldValue.Amazon.speedSlider) startAmazonSpeedSliderObserver();
        }
        if (oldValue === undefined || newValue.Statistics.AmazonAdTimeSkipped !== oldValue.Statistics.AmazonAdTimeSkipped) {
          settings.Statistics.AmazonAdTimeSkipped = newValue.Statistics.AmazonAdTimeSkipped;
        }
        if (oldValue === undefined || newValue.Statistics.IntroTimeSkipped !== oldValue.Statistics.IntroTimeSkipped) {
          settings.Statistics.IntroTimeSkipped = newValue.Statistics.IntroTimeSkipped;
        }
        if (oldValue === undefined || newValue.Statistics.RecapTimeSkipped !== oldValue.Statistics.RecapTimeSkipped) {
          settings.Statistics.RecapTimeSkipped = newValue.Statistics.RecapTimeSkipped;
        }
        if (oldValue === undefined || newValue.Statistics.SegmentsSkipped !== oldValue.Statistics.SegmentsSkipped) {
          settings.Statistics.SegmentsSkipped = newValue.Statistics.SegmentsSkipped;
          if (settings.Statistics.SegmentsSkipped === 0) {
            resetBadge();
          }
        }
      }
    }
  });
  function addIntroTimeSkipped(startTime, endTime) {
    if (typeof startTime === "number" && typeof endTime === "number" && endTime > startTime) {
      console.log("Intro Time skipped", endTime - startTime);
      settings.Statistics.IntroTimeSkipped += endTime - startTime;
      increaseBadge();
    }
  }
  function addRecapTimeSkipped(startTime, endTime) {
    if (typeof startTime === "number" && typeof endTime === "number" && endTime > startTime) {
      console.log("Recap Time skipped", endTime - startTime);
      settings.Statistics.RecapTimeSkipped += endTime - startTime;
      increaseBadge();
    }
  }

  // Observers
  // default Options for the observer (which mutations to observe)
  const config = { attributes: true, childList: true, subtree: true };
  // Netflix Observers
  const NetflixConfig = { attributes: true, attributeFilter: ["data-uia"], subtree: true, childList: true, attributeOldValue: false };
  const NetflixSkipIntroObserver = new MutationObserver(Netflix_intro);
  function Netflix_intro(mutations, observer) {
    for (let mutation of mutations) {
      for (let node of mutation.addedNodes) {
        let button = node.querySelector('[data-uia="player-skip-intro"]');
        if (button) {
          let video = document.querySelectorAll("video")[0];
          const time = video.currentTime;
          button.click();
          console.log("intro skipped", button);
          setTimeout(function () {
            addIntroTimeSkipped(time, video.currentTime);
          }, 600);
          return;
        }
      }
    }
  }

  const NetflixSkipRecapObserver = new MutationObserver(Netflix_Recap);
  function Netflix_Recap(mutations, observer) {
    for (let mutation of mutations) {
      for (let node of mutation.addedNodes) {
        let button = node.querySelector('[data-uia="player-skip-recap"]') || node.querySelector('[data-uia="player-skip-preplay"]');
        if (button) {
          let video = document.querySelectorAll("video")[0];
          const time = video.currentTime;
          button.click();
          console.log("Recap skipped", button);
          setTimeout(function () {
            addRecapTimeSkipped(time, video.currentTime);
          }, 600);
          return;
        }
      }
    }
  }

  const NetflixSkipCreditsObserver = new MutationObserver(Netflix_Credits);
  function Netflix_Credits(mutations, observer) {
    let button = document.querySelector('[data-uia="next-episode-seamless-button"]');
    if (button) {
      button.click();
      console.log("Credits skipped", button);
      increaseBadge();
    }
  }

  const NetflixSkipBlockedObserver = new MutationObserver(Netflix_Blocked);
  function Netflix_Blocked(mutations, observer) {
    for (let mutation of mutations) {
      for (let node of mutation.addedNodes) {
        let button = node.querySelector('[data-uia="interrupt-autoplay-continue"]');
        if (button) {
          button.click();
          console.log("Blocked skipped", button);
          increaseBadge();
          return;
        }
      }
    }
  }

  // Amazon Observers
  const AmazonSpeedSliderConfig = { attributes: true, attributeFilter: ["video"], subtree: true, childList: true, attributeOldValue: false };
  const AmazonSpeedSliderObserver = new MutationObserver(Amazon_SpeedSlider);
  function Amazon_SpeedSlider(mutations, observer) {
    let video = document.querySelector("#dv-web-player > div > div:nth-child(1) > div > div > div.scalingVideoContainer > div.scalingVideoContainerBottom > div > video");
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
        let position = document.querySelector("[class*=infobar-container]").firstChild.children[2];

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

  const AmazonSkipIntroConfig = { attributes: true, attributeFilter: [".skipelement"], subtree: true, childList: true, attributeOldValue: false };
  // const AmazonSkipIntro = new RegExp("skipelement", "i");
  const AmazonSkipIntroObserver = new MutationObserver(Amazon_Intro);
  function Amazon_Intro(mutations, observer) {
    let button = document.querySelector("[class*=skipelement]");
    if (button) {
      let video = document.querySelector("#dv-web-player > div > div:nth-child(1) > div > div > div.scalingVideoContainer > div.scalingVideoContainerBottom > div > video");
      const time = video.currentTime;
      button.click();
      console.log("Intro skipped", button);
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
        console.log("stopped observing| Intro");
        AmazonSkipIntroObserver.disconnect();
        waitTime = endTime - startTime + 2;
        // console.log("waiting for:", waitTime);
        setTimeout(function () {
          console.log("restarted observing| Intro");
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
              console.log("skipped Credits", button);
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
          console.log("FreeVee Ad skipped, length:", skipTime, "s");
          settings.Statistics.AmazonAdTimeSkipped += skipTime + 1;
          increaseBadge();
          // video.removeEventListener("playing", skipAd);
        }
      }
    }
  }
  // const FreeVeeConfig = { attributes: true, attributeFilter: [".atvwebplayersdk-adtimeindicator-text"], subtree: true, childList: true, attributeOldValue: false };
  // const AmazonFreeVeeObserver = new MutationObserver(AmazonFreeVee);
  // async function AmazonFreeVee(mutations, observer) {
  //   let video = document.querySelector("#dv-web-player > div > div:nth-child(1) > div > div > div.scalingVideoContainer > div.scalingVideoContainerBottom > div > video");
  //   // fixes the issue of infinite loading/crashing if the first time a series is played.
  //   if (video) {
  //     if (!video.paused && video.currentTime > 0) {
  //       skipAd(video);
  //     } else if (video.currentTime > 0) {
  //       video.addEventListener("playing", skipAd(video));
  //     }
  //   }
  // }

  async function Amazon_FreeveeTimeout() {
    // set loop every 1 sec and check if ad is there
    let AdInterval = setInterval(function () {
      if (!settings.Amazon.blockFreevee) {
        console.log("stopped observing| FreeVee Ad");
        clearInterval(AdInterval);
        return;
      }
      let video = document.querySelector("#dv-web-player > div > div:nth-child(1) > div > div > div.scalingVideoContainer > div.scalingVideoContainerBottom > div > video");
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

  // const AmazonSkipAdObserver = new MutationObserver(Amazon_Ad);
  // async function Amazon_Ad(mutations, observer) {
  //   // web player is shown
  //   if (getComputedStyle(document.querySelector("#dv-web-player")).display != "none") {
  //     for (let mutation of mutations) {
  //       if (mutation.target.classList.contains("atvwebplayersdk-infobar-container")) {
  //         let button = mutation.target.querySelector(".fu4rd6c.f1cw2swo");
  //         if (button) {
  //           button.click();
  //           // only getting the time after :08
  //           const adTime = parseInt(
  //             document
  //               .querySelector(".atvwebplayersdk-adtimeindicator-text")
  //               .innerHTML.match(/[:]\d+/)[0]
  //               .substring(1)
  //           );
  //           // if adTime is number
  //           if (typeof adTime === "number") {
  //             settings.Statistics.AmazonAdTimeSkipped += adTime;
  //           }
  //           increaseBadge();
  //           console.log("Self Ad skipped, length:", adTime, button);
  //           return;
  //         }
  //       }
  //     }
  //   }
  // }
  async function Amazon_AdTimeout() {
    // set loop every 1 sec and check if ad is there
    let AdInterval = setInterval(function () {
      if (!settings.Amazon.skipAd) {
        console.log("stopped observing| Self Ad");
        clearInterval(AdInterval);
        return;
      }
      let video = document.querySelector("#dv-web-player > div > div:nth-child(1) > div > div > div.scalingVideoContainer > div.scalingVideoContainerBottom > div > video");
      if (video) {
        video.onplay = function () {
          // console.log("started playing video");
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
              // wait for 100ms before skipping to make sure the button is not pressed too fast, or there will be inifinite loading
              setTimeout(() => {
                if (button) {
                  button.click();
                  if (typeof adTime === "number") settings.Statistics.AmazonAdTimeSkipped += adTime;
                  increaseBadge();
                  console.log("Self Ad skipped, length:", adTime, button);
                }
              }, 100);
            }
          }
        };
      }
    }, 100);
  }

  // start/stop the observers depending on settings
  async function startNetflixSkipIntroObserver() {
    if (settings.Netflix.skipIntro === undefined || settings.Netflix.skipIntro) {
      console.log("started observing| intro");
      let button = document.querySelector('[data-uia="player-skip-intro"]');
      if (button) {
        let video = document.querySelectorAll("video")[0];
        const time = video.currentTime;
        button.click();
        console.log("intro skipped", button);
        setTimeout(function () {
          addIntroTimeSkipped(time, video.currentTime);
        }, 600);
      }
      NetflixSkipIntroObserver.observe(document, NetflixConfig);
    } else {
      console.log("stopped observing| intro");
      NetflixSkipIntroObserver.disconnect();
    }
  }
  async function startNetflixSkipRecapObserver() {
    if (settings.Netflix.skipRecap === undefined || settings.Netflix.skipRecap) {
      console.log("started observing| Recap");
      let button = document.querySelector('[data-uia="player-skip-recap"]') || document.querySelector('[data-uia="player-skip-preplay"]');
      if (button) {
        let video = document.querySelectorAll("video")[0];
        const time = video.currentTime;
        button.click();
        console.log("Recap skipped", button);
        setTimeout(function () {
          addRecapTimeSkipped(time, video.currentTime);
        }, 600);
      }
      NetflixSkipRecapObserver.observe(document, NetflixConfig);
    } else {
      console.log("stopped observing| Recap");
      NetflixSkipRecapObserver.disconnect();
    }
  }
  async function startNetflixSkipCreditsObserver() {
    if (settings.Netflix.skipCredits === undefined || settings.Netflix.skipCredits) {
      console.log("started observing| Credits");
      let button = document.querySelector('[data-uia="next-episode-seamless-button"]');
      if (button) {
        button.click();
        console.log("Credits skipped", button);
      }
      NetflixSkipCreditsObserver.observe(document, NetflixConfig);
    } else {
      console.log("stopped observing| Credits");
      NetflixSkipCreditsObserver.disconnect();
    }
  }
  async function startNetflixSkipBlockedObserver() {
    if (settings.Netflix.skipBlocked === undefined || settings.Netflix.skipBlocked) {
      console.log("started observing| Blocked");
      let button = document.querySelector('[data-uia="interrupt-autoplay-continue"]');
      if (button) {
        button.click();
        console.log("Blocked skipped", button);
      }
      NetflixSkipBlockedObserver.observe(document, NetflixConfig);
    } else {
      console.log("stopped observing| Blocked");
      NetflixSkipBlockedObserver.disconnect();
    }
  }
  async function startAmazonSpeedSliderObserver() {
    if (settings.Amazon.speedSlider === undefined || settings.Amazon.speedSlider) {
      let video = document.querySelector("#dv-web-player > div > div:nth-child(1) > div > div > div.scalingVideoContainer > div.scalingVideoContainerBottom > div > video");
      let alreadySlider = document.querySelector("#videoSpeedSlider");

      // remove bad background document.querySelector(".fkpovp9.f8hspre").style.background = "rgba(0, 0, 0, 0.25)";
      let b = document.querySelector(".fkpovp9.f8hspre");
      if (b && b.style.background != "rgba(0, 0, 0, 0.25)") {
        b.style.background = "rgba(0, 0, 0, 0.25)";
      }

      if (video) {
        if (!alreadySlider) {
          // infobar position for the slider to be added
          let position = document.querySelector("[class*=infobar-container]").firstChild.children[2];

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
      console.log("started adding | SpeedSlider");
      AmazonSpeedSliderObserver.observe(document, AmazonSpeedSliderConfig);
    } else {
      console.log("stopped adding| SpeedSlider");
      AmazonSpeedSliderObserver.disconnect();
      document.querySelector("#videoSpeed")?.remove();
      document.querySelector("#videoSpeedSlider")?.remove();
      document.querySelector("#speedbutton")?.remove();
    }
  }

  async function startAmazonSkipIntroObserver() {
    if (settings.Amazon.skipIntro === undefined || settings.Amazon.skipIntro) {
      console.log("started observing| Intro");
      let button = document.querySelector("[class*=skipelement]");
      if (button) {
        let video = document.querySelector("#dv-web-player > div > div:nth-child(1) > div > div > div.scalingVideoContainer > div.scalingVideoContainerBottom > div > video");
        const time = video.currentTime;
        button.click();
        console.log("Intro skipped", button);
        //delay where the video is loaded
        setTimeout(function () {
          addIntroTimeSkipped(time, video.currentTime);
        }, 50);
      }
      AmazonSkipIntroObserver.observe(document, AmazonSkipIntroConfig);
    } else {
      console.log("stopped observing| Intro");
      AmazonSkipIntroObserver.disconnect();
    }
  }
  async function startAmazonSkipCreditsObserver() {
    if (settings.Amazon.skipCredits === undefined || settings.Amazon.skipCredits) {
      console.log("started observing| Credits");
      let button = document.querySelector("[class*=nextupcard-button]");
      if (button) {
        // only skipping to next episode not an entirely new series
        // this not skipping between seasons, which is fine i think because amazon is still doing it
        let newEpNumber = document.querySelector("[class*=nextupcard-episode]");
        if (newEpNumber && !newEpNumber.textContent.match(/(?<!\S)1(?!\S)/)) {
          button.click();
          console.log("Credits skipped", button);
        }
      }
      AmazonSkipCreditsObserver.observe(document, AmazonSkipCreditsConfig);
    } else {
      console.log("stopped observing| Credits");
      AmazonSkipCreditsObserver.disconnect();
    }
  }
  async function startAmazonSkipAdObserver() {
    if (settings.Amazon.skipAd === undefined || settings.Amazon.skipAd) {
      console.log("started observing| Self Ad");
      // only necessary for observer
      /*
      if (getComputedStyle(document.querySelector("#dv-web-player")).display != "none") {
        let button = document.querySelector(".fu4rd6c.f1cw2swo");
        if (button) {
          button.click();
          // only getting the time after :08
          let adTime = parseInt(
            document
              .querySelector(".atvwebplayersdk-adtimeindicator-text")
              .innerHTML.match(/[:]\d+/)[0]
              .substring(1)
          );
          // if adTime is number
          if (typeof adTime === "number") settings.Statistics.AmazonAdTimeSkipped += adTime;
          browser.storage.sync.set({ settings });
          console.log("Self Ad skipped, length:", adTime, button);
        }
      }
      AmazonSkipAdObserver.observe(document, config);
      */
      Amazon_AdTimeout();
    }
    /*
    else {
      console.log("stopped observing| Self Ad");
      AmazonSkipAdObserver.disconnect();
    }
    */
  }
  async function startAmazonBlockFreeveeObserver() {
    if (settings.Amazon.blockFreevee === undefined || settings.Amazon.blockFreevee) {
      console.log("started observing| FreeVee Ad");
      // AmazonFreeVeeObserver.observe(document, FreeVeeConfig);
      Amazon_FreeveeTimeout();
    }
    // else {
    //   console.log("stopped observing| FreeVee Ad");
    //   AmazonFreeVeeObserver.disconnect();
    //   let video = document.querySelector("#dv-web-player > div > div:nth-child(1) > div > div > div.scalingVideoContainer > div.scalingVideoContainerBottom > div > video");
    //   if (video) {
    //     video.removeEventListener("playing", skipAd);
    //   }
    // }
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
