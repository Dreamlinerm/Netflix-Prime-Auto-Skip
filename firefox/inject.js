console.debug("Netflix Ad skip plugin loaded.");
const params = new URLSearchParams(document.currentScript.src.split("?")[1]);

window.netflixSkipPlugin = {};
window.netflixSkipPlugin.config = {
  adLength: Number(params.get("adLength")),
};

window.netflixSkipPlugin.initPluginLogic = function () {
  // Clear variables:
  window.netflixSkipPlugin.videoPlayer = undefined;
  window.netflixSkipPlugin.playerSessionId = undefined;
  window.netflixSkipPlugin.player = undefined;

  // Set variables:
  if (netflix?.appContext?.state?.playerApp?.getAPI()?.videoPlayer) {
    window.netflixSkipPlugin.videoPlayer = netflix.appContext.state.playerApp.getAPI().videoPlayer;

    if (window.netflixSkipPlugin.videoPlayer?.getAllPlayerSessionIds()?.[0]) {
      window.netflixSkipPlugin.playerSessionId = window.netflixSkipPlugin.videoPlayer.getAllPlayerSessionIds()[0];

      window.netflixSkipPlugin.player = window.netflixSkipPlugin.videoPlayer.getVideoPlayerBySessionId(window.netflixSkipPlugin.playerSessionId);
    }
  }
};

// Get current player every 3 seconds:
setInterval(window.netflixSkipPlugin.initPluginLogic, 3000);

const NetflixVideoConfig = { attributes: true, subtree: true, childList: true, attributeOldValue: false };
const NetflixVideoObserver = new MutationObserver(Netflix_Video);
function Netflix_Video(mutations, observer) {
  let adLength = document.querySelector(".ltr-puk2kp")?.textContent;
  if (adLength) {
    if (window.netflixSkipPlugin.player && window.netflixSkipPlugin.player.getPlaybackRate() !== 2) {
      console.log("tried to fast forward");
      window.netflixSkipPlugin.player.setPlaybackRate(2);
      //   setPlaybackToNormal(Number(adLength) / 2);
      //   setTimeout(() => {
      //     window.netflixSkipPlugin.player.setPlaybackRate(1);
      //   }, Number(adLength) / 2);
    }
  } else if (window.netflixSkipPlugin.player.getPlaybackRate() > 1.5) {
    console.log("tried to stop fast forward");
    window.netflixSkipPlugin.player.setPlaybackRate(1);
  }
}
NetflixVideoObserver.observe(document, NetflixVideoConfig);
