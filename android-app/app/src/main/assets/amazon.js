var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a;
// Global Variables
function sendMessage() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/];
        });
    });
}
var settings = {
    value: {
        Amazon: {
            skipIntro: true,
            skipCredits: true,
            watchCredits: false,
            selfAd: true,
            skipAd: true,
            speedSlider: true,
            filterPaid: true,
            continuePosition: true,
            showRating: true,
            xray: true,
        },
        Netflix: {
            skipIntro: true,
            skipRecap: true,
            skipCredits: true,
            watchCredits: false,
            skipBlocked: true,
            skipAd: true,
            speedSlider: true,
            profile: true,
            showRating: true,
            removeGames: true,
            hideTitles: true,
        },
        Disney: {
            skipIntro: true,
            skipCredits: true,
            watchCredits: false,
            skipAd: true,
            speedSlider: true,
            showRating: true,
            selfAd: true,
            hideTitles: true,
        },
        Crunchyroll: {
            skipIntro: true,
            speedSlider: true,
            releaseCalendar: true,
            dubLanguage: null,
            profile: true,
            bigPlayer: true,
            disableNumpad: true,
        },
        HBO: {
            skipIntro: true,
            skipCredits: true,
            watchCredits: false,
            speedSlider: true,
            showRating: true,
        },
        Video: {
            playOnFullScreen: true,
            epilepsy: false,
            userAgent: true,
            doubleClick: false,
            scrollVolume: false,
            showYear: false,
        },
        Statistics: {
            AmazonAdTimeSkipped: 0,
            NetflixAdTimeSkipped: 0,
            DisneyAdTimeSkipped: 0,
            IntroTimeSkipped: 0,
            RecapTimeSkipped: 0,
            SegmentsSkipped: 0,
        },
        General: {
            Crunchyroll_profilePicture: "",
            profileName: "",
            profilePicture: "",
            sliderSteps: 1,
            sliderMin: 5,
            sliderMax: 20,
            filterDub: true,
            filterQueued: true,
            savedCrunchyList: [],
            GCdate: "2024-01-01",
            affiliate: true,
            Crunchyroll_skipTimeout: 0,
        },
    },
};
var ua = navigator.userAgent;
var lastAdTimeText = 0;
var videoSpeed = 1;
var url = window.location.href;
var hostname = window.location.hostname;
var title = document.title;
var config = { attributes: true, childList: true, subtree: true };
function logStartOfAddon() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            console.log("%cStreaming enhanced", "color: #00aeef;font-size: 2em;");
            console.log("Settings", settings.value);
            return [2 /*return*/];
        });
    });
}
function addSkippedTime(startTime, endTime, key) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (typeof startTime === "number" && typeof endTime === "number" && endTime > startTime) {
                console.log(key, endTime - startTime);
                settings.value.Statistics[key] += endTime - startTime;
                sendMessage("increaseBadge", {}, "background");
                console.log("Updated ".concat(key, ":"), settings.value.Statistics[key]);
            }
            return [2 /*return*/];
        });
    });
}
function startAmazon() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            logStartOfAddon();
            adjustForTV();
            AmazonSkipIntroObserver.observe(document, AmazonSkipIntroConfig);
            if ((_a = settings.value.Amazon) === null || _a === void 0 ? void 0 : _a.speedSlider)
                Amazon_SpeedKeyboard();
            AmazonObserver.observe(document, config);
            if ((_b = settings.value.Amazon) === null || _b === void 0 ? void 0 : _b.selfAd)
                Amazon_selfAdTimeout();
            if ((_c = settings.value.Amazon) === null || _c === void 0 ? void 0 : _c.skipAd) {
                // timeout of 100 ms because the ad is not loaded fast enough and the video will crash
                setTimeout(function () {
                    Amazon_FreeveeTimeout();
                }, 1000);
            }
            if ((_d = settings.value.Amazon) === null || _d === void 0 ? void 0 : _d.continuePosition)
                setTimeout(function () { return Amazon_continuePosition(); }, 500);
            return [2 /*return*/];
        });
    });
}
// #region Amazon
// Amazon Observers
var AmazonVideoClass = ".dv-player-fullscreen video";
var AmazonObserver = new MutationObserver(Amazon);
function Amazon() {
    var _a, _b, _c, _d, _e, _f;
    if ((_a = settings.value.Amazon) === null || _a === void 0 ? void 0 : _a.filterPaid)
        Amazon_FilterPaid();
    var video = document.querySelector(AmazonVideoClass);
    if ((_b = settings.value.Amazon) === null || _b === void 0 ? void 0 : _b.skipCredits)
        Amazon_Credits();
    if ((_c = settings.value.Amazon) === null || _c === void 0 ? void 0 : _c.watchCredits)
        Amazon_Watch_Credits();
    if ((_d = settings.value.Amazon) === null || _d === void 0 ? void 0 : _d.speedSlider)
        Amazon_SpeedSlider(video);
    if ((_e = settings.value.Amazon) === null || _e === void 0 ? void 0 : _e.xray)
        Amazon_xray();
    if ((_f = settings.value.Video) === null || _f === void 0 ? void 0 : _f.scrollVolume)
        Amazon_scrollVolume();
    remove_unnecessary_elements(video);
}
var AmazonSkipIntroConfig = {
    attributes: true,
    attributeFilter: [".skipelement"],
    subtree: true,
    childList: true,
    attributeOldValue: false,
};
var AmazonSkipIntroObserver = new MutationObserver(Amazon_Intro);
function Amazon_scrollVolume() {
    return __awaiter(this, void 0, void 0, function () {
        var volumeControl;
        return __generator(this, function (_a) {
            volumeControl = document.querySelector('[aria-label="Volume"]:not(.enhanced)');
            if (volumeControl) {
                volumeControl.classList.add("enhanced");
                volumeControl === null || volumeControl === void 0 ? void 0 : volumeControl.addEventListener("wheel", function (event) {
                    var video = document.querySelector(AmazonVideoClass);
                    if (!video)
                        return;
                    var volume = video.volume;
                    if (event.deltaY < 0)
                        volume = Math.min(1, volume + 0.1);
                    else
                        volume = Math.max(0, volume - 0.1);
                    video.volume = volume;
                });
            }
            return [2 /*return*/];
        });
    });
}
var lastIntroTime = -1;
function resetLastIntroTime() {
    setTimeout(function () {
        lastIntroTime = -1;
    }, 5000);
}
function Amazon_Intro() {
    var _a, _b;
    if ((_a = settings.value.Amazon) === null || _a === void 0 ? void 0 : _a.skipIntro) {
        // skips intro and recap
        // recap on lucifer season 3 episode 3
        // intro lucifer season 3 episode 4
        var button = document.querySelector("[class*=skipelement]");
        if (button === null || button === void 0 ? void 0 : button.checkVisibility()) {
            var video_1 = document.querySelector(AmazonVideoClass);
            var time_1 = Math.floor((_b = video_1 === null || video_1 === void 0 ? void 0 : video_1.currentTime) !== null && _b !== void 0 ? _b : 0);
            if (typeof time_1 === "number" && lastIntroTime != time_1) {
                lastIntroTime = time_1;
                resetLastIntroTime();
                button.click();
                console.log("Intro skipped", button);
                //delay where the video is loaded
                setTimeout(function () {
                    AmazonGobackbutton(video_1, time_1, video_1.currentTime);
                    addSkippedTime(time_1, video_1.currentTime, "IntroTimeSkipped");
                }, 50);
            }
        }
    }
}
var reverseButton = false;
function AmazonGobackbutton(video, startTime, endTime) {
    return __awaiter(this, void 0, void 0, function () {
        var button, buttonInHTML_1;
        var _a;
        return __generator(this, function (_b) {
            if (!reverseButton) {
                reverseButton = true;
                button = document.createElement("button");
                button.style.cssText = "padding: 0px 22px; line-height: normal; min-width: 0px; z-index: 999; pointer-events: all;";
                button.setAttribute("class", "fqye4e3 f1ly7q5u fk9c3ap fz9ydgy f1xrlb00 f1hy0e6n fgbpje3 f1uteees f1h2a8xb  f1cg7427 fiqc9rt fg426ew f1ekwadg");
                button.setAttribute("data-uia", "reverse-button");
                //  browser.i18n.getMessage("WatchSkippedButton")
                button.textContent = "Rewind?";
                (_a = document.querySelector(".atvwebplayersdk-action-buttons")) === null || _a === void 0 ? void 0 : _a.appendChild(button);
                buttonInHTML_1 = document.querySelector('[data-uia="reverse-button"]');
                if (buttonInHTML_1) {
                    function goBack() {
                        video.currentTime = startTime;
                        buttonInHTML_1 === null || buttonInHTML_1 === void 0 ? void 0 : buttonInHTML_1.remove();
                        console.log("stopped observing| Intro");
                        AmazonSkipIntroObserver.disconnect();
                        var waitTime = endTime - startTime + 2;
                        setTimeout(function () {
                            console.log("restarted observing| Intro");
                            AmazonSkipIntroObserver.observe(document, AmazonSkipIntroConfig);
                        }, waitTime * 1000);
                    }
                    buttonInHTML_1.addEventListener("click", goBack);
                    setTimeout(function () {
                        buttonInHTML_1.remove();
                        reverseButton = false;
                    }, 5000);
                }
            }
            return [2 /*return*/];
        });
    });
}
function Amazon_Credits() {
    return __awaiter(this, void 0, void 0, function () {
        var button, newEpNumber;
        var _a;
        return __generator(this, function (_b) {
            button = document.querySelector("[class*=nextupcard-button]");
            if (button) {
                newEpNumber = document.querySelector("[class*=nextupcard-episode]");
                if (
                // is series
                (newEpNumber === null || newEpNumber === void 0 ? void 0 : newEpNumber.textContent) &&
                    // not different show.
                    !/(?<!\S)1(?!\S)/.exec(newEpNumber.textContent) &&
                    lastAdTimeText != newEpNumber.textContent) {
                    lastAdTimeText = (_a = newEpNumber.textContent) !== null && _a !== void 0 ? _a : "";
                    resetLastATimeText();
                    button.click();
                    settings.value.Statistics.SegmentsSkipped++;
                    sendMessage("increaseBadge", {}, "background");
                    console.log("skipped Credits", button);
                }
            }
            return [2 /*return*/];
        });
    });
}
function Amazon_Watch_Credits() {
    return __awaiter(this, void 0, void 0, function () {
        var button;
        return __generator(this, function (_a) {
            button = document.querySelector("[class*=nextupcardhide-button]");
            if (button) {
                button.click();
                settings.value.Statistics.SegmentsSkipped++;
                sendMessage("increaseBadge", {}, "background");
                console.log("Watched Credits", button);
            }
            return [2 /*return*/];
        });
    });
}
var AmazonSliderStyle = "height: 1em;background: rgb(221, 221, 221);display: none;width:200px;";
function Amazon_SpeedSlider(video) {
    return __awaiter(this, void 0, void 0, function () {
        var alreadySlider_1, position, speed_1;
        var _a, _b;
        return __generator(this, function (_c) {
            if (video) {
                alreadySlider_1 = document.querySelector(".dv-player-fullscreen #videoSpeedSlider");
                if (!alreadySlider_1) {
                    position = (_b = (_a = document.querySelector(".dv-player-fullscreen [class*=infobar-container]")) === null || _a === void 0 ? void 0 : _a.firstChild) === null || _b === void 0 ? void 0 : _b.lastChild;
                    if (position)
                        createSlider(video, videoSpeed, position, AmazonSliderStyle, "");
                }
                else {
                    speed_1 = document.querySelector(".dv-player-fullscreen #videoSpeed");
                    if (video.playbackRate != parseFloat(alreadySlider_1.value) / 10) {
                        video.playbackRate = parseFloat(alreadySlider_1.value) / 10;
                    }
                    alreadySlider_1.oninput = function () {
                        if (speed_1)
                            speed_1.textContent = (parseFloat(alreadySlider_1.value) / 10).toFixed(1) + "x";
                        video.playbackRate = parseFloat(alreadySlider_1.value) / 10;
                    };
                }
            }
            return [2 /*return*/];
        });
    });
}
if ((_a = settings.value.Amazon) === null || _a === void 0 ? void 0 : _a.speedSlider)
    Amazon_SpeedKeyboard();
