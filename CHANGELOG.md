# Changelog

## 1.1.62

- fix HBO functions since selectors changed

## 1.1.61

- fix disney ad skip, because of changed interface

## 1.1.60

- Added disabled Settings Page
- Changed Popup UI a little
- BUG: playOnFullScreen switch was not working

## 1.1.59

- fix crunchyroll release calendar bug, because of new storage

## 1.1.58

- BUG: fixed skip intro amazon loop

## 1.1.57

- fixed bug in Crunchyroll Release Calendar
- Amazon,Disney skipCredits now not triggered if last episode

## 1.1.56

- Netflix skip Credits immediately not after draining animation
- Fixed browser action color back to red on chrome.
- Netflix: fixed scroll on Volume button to change volume

## 1.1.55

- Fixed Crunchyroll big picture, auto pick profile, because of change website
- Fixed Disney auto play on fullscreen
- Mayor Migration to VUE3 instead of native js, verified all functions working on pc.

## 1.1.54

- Added release year optionally.

## 1.1.53

- Prime wont load Ratings for Live tv
- Prime fixed TMDB title card on chrome.
- TMDB ratings added media_type to query, like movie e.g., because shows with same name but different type

## 1.1.52

- Disney improved ad skip
- Disney fixed Bug first ad is not skipped
- TMDB refresh new movie ratings every day
- Netflix wrong TMDB ratings for movies with dash

## 1.1.51

- implemented GarbageCollection for DBcache, which deletes ratings older than 30 days

## 1.1.48

- Removed section Extras from TMDB ratings on Disney+

## 1.1.47

- TMDB show low votes ratings in grey
- Improved TMDB correct lang
- Fixed, Disney TMDB rating postions and more accurate title extraction
- Better prime TMDB title extraction
- Removed Search, Suggested Page from Ratings

## 1.1.46

- Linked TMDB website when click on rating

## 1.1.45

- Fix Disney bug: Remove "Continue watching after ad" text when ad is not running.

## 1.1.44

- On Amazon.com fixed: Speedslider not showing up on dv-player-fullscreen
- On Amazon.com fixed: Not skipping ads longer than 150 seconds

## 1.1.43

- Netflix Toolbar gets higher bug fixed

## 1.1.42

- BUG: Popup not working on edge and chrome

## 1.1.41

- Block Disney Ads

## 1.1.40

- Netflix pause ad not getting removed when no video on screen
- Change the volume if you scroll on the volume icon

## 1.1.39

- fixed Netflix Ads

## 1.1.38

- Better mobile Popup layout
- Ratings: do not include ratings with vote count lower than 80
- Crunchyroll: Do not filter premiers not in queue on calendar
- Crunchyroll: Filter Japanese Audio in Dub also on calendar
- Amazon: Remove background hue on pause again

## 1.1.37

- Removed subtitle styling, since unnecessary

## 1.1.36

- Added double Click to hotstar
- Disney fix: Watch Credits

## 1.1.35
## Added Translations for:

- French
- Spanish
- Portuguese
- Italian
- Japanese
- Polish
- Swedish
- Chinese
- Korean
- Turkish

## 1.1.34

- Amazon close Fullscreen on original close buttons

## 1.1.33

- Separated the Speedslider from the subtitle setting on user request.
- Fixed Amazon double click to Fullscreen.

## 1.1.32

- Added Crunchyroll big video player mod.
- Disable the numpad on Crunchyroll.
- Added maximize on doubleclick
- Popup UI changed

## 1.1.29

- Fixed Prime filter paid movies.
- Fixed Prime Continue Watching position.

## 1.1.28

- Fixed hotstar crash/skip intro bug.

## 1.1.27

- Amazon changed video position and broke hole extension on prime video.

## 1.1.26

- Fixed ratings error

## 1.1.25

- Better ratings title recognition and more card types on Disney, Netflix, Prime Video

## 1.1.24

- Better ratings title recognition and more card types on Disney, Netflix, Prime Video

## 1.1.23

- Added Disney Self ad skip
- Added button translations

## 1.1.22

- Fixed settings error

## 1.1.18-19

- Profile Pick not working the same in deployed version

## 1.1.17

- Forgot to add Crunchyroll Profile Auto pick to settings

## 1.1.16

- Added Crunchyroll Profile Auto pick
- fixed Settings bug
- improved DBCache storage access

## 1.1.15

- Added three color Scale to ratings.

## 1.1.13

- HBO fixed watch credits on HBO movies.

## 1.1.12

- Removes Netflix pause ads

## 1.1.11

- Fixed Disney TMDB rating
- Filter duplicates removed, since now unnecessary on Disney

## 1.1.10

- Fixed Prime video skip intro loop bug
- Fixed Prime video watch intro button

## 1.1.9

- Disney new zealand skip credits bug

## 1.1.8

- Fix hotstar skip Credits bug

## 1.1.7

- Crunchyroll ReleaseCalendar if no show yet fixed

