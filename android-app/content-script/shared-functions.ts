// global window.Android
// function sendMessage(message) {
//   if (window?.Android?.sendMessage) {
//     window.Android.sendMessage(JSON.stringify(message));
//   } else {
//     console.log("Android interface not available");
//   }
// }
console.log("shared-functions loaded");
// Global Variables

export const date = new Date();
const today = date.toISOString().split("T")[0];

const ua = navigator.userAgent;
let url = window.location.href;
const hostname = window.location.hostname;
const title = document.title;
const isPrimeVideo =
  /amazon|primevideo/i.test(hostname) &&
  (/video/i.test(title) || /video/i.test(url));
let isNetflix = /netflix/i.test(hostname);
let isDisney = /disneyplus|starplus/i.test(hostname);
const isHotstar = /hotstar/i.test(hostname);
let isHBO = /max.com/i.test(hostname);
const htmlLang = document.documentElement.lang;

export enum Platforms {
  Netflix = "netflix",
  Amazon = "amazon",
  StarPlus = "starplus",
  Disney = "disney",
  Hotstar = "hotstar",
  Crunchyroll = "crunchyroll",
  HBO = "hbo",
}

export async function startSharedFunctions(platform: Platforms) {
  // if(platform == Platforms.Amazon) isPrimeVideo = true, because should only be called on amazon prime video
  if (platform == Platforms.Netflix) isNetflix = true;
  if (platform == Platforms.Disney) isDisney = true;
  if (platform == Platforms.HBO) isHBO = true;
}

// #region exported functions
// parse string time to seconds e.g. 1:30 -> 90
export function parseAdTime(adTimeText: string | null) {
  if (!adTimeText) return false;
  const adTime: number =
    parseInt(/:\d+/.exec(adTimeText ?? "")?.[0].substring(1) ?? "") +
    parseInt(/\d+/.exec(adTimeText ?? "")?.[0] ?? "") * 60;
  if (isNaN(adTime)) return false;
  return adTime;
}

export function createSlider(
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
// #endregion
