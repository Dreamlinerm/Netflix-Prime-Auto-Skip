var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                  ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
// import {
// 	// startSharedFunctions,
// 	parseAdTime,
// 	createSlider,
// 	// Platforms,
// } from "./shared-functions"
// startSharedFunctions(Platforms.Disney);
function parseAdTime(adTimeText) {
  var _a, _b, _c, _d;
  if (!adTimeText) return false;
  var adTime =
    parseInt(
      (_b =
        (_a = /:\d+/.exec(
          adTimeText !== null && adTimeText !== void 0 ? adTimeText : ""
        )) === null || _a === void 0
          ? void 0
          : _a[0].substring(1)) !== null && _b !== void 0
        ? _b
        : ""
    ) +
    parseInt(
      (_d =
        (_c = /\d+/.exec(
          adTimeText !== null && adTimeText !== void 0 ? adTimeText : ""
        )) === null || _c === void 0
          ? void 0
          : _c[0]) !== null && _d !== void 0
        ? _d
        : ""
    ) *
      60;
  if (isNaN(adTime)) return false;
  return adTime;
}
function createSlider(
  video,
  videoSpeed,
  position,
  sliderStyle,
  speedStyle,
  divStyle
) {
  if (divStyle === void 0) {
    divStyle = "";
  }
  videoSpeed = videoSpeed || video.playbackRate;
  var slider = document.createElement("input");
  slider.id = "videoSpeedSlider";
  slider.type = "range";
  slider.min = "5";
  slider.max = "20";
  slider.value = "10";
  slider.step = "1";
  slider.style.cssText = sliderStyle;
  var speed = document.createElement("p");
  speed.id = "videoSpeed";
  speed.textContent = videoSpeed ? videoSpeed.toFixed(1) + "x" : "1.0x";
  speed.style.cssText = speedStyle;
  if (divStyle) {
    var div = document.createElement("div");
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
    var sliderValue = parseFloat(slider.value);
    speed.textContent = (sliderValue / 10).toFixed(1) + "x";
    video.playbackRate = sliderValue / 10;
    videoSpeed = sliderValue / 10;
  };
  return { slider: slider, speed: speed };
}
// Global Variables
var hostname = window.location.hostname;
var isDisney = /disneyplus|starplus/i.test(hostname);
var isHotstar = /hotstar/i.test(hostname);
var isStarPlus = /starplus/i.test(hostname);
var lastAdTimeText = 0;
function logStartOfAddon() {
  return __awaiter(this, void 0, void 0, function () {
    return __generator(this, function (_a) {
      console.log("%cStreaming enhanced", "color: #00aeef;font-size: 2em;");
      return [2 /*return*/];
    });
  });
}
function addSkippedTime(startTime, endTime, key) {
  return __awaiter(this, void 0, void 0, function () {
    return __generator(this, function (_a) {
      if (
        typeof startTime === "number" &&
        typeof endTime === "number" &&
        endTime > startTime
      ) {
        console.log(key, endTime - startTime);
      }
      return [2 /*return*/];
    });
  });
}
function resetLastATimeText() {
  return __awaiter(this, arguments, void 0, function (time) {
    if (time === void 0) {
      time = 1000;
    }
    return __generator(this, function (_a) {
      // timeout of 1 second to make sure the button is not pressed too fast, it will crash or slow the website otherwise
      setTimeout(function () {
        lastAdTimeText = 0;
      }, time);
      return [2 /*return*/];
    });
  });
}
var videoSpeed = 1;
function startDisney() {
  return __awaiter(this, void 0, void 0, function () {
    return __generator(this, function (_a) {
      logStartOfAddon();
      DisneyObserver.observe(document, {
        attributes: true,
        childList: true,
        subtree: true,
      });
      setInterval(function () {
        var video = Array.from(document.querySelectorAll("video")).find(
          function (v) {
            return v.checkVisibility();
          }
        );
        Disney_skipAd(video);
      }, 300);
      return [2 /*return*/];
    });
  });
}
// #region Disney
// Disney Observers
var DisneyObserver = new MutationObserver(Disney);
function Disney() {
  // first ad not first video
  var video = Array.from(document.querySelectorAll("video")).find(function (v) {
    return v.checkVisibility();
  });
  var time = video === null || video === void 0 ? void 0 : video.currentTime;
  Disney_Intro(video, time);
  Disney_skipCredits(time);
  Disney_Watch_Credits();
  Disney_SpeedSlider(video);
  if (isDisney) {
    Disney_addHomeButton();
    Disney_selfAd(video, time);
  }
}
function Disney_skipAd(video) {
  return __awaiter(this, void 0, void 0, function () {
    var adTimeText, adTime, continueText;
    var _a, _b;
    return __generator(this, function (_c) {
      if (video && !video.paused) {
        adTimeText =
          (_b =
            (_a = document.querySelector("ad-badge-overlay")) === null ||
            _a === void 0
              ? void 0
              : _a.shadowRoot) === null || _b === void 0
            ? void 0
            : _b.querySelector(".ad-badge-overlay__content--time-display");
        if (adTimeText) {
          adTime = parseAdTime(
            adTimeText === null || adTimeText === void 0
              ? void 0
              : adTimeText.textContent
          );
          if (adTime && adTime >= 1 && lastAdTimeText != video.currentTime) {
            if (lastAdTimeText == 0) {
              console.log("Disney Ad skipped, length:", adTime, "s");
            }
            lastAdTimeText = video.currentTime;
            video.currentTime += adTime;
          }
        } else lastAdTimeText = 0;
        continueText = document.querySelector(
          "p.toast-notification__text[aria-hidden='true']"
        );
        if (
          continueText === null || continueText === void 0
            ? void 0
            : continueText.checkVisibility()
        ) {
          continueText.remove();
        }
      }
      return [2 /*return*/];
    });
  });
}
function Disney_Intro(video, time) {
  return __awaiter(this, void 0, void 0, function () {
    var button;
    var _a, _b, _c;
    return __generator(this, function (_d) {
      if (isDisney) {
        button = isStarPlus
          ? document.querySelector('[data-gv2elementkey="playNext"]')
          : document.querySelector(".skip__button");
      } else button = (_b = (_a = document.evaluate("//span[contains(., 'Skip Intro')]", document, null, XPathResult.ANY_TYPE, null)) === null || _a === void 0 ? void 0 : _a.iterateNext()) === null || _b === void 0 ? void 0 : _b.parentElement;
      if (
        button &&
        !((_c = document.querySelector('[data-testid="icon-restart"]')) ===
          null || _c === void 0
          ? void 0
          : _c.parentElement)
      ) {
        button.click();
        console.log("Intro/Recap skipped", button);
        setTimeout(function () {
          addSkippedTime(
            time,
            video === null || video === void 0 ? void 0 : video.currentTime,
            "IntroTimeSkipped"
          );
        }, 600);
      }
      return [2 /*return*/];
    });
  });
}
function Disney_skipCredits(currentTime) {
  return __awaiter(this, void 0, void 0, function () {
    var button, time, videoFullscreen;
    var _a, _b, _c;
    return __generator(this, function (_d) {
      if (isStarPlus)
        button = document.querySelector('[data-gv2elementkey="playNext"]');
      else if (isDisney)
        button =
          (_a = document.querySelector('[data-testid="icon-restart"]')) ===
            null || _a === void 0
            ? void 0
            : _a.parentElement;
      else
        button =
          (_c =
            (_b = document.evaluate(
              "//span[contains(., 'Next Episode')]",
              document,
              null,
              XPathResult.ANY_TYPE,
              null
            )) === null || _b === void 0
              ? void 0
              : _b.iterateNext()) === null || _c === void 0
            ? void 0
            : _c.parentElement;
      // button.getAttribute("data-testid") is to avoid clicking the next episode button when different show.
      if (button && !button.getAttribute("data-testid")) {
        time = currentTime;
        if (time && lastAdTimeText != time) {
          videoFullscreen = document.fullscreenElement !== null;
          lastAdTimeText = time;
          button.click();
          console.log("Credits skipped", button);
          resetLastATimeText();
        }
      }
      return [2 /*return*/];
    });
  });
}
function Disney_addHomeButton() {
  return __awaiter(this, void 0, void 0, function () {
    var buttonDiv, homeButton_1;
    var _a;
    return __generator(this, function (_b) {
      buttonDiv =
        (_a = document.querySelector(
          '[data-testid="browser-action-button"]'
        )) === null || _a === void 0
          ? void 0
          : _a.parentElement;
      if (buttonDiv && !document.querySelector("#homeButton")) {
        homeButton_1 = document.createElement("button");
        //  browser.i18n.getMessage $t("HomeButton")
        homeButton_1.textContent = "Home";
        homeButton_1.id = "homeButton";
        homeButton_1.style.cssText =
          'color: white;background-color: #40424A;border: rgb(64, 66, 74);border-radius: 5px;padding: 0 2px 0 2px;height: 56px;padding-left: 24px;padding-right: 24px;letter-spacing: 1.76px;font-size: 15px;  text-transform: uppercase;cursor: pointer;font-family:"Avenir-World-for-Disney-Demi", sans-serif;';
        // add hover effect
        homeButton_1.onmouseover = function () {
          homeButton_1.style.backgroundColor = "#474a53";
        };
        homeButton_1.onmouseout = function () {
          homeButton_1.style.backgroundColor = "#40424A";
        };
        homeButton_1.onclick = function () {
          window.location.href = "/";
        };
        buttonDiv.appendChild(homeButton_1);
      }
      return [2 /*return*/];
    });
  });
}
function Disney_Watch_Credits() {
  return __awaiter(this, void 0, void 0, function () {
    var button, time, video;
    var _a, _b, _c, _d, _e, _f;
    return __generator(this, function (_g) {
      if (isStarPlus)
        button = document.querySelector('[data-gv2elementkey="playNext"]');
      else if (
        isDisney &&
        !document.querySelector('[data-testid="playback-action-button"]')
      )
        button =
          (_a = document.querySelector('[data-testid="icon-restart"]')) ===
            null || _a === void 0
            ? void 0
            : _a.parentElement;
      else
        button =
          (_c =
            (_b = document.evaluate(
              "//span[contains(., 'Next Episode')]",
              document,
              null,
              XPathResult.ANY_TYPE,
              null
            )) === null || _b === void 0
              ? void 0
              : _b.iterateNext()) === null || _c === void 0
            ? void 0
            : _c.parentElement;
      if (button) {
        time = void 0;
        if (isDisney)
          time =
            (_e = /\d+/.exec(
              (_d =
                button === null || button === void 0
                  ? void 0
                  : button.textContent) !== null && _d !== void 0
                ? _d
                : ""
            )) === null || _e === void 0
              ? void 0
              : _e[0];
        if (
          (isHotstar &&
            !((_f = document.evaluate(
              "//span[contains(., 'My Space')]",
              document,
              null,
              XPathResult.ANY_TYPE,
              null
            )) === null || _f === void 0
              ? void 0
              : _f.iterateNext())) ||
          (time && lastAdTimeText != time)
        ) {
          video = Array.from(document.querySelectorAll("video")).find(function (
            v
          ) {
            return v.checkVisibility();
          });
          if (video) {
            video.click();
            lastAdTimeText = time !== null && time !== void 0 ? time : 0;
            console.log("Credits Watched", button);
            resetLastATimeText();
          }
        }
      }
      return [2 /*return*/];
    });
  });
}
var DisneySliderStyle =
  "pointer-events: auto;background: rgb(221, 221, 221);display: none;width:200px;";
