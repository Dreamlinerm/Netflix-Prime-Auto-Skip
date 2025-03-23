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
console.log("shared-functions loaded");
// Global Variables
var date = new Date();
var today = date.toISOString().split("T")[0];
var ua = navigator.userAgent;
var isMobile = /mobile|streamingEnhanced/i.test(ua);
var url = window.location.href;
var hostname = window.location.hostname;
var title = document.title;
var isPrimeVideo = /amazon|primevideo/i.test(hostname) && (/video/i.test(title) || /video/i.test(url));
var isDisney = /disneyplus|starplus/i.test(hostname);
var isHotstar = /hotstar/i.test(hostname);
var isHBO = /max.com/i.test(hostname);
var htmlLang = document.documentElement.lang;
var DBCache = {};
var GCdate = today;
function startSharedFunctions() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            getDBCache();
            return [2 /*return*/];
        });
    });
}
function getDBCache() {
    return __awaiter(this, void 0, void 0, function () {
        var localDBCache;
        return __generator(this, function (_a) {
            localDBCache = localStorage.getItem("DBCache");
            if (localDBCache) {
                DBCache = JSON.parse(localDBCache);
                console.log("DBCache loaded", Object.keys(DBCache).length);
            }
            else {
                localStorage.setItem("DBCache", JSON.stringify({}));
            }
            GCdate = localStorage.getItem("GCdate") || today;
            startShowRatingInterval();
            if (getDiffInDays(GCdate, date) >= GCdiff)
                garbageCollection();
            return [2 /*return*/];
        });
    });
}
// set DB Cache if cache size under 5MB
function setDBCache() {
    return __awaiter(this, void 0, void 0, function () {
        var size, kiloBytes, megaBytes;
        return __generator(this, function (_a) {
            size = new TextEncoder().encode(JSON.stringify(DBCache)).length;
            kiloBytes = size / 1024;
            megaBytes = kiloBytes / 1024;
            if (megaBytes < 4) {
                console.log("updateDBCache size:", megaBytes.toFixed(4) + " MB");
                localStorage.setItem("DBCache", JSON.stringify(DBCache));
            }
            else {
                console.log("DBCache cleared", megaBytes);
                DBCache = {};
                localStorage.setItem("DBCache", JSON.stringify(DBCache));
            }
            return [2 /*return*/];
        });
    });
}
// how long a record should be kept in the cache
var GCdiff = 30;
function garbageCollection() {
    return __awaiter(this, void 0, void 0, function () {
        var keys, _i, keys_1, key;
        return __generator(this, function (_a) {
            // clear every rating older than 30 days
            // clear every rating where db != tmdb
            console.log("garbageCollection started, deleting old ratings:");
            keys = Object.keys(DBCache);
            for (_i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                key = keys_1[_i];
                if (getDiffInDays(DBCache[key].date, date) >= GCdiff || DBCache[key].db != "tmdb") {
                    console.log(DBCache[key].date, key);
                    delete DBCache[key];
                }
            }
            GCdate = today;
            localStorage.setItem("GCdate", GCdate);
            setDBCache();
            return [2 /*return*/];
        });
    });
}
function getMovieInfo(title_1, card_1) {
    return __awaiter(this, arguments, void 0, function (title, card, media_type, year) {
        var locale, queryType, url, data, response, error_1, movie, compiledData;
        var _a;
        if (media_type === void 0) { media_type = null; }
        if (year === void 0) { year = null; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    locale = htmlLang || (navigator === null || navigator === void 0 ? void 0 : navigator.language) || "en-US";
                    queryType = media_type !== null && media_type !== void 0 ? media_type : "multi";
                    url = "https://api.themoviedb.org/3/search/".concat(queryType, "?query=").concat(encodeURI(title), "&include_adult=false&language=").concat(locale, "&page=1");
                    if (year)
                        url += "&year=".concat(year);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch(url, {
                            method: "GET",
                            headers: {
                                accept: "application/json",
                                Authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5OWQyMWUxMmYzNjU1MjM4NzdhNTAwODVhMmVjYThiZiIsInN1YiI6IjY1M2E3Mjg3MjgxMWExMDBlYTA4NjI5OCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.x_EaVXQkg1_plk0NVSBnoNUl4QlGytdeO613nXIsP3w",
                            },
                        })];
                case 2:
                    response = _b.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _b.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _b.sent();
                    console.error(error_1);
                    return [2 /*return*/, { error: error_1.message }];
                case 5:
                    if (data != undefined) {
                        movie = (_a = data === null || data === void 0 ? void 0 : data.results) === null || _a === void 0 ? void 0 : _a[0];
                        compiledData = {
                            id: movie === null || movie === void 0 ? void 0 : movie.id,
                            media_type: queryType == "multi" ? movie === null || movie === void 0 ? void 0 : movie.media_type : queryType,
                            score: movie === null || movie === void 0 ? void 0 : movie.vote_average,
                            vote_count: movie === null || movie === void 0 ? void 0 : movie.vote_count,
                            release_date: (movie === null || movie === void 0 ? void 0 : movie.release_date) || (movie === null || movie === void 0 ? void 0 : movie.first_air_date),
                            title: (movie === null || movie === void 0 ? void 0 : movie.title) || (movie === null || movie === void 0 ? void 0 : movie.original_title) || (movie === null || movie === void 0 ? void 0 : movie.name) || (movie === null || movie === void 0 ? void 0 : movie.original_name),
                            date: today,
                            db: "tmdb",
                        };
                        DBCache[title] = compiledData;
                        setRatingOnCard(card, compiledData, title);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
// show rating depending on page
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/g;
function showRating() {
    var _a, _b, _c, _d;
    if (isDisney) {
        url = window.location.href;
        // disable search and suggested movies
        if (url.includes("search"))
            return false;
        if (url.includes("entity")) {
            var SelectedTab = document.querySelector('[aria-selected="true"]');
            return (uuidRegex.test((_c = (_b = (_a = SelectedTab === null || SelectedTab === void 0 ? void 0 : SelectedTab.id) === null || _a === void 0 ? void 0 : _a.split("_control")) === null || _b === void 0 ? void 0 : _b[0]) !== null && _c !== void 0 ? _c : "") &&
                (SelectedTab === null || SelectedTab === void 0 ? void 0 : SelectedTab.getAttribute("aria-label")) != "EXTRAS");
        }
        return true;
    }
    else if (isPrimeVideo) {
        // suggested movies
        if (window.location.href.includes("detail")) {
            return ((_d = document.querySelector('[data-testid="btf-related-tab"]')) === null || _d === void 0 ? void 0 : _d.getAttribute("tabIndex")) == "0";
        }
        return true;
    }
    else
        return true;
}
function startShowRatingInterval() {
    return __awaiter(this, arguments, void 0, function (optionShowRating) {
        var RatingInterval;
        if (optionShowRating === void 0) { optionShowRating = true; }
        return __generator(this, function (_a) {
            if (showRating())
                addRating(optionShowRating);
            RatingInterval = setInterval(function () {
                if (showRating())
                    addRating(optionShowRating);
            }, 1000);
            return [2 /*return*/];
        });
    });
}
function getDiffInDays(firstDate, secondDate) {
    if (!firstDate || !secondDate)
        return 31;
    return Math.round(Math.abs(new Date(secondDate).getTime() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24));
}
function useDBCache(title, card, media_type) {
    var _a, _b, _c, _d;
    if (!((_a = DBCache[title]) === null || _a === void 0 ? void 0 : _a.date))
        DBCache[title].date = today;
    var vote_count = ((_b = DBCache[title]) === null || _b === void 0 ? void 0 : _b.vote_count) || 100;
    var diffInReleaseDate = 
    // vote count is under 80 inaccurate rating
    vote_count < 100 &&
        // did not refresh rating in the last 0 days
        getDiffInDays(DBCache[title].date, date) > 1 &&
        // release date is in the last 50 days after not many people will
        getDiffInDays((_c = DBCache[title]) === null || _c === void 0 ? void 0 : _c.release_date, date) <= 50;
    // refresh rating if older than 30 days or release date is in last month and vote count is under 100
    if (getDiffInDays(DBCache[title].date, date) >= GCdiff || diffInReleaseDate) {
        if (diffInReleaseDate)
            console.log("update recent movie:", title, ",refresh:", getDiffInDays(DBCache[title].date, date), ",Age:", getDiffInDays((_d = DBCache[title]) === null || _d === void 0 ? void 0 : _d.release_date, date), "Vote count:", vote_count);
        else
            console.log("update old rating:", title, ",Age:", getDiffInDays(DBCache[title].date, date));
        getMovieInfo(title, card, media_type);
    }
    else {
        setRatingOnCard(card, DBCache[title], title);
    }
}
function Amazon_getMediaType(type) {
    if (!type)
        return null;
    if (type.toLowerCase().includes("tv"))
        return "tv";
    if (type.toLowerCase().includes("movie"))
        return "movie";
    return null;
}
function getAllTitleCardsTypes() {
    var AllTitleCardsTypes = [];
    if (isDisney)
        AllTitleCardsTypes = [document.querySelectorAll("a[data-testid='set-item']:not(.imdb)")];
    else if (isHotstar)
        AllTitleCardsTypes = [document.querySelectorAll(".swiper-slide img:not(.imdb)")];
    else if (isHBO)
        AllTitleCardsTypes = [document.querySelectorAll("a[class*='StyledTileLinkNormal-']:not(.imdb)")];
    else if (isPrimeVideo)
        AllTitleCardsTypes = [
            document.querySelectorAll("li:not(.imdb) article[data-card-title]:not([data-card-entity-type='EVENT']):not([data-card-title='Live-TV'])"),
            document.querySelectorAll("article[data-testid*='-card']:not(.imdb):not(:has(a#rating))"),
        ];
    return AllTitleCardsTypes;
}
function addRating(showRating) {
    return __awaiter(this, void 0, void 0, function () {
        var AllTitleCardsTypes, lastTitle, updateDBCache, type, titleCards, i, card, media_type, title_1;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            url = window.location.href;
            AllTitleCardsTypes = getAllTitleCardsTypes();
            lastTitle = "";
            updateDBCache = false;
            for (type = 0; type < AllTitleCardsTypes.length; type++) {
                titleCards = AllTitleCardsTypes[type];
                for (i = 0; i < titleCards.length; i++) {
                    card = titleCards[i];
                    // add seen class
                    if (isDisney || isHotstar || isHBO)
                        card.classList.add("imdb");
                    else if (isPrimeVideo) {
                        if (type == 0)
                            (_a = card === null || card === void 0 ? void 0 : card.closest("li")) === null || _a === void 0 ? void 0 : _a.classList.add("imdb");
                        else if (type == 1)
                            card === null || card === void 0 ? void 0 : card.classList.add("imdb");
                    }
                    media_type = getMediaType(card);
                    title_1 = getCleanTitle(card, type);
                    if (!title_1)
                        continue;
                    // for the static Pixar Disney, Starplus etc. cards
                    if (showRating && (!isDisney || !(card === null || card === void 0 ? void 0 : card.classList.contains("_1p76x1y4")))) {
                        // sometimes more than one image is loaded for the same title
                        if (lastTitle != title_1 && !title_1.includes("Netflix") && !title_1.includes("Prime Video")) {
                            lastTitle = title_1;
                            if ((((_b = DBCache[title_1]) === null || _b === void 0 ? void 0 : _b.score) || getDiffInDays((_c = DBCache[title_1]) === null || _c === void 0 ? void 0 : _c.date, date) <= 7) &&
                                (!media_type || ((_d = DBCache[title_1]) === null || _d === void 0 ? void 0 : _d.media_type) == media_type)) {
                                useDBCache(title_1, card, media_type);
                            }
                            else {
                                getMovieInfo(title_1, card, media_type);
                                updateDBCache = true;
                            }
                        }
                    }
                }
            }
            if (updateDBCache) {
                setTimeout(function () {
                    setDBCache();
                }, 5000);
            }
            return [2 /*return*/];
        });
    });
}
function getMediaType(card) {
    var _a;
    var media_type = null;
    if (isDisney) {
        if (url.includes("browse/series"))
            media_type = "tv";
        else if (url.includes("browse/movies"))
            media_type = "movie";
        else if (/(Staffel)|(Nummer)|(Season)|(Episod)|(Number)/g.test(title !== null && title !== void 0 ? title : ""))
            media_type = "tv";
    }
    else if (isPrimeVideo) {
        if (url.includes("video/tv"))
            media_type = "tv";
        else if (url.includes("video/movie"))
            media_type = "movie";
        else
            media_type = Amazon_getMediaType((_a = card.getAttribute("data-card-entity-type")) !== null && _a !== void 0 ? _a : "");
    }
    return media_type;
}
function getCleanTitle(card, type) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    var title;
    if (isDisney) {
        title = Disney_fixTitle((_a = card === null || card === void 0 ? void 0 : card.getAttribute("aria-label")) !== null && _a !== void 0 ? _a : undefined);
        // no section Extras on disney shows
        if (url.includes("entity")) {
            var SelectedTabId = (_b = document.querySelector('[aria-selected="true"]')) === null || _b === void 0 ? void 0 : _b.id.split("_control")[0];
            if (SelectedTabId != ((_c = card.closest('div[role="tabpanel"]')) === null || _c === void 0 ? void 0 : _c.id))
                title = "";
        }
    }
    else if (isHotstar)
        title = (_d = card === null || card === void 0 ? void 0 : card.getAttribute("alt")) === null || _d === void 0 ? void 0 : _d.replace(/(S\d+\sE\d+)/g, "");
    else if (isPrimeVideo) {
        // detail means not live shows
        if ((_f = (_e = card.querySelector("a")) === null || _e === void 0 ? void 0 : _e.href) === null || _f === void 0 ? void 0 : _f.includes("detail")) {
            if (type == 0)
                title = Amazon_fixTitle((_g = card.getAttribute("data-card-title")) !== null && _g !== void 0 ? _g : "");
            else if (type == 1)
                title = Amazon_fixTitle((_j = (_h = card.querySelector("a")) === null || _h === void 0 ? void 0 : _h.getAttribute("aria-label")) !== null && _j !== void 0 ? _j : "");
        }
    }
    else if (isHBO)
        title = (_l = (_k = card.querySelector("p[class*='md_strong-']")) === null || _k === void 0 ? void 0 : _k.textContent) !== null && _l !== void 0 ? _l : "";
    return title;
}
function Disney_fixTitle(title) {
    var _a, _b, _c;
    title = (_c = (_b = (_a = title === null || title === void 0 ? void 0 : title.replace(" Disney+ Original", "")) === null || _a === void 0 ? void 0 : _a.replace("Disney+ Original ", "")) === null || _b === void 0 ? void 0 : _b.replace(" STAR Original", "")) === null || _c === void 0 ? void 0 : _c.replace("STAR Original ", "");
    // german translation
    if (htmlLang == "de") {
        title = title === null || title === void 0 ? void 0 : title.replace(/Nummer \d* /, "").split(" Für Details")[0].split(" Staffel")[0].split("Staffel")[0].split(" Neue")[0].split(" Alle")[0].split(" Demnächst")[0].split(" Altersfreigabe")[0].split(" Mach dich bereit")[0] // deadpool
        .split(" Jeden")[0].split(" Noch")[0].split(" Premiere")[0];
    }
    else if (htmlLang == "en") {
        title = title === null || title === void 0 ? void 0 : title.replace(/Number \d* /, "").replace(" Select for details on this title.", "").split(" Season")[0].split("Season")[0].split(" New ")[0].split(" All Episodes")[0].split(" Coming")[0].split(" Two-Episode")[0].split(" Rated")[0].split(" Prepare for")[0] // deadpool
        .split(" Streaming ")[0].replace(/ \d+ minutes remaining/g, "");
    }
    return title;
}
function Amazon_fixTitle(title) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return ((_j = (_h = (_g = (_f = (_e = (_d = (_c = (_b = (_a = title === null || title === void 0 ? void 0 : title.split(" - ")[0]) === null || _a === void 0 ? void 0 : _a.split(" – ")[0]) === null || _b === void 0 ? void 0 : _b.replace(/(S\d+)/g, "")) === null || _c === void 0 ? void 0 : _c.replace(/ \[.*\]/g, "")) === null || _d === void 0 ? void 0 : _d.replace(/\s\(.*\)/g, "")) === null || _e === void 0 ? void 0 : _e.replace(/:?\sStaffel-?\s\d+/g, "")) === null || _f === void 0 ? void 0 : _f.replace(/:?\sSeason-?\s\d+/g, "")) === null || _g === void 0 ? void 0 : _g.replace(/ \/ \d/g, "")) === null || _h === void 0 ? void 0 : _h.split(": Die komplette")[0]) === null || _j === void 0 ? void 0 : _j.split(": The complete")[0]);
}
function getColorForRating(rating, lowVoteCount) {
    // I want a color gradient from red to green with yellow in the middle
    // the ratings are between 0 and 10
    // the average rating is 6.5
    // https://distributionofthings.com/imdb-movie-ratings/
    if (!rating || lowVoteCount)
        return "grey";
    if (rating <= 5.5)
        return "red";
    if (rating <= 7)
        return "rgb(245, 197, 24)"; //#f5c518
    return "rgb(0, 166, 0)";
}
function getTMDBUrl(id, media_type) {
    return "https://www.themoviedb.org/".concat(media_type, "/").concat(id);
}
function setRatingOnCard(card, data, title) {
    return __awaiter(this, void 0, void 0, function () {
        var div, vote_count, releaseDate, parentDiv;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            div = document.createElement("div");
            vote_count = (data === null || data === void 0 ? void 0 : data.vote_count) || 100;
            // right: 1.5vw;
            div.id = "rating";
            Object.assign(div.style, {
                position: "absolute",
                bottom: "0",
                color: "black",
                textDecoration: "none",
                background: getColorForRating(data === null || data === void 0 ? void 0 : data.score, vote_count < 50),
                borderRadius: "5px",
                padding: "0 2px 0 2px",
                right: "0",
                zIndex: isDisney ? "" : "9999",
                fontSize: "1.5vw",
                lineHeight: "normal",
            });
            if ((data === null || data === void 0 ? void 0 : data.score) >= 0) {
                releaseDate = "";
                // if (settings.value.Video?.showYear && data?.release_date) {
                // 	releaseDate = new Date(data?.release_date)?.getFullYear() + "-"
                // 	// const year = new Date(data?.release_date)?.getYear();
                // 	// releaseDate = year >= 100 ? (year + " ").substring(1) : year + " ";
                // }
                div.textContent = releaseDate + ((_a = data.score) === null || _a === void 0 ? void 0 : _a.toFixed(1));
                div.setAttribute("alt", (data === null || data === void 0 ? void 0 : data.title) + ", OG title: " + title + ", Vote count: " + vote_count);
            }
            else {
                div.textContent = "?";
                div.setAttribute("alt", title);
                console.log("no score found:", title, data);
            }
            if (isHBO)
                card.appendChild(div);
            else if (isDisney) {
                parentDiv = card === null || card === void 0 ? void 0 : card.closest("div");
                if (parentDiv) {
                    if (card.nextElementSibling && card.nextElementSibling.id != "hideTitleButton") {
                        div.style.top = card.offsetHeight + "px";
                        div.style.bottom = "";
                    }
                    parentDiv.style.position = "relative";
                    parentDiv.appendChild(div);
                }
            }
            else if (isHotstar)
                (_b = card === null || card === void 0 ? void 0 : card.parentElement) === null || _b === void 0 ? void 0 : _b.appendChild(div);
            else if (isPrimeVideo) {
                if (card.getAttribute("data-card-title"))
                    (_d = (_c = card === null || card === void 0 ? void 0 : card.firstChild) === null || _c === void 0 ? void 0 : _c.firstChild) === null || _d === void 0 ? void 0 : _d.appendChild(div);
                else if (card.querySelector('div[data-testid="title-metadata-main"]')) {
                    (_e = card.querySelector('div[data-testid="title-metadata-main"]')) === null || _e === void 0 ? void 0 : _e.appendChild(div);
                }
                else
                    card.appendChild(div);
            }
            return [2 /*return*/];
        });
    });
}
// #endregion
startSharedFunctions();
