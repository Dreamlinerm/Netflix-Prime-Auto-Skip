# Changelog

All notable changes to this project will be documented in this file.

## [1.0.9] - 26-8-2022

* improved Amazon Intro skipping
* Added Addon Statistics: Ad , Intro,  Recap time skipped
* added Importing and Exporting of Settings in the Settings page

## [1.0.8] - 25-8-2022

* the Individual settings are now opened automatically in the settings page
* bug fixed: if there is an version update with a new setting, it wont show that the new setting is activated, although it is.
* removed unnecessary , function () {} and {setttings:setttings}

## [1.0.7] - 23-8-2022

* improved addon Settings page to include disable all amazon/netflix button and dropdown to decrease menu size
* fixed bug: freevee ad skipping may crash the site on first opening, now doesn't skip too often
  
## [1.0.6] - 23-8-2022

* Added Amazon Freevee ad skipping 
* better mutation observing => less computation

## [1.0.5] - 13-8-2022

Bug fix and sync settings

* synchronize the settings across accounts
* bug fixed where ad is skipped when the infobar is not shown yet(misclicks)

## [1.0.4] - 12-8-2022

Missed Button and Bugfix

* Updated the check if it is a video on Amazon to check the title and the url
* Updated the skip Recap to also check for skip-preplay, which is a different button
* removed error in console.logs

## [1.0.3] - 9-8-2022

* addon only runs on all amazon urls and netflix.com instead of <all_urls>
* then checks if amazon or netflix is contained in the url

## [1.0.2] - 4-8-2022

* Better settings menu styling
* fixed reset button works only on first time bug

## [1.0.1] - 3-8-2022

* Fixed bug opening the settings page the first time the buttons were not set correctly

## [1.0] - 2-8-2022

* released first version