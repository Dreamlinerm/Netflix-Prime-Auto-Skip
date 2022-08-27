<div align="center">

<img src="firefox/icons/NetflixAmazon%20Auto-Skip.svg" width="10%">

# Netflix/Prime Auto-Skip

Automatically skip Ads, intros, Credits, etc. on Prime video and Netflix.

</div>

## Installation

Download the extension here for [Firefox](https://addons.mozilla.org/firefox/addon/netflix-prime-auto-skip/) or [Chrome](https://chrome.google.com/webstore/detail/netflixprime-auto-skip/akaimhgappllmlkadblbdknhbfghdgle).

It will work with other skippers, but it may behave unexpectedly.

## What it does

The script, "skipper.js", is injected into all urls containing "amazon.\*/\*/video" or "netflix.com".

It automatically skips Ads, intros, Credits, recaps, and anything else you don't want to watch on Netflix and Prime video.
<table>
<tr>
<td>

## ✨ Features
Automatically skipping:
* Intros
* Credits&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: automatically goes to the next episode
  
Netflix:

* Recaps
* Inactivity Warning&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: automatically resuming the video

Prime video:
* Self promoting ads
* Freevee Ads&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: Watch series for free without ads

## Contributing

Everyone is welcome to contribute!

If you have any suggestions or Bugs, please open an issue.

Buy me a coffee! [PayPal](https://paypal.me/MarvinKrebber)


## Settings

Configure what is skipped in the settings Page.

Import and Export all Settings.

See Statistics.
  
</td>
<td>

![Alt text](Publish/Screenshots/settingsFoldedOut.png?raw=true)
</td>
</tr>
</table>

## How it works

The addon is observing every mutation of the dom Tree of the Website.

On Netflix it matches the buttons with the data-uia tag containing:

* Intro: player-skip-intro
* Recap: player-skip-recap, player-skip-preplay
* Credits: next-episode-seamless-button
* Inactivity Warning: interrupt-autoplay-continue

On Prime video it matches buttons with the Css Classes:

* Intro: skipelement
* Credits: nextupcard-button
* Self promoting ads: .fu4rd6c.f1cw2swo
  
The freevee ad text contains the ad length which is matched by 

* Freevee ads: .atvwebplayersdk-adtimeindicator-text

and then skipped by forwarding by the ad length.

## Run the Extension
```cd firefox```
### Install web-ext
```npm install --global web-ext```
### Run
```web-ext run```
### Build
copy firefox files to chrome and replace browser with chrome

```web-ext build --overwrite-dest```

## Disclaimer

Netflix and Amazon Prime videos are trademarks and the author of this addon is not affiliated with these companies.
