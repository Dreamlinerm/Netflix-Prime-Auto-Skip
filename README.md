<div align="center">

<img src="firefox/icons/NetflixAmazon%20Auto-Skip.svg" width="10%">

# Streaming enhanced

## Automatically skip Ads, Intros, Recaps, Credits, etc. on Netflix, Prime video and Disney+ & Hotstar.
<a href="https://addons.mozilla.org/firefox/addon/netflix-prime-auto-skip/">
<img src="Logos/firefox.svg" width="20px">
</a>
<img src="https://img.shields.io/amo/dw/NetflixPrime@Autoskip.io" >
<img src="https://img.shields.io/amo/users/NetflixPrime@Autoskip.io" >
<img src="https://img.shields.io/badge/installs-1253-informational" >
<img src="https://img.shields.io/amo/stars/NetflixPrime@Autoskip.io?color=e60010" >
<br>
<a href="https://chrome.google.com/webstore/detail/streaming-enhanced-netfli/akaimhgappllmlkadblbdknhbfghdgle">
<img src="Logos/chrome.svg" width="20px">
</a>
<img src="https://img.shields.io/chrome-web-store/users/akaimhgappllmlkadblbdknhbfghdgle" >
<img src="https://img.shields.io/badge/installs-620-informational" >
<img src="https://img.shields.io/chrome-web-store/stars/akaimhgappllmlkadblbdknhbfghdgle?color=e60010" >
</div>

## Install in Browser

<a href="https://addons.mozilla.org/firefox/addon/netflix-prime-auto-skip/">
<img src="Logos/firefox.svg" width="8%" alt="firefox">
</a>
<a href="https://chrome.google.com/webstore/detail/streaming-enhanced-netfli/akaimhgappllmlkadblbdknhbfghdgle">
<img src="Logos/chrome.svg" width="8%" alt="chrome">
</a>
<a href="https://chrome.google.com/webstore/detail/streaming-enhanced-netfli/akaimhgappllmlkadblbdknhbfghdgle">
<img src="Logos/microsoft-edge-1.svg" width="8%" alt="chrome">
</a>


## Install on Android
<div style="display:flex;flex-direction:column">
        <a href="https://play.google.com/store/apps/details?id=com.kiwibrowser.browser">
          <img src="Logos/kiwi.webp" width="8%">
          <br /><b>Kiwi Browser</b>
          </a>
</div>

Download [Kiwi Browser](https://play.google.com/store/apps/details?id=com.kiwibrowser.browser) or similar to be able to install the chrome addon. But Netflix cannot be watched on android.


It will work together with other skippers, but it may behave unexpectedly.

## Supported Streaming Services

<table>
    <tr>
      <td align="center" valign="top" width="14.28%">
        <img src="Logos/Netflix.png" width="20%">
        <img src="Logos/prime%20video.png" width="20%">
        <img src="Logos/disney-plus-logoBackground.jpeg" width="20%">
        <img src="Logos/Disney-Plus-HotstarBackground.webp" width="20%">
      </td>
    </tr>
</table>



## What it does

The script, "skipper.js", is injected into all urls containing "amazon.\*/\*/video" or "netflix.com" or "disneyplus.com" or "hotstar.com".

It automatically skips Ads, intros, Credits, recaps, and anything else you don't want to watch on Netflix, Prime video and Disney Plus & Hotstar.


## ✨ Features

On Netflix, Prime Video and Disney+ & Hotstar it automatically:

<ul>
<li>Skips Intros</li>
<li>Skips Credits&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: automatically goes to the next episode</li>
<li>Skips Ads</li>
<li>Adds playback speed control to UI</li>
<li>Plays on Fullscreen</li>
</ul>

On Netflix it also automatically:

<ul>
<li>Skips Recaps</li>
<li>Blocks Inactivity Warning&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: automatically resuming the video</li>
<li>Picks last used profile</li>
</ul>

On Amazon Prime Video it also automatically:

<ul>
<li>Skips Self promoting ads (Ads for prime video productions)</li>
<li>Filters paid content (movies, series)</li>
<li>Removes annoying blur when hovering over video</li>
</ul>

## Contributing

Everyone is welcome to contribute!

If you have any suggestions or Bugs, please open an issue.
## Contributors ✨

<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%">
        <a href="www.makre.de"
          >
          <img
            src="https://avatars.githubusercontent.com/u/90410608?s=96&v=4"
            width="100px;"
            alt="Marvin Krebber"
          />
          <br /><sub><b>Marvin Krebber</b></sub>
          </a>
      </td>
      <td align="center" valign="top" width="14.28%">
        <a href="https://github.com/jakche"
          >
          <img
            src="https://avatars.githubusercontent.com/u/70672583?v=4"
            width="100px;"
            alt="Jakche"
          />
          <br /><sub><b>Jakche</b></sub>
          </a>
      </td>
    </tr>
  </tbody>
</table>

## 💕 Enjoying Netflix/Prime Auto-Skip?

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

Netflix, Amazon Prime video and Disney+ are trademarks and the author of this addon is not affiliated with these companies.
