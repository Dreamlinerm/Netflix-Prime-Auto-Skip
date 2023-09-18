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
// matches all amazon urls under https://en.wikipedia.org/wiki/Amazon_(company)#Website
let hostname = window.location.hostname;
let title = document.title;
let url = window.location.href;
let ua = window.navigator.userAgent;
// only on prime video pages
let isPrimeVideo = /amazon|primevideo/i.test(hostname) && (/video/i.test(title) || /video/i.test(url));
let isNetflix = /netflix/i.test(hostname);
let isDisney = /disneyplus/i.test(hostname);
let isHotstar = /hotstar/i.test(hostname);

let isEdge = /edg/i.test(ua);
let isFirefox = /firefox/i.test(ua);
const version = "1.0.59";
if (isPrimeVideo || isNetflix || isDisney || isHotstar) {
  // global variables in localStorage
  const defaultSettings = {
    settings: {
      Amazon: { skipIntro: true, skipCredits: true, watchCredits: false, skipAd: true, blockFreevee: true, speedSlider: true, filterPaid: false, showRating: true, streamLinks: true },
      Netflix: { skipIntro: true, skipRecap: true, skipCredits: true, watchCredits: false, skipBlocked: true, NetflixAds: true, speedSlider: true, profile: true, showRating: true },
      Disney: { skipIntro: true, skipCredits: true, watchCredits: false, speedSlider: true },
      Video: { playOnFullScreen: true },
      Statistics: { AmazonAdTimeSkipped: 0, NetflixAdTimeSkipped: 0, IntroTimeSkipped: 0, RecapTimeSkipped: 0, SegmentsSkipped: 0 },
      General: { profileName: null, profilePicture: null, sliderSteps: 1, sliderMin: 5, sliderMax: 20 },
    },
  };
  let settings = defaultSettings.settings;
  let lastAdTimeText = 0;
  let videoSpeed;
  async function setVideoSpeed(speed) {
    videoSpeed = speed;
  }
  resetBadge();
  browser.storage.sync.get("settings", function (result) {
    settings = result.settings;
    console.log("%cNetflix%c/%cPrime%c Auto-Skip", "color: #e60010;font-size: 2em;", "color: white;font-size: 2em;", "color: #00aeef;font-size: 2em;", "color: white;font-size: 2em;");
    console.log("version:", version);
    console.log("Settings", settings);
    if (isNetflix) console.log("Page %cNetflix", "color: #e60010;");
    else if (isPrimeVideo) console.log("Page %cAmazon", "color: #00aeef;");
    else if (isDisney) console.log("Page %cDisney", "color: #0682f0;");
    else if (isHotstar) console.log("Page %cHotstar", "color: #0682f0;");
    if (typeof settings !== "object") {
      browser.storage.sync.set(defaultSettings);
    } else {
      if (isNetflix) {
        // start Observers depending on the settings
        if (settings.Netflix?.profile) startNetflixProfileObserver();
        if (settings.Netflix?.skipIntro) startNetflixSkipIntroObserver();
        if (settings.Netflix?.skipRecap) startNetflixSkipRecapObserver();
        if (settings.Netflix?.skipCredits) startNetflixSkipCreditsObserver();
        if (settings.Netflix?.watchCredits) startNetflixWatchCreditsObserver();
        if (settings.Netflix?.skipBlocked) startNetflixSkipBlockedObserver();
        if (settings.Netflix?.NetflixAds) startNetflixAdTimeout();
        if (settings.Netflix?.speedSlider) startNetflixSpeedSliderObserver();

        if (settings.Netflix?.showRating) startShowRatingInterval();
      } else if (isPrimeVideo) {
        if (settings.Amazon?.skipIntro) startAmazonSkipIntroObserver();
        if (settings.Amazon?.skipCredits) startAmazonSkipCreditsObserver();
        if (settings.Amazon?.watchCredits) startAmazonWatchCreditsObserver();
        if (settings.Amazon?.skipAd) startAmazonSkipAdObserver();
        if (settings.Amazon?.blockFreevee) {
          // timeout of 100 ms because the ad is not loaded fast enough and the video will crash
          setTimeout(function () {
            startAmazonBlockFreeveeObserver();
          }, 1000);
        }
        if (settings.Amazon?.speedSlider) startAmazonSpeedSliderObserver();
        if (settings.Amazon?.filterPaid) startAmazonFilterPaidObserver();
        if (settings.Amazon?.streamLinks) addStreamLinks();

        // if (settings.Amazon?.showRating) startShowRatingInterval();
      } else if (isDisney || isHotstar) {
        if (settings.Disney?.skipIntro) startDisneySkipIntroObserver();
        if (settings.Disney?.skipCredits) startDisneySkipCreditsObserver();
        if (settings.Disney?.watchCredits) startDisneyWatchCreditsObserver();
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
          if (oldValue === undefined || newValue.Netflix.watchCredits !== oldValue.Netflix?.watchCredits) startNetflixWatchCreditsObserver();
          if (oldValue === undefined || newValue.Netflix.skipBlocked !== oldValue.Netflix?.skipBlocked) startNetflixSkipBlockedObserver();
          if (oldValue === undefined || newValue.Netflix.NetflixAds !== oldValue.Netflix?.NetflixAds) startNetflixAdTimeout();
          if (oldValue === undefined || newValue.Netflix.speedSlider !== oldValue.Netflix?.speedSlider) startNetflixSpeedSliderObserver();

          if (oldValue === undefined || newValue.Video.showRating !== oldValue.Netflix?.showRating) startShowRatingInterval();
        } else if (isPrimeVideo) {
          if (oldValue === undefined || newValue.Amazon.skipIntro !== oldValue.Amazon?.skipIntro) startAmazonSkipIntroObserver();
          if (oldValue === undefined || newValue.Amazon.skipCredits !== oldValue.Amazon?.skipCredits) startAmazonSkipCreditsObserver();
          if (oldValue === undefined || newValue.Amazon.watchCredits !== oldValue.Amazon?.watchCredits) startAmazonWatchCreditsObserver();
          if (oldValue === undefined || newValue.Amazon.skipAd !== oldValue.Amazon?.skipAd) startAmazonSkipAdObserver();
          if (oldValue === undefined || newValue.Amazon.blockFreevee !== oldValue.Amazon?.blockFreevee) startAmazonBlockFreeveeObserver();
          if (oldValue === undefined || newValue.Amazon.speedSlider !== oldValue.Amazon?.speedSlider) startAmazonSpeedSliderObserver();
          if (oldValue === undefined || newValue.Amazon.filterPaid !== oldValue.Amazon?.filterPaid) startAmazonFilterPaidObserver();
          if (oldValue === undefined || newValue.Video.streamLinks !== oldValue.Amazon?.streamLinks) addStreamLinks();

          // if (oldValue === undefined || newValue.Video.showRating !== oldValue.Amazon?.showRating) startShowRatingInterval();
        } else if (isDisney || isHotstar) {
          // if value is changed then check if it is enabled or disabled
          if (oldValue === undefined || newValue.Disney.skipIntro !== oldValue.Disney?.skipIntro) startDisneySkipIntroObserver();
          if (oldValue === undefined || newValue.Disney.skipCredits !== oldValue.Disney?.skipCredits) startDisneySkipCreditsObserver();
          if (oldValue === undefined || newValue.Disney.watchCredits !== oldValue.Disney?.watchCredits) startDisneyWatchCreditsObserver();
          if (oldValue === undefined || newValue.Disney.speedSlider !== oldValue.Disney?.speedSlider) startDisneySpeedSliderObserver();
        }
        if (oldValue === undefined || newValue.Video.playOnFullScreen !== oldValue.Video?.playOnFullScreen) startPlayOnFullScreen(isNetflix);
        if (oldValue === undefined || settings.Statistics.SegmentsSkipped === 0) {
          resetBadge();
        }
      } else if (key == "DBCache") {
        DBCache = newValue;
      }
    }
  });
  let DBCache = {};
  browser.storage.local.get("DBCache", function (result) {
    DBCache = result?.DBCache;
    if (typeof DBCache !== "object") {
      console.log("DBCache not found, creating new one", DBCache);
      browser.storage.local.set({ DBCache: {} });
      DBCache = {};
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
  // ...args
  function log(...args) {
    const date = new Date();
    console.log(date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(), ...args);
  }
  // set DB Cache if cache size under 2MB
  function setDBCache() {
    const size = new TextEncoder().encode(JSON.stringify(DBCache)).length;
    const kiloBytes = size / 1024;
    const megaBytes = kiloBytes / 1024;
    if (megaBytes < 2) {
      browser.storage.local.set({ DBCache });
    } else {
      log("DBCache cleared", megaBytes);
      DBCache = {};
      browser.storage.local.set({ DBCache });
    }
    // log(megaBytes);
    // browser.storage.local.get("DBCache", function (result) {
    //   console.log(JSON.stringify(result?.DBCache));
    // });
    // console.log(JSON.stringify(DBCache));
  }
  // justWatchAPI
  async function getMovieInfo(movieTitle, card, Rating = true, locale = "en_US") {
    // console.log("getMovieInfo", movieTitle);
    const url = `https://apis.justwatch.com/content/titles/${locale}/popular?language=en&body={"page_size":1,"page":1,"query":"${movieTitle}","content_types":["show","movie"]}`;
    // const response = await fetch(encodeURI(url));
    // const data = await response.json();

    browser.runtime.sendMessage({ url }, function (data) {
      if (data != undefined && data != "") {
        // "https://www.justwatch.com" + data.items[0].full_path;
        const jWURL = data?.items?.[0]?.full_path;
        // flatrate = free with subscription (netflix, amazon prime, disney+)
        let offers = data?.items?.[0].offers?.filter((x) => x.monetization_type == "flatrate" && (x.package_short_name == "amp" || x.package_short_name == "nfx" || x.package_short_name == "dnp"));
        // get the first offer of each provider
        offers = offers?.filter((x, i) => offers.findIndex((y) => y.provider_id == x.provider_id) == i);
        // map offers to only package_short_name, country and standard_web url
        offers = offers?.map((x) => ({ country: x.country, package_short_name: x.package_short_name, url: x.urls.standard_web }));
        const score = data?.items?.[0]?.scoring?.filter((x) => x.provider_type == "imdb:score")?.[0]?.value;
        const compiledData = { jWURL, score, streamLinks: offers };
        DBCache[title] = compiledData;
        if (Rating) setRatingOnCard(card, compiledData, title);
        else setAlternativesOnCard(card, compiledData, title);
      }
    });
  }

  // Observers
  // default Options for the observer (which mutations to observe)
  const config = { attributes: true, childList: true, subtree: true };

  // shared functions
  async function JustWatch() {
    let titleCards;
    if (isNetflix) titleCards = document.querySelectorAll(".title-card .boxart-container:not(.imdb)");
    else titleCards = document.querySelectorAll("li:not(.imdb) [data-card-title]");
    titleCards.forEach((card) => {
      // let card = document.querySelector("li:not(.imdb) [data-card-title]");
      // let card = document.querySelector(".title-card .boxart-container:not(.imdb)");
      let title;
      if (isNetflix) title = card?.children?.[1]?.firstChild?.textContent;
      // remove everything after - in the title
      else title = card.getAttribute("data-card-title").split(" - ")[0].split(" – ")[0]; //Amazon
      if (title && !title.includes("Netflix") && !title.includes("Prime Video")) {
        if (!DBCache[title]) {
          getMovieInfo(title, card);
        } else {
          setRatingOnCard(card, DBCache[title], title);
        }
      }
    });
  }
  async function setAlternativesOnCard(card, data) {
    let div = document.createElement("div");
    div.style = "display:flex;";
    let h1 = document.createElement("h1");
    if (data?.jWURL) {
      h1.textContent = "Watch for free?";
      // add Just watch Link,
      // https://www.justwatch.com/appassets/img/home/logo.svg
      let a = document.createElement("a");
      a.href = "https://www.justwatch.com" + data.jWURL;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      let img = document.createElement("img");
      img.src = "https://www.justwatch.com/appassets/img/home/logo.svg";
      img.alt = "Just Watch icon";
      img.style = "border: 1px solid transparent;border-radius: 1.1em;width: 4.5em;height: auto;";

      a.appendChild(img);

      let Idiv = document.createElement("div");
      let p = document.createElement("p");
      p.textContent = "Just Watch";
      p.style = "margin: 0 0 0 5px;";
      Idiv.appendChild(a);
      Idiv.appendChild(p);

      div.appendChild(Idiv);
    }
    if (data?.streamLinks) {
      // netflix icon
      data.streamLinks.forEach((link) => {
        let a = document.createElement("a");
        a.href = data.streamLinks[0].url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        let img = document.createElement("img");
        let p = document.createElement("p");
        p.style = "margin: 0 0 0 5px;";
        if (link.package_short_name == "amp") {
          img.src = "https://images.justwatch.com/icon/430993/s100/image.png";
          img.alt = "Prime icon";
          p.textContent = "Prime (US VPN)";
        } else if (link.package_short_name == "nfx") {
          img.src = "https://images.justwatch.com/icon/207360008/s100/image.png";
          img.alt = "Netflix icon";
          p.textContent = "Netflix (US)";
        } else if (link.package_short_name == "dnp") {
          img.src = "https://images.justwatch.com/icon/147638351/s100/disneyplus.jpg";
          img.alt = "Prime icon";
          p.textContent = "Disney (US)";
        }
        img.style = "border: 1px solid transparent;border-radius: 1.1em;width: 4.5em;height: auto;";
        a.appendChild(img);

        let Idiv = document.createElement("div");
        Idiv.appendChild(a);
        Idiv.appendChild(p);
        div.appendChild(Idiv);
      });
    }
    card.insertBefore(div, card.firstChild);
    card.insertBefore(h1, card.firstChild);
  }

  async function setRatingOnCard(card, data, title) {
    if (isNetflix) card.classList.add("imdb");
    else card.parentElement.classList.add("imdb");

    let div = document.createElement("div");
    // right: 1.5vw;
    div.style = "position: absolute;bottom: 0;right:0;z-index: 9999;color: black;background: #f5c518;border-radius: 5px;font-size: 1vw;padding: 0 2px 0 2px;";
    // div.id = "imdb";
    if (data?.score) {
      div.textContent = data.score?.toFixed(1);
      // div.textContent = title;
    } else {
      div.textContent = "?";
      console.log("no Score found", title);
    }
    if (isNetflix) card.appendChild(div);
    else card.firstChild.firstChild.appendChild(div);
  }

  // Disney Observers
  const DisneySkipIntroObserver = new MutationObserver(Disney_Intro);
  function Disney_Intro(mutations, observer) {
    // intro star wars andor Season 1 episode 2
    // Recap Criminal Minds Season 1 Episode 2
    let button;
    if (isDisney) button = document.querySelector(".skip__button");
    else button = document.evaluate("//span[contains(., 'Skip')]", document, null, XPathResult.ANY_TYPE, null)?.iterateNext()?.parentElement;
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
    let button;
    if (isDisney) button = document.querySelector('[data-gv2elementkey="playNext"]');
    else button = document.evaluate("//span[contains(., 'Next Episode')]", document, null, XPathResult.ANY_TYPE, null)?.iterateNext()?.parentElement;
    if (button) {
      // only skip if the next video is the next episode of a series (there is a timer)
      let time;
      if (isDisney) time = button.textContent.match(/\d+/)?.[0];
      if ((isHotstar && !document.evaluate("//span[contains(., 'My Space')]", document, null, XPathResult.ANY_TYPE, null)?.iterateNext()) || (time && lastAdTimeText != time)) {
        button.click();
        lastAdTimeText = time;
        log("Credits skipped", button);
        increaseBadge();
        resetLastATimeText();
      }
    }
  }

  const DisneyWatchCreditsObserver = new MutationObserver(Disney_Watch_Credits);
  function Disney_Watch_Credits(mutations, observer) {
    let button;
    if (isDisney) button = document.querySelector('[data-gv2elementkey="playNext"]');
    else button = document.evaluate("//span[contains(., 'Next Episode')]", document, null, XPathResult.ANY_TYPE, null)?.iterateNext()?.parentElement;
    if (button) {
      // only skip if the next video is the next episode of a series (there is a timer)
      let time;
      if (isDisney) time = button.textContent.match(/\d+/)?.[0];
      if ((isHotstar && !document.evaluate("//span[contains(., 'My Space')]", document, null, XPathResult.ANY_TYPE, null)?.iterateNext()) || (time && lastAdTimeText != time)) {
        let video = document.querySelector("video");
        if (video) {
          video.click();
          lastAdTimeText = time;
          log("Credits skipped", button);
          increaseBadge();
          resetLastATimeText();
        }
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

        let position;
        if (isDisney) position = document.querySelector(".controls__right");
        else position = document.querySelector(".icon-player-landscape").parentElement.parentElement.parentElement.parentElement;

        if (position) {
          videoSpeed = videoSpeed ? videoSpeed : video.playbackRate;

          let slider = document.createElement("input");
          slider.id = "videoSpeedSlider";
          slider.type = "range";
          slider.min = settings.General.sliderMin;
          slider.max = settings.General.sliderMax;
          slider.value = videoSpeed * 10;
          slider.step = settings.General.sliderSteps;
          slider.style = "pointer-events: auto;background: rgb(221, 221, 221);display: none;width:200px;";
          position.insertBefore(slider, position.firstChild);

          let speed = document.createElement("p");
          speed.id = "videoSpeed";
          speed.textContent = videoSpeed ? videoSpeed + "x" : "1x";
          // makes the button clickable
          // speed.setAttribute("class", "control-icon-btn");
          speed.style = "height:10px;color:#f9f9f9;pointer-events: auto;position: relative;bottom: 8px;padding: 0 5px;";
          position.insertBefore(speed, position.firstChild);

          if (videoSpeed) video.playbackRate = videoSpeed;
          speed.onclick = function () {
            if (slider.style.display === "block") slider.style.display = "none";
            else slider.style.display = "block";
          };
          slider.oninput = function () {
            speed.textContent = this.value / 10 + "x";
            video.playbackRate = this.value / 10;
            setVideoSpeed(this.value / 10);
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
          setVideoSpeed(this.value / 10);
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
    // brooklyn nine nine season 1 episode 4
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
    // Outer Banks season 2 episode 1
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

  const NetflixWatchCreditsObserver = new MutationObserver(Netflix_Watch_Credits);
  function Netflix_Watch_Credits(mutations, observer) {
    let button = document.querySelector('[data-uia="watch-credits-seamless-button"]');
    if (button) {
      button.click();
      log("Credits watched", button);
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
      const adLength = Number(document.querySelector(".ltr-mmvz9h")?.textContent);
      if (video) {
        let playBackRate = 16;
        if (isEdge) playBackRate = 3;
        if (adLength && video.playbackRate != playBackRate) {
          log("Ad skipped, length:", adLength, "s");
          settings.Statistics.NetflixAdTimeSkipped += adLength;
          increaseBadge();
          video.playbackRate = playBackRate;
        } else if (adLength && video.paused) {
          video.play();
        } else if (video.playbackRate == playBackRate && !adLength) {
          video.playbackRate = 1;
        }
      }
    }, 100);
  }

  const NetflixSpeedSliderConfig = { attributes: true, attributeFilter: ["video"], subtree: true, childList: true, attributeOldValue: false };
  const NetflixSpeedSliderObserver = new MutationObserver(Netflix_SpeedSlider);
  function Netflix_SpeedSlider(mutations, observer) {
    let video = document.querySelector("video");
    let alreadySlider = document.querySelector("#videoSpeedSlider");
    // only add speed slider on lowest subscription tier
    // && !document.querySelector('[data-uia="control-speed"]')
    if (video) {
      let p = document.querySelector('[data-uia="controls-standard"]')?.firstChild.children;
      if (p) {
        if (!alreadySlider) {
          // infobar position for the slider to be added
          let position;
          if (p) position = p[p.length - 2].firstChild.lastChild;
          if (position) {
            videoSpeed = videoSpeed ? videoSpeed : video.playbackRate;
            let slider = document.createElement("input");
            slider.id = "videoSpeedSlider";
            slider.type = "range";
            slider.min = settings.General.sliderMin;
            slider.max = settings.General.sliderMax;
            slider.value = videoSpeed * 10;
            slider.step = settings.General.sliderSteps;
            slider.style = "position:relative;bottom:20px;display: none;width:200px;";
            position.insertBefore(slider, position.firstChild);

            let speed = document.createElement("p");
            speed.id = "videoSpeed";
            speed.textContent = videoSpeed ? videoSpeed + "x" : "1x";
            // makes the button clickable
            // speed.setAttribute("class", "control-icon-btn");
            speed.style = "position:relative;bottom:20px;font-size: 3em;padding: 0 5px;";
            position.insertBefore(speed, position.firstChild);

            if (videoSpeed) video.playbackRate = videoSpeed;
            speed.onclick = function () {
              if (slider.style.display === "block") slider.style.display = "none";
              else slider.style.display = "block";
            };
            slider.oninput = function () {
              speed.textContent = this.value / 10 + "x";
              video.playbackRate = this.value / 10;
              setVideoSpeed(this.value / 10);
            };
          }
        }
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
        let position = document.querySelector("[class*=infobar-container]")?.firstChild?.lastChild;
        if (position) {
          let slider = document.createElement("input");
          slider.id = "videoSpeedSlider";
          slider.type = "range";
          slider.min = settings.General.sliderMin;
          slider.max = settings.General.sliderMax;
          slider.value = "10";
          slider.step = settings.General.sliderSteps;
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
    // skips intro and recap
    // recap on lucifer season 3 episode 3
    // intro lucifer season 3 episode 4
    let button = document.querySelector("[class*=skipelement]");
    if (button) {
      let video = document.querySelector(AmazonVideoClass);
      const time = video.currentTime;
      if (time) {
        button.click();
        log("Intro skipped", button);
        //delay where the video is loaded
        setTimeout(function () {
          AmazonGobackbutton(video, time, video.currentTime);
          addIntroTimeSkipped(time, video.currentTime);
        }, 50);
      }
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
  const AmazonSkipCreditsObserver = new MutationObserver(Amazon_Credits);
  function Amazon_Credits(mutations, observer) {
    let button = document.querySelector("[class*=nextupcard-button]");
    if (button) {
      // only skipping to next episode not an entirely new series
      let newEpNumber = document.querySelector("[class*=nextupcard-episode]");
      if (newEpNumber && !newEpNumber.textContent.match(/(?<!\S)1(?!\S)/)) {
        button.click();
        increaseBadge();
        log("skipped Credits", button);
      }
    }
  }

  const AmazonWatchCreditsObserver = new MutationObserver(Amazon_Watch_Credits);
  function Amazon_Watch_Credits(mutations, observer) {
    let button = document.querySelector("[class*=nextupcardhide-button]");
    if (button) {
      button.click();
      increaseBadge();
      log("Watched Credits", button);
    }
  }

  function skipAd(video) {
    // Series grimm
    let adTimeText = document.querySelector(".atvwebplayersdk-adtimeindicator-text");
    if (adTimeText) {
      const adTime = parseInt(adTimeText.textContent.match(/\d+/)[0]);
      // adTimeText.textContent.length > 7 so it doesn't try to skip when the self ad is playing
      // !document.querySelector(".fu4rd6c.f1cw2swo") so it doesn't try to skip when the self ad is playing
      if (!document.querySelector(".fu4rd6c.f1cw2swo") && !lastAdTimeText) {
        if (typeof adTime === "number" && adTime > 1) {
          lastAdTimeText = adTime;
          resetLastATimeText();
          // getting stuck loading when skipping ad longer than 100 seconds i think
          // let skipTime = adTime <= 20 ? adTime - 1 : 20;
          let skipTime = adTime - 1;
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
      lastAdTimeText = 0;
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
        if (isNetflix || isDisney || isHotstar) video = document.querySelector("video");
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

  async function addStreamLinks() {
    let title = document.querySelector("h1[data-automation-id='title']")?.textContent?.split(" [")[0];
    if (title) {
      let card = document.querySelector("div#dv-action-box");
      if (!DBCache[title]) {
        getMovieInfo(title, card, false);
      } else {
        setJustWatchOnCard(card, DBCache[title], title);
      }
    }
  }
  async function startShowRatingInterval() {
    if (settings.Netflix?.showRating) {
      log("started observing| ShowRating");
      let JustWatchInterval = setInterval(function () {
        if (!settings.Netflix?.showRating) {
          clearInterval(JustWatchInterval);
          log("stopped observing| ShowRating");
        } else {
          JustWatch();
        }
      }, 1000);
      let DBCacheInterval = setInterval(function () {
        if (!settings.Netflix?.showRating) clearInterval(DBCacheInterval);
        else setDBCache();
      }, 5000);
    }
  }
  // Disney
  async function startDisneySkipIntroObserver() {
    if (settings.Disney?.skipIntro === undefined || settings.Disney.skipIntro) {
      log("started observing| Intro");
      Disney_Intro();
      DisneySkipIntroObserver.observe(document, config);
    } else {
      log("stopped observing| Intro");
      DisneySkipIntroObserver.disconnect();
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
  async function startDisneyWatchCreditsObserver() {
    if (settings.Netflix?.watchCredits === undefined || settings.Netflix.watchCredits) {
      log("started observing| Credits");
      Disney_Watch_Credits();
      DisneyWatchCreditsObserver.observe(document, config);
    } else {
      log("stopped observing| Credits");
      DisneyWatchCreditsObserver.disconnect();
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
  async function startNetflixWatchCreditsObserver() {
    if (settings.Netflix?.watchCredits === undefined || settings.Netflix.watchCredits) {
      Netflix_Watch_Credits();
      log("started observing| Credits");
      NetflixWatchCreditsObserver.observe(document, NetflixConfig);
    } else {
      log("stopped observing| Credits");
      NetflixWatchCreditsObserver.disconnect();
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
      Amazon_Credits();
      AmazonSkipCreditsObserver.observe(document, AmazonSkipCreditsConfig);
    } else {
      log("stopped observing| Credits");
      AmazonSkipCreditsObserver.disconnect();
    }
  }
  async function startAmazonWatchCreditsObserver() {
    if (settings.Amazon?.watchCredits === undefined || settings.Amazon.watchCredits) {
      log("started observing| Credits");
      Amazon_Watch_Credits();
      AmazonWatchCreditsObserver.observe(document, AmazonSkipCreditsConfig);
    } else {
      log("stopped observing| Credits");
      AmazonWatchCreditsObserver.disconnect();
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
