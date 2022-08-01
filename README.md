# Prime Skip

**This add-on injects JavaScript into the Amazon web pages.**

## What it does

This extension just includes:

* a content script, "skipper.js", that is injected into all pages, but will only run if under "amazon","netflix" or any of its subdomains and contains video in url.

Skips intros, Ads and Credits on Amazon Prime and intros, credits on Netflix. It can be configured what to skip exactly in the settings.
## Commands
### Install web-ext
```npm install --global web-ext```
### Run
```web-ext run```
### Build
```web-ext build --overwrite-dest```