## 1.1.6

- Crunchyroll: now put release schedule in current weeks release calendar(queued no dub only)

## 1.1.4

- PT_BR better Translation
- Changed donation link

## 1.1.3

- Added HBO max streaming service
- TBMD ratings show N/A if no rating available and ? if not found. And if you inspect the ratings label you can see the found movie title
- minor function improvements

## 1.1.2

- Filter duplicate shows on disney (optional)
- fixed Crunchyroll dub bug
- fixed Extension context invalidated error.
- code optimization (closest function)

## 1.1.1

- added optional tabs permission because of misleading permission text on chrome

## 1.1.0

- Fixed default page on install

## 1.0.99

- Fixed Intro skipped to fast on Crunchyroll, if the audio is dubbed

## 1.0.98

- Improved Popup UI
- Improved Shared Settings on Extended Settings

## 1.0.97

- Fixed Continue postion on amazon prime
- Changed Speed indicator position

## 1.0.96

- Fixed new Amazon Ad-indicator

## 1.0.95

- Fixed Netflix ad skip, since adTime css class changed

## 1.0.94

- Forgot to add starplus permission

## 1.0.93

- Remove Xray over amazon prime videos
- Fix bug zoom in on settings on about:addons
- Prime video hover now transparent

## 1.0.92

- Disney go to home button bug on Chrome

## 1.0.91

- Added Disney go to Home button
- Disney changed skip Credits button. Issue fixed
- Starplus mobile site now working

## 1.0.90

- Fix Disney video player redesign, video functions wont work

## 1.0.89

- Added disney Starplus compatibility

## 1.0.88

- Fixed bug in navigation buttons in extended settings
- Fixed html in settings

## 1.0.87

- Improved Settings style
- Fixed settings bug with scrollbar

## 1.0.86

- Disney when going to next episode remain in full screen
- Fix bug Amazon Continue Watching position

## 1.0.85

- Disney original intro skipped

## 1.0.83

- Better TMDB accuracy
- Prime Video Ad UI change: Skip ad fixed

## 1.0.82

- Prime Video Ad UI change: Skip ad fixed

## 1.0.81

- Fixed paused AD on Netflix
- Open current Weekday on Cr Release Calendar

## 1.0.80

- Added TMDB ratings to Prime Video
- Better title filter for TMDB
- On extension update no more Error Context invalidated errors

## 1.0.79

- Fixed Prime Video Credits skip will crash page

## 1.0.78

- Mute Netflix Ad skip
- Add Feature to Prime: move continue watching to the top

## 1.0.77

- Automatically use desktop mode on firefox/chrome mobile
- Various mobile improvements

## 1.0.74

- Released for Firefox on Android

## 1.0.73

- Fixed umlauts for Netflix auto profile pick

## 1.0.72

- Added epilepsy option
- fixed disney intro/recap bug

## 1.0.70

- added Crunchyroll Gobackbutton from Intro
- fix Crunchyroll Release calendar BUG when switch off function
- less API calls to TMDB only refresh unknown daily
- better remove old settings

## 1.0.69

- Improved subtitles of Amazon and Disney

## 1.0.67

- added Crunchyroll startPlayOnFullScreen
- fixed bug Crunchyroll ReleaseCalendar removedDub on load
- Changed 1x to 1.0x on Sliders
- Some language changes on pt_br

## 1.0.66

- added Streaming Service Crunchyroll
- fixed Netflix SpeedSlider was conflicting with netflix ad Skip
- added Portuguese (BR) as a Language
- simplified Code substantially(min. 600 LOC less)

## 1.0.65

- fixed Netflix SpeedSlider was conflicting with netflix ad Skip
- added Portuguese (BR) as a Language
- simplified Code substantially(600 LOC less)

## 1.0.64

- added TMDB to Hotstar

## 1.0.63

- less TMDB calls on disney: bugfix for each works different on chrome

## 1.0.62

- fixed Netflix ad skip: skips too far
- added IMDB rating to Disney
- replaced justWatch APi to themoviedb API since justWatch api no longer working
- removed addStreamingLinks since justWatch api no longer working

## 1.0.59

- Added IMDB rating on Amazon Prime and Netflix

## 1.0.56,57

- Improved Freevee Ad skip

## 1.0.56

- Improved shared settings
- Made Watch Credits inverse of Skip Credits
- Fixed UI

## 1.0.55

- added Always Watch Credits feature
- fixed Shared Features Switches

## 1.0.53

- Fixed chrome pop-up wrong width

## 1.0.52

- Fixed Amazon Prime skip Credits

## 1.0.51

- Fixed Netflix Ad skip due to changed css classes of Netflix

## 1.0.50

- Fixed amazon speedslider due to changed layout of amazon
- Fixed Amazon Freevee ad skip bug if ad length divisible by 20

## 1.0.49

- Added Speedslider min,max,step options
- Added Language: Macedonian
- Edge: Netflix Ad bug fixed
- Hotstar: Skip Ad,Recap,Credits fixed

