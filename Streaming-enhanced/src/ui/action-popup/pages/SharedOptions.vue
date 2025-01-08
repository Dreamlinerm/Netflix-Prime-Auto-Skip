<template>
  <div class="line flex">
    <p>{{ $t("IntroSwitch") }}</p>
    <Switch v-model="skipIntro"></Switch>
  </div>
  <hr />
  <div class="line flex">
    <p>{{ $t("CreditsSwitch") }}</p>
    <Switch v-model="skipCredits"></Switch>
  </div>
  <div class="line flex">
    <p>{{ $t("WatchCreditsSwitch") }}</p>
    <Switch v-model="settings.Amazon.watchCredits"></Switch>
  </div>
  <hr />
  <div class="line flex">
    <p>{{ $t("AdsSwitch") }}</p>
    #VideoAds
    <Switch v-model="settings.Amazon.skipIntro"></Switch>
  </div>
  <div class="line flex">
    <p>{{ $t("SliderSwitch") }}</p>
    <Switch v-model="settings.Amazon.speedSlider"></Switch>
  </div>
  <div class="line flex">
    <p>{{ $t("FullscreenSwitch") }}</p>
    <Switch v-model="settings.Video.playOnFullScreen"></Switch>
  </div>
  <div class="line flex">
    <p>{{ $t("DoubleClickSwitch") }}</p>
    <Switch v-model="settings.Video.doubleClick"></Switch>
  </div>
  <div class="line flex">
    <p>{{ $t("scrollVolumeSwitch") }}</p>
    <Switch v-model="settings.Video.scrollVolume"></Switch>
  </div>
  <div class="line flex">
    <p>{{ $t("RatingSwitch") }}</p>
    <Switch v-model="settings.Amazon.showRating"></Switch>
  </div>
  <div class="line flex">
    <p>{{ $t("ShowYearSwitch") }}</p>
    <Switch v-model="settings.Video.showYear"></Switch>
  </div>
  <a
    href="https://www.themoviedb.org"
    target="_blank"
    class="line flex"
  >
    <img
      src="@assets/TMDB.svg"
      alt="TMDB"
    />
  </a>
</template>
<script setup lang="ts">
const optionsStore = useOptionsStore()
const { settings } = storeToRefs(optionsStore)
const streamingServices = ["Amazon", "Netflix", "Disney", "Crunchyroll", "HBO"]

const skipIntro = computed({
  get: () =>
    streamingServices.every((service) => settings.value[service].skipIntro),
  set: (value) => {
    streamingServices.forEach((service) => {
      settings.value[service].skipIntro = value
    })
  },
})

const skipCredits = computed({
  get: () =>
    streamingServices.every(
      (service) => settings.value[service]?.skipCredits ?? true,
    ),
  set: (value) => {
    streamingServices.forEach((service) => {
      if (settings.value[service]?.skipCredits !== undefined) {
        settings.value[service].skipCredits = value
      }
    })
  },
})
</script>
<style scoped></style>
