# Prime Skip

**This add-on injects JavaScript into the Netflix and Amazon web page.**
## Published
Firefox: https://addons.mozilla.org/de/firefox/addon/netflix-prime-auto-skip/

Chrome: https://chrome.google.com/webstore/detail/netflixprime-auto-skip/akaimhgappllmlkadblbdknhbfghdgle
## What it does

This extension includes a content script, "skipper.js", that is injected into all pages, but will only run if under "amazon/*/video","netflix".

It automatically skips Ads, intros, Credits, recaps, and anything else you don't want to watch on Netflix and Amazon Prime video.

You can configure what to watch and what to skip in the settings Page:

![Alt text](Publish/Screenshots/AddonMenu%20standalone.png?raw=true)

✨ Features

Netflix Automatically skipping:


* Intros
* Recaps
* Credits                 : automatically goes to the next episode
* Inactivity Warning      : automatically resuming the video

Amazon Prime video Automatically skipping:


* Intros
* Credits: automatically goes to the next episode
* Self promoting ads
* Freevee Ads: Watch series for free without ads


Disclaimer

Netflix and Amazon Prime videos are trademarks and the author of this addon is not affiliated with these companies.

## What is the addon searching the websites for:

Netflix data-uia=:

* Intro: player-skip-intro

* Recap: player-skip-recap, player-skip-preplay

* Credits: next-episode-seamless-button

* Inactivity Warning: interrupt-autoplay-continue

Amazon Prime ClassList:

* Intro: skipelement

* Credits: nextupcard-button

* Freevee ads: .atvwebplayersdk-adtimeindicator-text

* Self promoting ads: .fu4rd6c.f1cw2swo

## Commands
```cd firefox```
### Install web-ext
```npm install --global web-ext```
### Run
```web-ext run```
### Build
copy firefox files to chrome and replace browser with chrome

```web-ext build --overwrite-dest```
