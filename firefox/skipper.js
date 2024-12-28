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
// matches all amazon urls under https://en.wikipedia.org/wiki/Amazon_(company)#Website
const hostname = window.location.hostname;
const title = document.title;
let url = window.location.href;
const ua = navigator.userAgent;
// only on prime video pages
const isPrimeVideo = /amazon|primevideo/i.test(hostname) && (/video/i.test(title) || /video/i.test(url));
const isNetflix = /netflix/i.test(hostname);
const isDisney = /disneyplus|starplus/i.test(hostname);
const isHotstar = /hotstar/i.test(hostname);
const isCrunchyroll = /crunchyroll/i.test(hostname);
const isStarPlus = /starplus/i.test(hostname);
const isHBO = /max.com/i.test(hostname);

const isMobile = /mobile|streamingEnhanced/i.test(ua);
const isEdge = /edg/i.test(ua);
// const isFirefox = /firefox/i.test(ua);
// const isChrome = /chrome/i.test(ua);
const htmlLang = document.documentElement.lang;
const date = new Date();
const today = date.toISOString().split("T")[0];
const version = "1.1.53";
if (isPrimeVideo || isNetflix || isDisney || isHotstar || isCrunchyroll || isHBO) {
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
      Disney: { skipIntro: true, skipCredits: true, watchCredits: false, skipAd: true, speedSlider: true, showRating: true, selfAd: true },
      Crunchyroll: {
        skipIntro: true,
        speedSlider: true,
        releaseCalendar: true,
        dubLanguage: null,
        profile: true,
        bigPlayer: true,
        disableNumpad: true,
      },
      HBO: { skipIntro: true, skipCredits: true, watchCredits: false, speedSlider: true, showRating: true },
      Video: { playOnFullScreen: true, epilepsy: false, userAgent: true, doubleClick: true, scrollVolume: true },
      Statistics: {
        AmazonAdTimeSkipped: 0,
        NetflixAdTimeSkipped: 0,
        DisneyAdTimeSkipped: 0,
        IntroTimeSkipped: 0,
        RecapTimeSkipped: 0,
        SegmentsSkipped: 0,
      },
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
        GCdate: "2024-01-01",
        showYear: false,
      },
    },
  };
  let settings = { ...defaultSettings.settings };
  let DBCache = {};
  let lastAdTimeText = 0;
  let videoSpeed = 1;
  async function setVideoSpeed(speed) {
    videoSpeed = speed;
  }
  resetBadge();
  // how long a record should be kept in the cache
  const GCdiff = 30;
  async function garbageCollection() {
    // clear every rating older than 30 days
    // clear every rating where db != tmdb
    log("garbageCollection started, deleting old ratings:");
    const keys = Object.keys(DBCache);
    for (let key of keys) {
      if (getDiffInDays(DBCache[key].date, date) >= GCdiff || DBCache[key].db != "tmdb") {
        console.log(DBCache[key].date, key);
        delete DBCache[key];
      }
    }
    settings.General.GCdate = today;
    setStorage();
    setDBCache();
  }
  async function getDBCache() {
    browser.storage.local.get("DBCache", function (result) {
      DBCache = result?.DBCache;
      if (typeof DBCache !== "object") {
        log("DBCache not found, creating new one", DBCache);
        try {
          browser.storage.local.set({ DBCache: {} });
        } catch (error) {
          log(error);
        }
        DBCache = {};
      }
      if (isNetflix && settings.Netflix?.showRating) startShowRatingInterval();
      else if (isDisney || isHotstar) {
        if (settings.Disney?.showRating) startShowRatingInterval();
      } else if (isPrimeVideo && settings.Amazon?.showRating) startShowRatingInterval();
      else if (isHBO && settings.HBO?.showRating) startShowRatingInterval();
      if (getDiffInDays(settings.General.GCdate, date) >= GCdiff) garbageCollection();
    });
  }
  function logStartOfAddon() {
    console.log("%cStreaming enhanced", "color: #00aeef;font-size: 2em;");
    console.log("version:", version);
    console.log("Settings", settings);
    if (isNetflix) console.log("Page %cNetflix", "color: #e60010;");
    else if (isPrimeVideo) console.log("Page %cAmazon", "color: #00aeef;");
    else if (isStarPlus) console.log("Page %cStarPlus", "color: #fe541c;");
    else if (isDisney) console.log("Page %cDisney", "color: #0682f0;");
    else if (isHotstar) console.log("Page %cHotstar", "color: #0682f0;");
    else if (isCrunchyroll) console.log("Page %cCrunchyroll", "color: #e67a35;");
    else if (isHBO) console.log("Page %cHBO", "color: #0836f1;");
  }
  function startNetflix(Netflix) {
    if (Netflix?.profile) AutoPickProfile();
    if (Netflix?.skipAd) Netflix_SkipAdInterval();
    NetflixObserver.observe(document, config);
  }
  function startAmazon(Amazon) {
    AmazonSkipIntroObserver.observe(document, AmazonSkipIntroConfig);
    if (settings?.Video?.doubleClick) Amazon_doubleClick();
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
  function startCrunchyroll(Crunchyroll) {
    if (Crunchyroll?.releaseCalendar) Crunchyroll_ReleaseCalendar();
    if (Crunchyroll?.profile) {
      let pickInterval = setInterval(function () {
        Crunchyroll_AutoPickProfile();
      }, 100);
      setTimeout(function () {
        if (settings.Crunchyroll?.bigPlayer) Crunchyroll_bigPlayerStyle();
      }, 1000);
      // only click on profile on page load not when switching profiles
      setTimeout(function () {
        clearInterval(pickInterval);
      }, 2000);
      CrunchyrollObserver.observe(document, config);
    }
  }
  browser.storage.sync.get("settings", function (result) {
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

    logStartOfAddon();
    if (isNetflix) startNetflix(settings.Netflix);
    else if (isPrimeVideo) startAmazon(settings.Amazon);
    else if (isDisney || isHotstar) {
      if (isHotstar) Hotstar_doubleClick();
      DisneyObserver.observe(document, config);
      setInterval(function () {
        let video = Array.from(document.querySelectorAll("video")).find((v) => v.checkVisibility());
        if (settings.Disney?.skipAd) Disney_skipAd(video);
      }, 300);
    } else if (isCrunchyroll) startCrunchyroll(settings.Crunchyroll);
    else if (isHBO) HBOObserver.observe(document, config);
    if (settings?.Video?.playOnFullScreen) startPlayOnFullScreen();
    getDBCache();
  });
  browser.storage.local.onChanged.addListener(function (changes) {
    if (changes?.DBCache) DBCache = changes.DBCache.newValue;
  });
  browser.storage.sync.onChanged.addListener(function (changes) {
    if (changes?.settings) {
      const { oldValue, newValue } = changes.settings;
      settings = newValue;
      log("settings", "Old value:", oldValue, ", new value:", newValue);
      if (isNetflix) NetflixSettingsChanged(oldValue?.Netflix, newValue?.Netflix);
      else if (isPrimeVideo) AmazonSettingsChanged(oldValue?.Amazon, newValue?.Amazon);
      else if (isDisney || isHotstar) DisneySettingsChanged(oldValue?.Disney, newValue?.Disney);
      else if (isHBO) HBOSettingsChanged(oldValue?.HBO, newValue?.HBO);

      if (!oldValue || newValue.Video.playOnFullScreen !== oldValue?.Video?.playOnFullScreen) startPlayOnFullScreen();
      if (!oldValue || newValue.Video.doubleClick !== oldValue?.Video?.doubleClick) Amazon_doubleClick();
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
    if (!oldValue?.showRating && newValue.showRating) startShowRatingInterval();
  }
  function DisneySettingsChanged(oldValue, newValue) {
    if (!oldValue?.showRating && newValue.showRating) startShowRatingInterval();
  }
  function HBOSettingsChanged(oldValue, newValue) {
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
  function log(...args) {
    console.log(date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(), ...args);
  }
  // set DB Cache if cache size under 2MB
  async function setDBCache() {
    const size = new TextEncoder().encode(JSON.stringify(DBCache)).length;
    const kiloBytes = size / 1024;
    const megaBytes = kiloBytes / 1024;
    if (megaBytes < 5) {
      log("updateDBCache size:", megaBytes.toFixed(4) + " MB");
      browser.storage.local.set({ DBCache });
    } else {
      log("DBCache cleared", megaBytes);
      DBCache = {};
      browser.storage.local.set({ DBCache });
    }
  }
  async function getMovieInfo(title, card, media_type = null, year = null) {
    // justwatch api
    // const url = `https://apis.justwatch.com/content/titles/${locale}/popular?language=en&body={"page_size":1,"page":1,"query":"${title}","content_types":["show","movie"]}`;
    let locale = htmlLang || navigator?.language || "en-US";
    const queryType = media_type || "multi";
    let url = `https://api.themoviedb.org/3/search/${queryType}?query=${encodeURI(title)}&include_adult=false&language=${locale}&page=1`;
    if (year) url += `&year=${year}`;
    // const response = await fetch(encodeURI(url));
    // const data = await response.json();
    try {
      browser.runtime.sendMessage({ url }, function (data) {
        if (data != undefined && data != "") {
          // themoviedb
          let compiledData = {};
          const movie = data?.results?.[0];
          compiledData = {
            id: movie?.id,
            media_type: queryType == "multi" ? movie?.media_type : queryType,
            score: movie?.vote_average,
            vote_count: movie?.vote_count,
            release_date: movie?.release_date || movie?.first_air_date,
            title: movie?.title || movie?.original_title || movie?.name || movie?.original_name,
            date: today,
            db: "tmdb",
          };
          // if (
          //   compiledData?.title &&
          //   !compiledData.title
          //     .toLowerCase()
          //     .replace(":", "")
          //     .replace("-", "")
          //     .replace(",", "")
          //     .includes(title.toLowerCase().replace(":", "").replace("-", "").replace(",", ""))
          // ) {
          //   console.log(
          //     "Title mismatch",
          //     title.replace(":", "").replace("-", "").replace(",", "") + "><" + compiledData.title.replace(":", "").replace("-", "").replace(",", "")
          //   );
          // }
          DBCache[title] = compiledData;
          setRatingOnCard(card, compiledData, title);
        }
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
  // #region Shared funcs
  // shared functions
  // show rating depending on page
  const uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/g;
  function showRating() {
    if (isDisney) {
      url = window.location.href;
      // disable search and suggested movies
      if (url.includes("search")) return false;
      if (url.includes("entity")) {
        const SelectedTab = document.querySelector('[aria-selected="true"]');
        return uuidRegex.test(SelectedTab?.id.split("_control")[0]) && SelectedTab?.getAttribute("aria-label") != "EXTRAS";
      }
      return true;
    } else if (isPrimeVideo) {
      // suggested movies
      if (window.location.href.includes("detail")) {
        return document.querySelector('[data-testid="btf-related-tab"]')?.tabIndex == 0;
      }
      return true;
    } else return true;
  }
  async function startShowRatingInterval() {
    if (showRating()) addRating();
    let RatingInterval = setInterval(function () {
      if (
        (isNetflix && !settings.Netflix?.showRating) ||
        (isPrimeVideo && !settings.Amazon?.showRating) ||
        ((isDisney || isHotstar) && !settings.Disney?.showRating) ||
        (isHBO && !settings.HBO?.showRating)
      ) {
        log("stopped adding Rating");
        clearInterval(RatingInterval);
        return;
      }
      if (showRating()) addRating();
    }, 1000);
  }
  function getDiffInDays(firstDate, secondDate) {
    if (!firstDate || !secondDate) return 31;
    return Math.round(Math.abs(new Date(secondDate).getTime() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24));
  }
  function useDBCache(title, card, media_type) {
    if (!DBCache[title]?.date) DBCache[title].date = today;
    const vote_count = DBCache[title]?.vote_count || 100;
    const diffInReleaseDate =
      // vote count is under 80 inaccurate rating
      vote_count < 100 &&
      // did not refresh rating in the last 0 days
      getDiffInDays(DBCache[title].date, date) > 0 &&
      // release date is in the last 50 days after not many people will
      getDiffInDays(DBCache[title]?.release_date, date) <= 50;

    // refresh rating if older than 30 days or release date is in last month and vote count is under 100
    if (getDiffInDays(DBCache[title].date, date) >= GCdiff || diffInReleaseDate) {
      if (diffInReleaseDate)
        log("update recent movie:", title, ",Age:", getDiffInDays(DBCache[title]?.release_date, date), "Vote count:", vote_count);
      else log("update old rating:", title, ",Age:", getDiffInDays(DBCache[title].date, date));
      getMovieInfo(title, card, media_type);
      // log("no info today", title);
    } else {
      setRatingOnCard(card, DBCache[title], title);
    }
  }
  function getMediaType(type) {
    if (!type) return null;
    if (type.toLowerCase().includes("tv")) return "tv";
    if (type.toLowerCase().includes("movie")) return "movie";
    return null;
  }
  async function addRating() {
    url = window.location.href;
    let AllTitleCardsTypes;
    if (isNetflix) AllTitleCardsTypes = [document.querySelectorAll(".title-card .boxart-container:not(.imdb)")];
    else if (isDisney) AllTitleCardsTypes = [document.querySelectorAll("a[data-testid='set-item']:not(.imdb)")];
    else if (isHotstar) AllTitleCardsTypes = [document.querySelectorAll(".swiper-slide img:not(.imdb)")];
    else if (isHBO) AllTitleCardsTypes = [document.querySelectorAll("a[class*='StyledTileLinkNormal-Beam-Web-Ent']:not(.imdb)")];
    else if (isPrimeVideo)
      AllTitleCardsTypes = [
        document.querySelectorAll("li:not(.imdb) article[data-card-title]:not([data-card-entity-type='EVENT']):not([data-card-title='Live-TV'])"),
        document.querySelectorAll("article[data-testid*='-card']:not(.imdb):not(:has(a#rating))"),
      ];
    // on disney there are multiple images for the same title so only use the first one
    let lastTitle = "";
    // for each is not going in order on chrome
    let updateDBCache = false;
    for (let type = 0; type < AllTitleCardsTypes.length; type++) {
      const titleCards = AllTitleCardsTypes[type];
      let media_type = null;
      for (let i = 0; i < titleCards.length; i++) {
        let card = titleCards[i];
        // add seen class
        if (isNetflix || isDisney || isHotstar || isHBO) card.classList.add("imdb");
        else if (isPrimeVideo) {
          if (type == 0) card?.closest("li")?.classList.add("imdb");
          else if (type == 1) card?.classList.add("imdb");
        }
        let title;
        if (isNetflix) {
          title = card?.parentElement?.getAttribute("aria-label")?.split(" (")[0];
          if (url.includes("genre/83")) media_type = "tv";
          else if (url.includes("genre/34399")) media_type = "movie";
        } else if (isDisney) {
          title = card?.getAttribute("aria-label")?.replace(" Disney+ Original", "")?.replace(" STAR Original", "");
          // no section Extras on disney shows
          if (url.includes("entity")) {
            const SelectedTabId = document.querySelector('[aria-selected="true"]')?.id.split("_control")[0];
            if (SelectedTabId != card.closest('div[role="tabpanel"]')?.id) title = "";
          }
          if (url.includes("browse/series")) media_type = "tv";
          else if (url.includes("browse/movies")) media_type = "movie";
          else if (/(Staffel)|(Nummer)|(Season)|(Episod)|(Number)/g.test(title)) media_type = "tv";
          // german translation
          if (htmlLang == "de") {
            title = title
              ?.replace(/Nummer \d* /, "")
              .split(" Für Details")[0]
              .split(" Staffel")[0]
              .split("Staffel")[0]
              .split(" Neue")[0]
              .split(" Alle")[0]
              .split(" Demnächst")[0]
              .split(" Altersfreigabe")[0]
              .split(" Mach dich bereit")[0] // deadpool
              //did not find translation
              .split(" Jeden")[0]
              .split(" Noch")[0]
              .split(" Premiere")[0];
          } else if (htmlLang == "en") {
            title = title
              ?.replace(/Number \d* /, "")
              .replace(" Select for details on this title.", "")
              .split(" Season")[0]
              .split("Season")[0]
              .split(" New ")[0]
              .split(" All Episodes")[0]
              .split(" Coming")[0]
              .split(" Two-Episode")[0]
              .split(" Rated")[0]
              .split(" Prepare for")[0] // deadpool
              //did not find translation
              .split(" Streaming ")[0]
              //did not find translation
              .replace(/ \d+ minutes remaining/g, "");
          }
        } else if (isHotstar) title = card?.getAttribute("alt")?.replace(/(S\d+\sE\d+)/g, "");
        else if (isPrimeVideo) {
          function fixTitle(title) {
            return (
              title
                ?.split(" - ")[0]
                ?.split(" – ")[0]
                ?.replace(/(S\d+)/g, "")
                ?.replace(/ \[.*\]/g, "")
                ?.replace(/\s\(.*\)/g, "")
                ?.replace(/:?\sStaffel-?\s\d+/g, "")
                ?.replace(/:?\sSeason-?\s\d+/g, "")
                ?.replace(/ \/ \d/g, "")
                ?.split(": Die komplette")[0]
                // nicht sicher
                ?.split(": The complete")[0]
            );
          }
          // detail means not live shows
          if (card.querySelector("a").href.includes("detail")) {
            if (type == 0) title = fixTitle(card.getAttribute("data-card-title"));
            else if (type == 1) title = fixTitle(card.querySelector("a")?.getAttribute("aria-label"));
          }
          if (url.includes("video/tv")) media_type = "tv";
          else if (url.includes("video/movie")) media_type = "movie";
          else media_type = getMediaType(card.getAttribute("data-card-entity-type"));
        } else if (isHBO) title = card.querySelector("p[class*='md_strong-Beam-Web-Ent']")?.textContent;
        // for the static Pixar Disney, Starplus etc. cards
        if (!isDisney || !card?.classList.contains("_1p76x1y4")) {
          // sometimes more than one image is loaded for the same title
          if (title && lastTitle != title && !title.includes("Netflix") && !title.includes("Prime Video")) {
            lastTitle = title;
            console.log("Title:", title, media_type);
            if (
              (DBCache[title]?.score || getDiffInDays(DBCache[title]?.date, date) <= 7) &&
              (!media_type || DBCache[title]?.media_type == media_type)
            ) {
              useDBCache(title, card, media_type);
            } else {
              getMovieInfo(title, card, media_type);
              updateDBCache = true;
            }
          }
        }
      }
    }
    if (updateDBCache) {
      setTimeout(function () {
        setDBCache();
      }, 5000);
    }
  }
  function getColorForRating(rating, lowVoteCount) {
    // I want a color gradient from red to green with yellow in the middle
    // the ratings are between 0 and 10
    // the average rating is 6.5
    // https://distributionofthings.com/imdb-movie-ratings/
    if (!rating || lowVoteCount) return "grey";
    if (rating <= 5.5) return "red";
    if (rating <= 7) return "rgb(245, 197, 24)"; //#f5c518
    return "rgb(0, 166, 0)";
  }
  function getTMDBUrl(id, media_type) {
    return `https://www.themoviedb.org/${media_type}/${id}`;
  }

  async function setRatingOnCard(card, data, title) {
    let div = document.createElement(data?.id ? "a" : "div");
    if (data?.id) {
      div.href = getTMDBUrl(data.id, data.media_type);
      div.target = "_blank";
    }
    const vote_count = data?.vote_count || 100;
    // right: 1.5vw;
    div.id = "rating";
    div.style =
      "position: absolute;bottom: 0;color: black;text-decoration: none;background:" +
      getColorForRating(data?.score, vote_count < 50) +
      ";border-radius: 5px;padding: 0 2px 0 2px;" +
      (isNetflix ? "right:0.2vw;" : "right:0;") +
      (isDisney ? "" : "z-index: 9999;") +
      (isMobile ? "font-size: 4vw;" : "font-size: 1vw;");

    // div.id = "imdb";
    if (data?.score >= 0) {
      let releaseDate = "";
      if (settings.General?.showYear && data?.release_date) {
        const releaseDate = new Date(data?.release_date)?.getFullYear() + "-";
        // const year = new Date(data?.release_date)?.getYear();
        // releaseDate = year >= 100 ? (year + " ").substring(1) : year + " ";
      }
      div.textContent = releaseDate + data.score?.toFixed(1);
      div.setAttribute("alt", data?.title + ", OG title: " + title + ", Vote count: " + vote_count);
    } else {
      div.textContent = "?";
      div.setAttribute("alt", title);
      log("no score found:", title, data);
    }
    if (isNetflix) {
      card.closest(".title-card-container")?.appendChild(div);
    } else if (isHBO) card.appendChild(div);
    else if (isDisney) {
      const parentDiv = card?.closest("div");
      if (parentDiv) {
        if (card.nextElementSibling) {
          div.style.top = card.offsetHeight + "px";
          div.style.bottom = "";
        }
        parentDiv.style.position = "relative";
        parentDiv.appendChild(div);
      }
    } else if (isHotstar) card.parentElement.appendChild(div);
    else if (isPrimeVideo) {
      if (card.getAttribute("data-card-title")) card.firstChild.firstChild.appendChild(div);
      else if (card.querySelector('div[data-testid="title-metadata-main"]')) {
        card.querySelector('div[data-testid="title-metadata-main"]').appendChild(div);
      } else card.appendChild(div);
    }
  }
  function OnFullScreenChange() {
    let video;
    if (isNetflix || isDisney || isHotstar || isHBO) video = document.querySelector("video");
    else video = document.querySelector(AmazonVideoClass);
    if (window.fullScreen && video) {
      video.play();
      log("auto-played on fullscreen");
      increaseBadge();
    }
  }
  async function startPlayOnFullScreen() {
    if (settings.Video?.playOnFullScreen) {
      addEventListener("fullscreenchange", OnFullScreenChange);
    } else {
      removeEventListener("fullscreenchange", OnFullScreenChange);
    }
  }
  // #endregion
  // #region Disney
  // Disney Observers
  const DisneyObserver = new MutationObserver(Disney);
  function Disney() {
    // first ad not first video
    let video = Array.from(document.querySelectorAll("video")).find((v) => v.checkVisibility());
    const time = video?.currentTime;
    if (settings.Disney?.skipIntro) Disney_Intro(video, time);
    Disney_skipCredits(time);
    if (settings.Disney?.watchCredits) Disney_Watch_Credits();
    if (settings.Disney?.speedSlider) Disney_SpeedSlider(video);
    if (isDisney) {
      Disney_addHomeButton();
      if (settings.Disney?.selfAd) Disney_selfAd(video, time);
    }
    if (settings.Video?.scrollVolume) Disney_scrollVolume(video);
  }
  async function Disney_skipAd(video) {
    if (video) {
      const adTimeText = document.querySelector("div.overlay_interstitials__content_time_display");
      if (adTimeText) {
        const adTime = parseAdTime(adTimeText.textContent);
        if (adTime >= 1 && lastAdTimeText != video.currentTime) {
          if (lastAdTimeText == 0) {
            log("Disney Ad skipped, length:", adTime, "s");
            settings.Statistics.DisneyAdTimeSkipped += adTime;
            increaseBadge();
          }
          lastAdTimeText = video.currentTime;
          video.currentTime += adTime;
        }
      } else lastAdTimeText = 0;
      // remove das video wird nach der pause fortgesetzt text after skipping ad
      const continueText = document.querySelector("p.toast-notification__text[aria-hidden='true']");
      if (continueText?.checkVisibility()) {
        continueText.remove();
        increaseBadge();
      }
    }
  }
  async function Disney_scrollVolume(video) {
    const volumeControl = document.querySelector("div.audio-control:not(.enhanced)");
    if (volumeControl) {
      volumeControl.classList.add("enhanced");
      volumeControl?.addEventListener("wheel", (event) => {
        let volume = video.volume;
        if (event.deltaY < 0) volume = Math.min(1, volume + 0.1);
        else volume = Math.max(0, volume - 0.1);
        video.volume = volume;
        const sliderContainer = volumeControl.querySelector(".slider-container");
        sliderContainer.firstChild.children[1].style.strokeDashoffset = 100 - volume * 100 + "px";
        sliderContainer.children[1].style.height = volume * 100 + "%";
        sliderContainer.children[2].style.height = volume * 100 + "%";
      });
    }
  }

  async function Disney_Intro(video, time) {
    // intro star wars andor Season 1 episode 2
    // Recap Criminal Minds Season 1 Episode 2
    let button;
    if (isDisney) {
      const skipCreditsButton = isStarPlus
        ? document.querySelector('[data-gv2elementkey="playNext"]')
        : document.querySelector('[data-testid="playback-action-button"]');
      if (!skipCreditsButton) button = document.querySelector(".skip__button");
    } else button = document.evaluate("//span[contains(., 'Skip Intro')]", document, null, XPathResult.ANY_TYPE, null)?.iterateNext()?.parentElement;
    if (button) {
      button.click();
      log("Intro/Recap skipped", button);
      setTimeout(function () {
        addSkippedTime(time, video?.currentTime, "Intro/RecapTimeSkipped");
      }, 600);
    }
    // // if intro/recap time starts at 0 there is no skip button so always rewind to 0
    // if (isDisney && video?.play && SetTimeToZeroOnce != video.src) {
    //   if (video.currentTime > 0.2 && video.currentTime < 5) {
    //     log("reset time to", video.currentTime);
    //     video.currentTime = 0;
    //     SetTimeToZeroOnce = video.src;
    //   }
    // }
  }
  async function Disney_skipCredits(currentTime) {
    let button;
    if (isStarPlus) button = document.querySelector('[data-gv2elementkey="playNext"]');
    else if (isDisney && !document.querySelector('[data-testid="playback-action-button"]'))
      button = document.querySelector('[data-testid="icon-restart"]')?.parentElement;
    else button = document.evaluate("//span[contains(., 'Next Episode')]", document, null, XPathResult.ANY_TYPE, null)?.iterateNext()?.parentElement;
    if (button) {
      // time is to avoid clicking too fast
      const time = parseInt(currentTime);
      if (time && lastAdTimeText != time) {
        const videoFullscreen = document.fullscreenElement !== null;
        lastAdTimeText = time;
        if (settings.Disney?.skipCredits) {
          button.click();
          log("Credits skipped", button);
          increaseBadge();
          resetLastATimeText();
        }
        if (!isHotstar) {
          // keep video fullscreen
          setTimeout(function () {
            if (videoFullscreen && document.fullscreenElement == null) {
              browser.runtime.sendMessage({ type: "fullscreen" });
              function resetFullscreen() {
                browser.runtime.sendMessage({ type: "exitFullscreen" });
                log("exitFullscreen");
                removeEventListener("fullscreenchange", resetFullscreen);
              }
              addEventListener("fullscreenchange", resetFullscreen);
              document.onkeydown = function (evt) {
                if ("key" in evt && (evt.key === "Escape" || evt.key === "Esc")) {
                  browser.runtime.sendMessage({ type: "exitFullscreen" });
                }
              };
              log("fullscreen");
            }
          }, 1000);
        }
      }
    }
  }
  async function Disney_addHomeButton() {
    // add home button to the end of the credits
    const buttonDiv = document.querySelector('[data-testid="browser-action-button"]')?.parentElement;
    if (buttonDiv && !document.querySelector("#homeButton")) {
      const homeButton = document.createElement("button");
      homeButton.textContent = browser.i18n.getMessage("HomeButton");
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
  async function Disney_Watch_Credits() {
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
          log("Credits Watched", button);
          increaseBadge();
          resetLastATimeText();
        }
      }
    }
  }
  function createSlider(video, position, sliderStyle, speedStyle, divStyle = "") {
    videoSpeed = videoSpeed || video.playbackRate;

    let slider = document.createElement("input");
    slider.id = "videoSpeedSlider";
    slider.type = "range";
    slider.min = settings.General.sliderMin;
    slider.max = settings.General.sliderMax;
    slider.value = videoSpeed * 10;
    slider.step = settings.General.sliderSteps;
    slider.style = sliderStyle;

    let speed = document.createElement("p");
    speed.id = "videoSpeed";
    speed.textContent = videoSpeed ? videoSpeed.toFixed(1) + "x" : "1.0x";
    speed.style = speedStyle;
    if (divStyle) {
      let div = document.createElement("div");
      div.style = divStyle;
      div.appendChild(slider);
      div.appendChild(speed);
      position.prepend(div);
    } else position.prepend(slider, speed);

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
  const DisneySpeedStyle = "height:10px;min-width:40px;color:#f9f9f9;pointer-events: auto;position: relative;bottom: 8px;padding: 0 5px;";
  async function Disney_SpeedSlider(video) {
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

  async function Disney_selfAd(video, time) {
    if (isDisney) {
      let button = document.querySelector(".overlay_interstitials__promo_skip_button");
      if (button) {
        button.click();
        log("SelfAd skipped", button);
        setTimeout(function () {
          addSkippedTime(time, video?.currentTime, "selfAdkipped");
        }, 600);
      }
    }
  }

  async function Hotstar_doubleClick() {
    if (settings.Video?.doubleClick) {
      // event listener for double click
      document.ondblclick = function () {
        document.querySelector(".icon-player-landscape")?.closest("button")?.click();
        document.querySelector(".icon-player-portrait")?.closest("button")?.click();
      };
    } else {
      document.ondblclick = null;
    }
  }
  // #endregion
  // #region Netflix
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
    if (settings.Video?.scrollVolume) Netflix_scrollVolume(video);
  }
  async function Netflix_scrollVolume(video) {
    const volumeControl = document.querySelector('[data-uia*="control-volume"]:not(.enhanced)');
    if (volumeControl) {
      volumeControl.classList.add("enhanced");
      const handleVolumeControl = (event) => {
        let volume = video.volume;
        if (event.deltaY < 0) volume = Math.min(1, volume + 0.05);
        else volume = Math.max(0, volume - 0.05);
        video.volume = volume;
      };
      removeEventListener("wheel", handleVolumeControl);
      volumeControl?.addEventListener("wheel", handleVolumeControl);
    }
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
        setStorage();
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
      // .default-ltr-cache-mmvz9h or ltr-mmvz9h
      const adLength = Number(document.querySelector('span[class*="mmvz9h"]')?.textContent);
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
      // pause video shows ad
      // sherlock show comes alot.
      const div = document.querySelector('div[data-uia="pause-ad-title-display"]');
      const button = document.querySelector('button[data-uia="pause-ad-expand-button"]');
      if (
        button &&
        div.checkVisibility({ opacityProperty: true }) &&
        (!video || (video.paused && lastAdTimeText != parseInt(video.currentTime / 10)))
      ) {
        lastAdTimeText = parseInt(video.currentTime / 10);
        resetLastATimeText();
        button.click();
        log("Remove Video Paused ad", button);
        increaseBadge();
        setTimeout(() => {
          // not always a video is showing on next episode apparently
          (video || document.querySelector("video")).pause();
        }, 100);
      }
    }, 100);
  }
  const NetflixSliderStyle = "display: none;width:200px;";
  const NetflixSpeedStyle = "font-size: 3em;padding: 0 5px;margin: unset;align-content: center;";
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
  // #endregion
  // #region Amazon
  // Amazon Observers
  const AmazonVideoClass = ".dv-player-fullscreen video";
  const AmazonObserver = new MutationObserver(Amazon);

  function Amazon() {
    if (settings.Amazon?.filterPaid) Amazon_FilterPaid();
    const video = document.querySelector(AmazonVideoClass);
    if (settings.Amazon?.skipCredits) Amazon_Credits();
    if (settings.Amazon?.watchCredits) Amazon_Watch_Credits();
    if (settings.Amazon?.speedSlider) Amazon_SpeedSlider(video);
    if (settings.Amazon?.xray) Amazon_xray();
    if (settings.Video?.scrollVolume) Amazon_scrollVolume();
  }
  const AmazonSkipIntroConfig = { attributes: true, attributeFilter: [".skipelement"], subtree: true, childList: true, attributeOldValue: false };
  // const AmazonSkipIntro = new RegExp("skipelement", "i");
  const AmazonSkipIntroObserver = new MutationObserver(Amazon_Intro);

  async function Amazon_scrollVolume() {
    const volumeControl = document.querySelector('[aria-label="Volume"]:not(.enhanced)');
    if (volumeControl) {
      volumeControl.classList.add("enhanced");
      volumeControl?.addEventListener("wheel", (event) => {
        const video = document.querySelector(AmazonVideoClass);
        let volume = video.volume;
        if (event.deltaY < 0) volume = Math.min(1, volume + 0.1);
        else volume = Math.max(0, volume - 0.1);
        video.volume = volume;
      });
    }
  }
  let lastIntroTime = -1;
  function resetLastIntroTime() {
    setTimeout(() => {
      lastIntroTime = -1;
    }, 5000);
  }
  function Amazon_Intro() {
    if (settings.Amazon?.skipIntro) {
      // skips intro and recap
      // recap on lucifer season 3 episode 3
      // intro lucifer season 3 episode 4
      let button = document.querySelector("[class*=skipelement]");
      if (button) {
        let video = document.querySelector(AmazonVideoClass);
        const time = video?.currentTime;
        if (typeof time === "number" && lastIntroTime != parseInt(time)) {
          lastIntroTime = parseInt(time);
          resetLastIntroTime();
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
      button.style = "padding: 0px 22px; line-height: normal; min-width: 0px;z-index:999;pointer-events:all;";
      button.setAttribute("class", "fqye4e3 f1ly7q5u fk9c3ap fz9ydgy f1xrlb00 f1hy0e6n fgbpje3 f1uteees f1h2a8xb  f1cg7427 fiqc9rt fg426ew f1ekwadg");
      button.setAttribute("data-uia", "reverse-button");
      button.textContent = browser.i18n.getMessage("WatchSkippedButton");
      document.querySelector(".atvwebplayersdk-action-buttons").appendChild(button);
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
    if (video) {
      let alreadySlider = document.querySelector(".dv-player-fullscreen #videoSpeedSlider");
      if (!alreadySlider) {
        // infobar position for the slider to be added
        let position = document.querySelector(".dv-player-fullscreen [class*=infobar-container]")?.firstChild?.lastChild;
        if (position) createSlider(video, position, AmazonSliderStyle, "");
      } else {
        // need to resync the slider with the video sometimes
        let speed = document.querySelector(".dv-player-fullscreen #videoSpeed");
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
    const continueCategory = document.querySelector('.j5ZgN-._0rmWBt[data-testid="card-overlay"]')?.closest('[class="+OSZzQ"]');
    const position = continueCategory?.parentNode?.childNodes?.[2];
    if (continueCategory && position) position.before(continueCategory);
  }
  async function Amazon_FilterPaid() {
    // if not on the shop page or homepremiere
    if (url.includes("storefront") || url.includes("genre") || url.includes("movie")) {
      // the yellow hand bag is the paid category .NbhXwl
      document.querySelectorAll("section[data-testid='standard-carousel'] ul:has(svg.NbhXwl)").forEach((a) => {
        deletePaidCategory(a);
      });
    }
  }
  async function deletePaidCategory(a) {
    // if the section is mostly paid content delete it
    // -2 because sometimes there are title banners
    if (
      a.children.length - a.querySelectorAll('[data-hidden="true"]').length - 2 <=
      a.querySelectorAll("[data-testid='card-overlay'] svg.NbhXwl").length
    ) {
      const section = a.closest('[class="+OSZzQ"]');
      log("Filtered paid category", section);
      section?.remove();
      increaseBadge();
    }
    // remove individual paid elements
    else {
      a.querySelectorAll("li:has(svg.NbhXwl)").forEach((b) => {
        log("Filtered paid Element", b);
        b.remove();
        increaseBadge();
      });
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
  function parseAdTime(adTimeText) {
    const adTime = parseInt(/:\d+/.exec(adTimeText)?.[0].substring(1)) + parseInt(/\d+/.exec(adTimeText)?.[0]) * 60;
    if (isNaN(adTime)) return false;
    return adTime;
  }
  async function skipAd(video) {
    // Series grimm
    // there area multiple adtime texts, the dv-player-fullscreen is the correct one
    const adTimeText = document.querySelector(".dv-player-fullscreen .atvwebplayersdk-ad-timer-text");
    if (adTimeText?.checkVisibility()) {
      let adTime;
      adTime = parseAdTime(adTimeText?.childNodes?.[0]?.textContent);
      if (!adTime) adTime = parseAdTime(adTimeText?.childNodes?.[1]?.textContent);
      // !document.querySelector(".fu4rd6c.f1cw2swo") so it doesn't try to skip when the self ad is playing
      if (!document.querySelector(".fu4rd6c.f1cw2swo") && adTime > 1 && !lastAdTimeText) {
        lastAdTimeText = adTime;
        // biggest skiptime before crashing on amazon.com, can be little higher than 90 but 90 to be safe
        const bigTime = 90;
        resetLastATimeText(adTime > bigTime ? 3000 : 1000);
        const skipTime = adTime > bigTime ? bigTime : adTime - 1;
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
    log("customizeMobileView");
    // customize mobile view for desktop website
    // /gp/video/detail/ is the film description page otherwise looks weird
    if (!url.includes("/gp/video/detail/")) {
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
    document.querySelector(".xrayQuickViewList")?.remove();
    // remove bad background hue which is annoying
    let b = document.querySelector(".fkpovp9.f8hspre:not(.enhanced)");
    if (b) {
      b.classList.add("enhanced");
      b.style.backgroundColor = "transparent";
      b.style.background = "transparent";
    }
  }

  async function Amazon_doubleClick() {
    if (settings.Video?.doubleClick) {
      // event listener for double click
      document.ondblclick = function () {
        document.querySelector(".dv-player-fullscreen button[class*=fullscreen-button]")?.click();
      };
    } else {
      document.ondblclick = null;
    }
  }
  // #endregion
  // #region Crunchyroll
  // Crunchyroll functions
  function filterQueued(display) {
    document.querySelectorAll("div.queue-flag:not(.queued)").forEach((element) => {
      // if not on premiere
      element.parentElement.parentElement.parentElement.style.display = element.parentElement.parentElement
        .querySelector(".premiere-flag")
        ?.checkVisibility()
        ? "block"
        : display;
    });
    if (display == "block" && settings.General.filterDub) filterDub("none");
  }
  function filterDub(display) {
    let list = document.querySelectorAll("cite[itemprop='name']");
    list.forEach((element) => {
      if (element.textContent.includes("Dub") || element.textContent.includes("Audio"))
        element.parentElement.parentElement.parentElement.parentElement.parentElement.style.display = display;
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
    input.id = filterType;
    input.onclick = function () {
      settings.General[filterType] = this.checked;
      filterFunction(this.checked ? "none" : "block");
      setStorage();
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
  // start of add CrunchyList to Crunchyroll
  function addShowsToList(position, list) {
    list.forEach((element) => {
      const article = document.createElement("article");
      article.className = "release js-release";

      let time = document.createElement("time");
      time.className = "available-time";
      time.textContent = new Date(element.time).toLocaleString([], { hour: "2-digit", minute: "2-digit" });

      let div1 = document.createElement("div");
      let div2 = document.createElement("div");
      div2.className = "queue-flag queued enhanced";

      let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 48 48");

      let use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      use.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "/i/svg/simulcastcalendar/calendar_icons.svg#cr_bookmark");

      svg.appendChild(use);
      div2.appendChild(svg);

      let h1 = document.createElement("h1");
      h1.className = "season-name";

      let a = document.createElement("a");
      a.className = "js-season-name-link";
      a.href = element.href;
      a.setAttribute("itemprop", "url");

      let cite = document.createElement("cite");
      cite.setAttribute("itemprop", "name");
      cite.textContent = element.name;

      a.appendChild(cite);
      h1.appendChild(a);

      div1.appendChild(div2);
      div1.appendChild(h1);

      article.appendChild(time);
      article.appendChild(div1);
      position.appendChild(article);
    });
  }
  function clickOnCurrentDay() {
    let days = document.querySelectorAll(".specific-date [datetime]");
    for (const day of days) {
      const dateOnPage = new Date(day.getAttribute("datetime"));
      // if the day of the week is the same as today click on it, like if its Monday click on Monday
      if (date.getDay() == dateOnPage.getDay()) {
        // need timeout because the page is not fully loaded
        setTimeout(() => {
          day.click();
        }, 100);
        // isCurrentWeek
        return date.toLocaleDateString() == dateOnPage.toLocaleDateString();
      }
    }
    return false;
  }
  function createLocalList() {
    let localList = [];
    document.querySelectorAll("div.queue-flag.queued:not(.enhanced)").forEach((element) => {
      const h1 = element.nextElementSibling?.firstChild?.nextSibling;
      const name = h1.firstChild.nextSibling.textContent;
      if (!name.includes("Dub")) {
        const href = h1?.href;
        const time = element.parentElement?.parentElement?.firstElementChild?.getAttribute("datetime");
        localList.push({ href, name, time });
      }
    });
    return localList;
  }
  function filterOldList(isCurrentWeek, localList) {
    let oldList = settings.General.savedCrunchyList || [];
    const lastElement = localList[localList.length - 1];
    const lastTime = new Date(lastElement.time);
    const [lastDay, lastHr, lastMin] = [lastTime.getDay(), lastTime.getHours(), lastTime.getMinutes()];
    // delete all previous weekdays from oldList
    if (!isCurrentWeek) {
      oldList = [];
    } else {
      oldList = oldList
        .filter((item) => {
          return shiftSunday(date.getDay()) - shiftSunday(new Date(item.time).getDay()) <= 0;
        })
        // delete all items from same weekday before lastElement time
        .filter((item) => {
          const itemTime = new Date(item.time);
          const itemHr = itemTime.getHours();
          // no shows today yet
          const itemDay = itemTime.getDay();
          return lastDay != itemDay || itemDay != date.getDay() || itemHr > lastHr || (itemHr == lastHr && itemTime.getMinutes() > lastMin);
        });
    }
    return oldList;
  }
  const shiftSunday = (a) => (a + 6) % 7;
  function addSavedCrunchyList() {
    let localList = createLocalList();
    const isCurrentWeek = clickOnCurrentDay();
    const oldList = localList.length > 0 ? filterOldList(isCurrentWeek, localList) : settings.General.savedCrunchyList || [];
    settings.General.savedCrunchyList = localList.concat(oldList);
    setStorage();
    if (isCurrentWeek && !document.querySelector("div.queue-flag.queued.enhanced")) {
      // now add the old list to the website list
      document.querySelectorAll("section.calendar-day").forEach((element) => {
        const weekday = new Date(element.querySelector("time")?.getAttribute("datetime")).getDay();
        // remove Schedule Coming Soon text
        if (shiftSunday(date.getDay()) - shiftSunday(weekday) < 0) element?.children?.[1]?.firstChild?.nextSibling?.remove();
        addShowsToList(
          element.children[1],
          oldList.filter((item) => new Date(item.time).getDay() == weekday)
        );
      });
    }
  }
  async function Crunchyroll_ReleaseCalendar() {
    if (url.includes("simulcastcalendar")) {
      // Show playlist only
      filterQueued(settings.General.filterQueued ? "none" : "block");
      filterDub(settings.General.filterDub ? "none" : "block");
      if (!document.querySelector("#filterQueued")) addButtons();
      // add saved CrunchyList and click on current day
      addSavedCrunchyList();
    }
  }
  const CrunchyrollObserver = new MutationObserver(Crunchyroll);
  async function Crunchyroll() {
    if (settings.Crunchyroll?.profile) Crunchyroll_profile();
  }
  async function Crunchyroll_profile() {
    // save profile
    let img = document.querySelector(".erc-authenticated-user-menu img");
    if (img && img.src !== settings.General.Crunchyroll_profilePicture) {
      settings.General.Crunchyroll_profilePicture = img.src;
      setStorage();
      log("Profile switched to", img.src);
    }
  }
  async function Crunchyroll_AutoPickProfile() {
    // click on profile picture
    if (document.querySelector(".profile-item-name")) {
      document.querySelectorAll(".erc-profile-item img")?.forEach((img) => {
        if (img.src === settings.General.Crunchyroll_profilePicture) {
          img.click();
          log("Profile automatically chosen:", img.src);
          increaseBadge();
        }
      });
    }
  }
  async function Crunchyroll_bigPlayerStyle() {
    if (document.querySelector(".video-player-wrapper")) {
      // show header on hover
      let style = document.createElement("style");
      style.innerHTML = `
      .video-player-wrapper{
          max-Height: calc(100vw / 1.7777);
          height: 100vh;
      }
      .erc-large-header {
          position: absolute;
          top: 0;
          width: 100%;
          height: 3.75rem;
          z-index: 999;
      }
      .erc-large-header .header-content {
          position: absolute;
          top: -3.75rem;
          transition: top 0.4s, top 0.4s;
      }
      .erc-large-header:hover .header-content {
          top: 0;
      }
    `;
      document.head.appendChild(style);
    }
  }
  // #endregion
  // #region HBO
  // HBO functions
  const HBOObserver = new MutationObserver(HBO);
  async function HBO() {
    const video = document.querySelector("video");
    const time = video?.currentTime;
    if (settings.HBO?.skipIntro) HBO_Intro(video, time);
    if (settings.HBO?.skipCredits) HBO_Credits(time);
    if (settings.HBO?.watchCredits) HBO_Watch_Credits(video);
    if (settings.HBO?.speedSlider) HBO_SpeedSlider(video);
  }
  function HBO_Intro(video, time) {
    let button = document.querySelector('[class*="SkipButton-Beam-Web-Ent"]');
    if (button?.checkVisibility({ visibilityProperty: true })) {
      button.click();
      log("Intro skipped", button);
      setTimeout(function () {
        addSkippedTime(time, video?.currentTime, "IntroTimeSkipped");
      }, 600);
    }
  }
  let lastSkip = 0;
  function HBO_Credits(time) {
    let button = document.querySelector('[class*="UpNextButton-Beam-Web-Ent"]');
    if (button && lastSkip < time - 1) {
      lastSkip = parseInt(time);
      button.click();
      increaseBadge();
      log("Credits skipped", button);
    }
  }
  function HBO_Watch_Credits(video) {
    let button = document.querySelector('[class*="DismissButton-Beam-Web-Ent"]');
    if (button) {
      button.click();
      increaseBadge();
      log("Watched Credits", button);
    }
    // is movie
    button = document.querySelector(".player-shrink-transition-enter-done");
    if (video && button) {
      video.click();
      increaseBadge();
      log("Watched Credits", button);
    }
  }
  const HBOSliderStyle = "height: 1em;background: rgb(221, 221, 221);display: none;width:200px;";
  const HBOSpeedStyle = "font-size: 1.5em;color:#b2b2b2;";
  const HBODivStyle = "height:48px;display: flex;align-items: center;";
  async function HBO_SpeedSlider(video) {
    let alreadySlider = document.querySelector("#videoSpeedSlider");
    if (!alreadySlider) {
      // infobar position for the slider to be added
      let position = document.querySelector('[class*="ControlsFooterBottomRight-Beam-Web-Ent"]');
      if (position) createSlider(video, position, HBOSliderStyle, HBOSpeedStyle, HBODivStyle);
    }
  }
  // #endregion
  // Badge functions
  // eslint-disable-next-line no-unused-vars
  async function setBadgeText(text) {
    try {
      browser.runtime.sendMessage({
        type: "setBadgeText",
        content: text,
      });
    } catch (error) {
      log(error);
    }
  }
  async function increaseBadge() {
    settings.Statistics.SegmentsSkipped++;
    try {
      browser.storage.sync.set({ settings });
      browser.runtime.sendMessage({
        type: "increaseBadge",
      });
    } catch (error) {
      log(error);
    }
  }
  async function resetBadge() {
    try {
      browser.runtime.sendMessage({
        type: "resetBadge",
      });
    } catch (error) {
      log(error);
    }
  }
  async function setStorage() {
    try {
      browser.storage.sync.set({ settings });
    } catch (error) {
      log(error);
    }
  }
}
