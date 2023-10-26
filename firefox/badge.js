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
console.log("badge.js loaded");
let Badges = {};
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
        // api key for themoviedb
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5OWQyMWUxMmYzNjU1MjM4NzdhNTAwODVhMmVjYThiZiIsInN1YiI6IjY1M2E3Mjg3MjgxMWExMDBlYTA4NjI5OCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.x_EaVXQkg1_plk0NVSBnoNUl4QlGytdeO613nXIsP3w",
      },
    })
      .then((response) => response.json())
      .then((data) => sendResponse(data))
      .catch((error) => console.error(error));
    return true; // Indicates that sendResponse will be called asynchronously
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
