const defaultSettings = {
  settings: {
    Amazon: { skipIntro: true, skipCredits: true, watchCredits: false, skipAd: true, blockFreevee: true, speedSlider: true, filterPaid: false, showRating: true, streamLinks: true },
    Netflix: { skipIntro: true, skipRecap: true, skipCredits: true, watchCredits: false, skipBlocked: true, NetflixAds: true, speedSlider: true, profile: true, showRating: true },
    Disney: { skipIntro: true, skipCredits: true, watchCredits: false, speedSlider: true, showRating: true },
    Crunchyroll: { skipIntro: true, skipCredits: true, watchCredits: false, speedSlider: true, releaseCalendar: true },
    Video: { playOnFullScreen: true },
    Statistics: { AmazonAdTimeSkipped: 0, NetflixAdTimeSkipped: 0, IntroTimeSkipped: 0, RecapTimeSkipped: 0, SegmentsSkipped: 0 },
    General: { profileName: null, profilePicture: null, sliderSteps: 1, sliderMin: 5, sliderMax: 20, filterDub: true, filterQueued: true },
  },
};
let settings = defaultSettings.settings;
browser.storage.sync.get("settings", function (result) {
  settings = result.settings;
  if (typeof settings !== "object") {
    browser.storage.sync.set(defaultSettings);
  } else {
    CrunchyrollObserver.observe(document, config);
    Crunchyroll_ReleaseCalendar();

    let changedSettings = false;
    for (const key in defaultSettings.settings) {
      if (typeof settings[key] === "undefined") {
        log("undefined Setting:", key);
        changedSettings = true;
        settings[key] = defaultSettings.settings[key];
      } else {
        for (const subkey in defaultSettings.settings[key]) {
          if (typeof settings[key][subkey] === "undefined") {
            log("undefined Setting:", key, subkey);
            changedSettings = true;
            settings[key][subkey] = defaultSettings.settings[key][subkey];
          }
        }
      }
    }
    if (changedSettings) {
      browser.storage.sync.set({ settings });
    }
  }
});
const CrunchyrollObserver = new MutationObserver(Crunchyroll);
function Crunchyroll() {
  // if (settings.Crunchyroll?.skipIntro) Crunchyroll_Intro();
  // if (settings.Crunchyroll?.skipCredits) Crunchyroll_Credits();
  // if (settings.Crunchyroll?.watchCredits) Crunchyroll_Watch_Credits();
  // if (settings.Crunchyroll?.speedSlider) Crunchyroll_SpeedSlider();
}
async function Crunchyroll_Intro() {
  // the line below in xpath
  // //div[contains(@class, 'SkipContainer')]//button[contains(@class, 'Button') and contains(@class, 'skip')]
  // let button = document.evaluate('//div[@data-testid="skipIntroText"]', document, null, XPathResult.ANY_TYPE, null)?.iterateNext();
  const button = document.querySelector('[data-testid="skipIntroText"]');
  console.log(button, document.querySelector("iframe"));
  if (button) {
    let video = document.querySelector("video");
    const time = video?.currentTime;
    button?.click();
    log("Intro skipped", button);
    setTimeout(function () {
      addSkippedTime(time, video?.currentTime, "IntroTimeSkipped");
    }, 600);
  }
}
