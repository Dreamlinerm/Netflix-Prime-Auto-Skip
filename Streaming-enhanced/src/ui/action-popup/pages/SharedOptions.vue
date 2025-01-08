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
const skipIntro = computed({
  get: () =>
    settings.value.Amazon.skipIntro &&
    settings.value.Netflix.skipIntro &&
    settings.value.Disney.skipIntro &&
    settings.value.Crunchyroll.skipIntro &&
    settings.value.HBO.skipIntro,
  set: (value) => {
    settings.value.Amazon.skipIntro = value
    settings.value.Netflix.skipIntro = value
    settings.value.Disney.skipIntro = value
    settings.value.Crunchyroll.skipIntro = value
    settings.value.HBO.skipIntro = value
  },
})

const skipCredits = computed({
  get: () =>
    settings.value.Amazon.skipCredits &&
    settings.value.Netflix.skipCredits &&
    settings.value.Disney.skipCredits &&
    settings.value.HBO.skipCredits,
  set: (value) => {
    settings.value.Amazon.skipCredits = value
    settings.value.Netflix.skipCredits = value
    settings.value.Disney.skipCredits = value
    settings.value.HBO.skipCredits = value
  },
})
</script>
<style scoped></style>
