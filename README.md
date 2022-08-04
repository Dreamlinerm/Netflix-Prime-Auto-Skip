# Prime Skip

**This add-on injects JavaScript into the Netflix and Amazon web page.**

## What it does

This extension includes a content script, "skipper.js", that is injected into all pages, but will only run if under "amazon/*/video","netflix".

It automatically skips intros, Credits, recaps, and anything else you don't want to watch on Netflix and Amazon Prime video.

You can configure what to watch and what to skip in the settings Page.

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


Disclaimer

Netflix and Amazon Prime videos are trademarks and the author of this addon is not affiliated with these companies.
## Commands
```cd firefox```
### Install web-ext
```npm install --global web-ext```
### Run
```web-ext run```
### Build
```web-ext build --overwrite-dest```