<div align="center">
<img src="docs/icons/NetflixAmazon%20Auto-Skip.svg" height="80rem">

# Streaming enhanced ![Project Version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FDreamlinerm%2FNetflix-Prime-Auto-Skip%2Fmain%2Fpackage.json&query=version&label=Version)


## Automatically skip Ads, Intros, Recaps, Credits, etc.
<a href="https://addons.mozilla.org/firefox/addon/netflix-prime-auto-skip/">
<img src="docs/Logos/firefox.svg" width="20px">
<img src="https://img.shields.io/amo/users/NetflixPrime@Autoskip.io" >
<img src="https://img.shields.io/amo/dw/NetflixPrime@Autoskip.io" >
<img alt="Mozilla Add-on Rating" src="https://img.shields.io/amo/rating/NetflixPrime%40Autoskip.io">
</a>
<br>
<a href="https://chrome.google.com/webstore/detail/streaming-enhanced-netfli/akaimhgappllmlkadblbdknhbfghdgle">
<img src="docs/Logos/chrome.svg" width="20px">
<img src="https://img.shields.io/chrome-web-store/users/akaimhgappllmlkadblbdknhbfghdgle" >
<img alt="Chrome Web Store Rating" src="https://img.shields.io/chrome-web-store/rating/akaimhgappllmlkadblbdknhbfghdgle">
</a>
<br>
<img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/m/Dreamlinerm/Netflix-Prime-Auto-Skip">
<img alt="Development Time" src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FDreamlinerm%2FNetflix-Prime-Auto-Skip%2Frefs%2Fheads%2Fmain%2FauthorHours.json&query=time&label=Approx%20Dev%20Time%20(Owner)">
<br>
<a href="https://discord.gg/5fBYathA7d">
<img src="https://img.shields.io/badge/Discord_Server-5a5a5a?logo=discord" width="200">
</a>
</div>

***

## Download & Install
<a href="https://addons.mozilla.org/firefox/addon/netflix-prime-auto-skip/"><img src="docs/Logos/download button/firefox.png" alt="Get Streaming enhanced for Firefox"/>
<a href="https://chrome.google.com/webstore/detail/streaming-enhanced-netfli/akaimhgappllmlkadblbdknhbfghdgle"><img src="docs/Logos/download button/chrome.png" alt="Get Streaming enhanced for Chromium"/>
<a href="https://microsoftedge.microsoft.com/addons/detail/streaming-enhanced-netfli/dhfpagghjamocfaaignghcljfpppelff"><img src="docs/Logos/download button/microsoft.png" alt="Get Streaming enhanced for Edge"/>

## Install on Android

<div style="display:flex">
                <a href="https://addons.mozilla.org/firefox/addon/netflix-prime-auto-skip/">
                <img src="docs/Logos/firefox.svg" height="64px" alt="firefox">
                </a>
                <a href="https://play.google.com/store/apps/details?id=com.kiwibrowser.browser">
                <img src="docs/Logos/kiwi.webp" height="64px">
                </a>
</div>

