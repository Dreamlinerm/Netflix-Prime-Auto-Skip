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
const hostname = window.location.hostname;
const title = document.title;
const url = window.location.href;
const ua = window.navigator.userAgent;
// only on prime video pages
const isPrimeVideo = /amazon|primevideo/i.test(hostname) && (/video/i.test(title) || /video/i.test(url));
const isNetflix = /netflix/i.test(hostname);
const isDisney = /disneyplus/i.test(hostname);
const isHotstar = /hotstar/i.test(hostname);
const isCrunchyroll = /crunchyroll/i.test(hostname);

const isEdge = /edg/i.test(ua);
const isFirefox = /firefox/i.test(ua);
const version = "1.0.64";
if (isPrimeVideo || isNetflix || isDisney || isHotstar || isCrunchyroll) {
  // global variables in localStorage
  const defaultSettings = {
    settings: {
      Amazon: { skipIntro: true, skipCredits: true, watchCredits: false, skipAd: true, blockFreevee: true, speedSlider: true, filterPaid: false, showRating: true, streamLinks: true },
      Netflix: { skipIntro: true, skipRecap: true, skipCredits: true, watchCredits: false, skipBlocked: true, NetflixAds: true, speedSlider: true, profile: true, showRating: true },
      Disney: { skipIntro: true, skipCredits: true, watchCredits: false, speedSlider: true, showRating: true },
      Crunchyroll: { skipIntro: true, skipCredits: true, watchCredits: false, speedSlider: true, releaseCalendar: true },
      Video: { playOnFullScreen: true },
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
        if (settings.Netflix?.profile) AutoPickProfile();
        if (settings.Netflix?.NetflixAds) Netflix_SkipAdInterval();
        NetflixObserver.observe(document, config);
      } else if (isPrimeVideo) {
        AmazonSkipIntroObserver.observe(document, AmazonSkipIntroConfig);
        AmazonObserver.observe(document, config);
        if (settings.Amazon?.skipAd) Amazon_AdTimeout();
        if (settings.Amazon?.blockFreevee) {
          // timeout of 100 ms because the ad is not loaded fast enough and the video will crash
          setTimeout(function () {
            Amazon_FreeveeTimeout();
          }, 1000);
        }
      } else if (isDisney || isHotstar) DisneyObserver.observe(document, config);
      else if (isCrunchyroll) {
        CrunchyrollObserver.observe(document, config);
        Crunchyroll_ReleaseCalendar();
        if (settings.Crunchyroll?.skipIntro) Crunchyroll_IntroInterval();
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
    browser.storage.local.get("DBCache", function (result) {
      DBCache = result?.DBCache;
      if (typeof DBCache !== "object") {
        log("DBCache not found, creating new one", DBCache);
        browser.storage.local.set({ DBCache: {} });
        DBCache = {};
      }
      if (isNetflix) {
        if (settings.Netflix?.showRating) {
          startShowRatingInterval();
        }
      }
      // else if (isPrimeVideo) {
      //   if (settings.Amazon?.streamLinks) addStreamLinks();
      // }
      else if (isDisney || isHotstar) {
        if (settings.Disney?.showRating) startShowRatingInterval();
      }
    });
  });
  browser.storage.local.onChanged.addListener(function (changes, namespace) {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (key == "DBCache") {
        DBCache = newValue;
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
          if (oldValue === undefined || (newValue.Netflix.NetflixAds !== oldValue?.Netflix?.NetflixAds && newValue.Netflix.NetflixAds)) Netflix_SkipAdInterval();
        } else if (isPrimeVideo) {
          if (oldValue === undefined || (newValue.Amazon.skipAd !== oldValue?.Amazon?.skipAd && newValue.Amazon.skipAd)) Amazon_AdTimeout();
          if (oldValue === undefined || (newValue.Amazon.blockFreevee !== oldValue?.Amazon?.blockFreevee && newValue.Amazon.blockFreevee)) Amazon_FreeveeTimeout();
        }
        if (oldValue === undefined || newValue.Video.playOnFullScreen !== oldValue?.Video?.playOnFullScreen) startPlayOnFullScreen(isNetflix);
        if (oldValue === undefined || (newValue.Netflix.showRating !== oldValue?.Netflix?.showRating && newValue.Netflix.showRating)) startShowRatingInterval();
      }
    }
  });
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
      browser.storage.local.set({ DBCache });
    } else {
      log("DBCache cleared", megaBytes);
      DBCache = {};
      browser.storage.local.set({ DBCache });
    }
  }
  // browser.storage.local.set({ DBCache: {} });
  // justWatchAPI
  const today = date.toISOString().split("T")[0];
  async function getMovieInfo(title, card, Rating = true) {
    // justwatch api
    // const url = `https://apis.justwatch.com/content/titles/${locale}/popular?language=en&body={"page_size":1,"page":1,"query":"${title}","content_types":["show","movie"]}`;
    let locale = "en-US";
    if (navigator?.language) {
      locale = navigator?.language;
    }
    // use the url for themoviedb.org now
    const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURI(title)}&include_adult=true&language=${locale}&page=1`;
    // const response = await fetch(encodeURI(url));
    // const data = await response.json();
    browser.runtime.sendMessage({ url }, function (data) {
      if (data != undefined && data != "") {
        // // justwatch
        // // "https://www.justwatch.com" + data.items[0].full_path;
        // const jWURL = data?.items?.[0]?.full_path;
        // // flatrate = free with subscription
        // // (netflix, amazon prime, disney+) (x.package_short_name == "amp" || x.package_short_name == "nfx" || x.package_short_name == "dnp")
        // // fuv and drv are both hulu
        // let offers = data?.items?.[0].offers?.filter((x) => x.monetization_type == "flatrate");
        // // get the first offer of each provider
        // offers = offers?.filter((x, i) => offers.findIndex((y) => y.provider_id == x.provider_id) == i);
        // // map offers to only package_short_name, country and standard_web url
        // offers = offers?.map((x) => ({ country: x.country, package_short_name: x.package_short_name, url: x.urls.standard_web }));
        // const score = data?.items?.[0]?.scoring?.filter((x) => x.provider_type == "imdb:score")?.[0]?.value;
        // const compiledData = { jWURL, score, streamLinks: offers };

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
        if (!compiledData?.score) {
          log("no Score found", title, data);
        }
        // else {
        //   log("Score found", title);
        // }
        if (Rating) setRatingOnCard(card, compiledData, title);
        else {
          setAlternativesOnCard(card, compiledData, title);
          setDBCache();
        }
      }
    });
  }

  // Observers
  // default Options for the observer (which mutations to observe)
  const config = { attributes: true, childList: true, subtree: true };

  // shared functions
  async function startShowRatingInterval() {
    addRating();
    let RatingInterval = setInterval(function () {
      if ((isNetflix && !settings.Netflix?.NetflixAds) || (isPrimeVideo && !settings.Amazon?.skipAd) || ((isDisney || isHotstar) && !settings.Disney?.skipCredits)) {
        log("stopped adding Rating");
        clearInterval(RatingInterval);
        return;
      }
      addRating();
    }, 1000);
    let DBCacheInterval = setInterval(function () {
      if ((isNetflix && !settings.Netflix?.NetflixAds) || (isPrimeVideo && !settings.Amazon?.skipAd) || ((isDisney || isHotstar) && !settings.Disney?.skipCredits)) {
        log("stopped DBCacheInterval");
        clearInterval(DBCacheInterval);
        return;
      }
      setDBCache();
    }, 5000);
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
      // add seeen class
      if (isNetflix || isDisney || isHotstar) card.classList.add("imdb");
      //Amazon
      else card.parentElement.classList.add("imdb");
      // let card = document.querySelectorAll(".title-card .boxart-container:not(.imdb)");
      let title;
      if (isNetflix) title = card?.children?.[1]?.firstChild?.textContent.split(" – ")[0];
      // S2: E3 remove this part
      else if (isDisney) title = card?.getAttribute("alt")?.replace(/(S\d+:\sE\d+\s)/g, "");
      else if (isHotstar) title = card?.getAttribute("alt")?.replace(/(S\d+\sE\d+)/g, "");
      // amazon
      // remove everything after - in the title
      else title = card.getAttribute("data-card-title").split(" - ")[0].split(" – ")[0];
      if (title && lastTitle != title && !title.includes("Netflix") && !title.includes("Prime Video")) {
        // sometimes more than one image is loaded for the same title
        lastTitle = title;
        if (!DBCache[title]?.score) {
          getMovieInfo(title, card);
          // log("no info in DBcache", title);
        } else {
          if (!DBCache[title]?.date) {
            DBCache[title].date = today;
          }
          // if DBCache[title]?.date is older than 30 days
          function getDiffinDays(firstDate, secondDate) {
            const date1 = new Date(firstDate);
            const date2 = new Date(secondDate);
            const diffInDays = Math.round(Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
            return diffInDays;
          }
          let diffinReleaseDate = false;
          if (DBCache[title]?.release_date) diffinReleaseDate = getDiffinDays(new Date(DBCache[title]?.release_date), date) <= 30;
          if (getDiffinDays(new Date(DBCache[title]?.date), date) >= 30 || diffinReleaseDate) {
            if (diffinReleaseDate) log("update rating", title, DBCache[title]?.release_date, getDiffinDays(new Date(DBCache[title]?.release_date), date));
            else log("update rating", title, DBCache[title]?.date, getDiffinDays(date, new Date(DBCache[title]?.date)));
            getMovieInfo(title, card);
            // log("no info today", title);
          } else {
            setRatingOnCard(card, DBCache[title], title);
          }
        }
      }
    }
  }
  // deprecated justwatch api
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
      a.style = "color:white";

      let img = document.createElement("img");
      img.src = "https://www.justwatch.com/appassets/img/home/logo.svg";
      img.alt = "Just Watch icon";
      img.style = "border: 1px solid transparent;border-radius: 1.1em;width: 4em;height: auto;";

      let p = document.createElement("p");
      p.textContent = "Just Watch";
      p.style = "margin: 0 0 0 5px;font-size: 14px;";

      a.appendChild(img);
      a.appendChild(p);
      div.appendChild(a);
    }
    if (data?.streamLinks) {
      // netflix icon
      data.streamLinks.forEach((link) => {
        let a = document.createElement("a");
        a.href = link.url;
        a.target = "_blank";
        a.style = "color:white";

        let img = document.createElement("img");
        let p = document.createElement("p");
        p.style = "margin: 0 0 0 5px;font-size: 14px;";
        let text = "";
        switch (link.package_short_name) {
          case "amp":
            img.src = "https://images.justwatch.com/icon/430993/s100/";
            text = "Prime";
            break;
          case "aat":
            img.src = "https://www.justwatch.com/images/icon/190848813/s100";
            text = "Prime";
            break;
          case "nfx":
            img.src = "https://images.justwatch.com/icon/207360008/s100/";
            text = "Netflix";
            break;
          case "dnp":
            img.src = "https://images.justwatch.com/icon/147638351/s100/";
            text = "Disney+";
            break;
          case "hlu":
            img.src = "https://images.justwatch.com/icon/116305230/s100/";
            text = "Hulu";
            break;
          case "mxx":
            img.src = "https://images.justwatch.com/icon/305458112/s100";
            text = "Max";
            break;
          case "cru":
            img.src = "https://images.justwatch.com/icon/127445869/s100";
            text = "Crunchyroll";
            break;
          default:
            text = link.package_short_name;
            break;
        }
        if (img.src) {
          img.alt = text;
          p.textContent = text + " (US)";
          img.style = "border: 1px solid transparent;border-radius: 1.1em;width: 4em;height: auto;";
          a.appendChild(img);
          a.appendChild(p);
          div.appendChild(a);
        }
      });
    }
    card.insertBefore(div, card.firstChild);
    card.insertBefore(h1, card.firstChild);
  }

  async function setRatingOnCard(card, data, title) {
    let div = document.createElement("div");
    // right: 1.5vw;
    div.style = "position: absolute;bottom: 0;right:0;z-index: 9999;color: black;background: #f5c518;border-radius: 5px;font-size: 1vw;padding: 0 2px 0 2px;";
    // div.id = "imdb";
    if (data?.score) {
      div.textContent = data.score?.toFixed(1);
      // div.textContent = title;
    } else {
      div.textContent = "?";
    }
    if (isNetflix) card.appendChild(div);
    else if (isDisney || isHotstar) card.parentElement?.appendChild(div);
    else card.firstChild.firstChild.appendChild(div);
  }
  async function startPlayOnFullScreen(isNetflix) {
    if (settings.Video?.playOnFullScreen === undefined || settings.Video?.playOnFullScreen) {
      log("started observing| PlayOnFullScreen");
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
      addEventListener("fullscreenchange", OnFullScreenChange);
    } else {
      log("stopped observing| PlayOnFullScreen");
      removeEventListener("fullscreenchange", OnFullScreenChange);
    }
  }
  // deprecated
  async function addStreamLinks() {
    log("adding stream links");
    let title = document.querySelector("h1[data-automation-id='title']")?.textContent?.split(" [")[0];
    if (title) {
      // if not already free blue in prime icon
      if (!document.querySelector(".fbl-icon._3UMk3x._1a_Ljt._3H1cN4")) {
        let card = document.querySelector("div#dv-action-box");
        if (!DBCache[title]) {
          getMovieInfo(title, card, false);
          log("no info in DBcache", title);
        } else {
          setAlternativesOnCard(card, DBCache[title], title);
        }
      }
    }
  }

  // Disney Observers
  const DisneyObserver = new MutationObserver(Disney);
  function Disney() {
    if (settings.Disney?.skipIntro) Disney_Intro();
    if (settings.Disney?.skipCredits) Disney_Credits();
    if (settings.Disney?.watchCredits) Disney_Watch_Credits();
    if (settings.Disney?.speedSlider) Disney_SpeedSlider();
  }
  function Disney_Intro() {
    // intro star wars andor Season 1 episode 2
    // Recap Criminal Minds Season 1 Episode 2
    let button;
    if (isDisney) button = document.querySelector(".skip__button");
    else button = document.evaluate("//span[contains(., 'Skip')]", document, null, XPathResult.ANY_TYPE, null)?.iterateNext()?.parentElement;
    if (button) {
      let video = document.querySelector("video");
      const time = video?.currentTime;
      button.click();
      log("Recap skipped", button);
      setTimeout(function () {
        addSkippedTime(time, video?.currentTime, "RecapTimeSkipped");
      }, 600);
    }
  }
  function Disney_Credits() {
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
  function Disney_Watch_Credits() {
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
  function Disney_SpeedSlider() {
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
  // Netflix Observer
  const NetflixObserver = new MutationObserver(Netflix);
  function Netflix() {
    const video = document.querySelector("video");
    const time = video?.currentTime;
    if (settings.Netflix?.profile === undefined || settings.Netflix?.profile) Netflix_profile();
    if (settings.Netflix?.skipIntro === undefined || settings.Netflix?.skipIntro) {
      if (Netflix_General('[data-uia="player-skip-intro"]', "Intro skipped", false)) {
        setTimeout(function () {
          addSkippedTime(time, video?.currentTime, "IntroTimeSkipped");
        }, 600);
      }
    }
    if (settings.Netflix?.skipRecap === undefined || settings.Netflix?.skipRecap) {
      if (Netflix_General('[data-uia="player-skip-recap"]', "Recap skipped", false) || Netflix_General('[data-uia="player-skip-preplay"]', "Recap skipped", false)) {
        setTimeout(function () {
          addSkippedTime(time, video?.currentTime, "RecapTimeSkipped");
        }, 600);
      }
    }
    if (settings.Netflix?.skipCredits === undefined || settings.Netflix?.skipCredits) Netflix_General('[data-uia="next-episode-seamless-button"]', "Credits skipped");
    if (settings.Netflix?.watchCredits === undefined || settings.Netflix?.watchCredits) Netflix_General('[data-uia="watch-credits-seamless-button"]', "Credits watched");
    if (settings.Netflix?.skipBlocked === undefined || settings.Netflix?.skipBlocked) Netflix_General('[data-uia="interrupt-autoplay-continue"]', "Blocked skipped");
    if (settings.Netflix?.speedSlider === undefined || settings.Netflix?.speedSlider) Netflix_SpeedSlider(video);
  }

  function Netflix_profile() {
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
      if (!settings.Netflix?.NetflixAds) {
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
        if (adLength > 8 && video.playbackRate != playBackRate) {
          log("Ad skipped, length:", adLength, "s");
          settings.Statistics.NetflixAdTimeSkipped += adLength;
          increaseBadge();
          video.playbackRate = playBackRate;
        } else if (adLength > 2 && video.playbackRate < 2) {
          video.playbackRate = adLength / 2;
        } else if (adLength && video.paused) {
          video.play();
        } else if (adLength <= 2 || !adLength) {
          // videospeed is speedSlider value
          video.playbackRate = videoSpeed;
        }
      }
    }, 100);
  }
  function Netflix_SpeedSlider(video) {
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
  const AmazonObserver = new MutationObserver(Amazon);
  function Amazon() {
    const video = document.querySelector(AmazonVideoClass);
    if (settings.Amazon?.skipCredits === undefined || settings.Amazon?.skipCredits) Amazon_Credits();
    if (settings.Amazon?.watchCredits === undefined || settings.Amazon?.watchCredits) Amazon_Watch_Credits();
    if (settings.Amazon?.speedSlider === undefined || settings.Amazon?.speedSlider) Amazon_SpeedSlider(video);
    if (settings.Amazon?.filterPaid === undefined || settings.Amazon?.filterPaid) Amazon_FilterPaid();
  }
  const AmazonSkipIntroConfig = { attributes: true, attributeFilter: [".skipelement"], subtree: true, childList: true, attributeOldValue: false };
  // const AmazonSkipIntro = new RegExp("skipelement", "i");
  const AmazonSkipIntroObserver = new MutationObserver(Amazon_Intro);
  function Amazon_Intro(mutations, observer) {
    if (settings.Amazon?.skipIntro === undefined || settings.Amazon?.skipIntro) {
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
            addSkippedTime(time, video.currentTime, "IntroTimeSkipped");
          }, 50);
        }
      }
    }
  }
  reverseButton = false;
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
  async function Amazon_Credits() {
    const button = document.querySelector("[class*=nextupcard-button]");
    if (button) {
      // only skipping to next episode not an entirely new series
      const newEpNumber = document.querySelector("[class*=nextupcard-episode]");
      if (newEpNumber && !newEpNumber.textContent.match(/(?<!\S)1(?!\S)/)) {
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
  async function Amazon_SpeedSlider(video) {
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
          slider.style = "height: 1em;background: rgb(221, 221, 221);display: none;width:200px;";
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
  async function Amazon_FilterPaid() {
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
  // Crunchyroll Observers
  const CrunchyrollObserver = new MutationObserver(Crunchyroll);
  function Crunchyroll() {
    // if (settings.Crunchyroll?.skipIntro) Crunchyroll_Intro();
    // if (settings.Crunchyroll?.skipCredits) Crunchyroll_Credits();
    // if (settings.Crunchyroll?.watchCredits) Crunchyroll_Watch_Credits();
    // if (settings.Crunchyroll?.speedSlider) Crunchyroll_SpeedSlider();
  }
  async function Crunchyroll_IntroInterval() {
    Crunchyroll_Intro();
    let IntroInterval = setInterval(function () {
      if (!settings.Crunchyroll?.skipIntro) {
        log("stopped watching Intro");
        clearInterval(IntroInterval);
        return;
      }
      Crunchyroll_Intro();
    }, 10000);
  }
  async function Crunchyroll_Intro() {
    // the line below in xpath
    // //div[contains(@class, 'SkipContainer')]//button[contains(@class, 'Button') and contains(@class, 'skip')]
    // let button = document.evaluate('//div[@data-testid="skipIntroText"]', document, null, XPathResult.ANY_TYPE, null)?.iterateNext();
    const button = document.querySelector('[data-testid="skipIntroText"]');
    console.log(button, document.querySelector("iframe"));
    if (button) {
      let video = document.querySelector("video");
      const time = video?.currentTime;
      button?.click();
      log("Intro skipped", button);
      setTimeout(function () {
        addSkippedTime(time, video?.currentTime, "IntroTimeSkipped");
      }, 600);
    }
  }
  async function Crunchyroll_ReleaseCalendar() {
    if (settings.Crunchyroll?.releaseCalendar && window.location.href.includes("simulcastcalendar")) {
      function filterQueued(display) {
        let list = document.querySelectorAll("div.queue-flag:not(.queued)");
        list.forEach((element) => {
          element.parentElement.parentElement.parentElement.style.display = display;
        });
      }
      filterQueued(settings.General.filterQueued ? "none" : "block");
      function filterDub(display) {
        // itemprop="name"
        let list = document.querySelectorAll("cite[itemprop='name']");
        list.forEach((element) => {
          if (element.textContent.includes("Dub")) element.parentElement.parentElement.parentElement.parentElement.parentElement.style.display = display;
        });
      }
      filterDub("none");
      // Show playlist only
      const label = document.createElement("label");
      const span = document.createElement("span");
      span.style = "display: flex;align-items: center;";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = settings.General.filterQueued;
      input.onclick = function () {
        filterQueued(this.checked ? "none" : "block");
        settings.General.filterQueued = this.checked;
        browser.storage.sync.set({ settings });
      };
      const p = document.createElement("p");
      p.style = "width: 100px;";
      p.textContent = "Show Playlist only";
      label.appendChild(span);
      span.appendChild(input);
      span.appendChild(p);
      // Filter Dub
      const label2 = document.createElement("label");
      const span2 = document.createElement("span");
      span2.style = "display: flex;align-items: center;";
      const input2 = document.createElement("input");
      input2.type = "checkbox";
      input2.checked = settings.General.filterDub;
      input2.onclick = function () {
        filterDub(this.checked ? "none" : "block");
        settings.General.filterDub = this.checked;
        browser.storage.sync.set({ settings });
      };
      const p2 = document.createElement("p");
      p2.style = "width: 100px;";
      p2.textContent = "Filter Dub";
      label2.appendChild(span2);
      span2.appendChild(input2);
      span2.appendChild(p2);

      const toggleForm = document.querySelector("#filter_toggle_form");
      toggleForm.style.display = "flex";
      toggleForm.firstElementChild.appendChild(label);
      toggleForm.firstElementChild.appendChild(label2);
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
