<div align="center">

<img src="firefox/icons/NetflixAmazon%20Auto-Skip.svg" width="10%">

# Netflix/Prime Auto-Skip

Automatically skip Ads, intros, Credits, etc. on Prime video and Netflix.

Firefox:
<img src="https://img.shields.io/amo/dw/NetflixPrime@Autoskip.io" >
<img src="https://img.shields.io/amo/users/NetflixPrime@Autoskip.io" >
<img src="https://img.shields.io/badge/installs-1253-informational" >
<img src="https://img.shields.io/amo/stars/NetflixPrime@Autoskip.io?color=e60010" >
Chrome: 
<img src="https://img.shields.io/chrome-web-store/users/akaimhgappllmlkadblbdknhbfghdgle" >
<img src="https://img.shields.io/badge/installs-504-informational" >
<img src="https://img.shields.io/chrome-web-store/stars/akaimhgappllmlkadblbdknhbfghdgle?color=e60010" >
</div>

## Installation

Download the extension here for [Firefox](https://addons.mozilla.org/firefox/addon/netflix-prime-auto-skip/) or [Chrome](https://chrome.google.com/webstore/detail/netflixprime-auto-skip/akaimhgappllmlkadblbdknhbfghdgle).
<br>
Android: Download [Kiwi Browser](https://play.google.com/store/apps/details?id=com.kiwibrowser.browser) or similar to be able to install the chrome addon. But only Amazon prime can be watched on android in the Browser.

It will work with other skippers, but it may behave unexpectedly.

## What it does

The script, "skipper.js", is injected into all urls containing "amazon.\*/\*/video" or "netflix.com".

It automatically skips Ads, intros, Credits, recaps, and anything else you don't want to watch on Netflix and Prime video.


## ✨ Features

On Netflix and Prime Video it automatically:

<ul>
<li>Skips Intros</li>
<li>Skips Credits&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: automatically goes to the next episode</li>
<li>Skips Ads</li>
<li>Plays on Fullscreen</li>
</ul>

On Netflix it also:

<ul>
<li>Skips Recaps</li>
<li>Blocks Inactivity Warning&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: automatically resuming the video</li>
<li>Picks last used profile</li>
</ul>

On Amazon Prime Video it also:

<ul>
<li>Skips Self promoting ads</li>
<li>Filters paid content (movies, series)</li>
<li>Adds playback speed control to UI</li>
<li>Removes annoying blur when hovering over video</li>
</ul>

## Contributing

Everyone is welcome to contribute!

If you have any suggestions or Bugs, please open an issue.

Buy me a coffee! [PayPal](https://paypal.me/MarvinKrebber)


## Settings

Configure what is skipped in the settings Page.

Import and Export all Settings.

See Statistics.
  
![Settings.png](Publish/Screenshots/settings.png?raw=true)

## How it works

The addon is observing every mutation of the dom Tree of the Website.

On Netflix it matches the buttons with the data-uia tag containing:

* Intro: player-skip-intro
* Recap: player-skip-recap, player-skip-preplay
* Credits: next-episode-seamless-button
* Inactivity Warning: interrupt-autoplay-continue
* Basic tier ads: matched by css class .ltr-puk2kp and the speed is set to 16x until the ad is over

On Prime video it matches buttons with the Css Classes:

* Intro: skipelement
* Credits: nextupcard-button
* Self promoting ads: .fu4rd6c.f1cw2swo
* Paid Content: .o86fri (yallow text indicates paid films)
  
The freevee ad text contains the ad length which is matched by 

* Freevee ads: .atvwebplayersdk-adtimeindicator-text

and then skipped by forwarding by the ad length -1 second which will fix a lot of issues.

## Run the Extension
```cd firefox```
### Install web-ext
```npm install --global web-ext```
### Run
```web-ext run --devtools```
### Build
copy firefox files to chrome and replace "browser" with "chrome"

```web-ext build --overwrite-dest```

## Disclaimer

Netflix and Amazon Prime videos are trademarks and the author of this addon is not affiliated with these companies.
