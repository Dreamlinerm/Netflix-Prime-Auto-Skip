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
console.log("badge.js loaded");
let Badges = {};
const isMobile = /Android/i.test(navigator.userAgent);
/**
 *
 * Increases Badge by 1
 *
 */
async function increaseBadge(tabId = null) {
  if (Badges[tabId] === undefined || typeof Badges[tabId] !== "number") {
    Badges[tabId] = 0;
  }
  Badges[tabId]++;
  browser.browserAction.setBadgeText({ text: Badges[tabId].toString(), tabId });
}
/**
 * Set Badge to a specific value
 * @param {string} text
 * @param {number} tabId
 */
async function setBadgeText(text, tabId = null) {
  Badges[tabId] = text;
  browser.browserAction.setBadgeText({ text, tabId });
}

// receive message from content script with the badgeText and set it in the badge
browser.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.url) {
    fetch(message.url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5OWQyMWUxMmYzNjU1MjM4NzdhNTAwODVhMmVjYThiZiIsInN1YiI6IjY1M2E3Mjg3MjgxMWExMDBlYTA4NjI5OCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.x_EaVXQkg1_plk0NVSBnoNUl4QlGytdeO613nXIsP3w",
      },
    })
      .then((response) => response.json())
      .then((data) => sendResponse(data))
      .catch((error) => console.error(error));
    return true; // Indicates that sendResponse will be called asynchronously
  } else if (message.type === "fullscreen") {
    console.log("Fullscreen", sender);
    browser.windows.update(sender.tab.windowId, { state: "fullscreen" });
  } else if (message.type === "exitFullscreen") {
    console.log("exit Fullscreen", sender);
    browser.windows.update(sender.tab.windowId, { state: "normal" });
  } else if (message.type === "setBadgeText") {
    setBadgeText(message.content, sender.tab.id);
  } else if (message.type === "increaseBadge") {
    increaseBadge(sender.tab.id);
  } else if (message.type === "resetBadge") {
    delete Badges[sender.tab.id];
    browser.browserAction.setBadgeText({ text: "", tabId: sender.tab.id });
  }
});

browser.runtime.onInstalled.addListener((details) => {
  // details.reason === "update" ||
  if (details.reason === "install") {
    browser.tabs.create({
      url: "popup/settings.html#Default",
    });
  }
});

if (isMobile) {
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
      Disney: { skipIntro: true, skipCredits: true, watchCredits: false, speedSlider: true, showRating: true, filterDuplicates: false },
      Crunchyroll: { skipIntro: true, speedSlider: true, releaseCalendar: true, dubLanguage: null },
      HBO: { skipIntro: true, skipCredits: true, watchCredits: false, speedSlider: true, showRating: true },
      Video: { playOnFullScreen: true, epilepsy: false, userAgent: true },
      Statistics: { AmazonAdTimeSkipped: 0, NetflixAdTimeSkipped: 0, IntroTimeSkipped: 0, RecapTimeSkipped: 0, SegmentsSkipped: 0 },
      General: {
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
  let settings = defaultSettings.settings;
  browser.storage.sync.get("settings", function (result) {
    // overwrite default settings with user settings
    settings = { ...defaultSettings.settings, ...result.settings };
    ChangeUserAgent();
    console.log("userAgent", settings.Video.userAgent);
  });

  browser.storage.sync.onChanged.addListener(function (changes) {
    if (changes?.settings) {
      const { oldValue, newValue } = changes.settings;
      settings = newValue;
      if (newValue.Video.userAgent !== oldValue?.Video?.userAgent) {
        console.log("userAgent", settings.Video.userAgent);
        // remove listener
        if (!newValue?.Video?.userAgent) {
          browser.webRequest.onBeforeSendHeaders.removeListener(ReplaceUserAgent);
        } else {
          ChangeUserAgent();
        }
      }
    }
  });
  const newUa = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0 streamingEnhanced";
  function ReplaceUserAgent(details) {
    for (let header of details.requestHeaders) {
      if (header.name === "User-Agent") {
        header.value = newUa;
        break;
      }
    }
    return { requestHeaders: details.requestHeaders };
  }

  function ChangeUserAgent() {
    if (settings.Video.userAgent) {
      browser.webRequest.onBeforeSendHeaders.addListener(
        ReplaceUserAgent,
        {
          urls: [
            "*://*.disneyplus.com/*",
            "*://*.starplus.com/*",
            "*://*.max.com/*",
            "*://*.hbomax.com/*",
            // these are only the prime video urls
            "*://*.primevideo.com/*",
            "*://*.amazon.com/gp/video/*",
            "*://*.amazon.co.jp/gp/video/*",
            "*://*.amazon.de/gp/video/*",
            "*://*.amazon.co.uk/gp/video/*",
          ],
        },
        ["blocking", "requestHeaders"]
      );
    }
  }
}