Download [Firefox](https://addons.mozilla.org/firefox/addon/netflix-prime-auto-skip/), [Kiwi Browser](https://play.google.com/store/apps/details?id=com.kiwibrowser.browser) or similar to be able to install the firefox/chrome extension. 

The drm for each streaming service will be installed automatically when a video started for the first time and you may need to reload the page once.

### Supported Streaming Services:

<table>
    <tr>
      <td align="center" valign="top" width="14.28%">
        <img src="docs/Logos/Netflix.png" width="20%">
        <img src="docs/Logos/prime%20video.png" width="20%" >
        <img src="docs/Logos/crunchyroll.avif" width="20%">
        <img src="docs/Logos/HBO-max.jpg" width="20%">
        <img src="docs/Logos/disney-plus-logoBackground.jpeg" width="20%">
        <img src="docs/Logos/Disney-Plus-HotstarBackground.webp" width="20%">
        <img src="docs/Logos/starplus.png" width="20%" style="background-color:white;">
      </td>
    </tr>
</table>
<details>
  <summary>The above table in markdown</summary>
  
  | Netflix | Prime Video     | Disney+ (Hotstar, STAR+) | Crunchyroll | HBO    |
  | ---     | ---             | ---                      | ---         | ---    |
  | ✅      | ✅             | ✅                      | ✅          | ✅    |
</details>

## Table of Contents

- [Android Compatibility](#android-compatibility)
- [Contributing to Translation](#contributing-to-translation)
- [Features](#-features)  
- [Ratings explanation](#ratings)
- [Implemented Feature Overview](#implemented-feature-overview)
- [Develop the Extension](#develop-the-extension)
- [Changelog](./CHANGELOG.md)


## Android Compatibility:

| Netflix | Prime Video         | Disney+ (Hotstar, STAR+) | Crunchyroll | HBO                |
| ---     | ---                 | ---                      | ---         | ---                |
| ❌     | ✅(tweaked Desktop Website) | ✅(default Desktop Website)      | ✅         | ✅ |

## Contributing to Translation

We welcome contributions to the translation of the extension. If you're interested in helping us translate the extension to your language look [here](https://github.com/Dreamlinerm/Netflix-Prime-Auto-Skip/wiki/Add-or-Fix-Language-Localization).

## ✨ Features

Features in other supported languages:
| [Deutsch](docs/storeDescriptions/de.md) |
| [Français](docs/storeDescriptions/fr.md) |
| [Español](docs/storeDescriptions/es.md) |
| [Português](docs/storeDescriptions/pt.md) |
| [Português (Brasil)](docs/storeDescriptions/pt_br.md) |
| [Italiano](docs/storeDescriptions/it.md) |
| [日本語](docs/storeDescriptions/ja.md) |
| [Polski](docs/storeDescriptions/pl.md) |
| [Svenska](docs/storeDescriptions/sv.md) |
| [汉语](docs/storeDescriptions/zh_CN.md) |
| [한국어](docs/storeDescriptions/ko.md) |
| [Türkçe](docs/storeDescriptions/tr.md) |

<!-- description -->
You can customize which features are enabled in the Settings.

This extension enhances your streaming experience on Netflix, Prime Video, Disney+ (Hotstar, STAR+), Crunchyroll, and HBO Max by automatically:
<ul>
<li>Block Ads</li>
<li>Skipping Intros & Recaps</li>
<li>Skipping Credits</li>
<li>Displaying TMDB ratings for all shows</li>
<li>Adding customizable playback speed control</li>
<li>Automatically start to play videos in fullscreen</li>
<li>Go fullscreen on double click</li>
<li>Scroll to change the volume</li>
</ul>

Platform-Specific Features:
<ul>
<li>Netflix:
  <ul>
    <li>Remembers and selects your last-used profile automatically</li>
    <li>Blocks the “Are you still watching?” inactivity warning</li>
  </ul>
</li>

<li>Amazon Prime Video:
  <ul>
    <li>Skips self-promotional ads (for Prime Video productions)</li>
    <li>Filters out paid content (movies, series) from the home page</li>
    <li>Removes the blur effect when hovering over videos</li>
  </ul>
</li>

<li>Disney+ (Hotstar, STAR+):
  <ul>
    <li>Skips self-promotional ads</li>
    <li>Automatically returns to fullscreen mode when going to the next episode</li>
  </ul>
</li>

<li>Crunchyroll:
  <ul>
    <li>Remembers and selects your last-used profile automatically</li>
    <li>Adds filters to the release calendar, so it is useable</li>
    <li>Video size expanded to entire window</li>
    <li>Disable the numpad</li>
  </ul>
</li>
</ul>

Android Support in Desktop mode:
<ul>
<li>Prime Video</li>
<li>Disney+ (Hotstar, STAR+)</li>
<li>Crunchyroll</li>
<li>HBO Max</li>
</ul>
To use the extension on an Android phone, download Firefox.

## ☔ Safe & Open Source
This extension is open-source! Feel free to contribute or explore the code on <a href="https://github.com/Dreamlinerm/Netflix-Prime-Auto-Skip" target="_blank">Github</a>.

## 💕 Enjoying Streaming enhanced?
If you’re enjoying the enhanced streaming experience, please consider leaving a 5-star review! Reviews help build trust and attract new users.
If you'd like to support further development, you can buy me a <a href="https://github.com/sponsors/Dreamlinerm" target="_blank">coffee</a>.

## Disclaimer
Netflix, Prime Video, Disney+ (Hotstar, STAR+), Crunchyroll and HBO max are trademarks and the author of this addon is not affiliated with these companies.
<!-- descriptionEnd -->

### Skip Credits, Watch Credits

Skip Credits and Watch Credits are mutally exclusive, but you can turn both of the off. One allways skips the credits and one allways watches them, if both are turned off its the default behaviour showing the skip credit button.

<img src="docs/Logos/svg/settings.svg" alt="Settings Preview">

## Ratings

Click on Rating to go to the TMDB page of the movie.

The ratings are gathered from the TMDB API. Ratings are refreshed every month.
If there is no score they are refreshed once per day. If the movie is newer than 50 days and has less than 100 votes it will get refreshed every 3 days.

| Rating | Explanation |
| --- | --- |
| ? | Title not found |
| <img src="docs/Logos/greyBox.svg" height="20px"> | ? or less than 30 votes |
| <img src="docs/Logos/redBox.svg" height="20px"> | <= 5.5 stars|
| <img src="docs/Logos/yellowBox.svg" height="20px"> | <= 7 stars|
| <img src="docs/Logos/greenBox.svg" height="20px"> | >7 stars|


# Implemented Feature Overview

| abbrev. | definition |
| --- | --- |
|S|season|
|E|episode|
|✅| Implemented|
|➖| Not available|
|❌| Not implemented|
|?| don't know if necessary|
| Name| service specific features|

| Feature | Netflix | Prime Video | Disney+ (Hotstar, STAR+) | Crunchyroll | HBO max |
| --- | --- | --- | --- | --- | --- |
| Intro | ✅ <a href="https://www.netflix.com/watch/80011385">brooklyn nine nine S1E4</a>| ✅  <a href="https://www.amazon.de/gp/video/detail/B07FMF18GN">lucifer S3E4</a>| ✅ <a href="https://www.disneyplus.com/en-gb/video/4e9305a0-6ade-4922-bfba-c68c53a0d5a6">star wars andor S1E2</a> | ✅ [One piece](https://www.crunchyroll.com/series/GRMG8ZQZR/one-piece) | ✅ |
| Recaps | ✅ <a href="https://www.netflix.com/watch/81274622">Outer Banks S2E1</a>| ✅ <a href="https://www.amazon.de/gp/video/detail/B07FMF18GN">lucifer S3E3</a> | ✅ <a href="https://www.disneyplus.com/en-gb/video/efe020f1-7a23-42b5-a330-b193eef8531b">Criminal Minds S1E2</a>| ? | ✅ |
| Credits | ✅ | ✅ | ✅ | ❌(not necessary if outro is skipped) | ✅ |
| Ads | ✅ | ✅ | ✅ | ❌(Ublock can do it) | ? |
| Add Speed Slider | ✅ | ✅ | ✅ | ✅ | ✅ |
| Play on Fullscreen | ✅ | ✅ | ✅ | ✅ | ✅ |
| fullscreen on double click | ➖ | ✅ | ➖ | ✅ | ? |
| Scroll for volume |  ✅ | ✅ | ✅ | ✅ | ❌ |
| TMDB Rating | ✅ | ✅ | ✅ | ❌(MAL ratings better) | ✅ |
| Individual Features | <ul><li>Inactivity Warning</li><li>Auto pick last profile</li></ul> | <ul><li>Skip Self Ads</li><li>Paid Content filter</li><li>Move category "Continue"</li><li>Hide Xray</li></ul> | <ul><li>Skip self ads</li><li>Remain fullscreen</li></ul> | <ul><li>Auto pick last profile</li><li>Release Calendar Filters</li><li>Big Video size</li><li>Disable the numpad</li></ul> | ➖ |

## Develop the Extension

### Setup

- ```npm install -g pnpm``` install pnpm. npm is also possible but pnpm is recommended
- ```pnpm install``` install all required packages
- ```pnpm build``` build firefox and chrome zip files in dist folder
- ```pnpm web-ext``` run the extension in firefox
- ```pnpm chrome``` run the extension in chrome

This extension was built with the template [vite-vue3-browser-extension-v3](https://github.com/mubaidr/vite-vue3-browser-extension-v3)

### Further Commands

- ```pnpm dev``` hot build with sourcemaps and w/o minification for both
- ```pnpm dev:chrome``` hot build with sourcemaps and w/o minification for chrome
- ```pnpm dev:firefox``` hot build with sourcemaps and w/o minification for firefox
- ```npm run start-android```  start on firefox android

Further documentation is [here](develop.md)

## Open the Extension without web-ext

## Chrome

To run the extension in chrome you can just load the ``dist/chrome`` folder as an unpacked extension. But every time you modify the code you have to reload the extension on the extension page manually.
I primarily just develop in firefox and then copy the code into chrome and replace ``browser`` with ``chrome`` in the code.

## Firefox 

Just like chrome you can temporarily load the extension by going to ``about:addons``, clicking on the gear icon and then ``Install Add-ons From File``. Then you can load the ``dist/firefox`` folder as a temporary extension.

## Changelog

You can see the [Changelog](./CHANGELOG.md) here or the extension settings.