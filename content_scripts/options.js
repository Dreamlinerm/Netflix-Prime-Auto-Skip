(function () {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  // global variables
  // browser.storage.local.get("disabled", function (result) {
  //   console.log("op:Value currently is " + result.disabled);
  // });
  // browser.storage.local.set({ disabled: true }, function () {
  //   console.log("Value is set to " + true);
  // });

  // browser.storage.local.get("disabled", function (result) {
  //   console.log("Value currently is " + result.disabled);
  // });
  // browser.storage.local.set({ disabled: false }, function () {
  //   console.log("Value is set to " + false);
  // });
  console.log("options.js");
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;
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
