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
// matches all amazon urls under https://en.wikipedia.org/wiki/Amazon_(company)#Website
const hostname = window.location.hostname;
const title = document.title;
const url = window.location.href;
const ua = navigator.userAgent;
// only on prime video pages
const isPrimeVideo = /amazon|primevideo/i.test(hostname) && (/video/i.test(title) || /video/i.test(url));
const isNetflix = /netflix/i.test(hostname);
const isDisney = /disneyplus|starplus/i.test(hostname);
const isHotstar = /hotstar/i.test(hostname);
const isCrunchyroll = /crunchyroll/i.test(hostname);
const isStarPlus = /starplus/i.test(hostname);

const isMobile = /mobile|streamingEnhanced/i.test(ua);
const isEdge = /edg/i.test(ua);
// const isFirefox = /firefox/i.test(ua);
// const isChrome = /chrome/i.test(ua);
const version = "1.0.94";
if (isPrimeVideo || isNetflix || isDisney || isHotstar || isCrunchyroll) {
  /* eslint-env root:true */
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
      Disney: { skipIntro: true, skipCredits: true, watchCredits: false, speedSlider: true, showRating: true },
      Crunchyroll: { skipIntro: true, speedSlider: true, releaseCalendar: true },
      Video: { playOnFullScreen: true, epilepsy: false, userAgent: true },
      Statistics: { AmazonAdTimeSkipped: 0, NetflixAdTimeSkipped: 0, IntroTimeSkipped: 0, RecapTimeSkipped: 0, SegmentsSkipped: 0 },
      General: { profileName: null, profilePicture: null, sliderSteps: 1, sliderMin: 5, sliderMax: 20, filterDub: true, filterQueued: true },
    },
  };
  let settings = defaultSettings.settings;
  let DBCache = {};
  let lastAdTimeText = 0;
  let videoSpeed = 1;
  async function setVideoSpeed(speed) {
    videoSpeed = speed;
  }
  resetBadge();
  async function getDBCache() {
    chrome.storage.local.get("DBCache", function (result) {
      DBCache = result?.DBCache;
      if (typeof DBCache !== "object") {
        log("DBCache not found, creating new one", DBCache);
        chrome.storage.local.set({ DBCache: {} });
        DBCache = {};
      }
      if (isNetflix) {
        if (settings.Netflix?.showRating) startShowRatingInterval();
      } else if (isDisney || isHotstar) {
        if (settings.Disney?.showRating) startShowRatingInterval();
      } else if (isPrimeVideo) {
        if (settings.Amazon?.showRating) startShowRatingInterval();
      }
    });
  }
  function logStartOfAddon() {
    console.log(
      "%cNetflix%c/%cPrime%c Auto-Skip",
      "color: #e60010;font-size: 2em;",
      "color: white;font-size: 2em;",
      "color: #00aeef;font-size: 2em;",
      "color: white;font-size: 2em;"
    );
    console.log("version:", version);
    console.log("Settings", settings);
    if (isNetflix) console.log("Page %cNetflix", "color: #e60010;");
    else if (isPrimeVideo) console.log("Page %cAmazon", "color: #00aeef;");
    else if (isDisney) console.log("Page %cDisney", "color: #0682f0;");
    else if (isHotstar) console.log("Page %cHotstar", "color: #0682f0;");
    else if (isCrunchyroll) console.log("Page %cCrunchyroll", "color: #e67a35;");
    else if (isStarPlus) console.log("Page %cStarPlus", "color: #fe541c;");
  }
  function startNetflix(Netflix) {
    if (Netflix?.profile) AutoPickProfile();
    if (Netflix?.skipAd) Netflix_SkipAdInterval();
    NetflixObserver.observe(document, config);
  }
  function startAmazon(Amazon) {
    AmazonSkipIntroObserver.observe(document, AmazonSkipIntroConfig);
    AmazonObserver.observe(document, config);
    if (Amazon?.skipAd) Amazon_AdTimeout();
    if (Amazon?.blockFreevee) {
      // timeout of 100 ms because the ad is not loaded fast enough and the video will crash
      setTimeout(function () {
        Amazon_FreeveeTimeout();
      }, 1000);
    }
    if (Amazon?.continuePosition) setTimeout(() => Amazon_continuePosition(), 500);
    if (settings.Video?.userAgent && isMobile) Amazon_customizeMobileView();
  }
  chrome.storage.sync.get("settings", function (result) {
    // if there is an undefined setting, set it to the default
    // apparently 2 depth gets overwritten so here it is
    settings.Amazon = { ...defaultSettings.settings.Amazon, ...result.settings.Amazon };
    settings.Netflix = { ...defaultSettings.settings.Netflix, ...result.settings.Netflix };
    settings.Disney = { ...defaultSettings.settings.Disney, ...result.settings.Disney };
    settings.Crunchyroll = { ...defaultSettings.settings.Crunchyroll, ...result.settings.Crunchyroll };
    settings.Video = { ...defaultSettings.settings.Video, ...result.settings.Video };
    settings.Statistics = { ...defaultSettings.settings.Statistics, ...result.settings.Statistics };
    settings.General = { ...defaultSettings.settings.General, ...result.settings.General };
    logStartOfAddon();
    getDBCache();

    if (isNetflix) startNetflix(settings.Netflix);
    else if (isPrimeVideo) startAmazon(settings.Amazon);
    else if (isDisney || isHotstar) DisneyObserver.observe(document, config);
    else if (isCrunchyroll) Crunchyroll_ReleaseCalendar();
    if (settings?.Video?.playOnFullScreen) startPlayOnFullScreen();
  });
  chrome.storage.local.onChanged.addListener(function (changes) {
    if (changes?.DBCache) DBCache = changes.DBCache.newValue;
  });
  chrome.storage.sync.onChanged.addListener(function (changes) {
    if (changes?.settings) {
      const { oldValue, newValue } = changes.settings;
      settings = newValue;
      log("settings", "Old value:", oldValue, ", new value:", newValue);
      if (isNetflix) NetflixSettingsChanged(oldValue?.Netflix, newValue?.Netflix);
      else if (isPrimeVideo) AmazonSettingsChanged(oldValue?.Amazon, newValue?.Amazon);
      else if (isDisney || isHotstar) DisneySettingsChanged(oldValue?.Disney, newValue?.Disney);

      if (!oldValue || newValue.Video.playOnFullScreen !== oldValue?.Video?.playOnFullScreen) startPlayOnFullScreen();
      if (oldValue?.Video?.userAgent != undefined && newValue.Video.userAgent !== oldValue?.Video?.userAgent) location.reload();
    }
  });
  function NetflixSettingsChanged(oldValue, newValue) {
    if (!oldValue?.skipAd && newValue.skipAd) Netflix_SkipAdInterval();
    if (!oldValue?.showRating && newValue.showRating) startShowRatingInterval();
  }
  function AmazonSettingsChanged(oldValue, newValue) {
    if (!oldValue?.skipAd && newValue.skipAd) Amazon_AdTimeout();
    if (!oldValue?.blockFreevee && newValue.blockFreevee) Amazon_FreeveeTimeout();
    if (!oldValue?.continuePosition && newValue.continuePosition) Amazon_continuePosition();
  }
  function DisneySettingsChanged(oldValue, newValue) {
    if (!oldValue?.showRating && newValue.showRating) startShowRatingInterval();
  }
  async function addSkippedTime(startTime, endTime, key) {
    if (typeof startTime === "number" && typeof endTime === "number" && endTime > startTime) {
      log(key, endTime - startTime);
      settings.Statistics[key] += endTime - startTime;
      increaseBadge();
    }
  }
  // ...args
  const date = new Date();
  function log(...args) {
    console.log(date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(), ...args);
  }
  // set DB Cache if cache size under 2MB
  function setDBCache() {
    const size = new TextEncoder().encode(JSON.stringify(DBCache)).length;
    const kiloBytes = size / 1024;
    const megaBytes = kiloBytes / 1024;
    if (megaBytes < 2) {
      chrome.storage.local.set({ DBCache });
    } else {
      log("DBCache cleared", megaBytes);
      DBCache = {};
      chrome.storage.local.set({ DBCache });
    }
  }
  // chrome.storage.local.set({ DBCache: {} });
  // justWatchAPI
  const today = date.toISOString().split("T")[0];
  async function getMovieInfo(title, card, year = null) {
    // justwatch api
    // const url = `https://apis.justwatch.com/content/titles/${locale}/popular?language=en&body={"page_size":1,"page":1,"query":"${title}","content_types":["show","movie"]}`;
    let locale = "en-US";
    if (navigator?.language) {
      locale = navigator?.language;
    }
    // use the url for themoviedb.org now
    let url = `https://api.themoviedb.org/3/search/multi?query=${encodeURI(title)}&include_adult=false&language=${locale}&page=1`;
    if (year) url += `&year=${year}`;
    // const response = await fetch(encodeURI(url));
    // const data = await response.json();
    try {
      chrome.runtime.sendMessage({ url }, function (data) {
        if (data != undefined && data != "") {
          // themoviedb
          let compiledData = {};
          // for (movie of data?.results) {
          //   if (movie.title.toLowerCase().includes(title.toLowerCase())) {
          //     compiledData = { score: movie?.vote_average, release_date: movie?.release_date, date: today, db: "tmdb" };
          //     break;
          //   }
          // }
          const movie = data?.results?.[0];
          compiledData = { score: movie?.vote_average, release_date: movie?.release_date, title: movie?.title, date: today, db: "tmdb" };
          DBCache[title] = compiledData;
          // if (!compiledData?.score) {
          //   log("no Score found:", title, data);
          // }
          setRatingOnCard(card, compiledData, title);
        }
        // else {
        //   DBCache[title] = { score: null, release_date: null, title: title, date: today, db: "tmdb" };
        //   log("no Score found data undefined", title, data);
        // }
      });
    } catch (error) {
      log(error);
      if (error.toString().includes("Extension context invalidated")) {
        location.reload();
      }
    }
  }

  // -----------------------   functions   ---------------------------------
  // default Options for the observer (which mutations to observe)
  const config = { attributes: true, childList: true, subtree: true };

  // shared functions
  async function startShowRatingInterval() {
    addRating();
    let RatingInterval = setInterval(function () {
      if (
        (isNetflix && !settings.Netflix?.showRating) ||
        (isPrimeVideo && !settings.Amazon?.showRating) ||
        ((isDisney || isHotstar) && !settings.Disney?.showRating)
      ) {
        log("stopped adding Rating");
        clearInterval(RatingInterval);
        return;
      }
      addRating();
    }, 1000);
    let DBCacheInterval = setInterval(function () {
      if (
        (isNetflix && !settings.Netflix?.showRating) ||
        (isPrimeVideo && !settings.Amazon?.showRating) ||
        ((isDisney || isHotstar) && !settings.Disney?.showRating)
      ) {
        log("stopped DBCacheInterval");
        clearInterval(DBCacheInterval);
        return;
      }
      setDBCache();
    }, 5000);
  }
  function getDiffInDays(firstDate, secondDate) {
    if (!firstDate || !secondDate) return 31;
    return Math.round(Math.abs(new Date(secondDate).getTime() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24));
  }
  function useDBCache(title, card) {
    if (!DBCache[title]?.date) DBCache[title].date = today;
    const diffInReleaseDate = getDiffInDays(DBCache[title]?.release_date, date) <= 20 && getDiffInDays(DBCache[title].date, date) > 0;
    if (getDiffInDays(DBCache[title].date, date) >= 30 || diffInReleaseDate) {
      if (diffInReleaseDate) log("update recent movie:", title, ",Age:", getDiffInDays(DBCache[title]?.release_date, date));
      else log("update old rating:", title, ",Age:", getDiffInDays(DBCache[title].date, date));
      getMovieInfo(title, card);
      // log("no info today", title);
    } else {
      setRatingOnCard(card, DBCache[title], title);
    }
  }
  async function addRating() {
    let titleCards;
    if (isNetflix) titleCards = document.querySelectorAll(".title-card .boxart-container:not(.imdb)");
    else if (isDisney) titleCards = document.querySelectorAll(".basic-card div div img:not(.imdb)");
    else if (isHotstar) titleCards = document.querySelectorAll(".swiper-slide img:not(.imdb)");
    // amazon
    else titleCards = document.querySelectorAll("li:not(.imdb) [data-card-title]");
    // on disney there are multiple images for the same title so only use the first one
    let lastTitle = "";
    // for each is not going in order on chrome
    for (let i = 0; i < titleCards.length; i++) {
      let card = titleCards[i];
      // add seen class
      if (isNetflix || isDisney || isHotstar) card.classList.add("imdb");
      //Amazon
      else {
        let parent = card?.parentElement;
        while (parent) {
          if (parent.tagName == "LI") break;
          parent = parent.parentElement;
        }
        if (parent) parent.classList.add("imdb");
      }
      let title;
      if (isNetflix) title = card?.children?.[1]?.firstChild?.textContent.split(" – ")[0];
      // S2: E3 remove this part
      else if (isDisney)
        title = card
          ?.getAttribute("alt")
          ?.replace(/(S\d+:\s?E\d+\s)/g, "")
          ?.split(". ")[0];
      else if (isHotstar) title = card?.getAttribute("alt")?.replace(/(S\d+\sE\d+)/g, "");
      // amazon
      // remove everything after - in the title
      else
        title = card
          .getAttribute("data-card-title")
          .split(" - ")[0]
          .split(" – ")[0]
          .replace(/(S\d+)/g, "")
          .replace(/\[dt\.?\/OV\]/g, "")
          .replace(/\[OV\]/g, "")
          .replace(/\s\(.*\)/g, "")
          .replace(/:?\sStaffel-?\s\d+/g, "")
          .replace(/:?\sSeason-?\s\d+/g, "")
          .split(", ")[0];

      // sometimes more than one image is loaded for the same title
      if (title && lastTitle != title && !title.includes("Netflix") && !title.includes("Prime Video")) {
        lastTitle = title;
        if (DBCache[title]?.score || getDiffInDays(DBCache[title]?.date, date) <= 1) {
          useDBCache(title, card);
        } else getMovieInfo(title, card);
      }
    }
  }

  async function setRatingOnCard(card, data, title) {
    let div = document.createElement("div");
    // right: 1.5vw;
    div.style =
      "position: absolute;bottom: 0;right:0;z-index: 9999;color: black;background: #f5c518;border-radius: 5px;padding: 0 2px 0 2px;" +
      (isMobile ? "font-size: 4vw;" : "font-size: 1vw;");
    // div.id = "imdb";
    if (data?.score) {
      div.textContent = data.score?.toFixed(1);
      // div.textContent = title;
    } else {
      div.textContent = "?";
      log("no score found:", title, data);
    }
    if (isNetflix) card.appendChild(div);
    else if (isDisney || isHotstar) card.parentElement?.appendChild(div);
    else card.firstChild.firstChild.appendChild(div);
  }
  function OnFullScreenChange() {
    let video;
    if (isNetflix || isDisney || isHotstar) video = document.querySelector("video");
    else video = document.querySelector(AmazonVideoClass);
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

  // Disney Observers
  const DisneyObserver = new MutationObserver(Disney);
  function Disney() {
    let video = document.querySelector("video");
    if (!video) video = document.querySelector("disney-web-player")?.shadowRoot?.firstChild?.firstChild;
    const time = video?.currentTime;
    if (settings.Disney?.skipIntro) Disney_Intro(video, time);
    Disney_Credits();
    Disney_addHomeButton();
    if (settings.Disney?.watchCredits) Disney_Watch_Credits();
    if (settings.Disney?.speedSlider) Disney_SpeedSlider(video);
  }
  let SetTimeToZeroOnce = null;
  let OriginalIntro = 0;
  function resetOriginalIntro() {
    setTimeout(() => {
      OriginalIntro = 0;
    }, 5000);
  }
  function Disney_Intro(video, time) {
    // intro star wars andor Season 1 episode 2
    // Recap Criminal Minds Season 1 Episode 2
    let button;
    if (isDisney) {
      if (!document.querySelector('[data-gv2elementkey="playNext"]')) button = document.querySelector(".skip__button");
    } else button = document.evaluate("//span[contains(., 'Skip')]", document, null, XPathResult.ANY_TYPE, null)?.iterateNext()?.parentElement;
    if (button) {
      button.click();
      log("Recap skipped", button);
      setTimeout(function () {
        addSkippedTime(time, video?.currentTime, "RecapTimeSkipped");
      }, 600);
    }
    // if original disney show skip the disney+ intro
    if (video?.play && !OriginalIntro && video.duration < 5) {
      OriginalIntro = video.duration;
      resetOriginalIntro();
      video.currentTime = video.duration;
      console.log("skipped Original intro");
    }
    // if intro/recap time starts at 0 there is no skip button so always rewind to 0
    if (video?.play && SetTimeToZeroOnce != video.src && video.duration > 5 && !OriginalIntro) {
      if (video.currentTime > 0.2 && video.currentTime < 5) {
        console.log("reset time to", video.currentTime);
        video.currentTime = 0;
        SetTimeToZeroOnce = video.src;
      }
    }
  }
  function Disney_Credits() {
    let button;
    if (isStarPlus) button = document.querySelector('[data-gv2elementkey="playNext"]');
    else if (isDisney && !document.querySelector('[data-testid="playback-action-button"]'))
      button = document.querySelector('[data-testid="icon-restart"]')?.parentElement;
    else button = document.evaluate("//span[contains(., 'Next Episode')]", document, null, XPathResult.ANY_TYPE, null)?.iterateNext()?.parentElement;
    if (button) {
      // only skip if the next video is the next episode of a series (there is a timer)
      let time;
      if (isDisney) time = /\d+/.exec(button.textContent)?.[0];
      if (
        (isHotstar && !document.evaluate("//span[contains(., 'My Space')]", document, null, XPathResult.ANY_TYPE, null)?.iterateNext()) ||
        (time && lastAdTimeText != time)
      ) {
        const videoFullscreen = document.fullscreenElement !== null;
        lastAdTimeText = time;
        if (settings.Disney?.skipCredits) {
          button.click();
          log("Credits skipped", button);
          increaseBadge();
          resetLastATimeText();
        }
        setTimeout(function () {
          if (videoFullscreen && document.fullscreenElement == null) {
            chrome.runtime.sendMessage({ type: "fullscreen" });
            function resetFullscreen() {
              chrome.runtime.sendMessage({ type: "exitFullscreen" });
              console.log("exitFullscreen");
              removeEventListener("fullscreenchange", resetFullscreen);
            }
            addEventListener("fullscreenchange", resetFullscreen);
            document.onkeydown = function (evt) {
              if ("key" in evt && (evt.key === "Escape" || evt.key === "Esc")) {
                chrome.runtime.sendMessage({ type: "exitFullscreen" });
              }
            };
            log("fullscreen");
          }
        }, 1000);
      }
    }
  }
  function Disney_addHomeButton() {
    // add home button to the end of the credits
    const buttonDiv = document.querySelector('[data-testid="browser-action-button"]')?.parentElement;
    if (buttonDiv && !document.querySelector("#homeButton")) {
      const homeButton = document.createElement("button");
      homeButton.textContent = "Home";
      homeButton.id = "homeButton";
      homeButton.style =
        'color: white;background-color: #40424A;border: rgb(64, 66, 74);border-radius: 5px;padding: 0 2px 0 2px;height: 56px;padding-left: 24px;padding-right: 24px;letter-spacing: 1.76px;font-size: 15px;  text-transform: uppercase;cursor: pointer;font-family:"Avenir-World-for-Disney-Demi", sans-serif;';
      // add hover effect
      homeButton.onmouseover = function () {
        homeButton.style.backgroundColor = "#474a53";
      };
      homeButton.onmouseout = function () {
        homeButton.style.backgroundColor = "#40424A";
      };
      homeButton.onclick = function () {
        window.location.href = "/";
      };
      buttonDiv.appendChild(homeButton);
    }
  }
  function Disney_Watch_Credits() {
    let button;
    if (isStarPlus) button = document.querySelector('[data-gv2elementkey="playNext"]');
    else if (isDisney && !document.querySelector('[data-testid="playback-action-button"]'))
      button = document.querySelector('[data-testid="icon-restart"]')?.parentElement;
    else button = document.evaluate("//span[contains(., 'Next Episode')]", document, null, XPathResult.ANY_TYPE, null)?.iterateNext()?.parentElement;
    if (button) {
      // only skip if the next video is the next episode of a series (there is a timer)
      let time;
      if (isDisney) time = /\d+/.exec(button.textContent)?.[0];
      if (
        (isHotstar && !document.evaluate("//span[contains(., 'My Space')]", document, null, XPathResult.ANY_TYPE, null)?.iterateNext()) ||
        (time && lastAdTimeText != time)
      ) {
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
  function createSlider(video, position, sliderStyle, speedStyle) {
    videoSpeed = videoSpeed || video.playbackRate;

    let slider = document.createElement("input");
    slider.id = "videoSpeedSlider";
    slider.type = "range";
    slider.min = settings.General.sliderMin;
    slider.max = settings.General.sliderMax;
    slider.value = videoSpeed * 10;
    slider.step = settings.General.sliderSteps;
    slider.style = sliderStyle;
    position.insertBefore(slider, position.firstChild);

    let speed = document.createElement("p");
    speed.id = "videoSpeed";
    speed.textContent = videoSpeed ? videoSpeed.toFixed(1) + "x" : "1.0x";
    speed.style = speedStyle;
    position.insertBefore(speed, position.firstChild);

    if (videoSpeed) video.playbackRate = videoSpeed;
    speed.onclick = function () {
      slider.style.display = slider.style.display === "block" ? "none" : "block";
    };
    slider.oninput = function () {
      speed.textContent = (this.value / 10).toFixed(1) + "x";
      video.playbackRate = this.value / 10;
      setVideoSpeed(this.value / 10);
    };

    return { slider, speed };
  }

  const DisneySliderStyle = "pointer-events: auto;background: rgb(221, 221, 221);display: none;width:200px;";
  const DisneySpeedStyle = "height:10px;color:#f9f9f9;pointer-events: auto;position: relative;bottom: 8px;padding: 0 5px;";
  function Disney_SpeedSlider(video) {
    // remove subtitle background
    let subtitles = document.querySelectorAll(".dss-subtitle-renderer-line:not(.enhanced)");
    subtitles.forEach((b) => {
      b.classList.add("enhanced");
      b.style.backgroundColor = "transparent";
      b.style.textShadow = "0px 0px 7px black";
    });
    if (video) {
      let alreadySlider = document.querySelector("#videoSpeedSlider");
      if (!alreadySlider) {
        // infobar position for the slider to be added
        let position;
        if (isDisney) position = document.querySelector(".controls__right");
        else position = document.querySelector(".icon-player-landscape")?.parentElement?.parentElement?.parentElement?.parentElement;
        if (position) createSlider(video, position, DisneySliderStyle, DisneySpeedStyle);
      } else {
        // need to resync the slider with the video sometimes
        let speed = document.querySelector("#videoSpeed");
        if (video.playbackRate != alreadySlider.value / 10) {
          video.playbackRate = alreadySlider.value / 10;
        }
        alreadySlider.oninput = function () {
          speed.textContent = (this.value / 10).toFixed(1) + "x";
          video.playbackRate = this.value / 10;
          setVideoSpeed(this.value / 10);
        };
      }
    }
  }
  // Netflix Observer
  const NetflixObserver = new MutationObserver(Netflix);
  function Netflix() {
    const video = document.querySelector("video");
    const time = video?.currentTime;
    const NSettings = settings.Netflix;
    if (NSettings?.profile) Netflix_profile();
    if (NSettings?.skipIntro) {
      if (Netflix_General('[data-uia="player-skip-intro"]', "Intro skipped", false)) {
        setTimeout(function () {
          addSkippedTime(time, video?.currentTime, "IntroTimeSkipped");
        }, 600);
      }
    }
    if (NSettings?.skipRecap) {
      if (
        Netflix_General('[data-uia="player-skip-recap"]', "Recap skipped", false) ||
        Netflix_General('[data-uia="player-skip-preplay"]', "Recap skipped", false)
      ) {
        setTimeout(function () {
          addSkippedTime(time, video?.currentTime, "RecapTimeSkipped");
        }, 600);
      }
    }
    if (NSettings?.skipCredits) Netflix_General('[data-uia="next-episode-seamless-button"]', "Credits skipped");
    if (NSettings?.watchCredits) Netflix_General('[data-uia="watch-credits-seamless-button"]', "Credits watched");
    if (NSettings?.skipBlocked) Netflix_General('[data-uia="interrupt-autoplay-continue"]', "Blocked skipped");
    if (NSettings?.speedSlider) Netflix_SpeedSlider(video);
  }
  // to parse html umlaut symbols like &auml; to ä
  function decodeHtmlEntities(str) {
    return new DOMParser().parseFromString("<!doctype html><body>" + str, "text/html").body.textContent;
  }
  function Netflix_profile() {
    // AutoPickProfile();
    let currentProfile = document.querySelector("[href*='/YourAccount']");
    if (currentProfile) {
      // there is a space before the - thats why slice -1
      const currentProfileName = decodeHtmlEntities(currentProfile?.getAttribute("aria-label")?.split("–")?.[0].split("-")?.[0].slice(0, -1));
      if (currentProfileName && currentProfileName !== settings.General.profileName) {
        // small profile picture
        settings.General.profilePicture = currentProfile?.firstChild?.firstChild?.src;
        settings.General.profileName = currentProfileName;
        chrome.storage.sync.set({ settings });
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
  function Netflix_General(selector, name, incBadge = true) {
    const button = document.querySelector(selector);
    if (button) {
      log(name, button);
      button.click();
      if (incBadge) increaseBadge();
      return true;
    }
    return false;
  }
  function Netflix_SkipAdInterval() {
    let AdInterval = setInterval(() => {
      if (!settings.Netflix?.skipAd) {
        log("stopped observing| Ad");
        clearInterval(AdInterval);
        return;
      }
      const video = document.querySelector("video");
      const adLength = Number(document.querySelector(".ltr-mmvz9h")?.textContent);
      // 16 max but too fast
      if (video) {
        let playBackRate = 8;
        if (isEdge) playBackRate = 3;
        if ((adLength || lastAdTimeText) && video.paused) {
          video.play();
        }
        if (adLength > 8 && video.playbackRate != playBackRate) {
          log("Ad skipped, length:", adLength, "s");
          settings.Statistics.NetflixAdTimeSkipped += adLength;
          increaseBadge();
          if (settings.Video.epilepsy) video.style.opacity = 0;
          video.muted = true;
          video.playbackRate = playBackRate;
          lastAdTimeText = adLength;
        } else if (adLength > 2 && video.playbackRate < 2) {
          video.playbackRate = adLength / 2;
          lastAdTimeText = adLength;
        } // added lastAdTimeText because other speedsliders are not working anymore
        else if (adLength <= 2 || (!adLength && lastAdTimeText)) {
          // videospeed is speedSlider value
          video.muted = false;
          video.playbackRate = videoSpeed;
          lastAdTimeText = 0;
          if (settings.Video.epilepsy) video.style.opacity = 1;
        }
      }
    }, 100);
  }
  const NetflixSliderStyle = "position:relative;bottom:20px;display: none;width:200px;";
  const NetflixSpeedStyle = "position:relative;bottom:20px;font-size: 3em;padding: 0 5px;";
  function Netflix_SpeedSlider(video) {
    // only add speed slider on lowest subscription tier
    // && !document.querySelector('[data-uia="control-speed"]')
    if (video) {
      let alreadySlider = document.querySelector("#videoSpeedSlider");
      if (!alreadySlider) {
        let p = document.querySelector('[data-uia="controls-standard"]')?.firstChild?.children;
        if (p) {
          // infobar position for the slider to be added
          let position = p[p.length - 2]?.firstChild?.lastChild;
          if (position) createSlider(video, position, NetflixSliderStyle, NetflixSpeedStyle);
        }
      }
    }
  }

  // Amazon Observers
  const AmazonVideoClass =
    "#dv-web-player > div > div:nth-child(1) > div > div > div.scalingVideoContainer > div.scalingVideoContainerBottom > div > video";
  const AmazonObserver = new MutationObserver(Amazon);
  function Amazon() {
    const video = document.querySelector(AmazonVideoClass);
    if (settings.Amazon?.skipCredits) Amazon_Credits();
    if (settings.Amazon?.watchCredits) Amazon_Watch_Credits();
    if (settings.Amazon?.speedSlider) Amazon_SpeedSlider(video);
    if (settings.Amazon?.filterPaid) Amazon_FilterPaid();
    if (settings.Amazon?.xray) Amazon_xray();
  }
  const AmazonSkipIntroConfig = { attributes: true, attributeFilter: [".skipelement"], subtree: true, childList: true, attributeOldValue: false };
  // const AmazonSkipIntro = new RegExp("skipelement", "i");
  const AmazonSkipIntroObserver = new MutationObserver(Amazon_Intro);
  function Amazon_Intro() {
    if (settings.Amazon?.skipIntro) {
      // skips intro and recap
      // recap on lucifer season 3 episode 3
      // intro lucifer season 3 episode 4
      let button = document.querySelector("[class*=skipelement]");
      if (button) {
        let video = document.querySelector(AmazonVideoClass);
        const time = video?.currentTime;
        if (time) {
          button.click();
          log("Intro skipped", button);
          //delay where the video is loaded
          setTimeout(function () {
            AmazonGobackbutton(video, time, video.currentTime);
            addSkippedTime(time, video.currentTime, "IntroTimeSkipped");
          }, 50);
        }
      }
    }
  }
  let reverseButton = false;
  async function AmazonGobackbutton(video, startTime, endTime) {
    if (!reverseButton) {
      reverseButton = true;
      // go back button
      const button = document.createElement("button");
      button.style = "padding: 0px 22px; line-height: normal; min-width: 0px";
      button.setAttribute("class", "fqye4e3 f1ly7q5u fk9c3ap fz9ydgy f1xrlb00 f1hy0e6n fgbpje3 f1uteees f1h2a8xb  f1cg7427 fiqc9rt fg426ew f1ekwadg");
      button.setAttribute("data-uia", "reverse-button");
      button.textContent = "Watch skipped ?";
      document.querySelector(".f18oq18q.f6suwnu.fhxjtbc.f1ngx5al").appendChild(button);
      let buttonInHTML = document.querySelector('[data-uia="reverse-button"]');
      function goBack() {
        video.currentTime = startTime;
        buttonInHTML.remove();
        log("stopped observing| Intro");
        AmazonSkipIntroObserver.disconnect();
        const waitTime = endTime - startTime + 2;
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
  async function Amazon_Credits() {
    const button = document.querySelector("[class*=nextupcard-button]");
    if (button) {
      // only skipping to next episode not an entirely new series
      const newEpNumber = document.querySelector("[class*=nextupcard-episode]");
      if (newEpNumber && !/(?<!\S)1(?!\S)/.exec(newEpNumber.textContent) && lastAdTimeText != newEpNumber.textContent) {
        lastAdTimeText = newEpNumber.textContent;
        resetLastATimeText();
        button.click();
        increaseBadge();
        log("skipped Credits", button);
      }
    }
  }
  async function Amazon_Watch_Credits() {
    let button = document.querySelector("[class*=nextupcardhide-button]");
    if (button) {
      button.click();
      increaseBadge();
      log("Watched Credits", button);
    }
  }
  const AmazonSliderStyle = "height: 1em;background: rgb(221, 221, 221);display: none;width:200px;";
  async function Amazon_SpeedSlider(video) {
    // remove bad background hue which is annoying
    //document.querySelector(".fkpovp9.f8hspre").style.background = "rgba(0, 0, 0, 0.25)";
    let b = document.querySelector(".fkpovp9.f8hspre:not(.enhanced)");
    if (b) {
      b.classList.add("enhanced");
      b.style.backgroundColor = "transparent";
      b.style.background = "transparent";
    }
    // remove subtitle background
    b = document.querySelector(".atvwebplayersdk-captions-text:not(.enhanced)");
    if (b) {
      b.classList.add("enhanced");
      b.style.backgroundColor = "transparent";
      b.style.textShadow = "0px 0px 7px black";
    }
    if (video) {
      let alreadySlider = document.querySelector("#videoSpeedSlider");
      if (!alreadySlider) {
        // infobar position for the slider to be added
        let position = document.querySelector("[class*=infobar-container]")?.firstChild?.lastChild;
        if (position) createSlider(video, position, AmazonSliderStyle, "");
      } else {
        // need to resync the slider with the video sometimes
        let speed = document.querySelector("#videoSpeed");
        if (video.playbackRate != alreadySlider.value / 10) {
          video.playbackRate = alreadySlider.value / 10;
        }
        alreadySlider.oninput = function () {
          speed.textContent = (this.value / 10).toFixed(1) + "x";
          video.playbackRate = this.value / 10;
        };
      }
    }
  }
  async function Amazon_continuePosition() {
    const div = document.querySelector("._2RwnU5.dynamic-type-ramp.dv-fable-breakpoints.VYbJYb.yL46mS.kK-hEr");
    if (div) {
      let a = document.querySelector('.j5ZgN-.r0m8Kk._0rmWBt[data-testid="card-overlay"]');
      let maxSectionDepth = 10;
      while (a?.parentElement && maxSectionDepth > 0) {
        a = a.parentElement;
        maxSectionDepth--;
        if (a?.classList?.contains("+OSZzQ")) break;
      }
      const insertBefore = div.childNodes[2];
      if (a && insertBefore) {
        // move continue category to the top
        div.insertBefore(a, insertBefore);
        // continueCategory.remove();
      }
    }
  }
  async function Amazon_FilterPaid() {
    // if not on the shop page or homepremiere
    if (!url.includes("contentId=store") && !url.includes("contentId=homepremiere") && !url.includes("contentType=merch")) {
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
  function Amazon_FreeveeTimeout() {
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
  async function skipAd(video) {
    // Series grimm
    let adTimeText = document.querySelector(".atvwebplayersdk-ad-timer-text");
    if (adTimeText) {
      adTimeText = adTimeText?.childNodes?.[1];
      let adTime;
      if (adTimeText)
        adTime = parseInt(/:\d+/.exec(adTimeText.textContent)?.[0].substring(1)) + parseInt(/\d+/.exec(adTimeText.textContent)?.[0]) * 60;
      // !document.querySelector(".fu4rd6c.f1cw2swo") so it doesn't try to skip when the self ad is playing
      if (!document.querySelector(".fu4rd6c.f1cw2swo") && typeof adTime === "number" && adTime > 1 && lastAdTimeText != adTime) {
        lastAdTimeText = adTime;
        resetLastATimeText();
        // getting stuck loading when skipping ad longer than 100 seconds i think
        // let skipTime = adTime <= 20 ? adTime - 1 : 20;
        let skipTime = adTime - 1;
        video.currentTime += skipTime;
        log("FreeVee Ad skipped, length:", skipTime, "s");
        settings.Statistics.AmazonAdTimeSkipped += skipTime;
        increaseBadge();
      }
    }
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
          // if video is playing
          if (getComputedStyle(document.querySelector("#dv-web-player")).display != "none") {
            let button = document.querySelector(".fu4rd6c.f1cw2swo");
            if (button) {
              // only getting the time after :08
              let adTime = parseInt(/:\d+/.exec(document.querySelector(".atvwebplayersdk-adtimeindicator-text").innerHTML)?.[0].substring(1));
              // wait for 100ms before skipping to make sure the button is not pressed too fast, or there will be infinite loading
              setTimeout(() => {
                button.click();
                if (typeof adTime === "number") settings.Statistics.AmazonAdTimeSkipped += adTime;
                increaseBadge();
                log("Self Ad skipped, length:", adTime, button);
              }, 150);
            }
          }
        };
      }
    }, 100);
  }

  async function Amazon_customizeMobileView() {
    console.log("customizeMobileView");
    // customize mobile view for desktop website
    if (!document.querySelector(AmazonVideoClass) && !url.includes("/gp/video/detail/")) {
      // add <meta name="viewport" content="width=device-width, initial-scale=1" /> to head
      let meta = document.createElement("meta");
      meta.name = "viewport";
      meta.content = "width=device-width, initial-scale=1";
      document.head.appendChild(meta);

      // make amazon more mobile friendly
      let navBelt = document.querySelector("#nav-belt");
      if (navBelt) {
        navBelt.style.width = "100vw";
        navBelt.style.display = "flex";
        navBelt.style.flexDirection = "column";
        navBelt.style.height = "fit-content";
      }
      let navMain = document.querySelector("#nav-main");
      if (navMain) navMain.style.display = "none";
    }
  }
  async function Amazon_xray() {
    const xrayList = document.querySelector(".xrayQuickViewList");
    if (xrayList) {
      xrayList.remove();
      log("Xray removed");
    }
  }
  // Crunchyroll functions
  function filterQueued(display) {
    document.querySelectorAll("div.queue-flag:not(.queued)").forEach((element) => {
      element.parentElement.parentElement.parentElement.style.display = display;
    });
    if (display == "block" && settings.General.filterDub) filterDub("none");
  }
  function filterDub(display) {
    let list = document.querySelectorAll("cite[itemprop='name']");
    list.forEach((element) => {
      if (element.textContent.includes("Dub")) element.parentElement.parentElement.parentElement.parentElement.parentElement.style.display = display;
    });
    if (display == "block" && settings.General.filterQueued) filterQueued("none");
  }
  function createFilterElement(filterType, filterText, settingsValue, filterFunction) {
    const label = document.createElement("label");
    const span = document.createElement("span");
    span.style = "display: flex;align-items: center;";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = settingsValue;
    input.onclick = function () {
      settings.General[filterType] = this.checked;
      filterFunction(this.checked ? "none" : "block");
      chrome.storage.sync.set({ settings });
    };
    const p = document.createElement("p");
    p.style = "width: 100px;";
    p.textContent = filterText;
    label.appendChild(span);
    span.appendChild(input);
    span.appendChild(p);
    return label;
  }
  function addButtons() {
    const toggleForm = document.querySelector("#filter_toggle_form");
    toggleForm.style.display = "flex";
    toggleForm.firstElementChild.appendChild(createFilterElement("filterQueued", "Show Playlist only", settings.General.filterQueued, filterQueued));
    toggleForm.firstElementChild.appendChild(createFilterElement("filterDub", "Filter Dub", settings.General.filterDub, filterDub));
  }
  async function Crunchyroll_ReleaseCalendar() {
    if (settings.Crunchyroll?.releaseCalendar && url.includes("simulcastcalendar")) {
      // Show playlist only
      filterQueued(settings.General.filterQueued ? "none" : "block");
      filterDub(settings.General.filterDub ? "none" : "block");
      addButtons();
      let days = document.querySelectorAll(".specific-date [datetime]");
      for (const day of days) {
        const date = new Date(day.getAttribute("datetime"));
        const today = new Date();
        // if the day of the week is the same as today click on it, like if its Monday click on Monday
        if (date.getDay() == today.getDay()) {
          day.click();
          break;
        }
      }
    }
  }
  // Badge functions
  // eslint-disable-next-line no-unused-vars
  function setBadgeText(text) {
    try {
      chrome.runtime.sendMessage({
        type: "setBadgeText",
        content: text,
      });
    } catch (error) {
      log(error);
    }
  }
  function increaseBadge() {
    settings.Statistics.SegmentsSkipped++;
    chrome.storage.sync.set({ settings });
    try {
      chrome.runtime.sendMessage({
        type: "increaseBadge",
      });
    } catch (error) {
      log(error);
    }
  }
  function resetBadge() {
    try {
      chrome.runtime.sendMessage({
        type: "resetBadge",
      });
    } catch (error) {
      log(error);
    }
  }
}
