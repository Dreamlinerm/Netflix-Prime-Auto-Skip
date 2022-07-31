/**
 * CSS to hide everything on the page,
 * except for elements that have the "beastify-image" class.
 */
const hidePage = `body > :not(.beastify-image) {
                    display: none;
                  }`;
// browser.runtime.onMessage.addListener((message) => {
//   if (message.command === "skipIntroStatus") {
//     document.querySelector("#intro").checked = message.skipVideo;
//     alert("skipVideo", message.skipVideo);
//   } else if (message.command === "skipAdsStatus") {
//     document.querySelector("#ads").checked = message.skipAd;
//     alert("skipAd", message.skipAd);
//   }
// });
// async function logListener(info) {
//   try {
//     let tabInfo = await browser.tabs.get(info.tabId);
//     alert(tabInfo);
//   } catch (error) {
//     console.error(error);
//   }
// }

// TODO: cookies----------------------------
// async function getTab() {
//   return browser.tabs.query({ active: true, currentWindow: true });
// }
// const tab = await getTab();
// console.log("tab", tab);
// console.log("tab.url", tab.url);
// const introCheckbox = document.querySelector("#intro");
// const adsCheckbox = document.querySelector("#ads");
// let cookie = browser.cookies.get({
//   url: browser.tabs.query({ active: true, currentWindow: true })[0].url,
//   name: "primeskip",
// });
// // if (cookie == null) {
// let cookieVal = {
//   skipVideos: introCheckbox.checked || "true",
//   skipAds: adsCheckbox.checked || "true",
// };
// console.log(cookieVal);
// browser.cookies.set({
//   url: browser.tabs.query({ active: true, currentWindow: true })[0].url,
//   name: "primeskip",
//   value: JSON.stringify(cookieVal),
// });
// // }
// cookie = browser.cookies.get({
//   url: browser.tabs.query({ active: true, currentWindow: true })[0].url,
//   name: "primeskip",
// });
// introCheckbox.checked = cookie.skipVideos;
// adsCheckbox.checked = cookie.skipAds;
// console.log("cookie", window.location.href, cookie.skipVideos, cookie.skipAds);
// TODO: make runner which will cache the option.
let skipVideos = localStorage.getItem("skipVideo");
let skipAds = localStorage.getItem("skipAd");
console.log("skipVideo: ", skipVideos, "skipAd: ", skipAds);
if (skipVideos == null) {
  console.log("skipVideo", true);
  localStorage.setItem("skipVideo", true);
  // skipVideos = true;
}
if (skipAds == null) {
  console.log("skipAd", true);
  localStorage.setItem("skipAd", true);
  // skipAds = true;
}
function toBool(bool) {
  if (bool == "true") {
    return true;
  } else {
    return false;
  }
}
document.querySelector("#intro").checked = toBool(skipVideos);
document.querySelector("#ads").checked = toBool(skipAds);
// browser.tabs
//   .query({ active: true, currentWindow: true })
//   .then(skipIntro)
//   .catch(reportError);
// browser.tabs
//   .query({ active: true, currentWindow: true })
//   .then(skipAd)
//   .catch(reportError);
/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {
  var listener = document.addEventListener("click", (e) => {
    /**
     * send a "skipIntro" message to the primeskip in the active tab.
     */
    function skipIntro(tabs) {
      const introCheckbox = document.querySelector("#intro");
      //   alert(introCheckbox.checked);
      //   browser.tabs.get(tabs[0].id);
      browser.tabs.sendMessage(tabs[0].id, {
        command: "skipIntro",
        skipVideo: introCheckbox.checked,
      });
    }
    /**
     * send a "skipIntro" message to the primeskip in the active tab.
     */
    function skipAd(tabs) {
      const adsCheckbox = document.querySelector("#ads");
      browser.tabs.sendMessage(tabs[0].id, {
        command: "skipAd",
        skipAd: adsCheckbox.checked,
      });
    }

    /**
     * Insert the page-hiding CSS into the active tab,
     * then get the beast URL and
     * send a "beastify" message to the content script in the active tab.
     */
    function beastify(tabs) {
      browser.tabs.insertCSS({ code: hidePage }).then(() => {
        //sth
      });
    }

    /**
     * Remove the page-hiding CSS from the active tab,
     * send a "reset" message to the content script in the active tab.
     */
    function reset(tabs) {
      browser.tabs.removeCSS({ code: hidePage }).then(() => {
        browser.tabs.sendMessage(tabs[0].id, {
          command: "reset",
        });
      });
    }

    /**
     * Just log the error to the console.
     */
    function reportError(error) {
      console.error(`There was an error: ${error}`);
    }
    function invert(bool) {
      if (bool == "true") {
        return "false";
      } else {
        return "true";
      }
    }
    /**
     * Get the active tab,
     * then call "beastify()" or "reset()" as appropriate.
     */
    if (e.target.classList.contains("reset")) {
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then(reset)
        .catch(reportError);
    } else if (e.target.classList.contains("intro")) {
      const skipVideos = localStorage.getItem("skipVideo");
      localStorage.setItem("skipVideo", invert(skipVideos));
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then(skipIntro)
        .catch(reportError);
    } else if (e.target.classList.contains("ads")) {
      const skipAds = localStorage.getItem("skipAd");
      localStorage.setItem("skipAd", invert(skipAds));
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then(skipAd)
        .catch(reportError);
    }
  });
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  console.error(`Failed to execute primeskip content script: ${error.message}`);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
//browser.tabs .executeScript({ file: "/content_scripts/options.js" }) .then(listenForClicks) .catch(reportExecuteScriptError);
browser.tabs
  .executeScript({ file: "/content_scripts/options.js" })
  .then(listenForClicks)
  .catch(reportExecuteScriptError);
