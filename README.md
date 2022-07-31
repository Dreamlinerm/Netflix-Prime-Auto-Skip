# Prime Skip

**This add-on injects JavaScript into the Amazon web pages.**

## What it does

This extension just includes:

* a content script, "skip.js", that is injected into all pages, but will only run if under "amazon" or any of its subdomains and contains video in url.

The content script skips every intro and ad on amazon prime.

## Commands
### Install web-ext
```npm install --global web-ext```
### Run
```web-ext run```
### Build
```web-ext build --overwrite-dest```