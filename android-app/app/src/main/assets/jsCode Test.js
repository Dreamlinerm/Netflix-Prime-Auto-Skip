const DisneyObserver = new MutationObserver(Disney);
const config = { attributes: true, childList: true, subtree: true };
DisneyObserver.observe(document, config);
function Disney() {
  // first ad not first video
  const video = Array.from(document.querySelectorAll("video")).find((v) =>
    v.checkVisibility()
  );
  document.querySelector(".skip__button")?.click();
}

// Send a message to the Android app
function sendMessage(message) {
  if (window.Android && window.Android.sendMessage) {
    window.Android.sendMessage(JSON.stringify(message));
  } else {
    console.log("Android interface not available");
  }
}

// Example usage
const message = {
  type: "greeting",
  content: "Hello from JavaScript!",
};
sendMessage(message);

console.log("Disney+ observer started");