var DisneySpeedStyle =
  "height:10px;min-width:40px;color:#f9f9f9;pointer-events: auto;position: relative;bottom: 8px;padding: 0 5px;";
function Disney_SpeedSlider(video) {
  return __awaiter(this, void 0, void 0, function () {
    var alreadySlider_1, position, speed_1;
    var _a, _b, _c, _d;
    return __generator(this, function (_e) {
      if (video) {
        alreadySlider_1 = document.querySelector("#videoSpeedSlider");
        if (!alreadySlider_1) {
          position = void 0;
          if (isDisney) position = document.querySelector(".controls__right");
          else
            position =
              (_d =
                (_c =
                  (_b =
                    (_a = document.querySelector(".icon-player-landscape")) ===
                      null || _a === void 0
                      ? void 0
                      : _a.parentElement) === null || _b === void 0
                    ? void 0
                    : _b.parentElement) === null || _c === void 0
                  ? void 0
                  : _c.parentElement) === null || _d === void 0
                ? void 0
                : _d.parentElement;
          if (position)
            createSlider(
              video,
              videoSpeed,
              position,
              DisneySliderStyle,
              DisneySpeedStyle
            );
        } else {
          speed_1 = document.querySelector("#videoSpeed");
          if (video.playbackRate !== parseFloat(alreadySlider_1.value) / 10) {
            video.playbackRate = parseFloat(alreadySlider_1.value) / 10;
          }
          alreadySlider_1.oninput = function () {
            var sliderValue = parseFloat(alreadySlider_1.value);
            if (speed_1)
              speed_1.textContent = (sliderValue / 10).toFixed(1) + "x";
            video.playbackRate = sliderValue / 10;
            videoSpeed = sliderValue / 10;
          };
        }
      }
      return [2 /*return*/];
    });
  });
}
function Disney_selfAd(video, time) {
  return __awaiter(this, void 0, void 0, function () {
    var button;
    return __generator(this, function (_a) {
      if (isDisney) {
        button = document.querySelector(
          ".overlay_interstitials__promo_skip_button"
        );
        if (button) {
          button.click();
          console.log("SelfAd skipped", button);
          setTimeout(function () {
            addSkippedTime(
              time,
              video === null || video === void 0 ? void 0 : video.currentTime,
              "DisneyAdTimeSkipped"
            );
          }, 600);
        }
      }
      return [2 /*return*/];
    });
  });
}
// #endregion
startDisney();
