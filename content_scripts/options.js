(function () {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

  //   let skipVideos = localStorage.getItem("skipVideo");
  //   let skipAds = localStorage.getItem("skipAd");
  //   console.log("Popup opened", skipVideos, skipAds);
  //   function logTabs(tabs) {
  //     console.log(tabs);
  //   }

  //   browser.tabs.query({ currentWindow: true }, logTabs);

  //   browser.tabs.sendMessage(
  //     browser.tabs.query({ active: true, currentWindow: true })[0].id,
  //     {
  //       command: "skipIntroStatus",
  //       skipVideo: skipVideos,
  //     }
  //   );
  //   browser.tabs.sendMessage(tabs[0].id, {
  //     command: "skipAdsStatus",
  //     skipVideo: skipAds,
  //   });
  /**
   * Given a URL to a beast image, remove all existing beasts, then
   * create and style an IMG node pointing to
   * that image, then insert the node into the document.
   */
  function insertBeast(beastURL) {
    removeExistingBeasts();
    let beastImage = document.createElement("img");
    beastImage.setAttribute("src", beastURL);
    beastImage.style.height = "100vh";
    beastImage.className = "beastify-image";
    document.body.appendChild(beastImage);
  }

  /**
   * Remove every beast from the page.
   */
  function removeExistingBeasts() {
    let existingBeasts = document.querySelectorAll(".beastify-image");
    for (let beast of existingBeasts) {
      beast.remove();
    }
  }

  /**
   * Listen for messages from the background script.
   * Call "insertBeast()" or "removeExistingBeasts()".
   */
  browser.runtime.onMessage.addListener((message) => {
    if (message.command === "beastify") {
      insertBeast(message.beastURL);
    } else if (message.command === "reset") {
      removeExistingBeasts();
    }
  });
})();