function Amazon_SpeedKeyboard() {
    return __awaiter(this, void 0, void 0, function () {
        var steps;
        return __generator(this, function (_a) {
            steps = settings.value.General.sliderSteps / 10;
            document.addEventListener("keydown", function (event) {
                var video = document.querySelector(AmazonVideoClass);
                if (!video)
                    return;
                if (event.key === "d") {
                    video.playbackRate = Math.min(video.playbackRate + steps * 2, settings.value.General.sliderMax / 10);
                    videoSpeed = video.playbackRate;
                }
                else if (event.key === "s") {
                    video.playbackRate = Math.max(video.playbackRate - steps * 2, 0.6);
                    videoSpeed = video.playbackRate;
                }
            });
            return [2 /*return*/];
        });
    });
}
function Amazon_continuePosition() {
    return __awaiter(this, void 0, void 0, function () {
        var continueCategory, position;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            continueCategory = (_a = document
                .querySelector('.j5ZgN-._0rmWBt[data-testid="card-overlay"]')) === null || _a === void 0 ? void 0 : _a.closest('[class="+OSZzQ"]');
            position = (_c = (_b = continueCategory === null || continueCategory === void 0 ? void 0 : continueCategory.parentNode) === null || _b === void 0 ? void 0 : _b.childNodes) === null || _c === void 0 ? void 0 : _c[2];
            if (continueCategory && position)
                position.before(continueCategory);
            return [2 /*return*/];
        });
    });
}
function Amazon_FilterPaid() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // if not on the shop page or homepremiere
            if (url.includes("storefront") || url.includes("genre") || url.includes("movie") || url.includes("Amazon-Video")) {
                // the yellow hand bag is the paid category .NbhXwl
                document.querySelectorAll("section[data-testid='standard-carousel'] ul:has(svg.NbhXwl)").forEach(function (a) {
                    deletePaidCategory(a);
                });
            }
            return [2 /*return*/];
        });
    });
}
function deletePaidCategory(a) {
    return __awaiter(this, void 0, void 0, function () {
        var section;
        return __generator(this, function (_a) {
            // if the section is mostly paid content delete it
            // -2 because sometimes there are title banners
            if (a.children.length - a.querySelectorAll('[data-hidden="true"]').length - 2 <=
                a.querySelectorAll("[data-testid='card-overlay'] svg.NbhXwl").length) {
                section = a.closest('[class*="+OSZzQ"]');
                console.log("Filtered paid category", section);
                section === null || section === void 0 ? void 0 : section.remove();
                settings.value.Statistics.SegmentsSkipped++;
                sendMessage("increaseBadge", {}, "background");
            }
            // remove individual paid elements
            else {
                a.querySelectorAll("li:has(svg.NbhXwl)").forEach(function (b) {
                    console.log("Filtered paid Element", b);
                    b.remove();
                    settings.value.Statistics.SegmentsSkipped++;
                    sendMessage("increaseBadge", {}, "background");
                });
            }
            return [2 /*return*/];
        });
    });
}
function Amazon_FreeveeTimeout() {
    // set loop every 1 sec and check if ad is there
    var AdInterval = setInterval(function () {
        if (!settings.value.Amazon.skipAd) {
            console.log("stopped observing| FreeVee Ad");
            clearInterval(AdInterval);
            return;
        }
        var video = document.querySelector(AmazonVideoClass);
        if (video && !video.paused && video.currentTime > 0) {
            // && !video.paused
            skipAd(video);
        }
    }, 100);
}
function skipAd(video) {
    return __awaiter(this, void 0, void 0, function () {
        var adTimeText, adTime, bigTime, skipTime;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            adTimeText = document.querySelector(".dv-player-fullscreen .atvwebplayersdk-ad-timer-text");
            if (adTimeText === null || adTimeText === void 0 ? void 0 : adTimeText.checkVisibility()) {
                adTime = void 0;
                adTime = parseAdTime((_b = (_a = adTimeText === null || adTimeText === void 0 ? void 0 : adTimeText.childNodes) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.textContent);
                if (!adTime)
                    adTime = parseAdTime((_d = (_c = adTimeText === null || adTimeText === void 0 ? void 0 : adTimeText.childNodes) === null || _c === void 0 ? void 0 : _c[1]) === null || _d === void 0 ? void 0 : _d.textContent);
                // !document.querySelector(".fu4rd6c.f1cw2swo") so it doesn't try to skip when the self ad is playing
                if (!document.querySelector(".fu4rd6c.f1cw2swo") && typeof adTime == "number" && adTime > 1 && !lastAdTimeText) {
                    lastAdTimeText = adTime;
                    bigTime = 90;
                    resetLastATimeText(adTime > bigTime ? 3000 : 1000);
                    skipTime = adTime > bigTime ? bigTime : adTime - 1;
                    video.currentTime += skipTime;
                    console.log("FreeVee Ad skipped, length:", skipTime, "s");
                    settings.value.Statistics.AmazonAdTimeSkipped += skipTime;
                    settings.value.Statistics.SegmentsSkipped++;
                    sendMessage("increaseBadge", {}, "background");
                }
            }
            return [2 /*return*/];
        });
    });
}
function resetLastATimeText() {
    return __awaiter(this, arguments, void 0, function (time) {
        if (time === void 0) { time = 1000; }
        return __generator(this, function (_a) {
            // timeout of 1 second to make sure the button is not pressed too fast, it will crash or slow the website otherwise
            setTimeout(function () {
                lastAdTimeText = 0;
            }, time);
            return [2 /*return*/];
        });
    });
}
function Amazon_selfAdTimeout() {
    return __awaiter(this, void 0, void 0, function () {
        var AdInterval;
        return __generator(this, function (_a) {
            AdInterval = setInterval(function () {
                if (!settings.value.Amazon.selfAd) {
                    console.log("stopped observing| Self Ad");
                    clearInterval(AdInterval);
                    return;
                }
                var video = document.querySelector(AmazonVideoClass);
                if (video) {
                    video.onplay = function () {
                        var _a, _b, _c, _d, _e;
                        // if video is playing
                        var dvWebPlayer = document.querySelector("#dv-web-player");
                        if (dvWebPlayer && getComputedStyle(dvWebPlayer).display != "none") {
                            var button_1 = document.querySelector(".fu4rd6c.f1cw2swo");
                            if (button_1) {
                                // only getting the time after :08
                                var adTime_1 = parseInt((_e = (_d = (_c = /:\d+/
                                    .exec((_b = (_a = document.querySelector(".atvwebplayersdk-adtimeindicator-text")) === null || _a === void 0 ? void 0 : _a.innerHTML) !== null && _b !== void 0 ? _b : "")) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.substring(1)) !== null && _e !== void 0 ? _e : "");
                                // wait for 100ms before skipping to make sure the button is not pressed too fast, or there will be infinite loading
                                setTimeout(function () {
                                    button_1.click();
                                    if (typeof adTime_1 === "number")
                                        settings.value.Statistics.AmazonAdTimeSkipped += adTime_1;
                                    settings.value.Statistics.SegmentsSkipped++;
                                    sendMessage("increaseBadge", {}, "background");
                                    console.log("Self Ad skipped, length:", adTime_1, button_1);
                                }, 150);
                            }
                        }
                    };
                }
            }, 100);
            return [2 /*return*/];
        });
    });
}
function Amazon_xray() {
    return __awaiter(this, void 0, void 0, function () {
        var b;
        var _a;
        return __generator(this, function (_b) {
            (_a = document.querySelector(".xrayQuickViewList")) === null || _a === void 0 ? void 0 : _a.remove();
            b = document.querySelector(".fkpovp9.f8hspre:not(.enhanced)");
            if (b) {
                b.classList.add("enhanced");
                b.style.backgroundColor = "transparent";
                b.style.background = "transparent";
            }
            return [2 /*return*/];
        });
    });
}
// #endregion
// #region tv specific
// find the focus
// document.querySelectorAll("div, a, button").forEach((button) => {
// 	button.addEventListener(
// 		"focus",
// 		function ($event) {
// 			const target = $event.target as HTMLElement
// 			// .activeElement?.classList?.toString()
// 			console.log("focus:", target)
// 		},
// 		true,
// 	)
// })
// Shared functions
function parseAdTime(adTimeText) {
    var _a, _b, _c, _d;
    if (!adTimeText)
        return false;
    var adTime = parseInt((_b = (_a = /:\d+/.exec(adTimeText !== null && adTimeText !== void 0 ? adTimeText : "")) === null || _a === void 0 ? void 0 : _a[0].substring(1)) !== null && _b !== void 0 ? _b : "") +
        parseInt((_d = (_c = /\d+/.exec(adTimeText !== null && adTimeText !== void 0 ? adTimeText : "")) === null || _c === void 0 ? void 0 : _c[0]) !== null && _d !== void 0 ? _d : "") * 60;
    if (isNaN(adTime))
        return false;
    return adTime;
}
function createSlider(video, videoSpeed, position, sliderStyle, speedStyle, divStyle) {
    if (divStyle === void 0) { divStyle = ""; }
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
    }
    else
        position.prepend(slider, speed);
    if (videoSpeed)
        video.playbackRate = videoSpeed;
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
function adjustForTV() {
    return __awaiter(this, void 0, void 0, function () {
        var loggedIn, header;
        var _a, _b;
        return __generator(this, function (_c) {
            loggedIn = document.querySelector("div#nav-al-signin");
            if (loggedIn) {
                header = document.querySelector("header#pv-navigation-bar");
                if (header)
                    header.style.position = "relative";
                (_a = document.querySelector("header#navbar-main")) === null || _a === void 0 ? void 0 : _a.remove();
                (_b = document.querySelector("nav#shortcut-menu")) === null || _b === void 0 ? void 0 : _b.remove();
            }
            document.onkeydown = function (event) {
                console.log("Key pressed:", event.key);
                // if(event.key === "ArrowUp"){
                // 	if
                // }
                // if (event.key === "Enter") {
                // 	const video = document.querySelector(AmazonVideoClass) as HTMLVideoElement
                // 	if (video && video.paused) {
                // 		video.play()
                // 	} else if (video && !video.paused) {
                // 		video.pause()
                // 	}
                // }
            };
            return [2 /*return*/];
        });
    });
}
function remove_unnecessary_elements(video) {
    return __awaiter(this, void 0, void 0, function () {
        var leftButtons;
        return __generator(this, function (_a) {
            // fix tabindex navigation
            document
                .querySelectorAll('ul[data-testid="card-container-list"] li article section div a:not(.enhanced)')
                .forEach(function (a) {
                a.classList.add("enhanced");
                a.removeAttribute("tabindex");
                // a.removeAttribute("tabindex")
                a.addEventListener("mouseover", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });
            leftButtons = document.querySelectorAll('section button[data-testid="right-arrow"], section button[data-testid="left-arrow"]');
            leftButtons.forEach(function (button) {
                button.style.visibility = "hidden";
            });
            return [2 /*return*/];
        });
    });
}
// #endregion
startAmazon();