## 1.0.48

- Changed name to Streaming enhanced
- Added German Locale
- Refreshed descriptions

## 1.0.47

- Added Disney Plus Hotstar
- Fixed Netflix and Disney Speedsliders

## 1.0.46

- Added Disney Plus
- Changed speed slider design on Amazon
- Changed skip Recap definition since it is also skipped on amazon and disney
- Added Netflix SpeedSlider

## 1.0.45

- Added Addon Install Page
- Changed some UI

## 1.0.44

- Improved Freevee Ad skip by stopping 0.1s before ad is over instead of 1s

## 1.0.43

- Changed speed slider to 2X max

## 1.0.42

- Added Icons to Settings and changed Design
- Added Statistics description

## 1.0.41

- Added back Individual options for shared options on the Settings page

## 1.0.40

- displayed shared skip ads incorrectly

## 1.0.38

- Confirm reset addon
- Added title to Settings page
- Changed button designs

## 1.0.37

- Fixed Chrome scroll bug in settings
- Fixed floating settings button bug in popup

## 1.0.36

- Now starts playing the video automatically if Fullscreen is opened
- Combined shared Settings from Amazon prime and Netflix
- Mayor settings layout overhaul

## 1.0.35

- Faster automatic profile pick on Netflix
- Bugfix: did not filter paid films on Category pages on Amazon
- Won't filter paid films in shop, since it doesn't make sense there (Amazon)

## 1.0.34

- does not open settings on update anymore

## 1.0.33

- Fixed infinite loading issue with higher delay of 150 ms

## 1.0.32

- Fixed blank page bug on amazon prime with remove paid content feature
- Show netflix profile picture in settings since name may be similar

## 1.0.31

- fixed auto click on profile on the profile manage page

## 1.0.30

- Automatically choosing last used Netflix Profile
- Fixed arrow direction on settings page
- Fixed various console errors

## 1.0.29

- proper Netflix Ad skip

## 1.0.28

- Fast Forwarding Ads on Netflix by 2X
- automatic opening of the settings when the extension is updated/installed

## 1.0.27

- fixed Amazon enable/disable all button (speed slider and filter paid content were forgotten)

## 1.0.26

- filter Paid Content on Amazon, like Films and series

## 1.0.25

- changed the Amazon credit auto skip: It will now only skip if it is the same season in the same series.
- changed Freevee Ad skip: Changed it to Interval, which fixes these bugs:
- parts of the actual video were also skipped
- sometimes Freevee ad was not skipped

## 1.0.24

- fixed issue of infinite loading on Freevee ad skip if it is longer than 90s

## 1.0.22

- fixed opened setting popups bug
- fixed vw warning on slider
- fixed warning if slider cannot be removed

## 1.0.21

- remove annoying background hue from amazon when mouse over on video

## 1.0.20

- added button to hide speed slider

## 1.0.19

- added a video speed slider to amazon prime video

## 1.0.18

- fixed bug not skipping ad between episodes

## 1.0.17

- fixed bug of forwarding into an ad won't skip it anymore

## 1.0.16

- implemented a go back button for Amazon, if the user wants to watch the intro
- fixed the infinite loading on freevee on first launch of a film

## 1.0.15

- fixed: self ad skips disabling subtitles
- fixed: self ad skips infinite loading on initial watching of series

## 1.0.14

- Fixed: not showing subtitles when self ad skipped

## 1.0.12

- Bugfix: if Amazon self ad is skipped, subtitles disappear
- improved performance since function gets returned if found button.

## 1.0.11

- fixed bug when badge is not reset properly when pressing reset button

## 1.0.10

- added Segments skipped statistic
- added Add-on Badges that show on the icon when something is skipped.
- fixed bug where the statistics are overridden if you have multiple instances of the add-on running
- improved self ad skipping logic
- removed unnecessary URL permission which use primevideo.com

## 1.0.9

- improved Amazon Intro skipping
- Added Addon Statistics: Ad , Intro, Recap time skipped
- added Importing and Exporting of Settings in the Settings page

## 1.0.8

- the Individual settings are now opened automatically in the settings page
- bug fixed: if there is an version update with a new setting, it wont show that the new setting is activated, although it is.
- removed unnecessary , function () {} and {settings:settings}

## 1.0.7

- improved addon Settings page to include disable all amazon/netflix button and dropdown to decrease menu size
- fixed bug: freevee ad skipping may crash the site on first opening, now doesn't skip too often

## 1.0.6

- Added Amazon Freevee ad skipping
- better mutation observing => less computation

## 1.0.5

- synchronize the settings across accounts
- bug fixed where ad is skipped when the infobar is not shown yet(misclicks)

## 1.0.4

- Updated the check if it is a video on Amazon to check the title and the url
- Updated the skip Recap to also check for skip-preplay, which is a different button
- removed error in console.logs

## 1.0.0

- Initial Release

          