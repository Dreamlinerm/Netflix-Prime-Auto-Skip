// import {
// 	// startSharedFunctions,
// 	parseAdTime,
// 	createSlider,
// 	// Platforms,
// } from "./shared-functions"
// startSharedFunctions(Platforms.Disney);
function parseAdTime(adTimeText: string | null) {
  if (!adTimeText) return false;
  const adTime: number =
    parseInt(/:\d+/.exec(adTimeText ?? "")?.[0].substring(1) ?? "") +
    parseInt(/\d+/.exec(adTimeText ?? "")?.[0] ?? "") * 60;
  if (isNaN(adTime)) return false;
  return adTime;
}

function createSlider(
  video: HTMLVideoElement,
  videoSpeed: number,
  position: HTMLElement,
  sliderStyle: string,
  speedStyle: string,
  divStyle = ""
) {
  videoSpeed = videoSpeed || video.playbackRate;

  const slider = document.createElement("input");
  slider.id = "videoSpeedSlider";
  slider.type = "range";
  slider.min = "5";
  slider.max = "20";
  slider.value = "10";
  slider.step = "1";
  slider.style.cssText = sliderStyle;

  const speed = document.createElement("p");
  speed.id = "videoSpeed";
  speed.textContent = videoSpeed ? videoSpeed.toFixed(1) + "x" : "1.0x";
  speed.style.cssText = speedStyle;
  if (divStyle) {
    const div = document.createElement("div");
    div.style.cssText = divStyle;
    div.appendChild(slider);
    div.appendChild(speed);
    position.prepend(div);
  } else position.prepend(slider, speed);

  if (videoSpeed) video.playbackRate = videoSpeed;
  speed.onclick = function () {
    slider.style.display = slider.style.display === "block" ? "none" : "block";
  };
  slider.oninput = function () {
    const sliderValue = parseFloat(slider.value);
    speed.textContent = (sliderValue / 10).toFixed(1) + "x";
    video.playbackRate = sliderValue / 10;
    videoSpeed = sliderValue / 10;
  };

  return { slider, speed };
}

// Global Variables
const hostname = window.location.hostname;
const isDisney = /disneyplus|starplus/i.test(hostname);
const isHotstar = /hotstar/i.test(hostname);
const isStarPlus = /starplus/i.test(hostname);
let lastAdTimeText: number | string = 0;
async function logStartOfAddon() {
  console.log("%cStreaming enhanced", "color: #00aeef;font-size: 2em;");
}
type StatisticsKey =
  | "AmazonAdTimeSkipped"
  | "NetflixAdTimeSkipped"
  | "DisneyAdTimeSkipped"
  | "IntroTimeSkipped"
  | "RecapTimeSkipped"
  | "SegmentsSkipped";
async function addSkippedTime(
  startTime: number,
  endTime: number,
  key: StatisticsKey
) {
  if (
    typeof startTime === "number" &&
    typeof endTime === "number" &&
    endTime > startTime
  ) {
    console.log(key, endTime - startTime);
  }
}

async function resetLastATimeText(time = 1000) {
  // timeout of 1 second to make sure the button is not pressed too fast, it will crash or slow the website otherwise
  setTimeout(() => {
    lastAdTimeText = 0;
  }, time);
}
let videoSpeed: number = 1;
async function startDisney() {
  logStartOfAddon();
  DisneyObserver.observe(document, {
    attributes: true,
    childList: true,
    subtree: true,
  });
  setInterval(function () {
    const video = Array.from(document.querySelectorAll("video")).find((v) =>
      v.checkVisibility()
    ) as HTMLVideoElement;
    Disney_skipAd(video);
  }, 300);
}

// #region Disney
// Disney Observers
const DisneyObserver = new MutationObserver(Disney);
function Disney() {
  // first ad not first video
  const video = Array.from(document.querySelectorAll("video")).find((v) =>
    v.checkVisibility()
  ) as HTMLVideoElement;
  const time = video?.currentTime;
  Disney_Intro(video, time);
  Disney_skipCredits(time);
  Disney_Watch_Credits();
  Disney_SpeedSlider(video);
  if (isDisney) {
    Disney_addHomeButton();
    Disney_selfAd(video, time);
  }
}
async function Disney_skipAd(video: HTMLVideoElement) {
  if (video && !video.paused) {
    const adTimeText = document
      .querySelector("ad-badge-overlay")
      ?.shadowRoot?.querySelector(".ad-badge-overlay__content--time-display");
    if (adTimeText) {
      const adTime = parseAdTime(adTimeText?.textContent);
      if (adTime && adTime >= 1 && lastAdTimeText != video.currentTime) {
        if (lastAdTimeText == 0) {
          console.log("Disney Ad skipped, length:", adTime, "s");
        }
        lastAdTimeText = video.currentTime;
        video.currentTime += adTime;
      }
    } else lastAdTimeText = 0;
    // remove das video wird nach der pause fortgesetzt text after skipping ad
    const continueText = document.querySelector(
      "p.toast-notification__text[aria-hidden='true']"
    );
    if (continueText?.checkVisibility()) {
      continueText.remove();
    }
  }
}

