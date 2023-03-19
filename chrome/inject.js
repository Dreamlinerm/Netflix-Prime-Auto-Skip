console.debug("Netflix Ad skip plugin loaded.");
const params = new URLSearchParams(document.currentScript.src.split("?")[1]);

let Settings = {
  adLength: Number(params.get("adLength")),
};
let videoPlayer;
let playerSessionId;
let player;

function initPluginLogic() {
  // Clear variables:
  videoPlayer = undefined;
  playerSessionId = undefined;
  player = undefined;

  // Set variables:
  if (netflix?.appContext?.state?.playerApp?.getAPI()?.videoPlayer) {
    videoPlayer = netflix.appContext.state.playerApp.getAPI().videoPlayer;

    if (videoPlayer?.getAllPlayerSessionIds()?.[0]) {
      playerSessionId = videoPlayer.getAllPlayerSessionIds()[0];
      //   console.log("playerSessionId", videoPlayer.getAllPlayerSessionIds());
      player = videoPlayer.getVideoPlayerBySessionId(playerSessionId);
    }
  }
}

// // Get current player every 3 seconds:
// setInterval(initPluginLogic(), 3000);

let AdInterval = setInterval(function () {
  initPluginLogic();
  let adLength = document.querySelector(".ltr-puk2kp")?.textContent;
  if (adLength) {
    if (player && player.getPlaybackRate() !== 2) {
      console.log("Fast forwarding Ad");
      player.setPlaybackRate(2);
    }
  }
  // set to normal playback rate if ad is over
  else if (player.getPlaybackRate() > 1.5) {
    console.log("Stopped fast forwarding");
    player.setPlaybackRate(1);
  }
}, 100);