async function Disney_Intro(video: HTMLVideoElement, time: number) {
  // intro star wars andor Season 1 episode 2
  // Recap Criminal Minds Season 1 Episode 2
  let button: HTMLElement | undefined;
  if (isDisney) {
    button = isStarPlus
      ? (document.querySelector(
          '[data-gv2elementkey="playNext"]'
        ) as HTMLElement)
      : (document.querySelector(".skip__button") as HTMLElement);
  } else
    button = document
      .evaluate(
        "//span[contains(., 'Skip Intro')]",
        document,
        null,
        XPathResult.ANY_TYPE,
        null
      )
      ?.iterateNext()?.parentElement as HTMLElement;
  if (
    button &&
    !document.querySelector('[data-testid="icon-restart"]')?.parentElement
  ) {
    button.click();
    console.log("Intro/Recap skipped", button);
    setTimeout(function () {
      addSkippedTime(time, video?.currentTime, "IntroTimeSkipped");
    }, 600);
  }
}
async function Disney_skipCredits(currentTime: number) {
  let button: HTMLElement;
  if (isStarPlus)
    button = document.querySelector(
      '[data-gv2elementkey="playNext"]'
    ) as HTMLElement;
  else if (isDisney)
    button = document.querySelector('[data-testid="icon-restart"]')
      ?.parentElement as HTMLElement;
  else
    button = document
      .evaluate(
        "//span[contains(., 'Next Episode')]",
        document,
        null,
        XPathResult.ANY_TYPE,
        null
      )
      ?.iterateNext()?.parentElement as HTMLElement;
  // button.getAttribute("data-testid") is to avoid clicking the next episode button when different show.
  if (button && !button.getAttribute("data-testid")) {
    // time is to avoid clicking too fast
    const time = currentTime;
    if (time && lastAdTimeText != time) {
      const videoFullscreen = document.fullscreenElement !== null;
      lastAdTimeText = time;
      button.click();
      console.log("Credits skipped", button);
      resetLastATimeText();
    }
  }
}
async function Disney_addHomeButton() {
  // add home button to the end of the credits
  const buttonDiv = document.querySelector(
    '[data-testid="browser-action-button"]'
  )?.parentElement;
  if (buttonDiv && !document.querySelector("#homeButton")) {
    const homeButton = document.createElement("button");
    //  browser.i18n.getMessage $t("HomeButton")
    homeButton.textContent = "Home";
    homeButton.id = "homeButton";
    homeButton.style.cssText =
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
  let button: Element | null | undefined;
  if (isStarPlus)
    button = document.querySelector('[data-gv2elementkey="playNext"]');
  else if (
    isDisney &&
    !document.querySelector('[data-testid="playback-action-button"]')
  )
    button = document.querySelector(
      '[data-testid="icon-restart"]'
    )?.parentElement;
  else
    button = document
      .evaluate(
        "//span[contains(., 'Next Episode')]",
        document,
        null,
        XPathResult.ANY_TYPE,
        null
      )
      ?.iterateNext()?.parentElement as HTMLElement;
  if (button) {
    // only skip if the next video is the next episode of a series (there is a timer)
    let time;
    if (isDisney) time = /\d+/.exec(button?.textContent ?? "")?.[0];
    if (
      (isHotstar &&
        !document
          .evaluate(
            "//span[contains(., 'My Space')]",
            document,
            null,
            XPathResult.ANY_TYPE,
            null
          )
          ?.iterateNext()) ||
      (time && lastAdTimeText != time)
    ) {
      const video = Array.from(document.querySelectorAll("video")).find((v) =>
        v.checkVisibility()
      ) as HTMLVideoElement;
      if (video) {
        video.click();
        lastAdTimeText = time ?? 0;
        console.log("Credits Watched", button);
        resetLastATimeText();
      }
    }
  }
}

const DisneySliderStyle =
  "pointer-events: auto;background: rgb(221, 221, 221);display: none;width:200px;";
const DisneySpeedStyle =
  "height:10px;min-width:40px;color:#f9f9f9;pointer-events: auto;position: relative;bottom: 8px;padding: 0 5px;";
async function Disney_SpeedSlider(video: HTMLVideoElement) {
  if (video) {
    const alreadySlider: HTMLInputElement | null =
      document.querySelector("#videoSpeedSlider");
    if (!alreadySlider) {
      // infobar position for the slider to be added
      let position: HTMLElement | null;
      if (isDisney) position = document.querySelector(".controls__right");
      else
        position = document.querySelector(".icon-player-landscape")
          ?.parentElement?.parentElement?.parentElement
          ?.parentElement as HTMLElement;
      if (position)
        createSlider(
          video,
          videoSpeed,
          position,
          DisneySliderStyle,
          DisneySpeedStyle
        );
    } else {
      // need to resync the slider with the video sometimes
      const speed = document.querySelector("#videoSpeed");
      if (video.playbackRate !== parseFloat(alreadySlider.value) / 10) {
        video.playbackRate = parseFloat(alreadySlider.value) / 10;
      }
      alreadySlider.oninput = function () {
        const sliderValue = parseFloat(alreadySlider.value);
        if (speed) speed.textContent = (sliderValue / 10).toFixed(1) + "x";
        video.playbackRate = sliderValue / 10;
        videoSpeed = sliderValue / 10;
      };
    }
  }
}

async function Disney_selfAd(video: HTMLVideoElement, time: number) {
  if (isDisney) {
    const button: HTMLElement | null = document.querySelector(
      ".overlay_interstitials__promo_skip_button"
    );
    if (button) {
      button.click();
      console.log("SelfAd skipped", button);
      setTimeout(function () {
        addSkippedTime(time, video?.currentTime, "DisneyAdTimeSkipped");
      }, 600);
    }
  }
}
// #endregion

startDisney();
