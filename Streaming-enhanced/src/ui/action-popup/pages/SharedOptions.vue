<template>
  <div class="p-1 m-0 flex">
    <p>{{ $t("IntroSwitch") }}</p>
    <Switch
      v-model="skipIntro"
      class="ml-auto"
    ></Switch>
  </div>
  <hr />
  <div class="p-1 m-0 flex">
    <p>{{ $t("CreditsSwitch") }}</p>
    <Switch
      v-model="skipCredits"
      class="ml-auto"
    ></Switch>
  </div>
  <div class="p-1 m-0 flex">
    <p>{{ $t("WatchCreditsSwitch") }}</p>
    <Switch
      v-model="watchCredits"
      class="ml-auto"
    ></Switch>
  </div>
  <hr />
  <div class="p-1 m-0 flex">
    <p>{{ $t("AdsSwitch") }}</p>
    <Switch
      v-model="blockAds"
      class="ml-auto"
    ></Switch>
  </div>
  <div class="p-1 m-0 flex">
    <p>{{ $t("SliderSwitch") }}</p>
    <Switch
      v-model="speedSlider"
      class="ml-auto"
    ></Switch>
  </div>
  <div class="p-1 m-0 flex">
    <p>{{ $t("FullscreenSwitch") }}</p>
    <Switch
      v-model="settings.Video.playOnFullScreen"
      class="ml-auto"
    ></Switch>
  </div>
  <div class="p-1 m-0 flex">
    <p>{{ $t("DoubleClickSwitch") }}</p>
    <Switch
      v-model="settings.Video.doubleClick"
      class="ml-auto"
    ></Switch>
  </div>
  <div class="p-1 m-0 flex">
    <p>{{ $t("scrollVolumeSwitch") }}</p>
    <Switch
      v-model="settings.Video.scrollVolume"
      class="ml-auto"
    ></Switch>
  </div>
  <div class="p-1 m-0 flex">
    <p>{{ $t("RatingSwitch") }}</p>
    <Switch
      v-model="showRating"
      class="ml-auto"
    ></Switch>
  </div>
  <div class="p-1 m-0 flex">
    <p>{{ $t("ShowYearSwitch") }}</p>
    <Switch
      v-model="settings.Video.showYear"
      class="ml-auto"
    ></Switch>
  </div>
  <a
    href="https://www.themoviedb.org"
    target="_blank"
    class="p-1 m-0 flex"
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

const watchCredits = computed({
  get: () =>
    streamingServices.every(
      (service) => settings.value[service]?.watchCredits ?? true,
    ),
  set: (value) => {
    streamingServices.forEach((service) => {
      if (settings.value[service]?.watchCredits !== undefined) {
        settings.value[service].watchCredits = value
      }
    })
  },
})
const blockAds = computed({
  get: () =>
    settings.value?.Amazon.blockFreevee &&
    settings.value?.Netflix.skipAd &&
    settings.value?.Disney.skipAd,
  set: (value) => {
    settings.value.Amazon.blockFreevee =
      settings.value.Netflix.skipAd =
      settings.value.Disney.skipAd =
        value
  },
})

const speedSlider = computed({
  get: () =>
    streamingServices.every(
      (service) => settings.value[service]?.speedSlider ?? true,
    ),
  set: (value) => {
    streamingServices.forEach((service) => {
      settings.value[service].speedSlider = value
    })
  },
})

const showRating = computed({
  get: () =>
    streamingServices.every(
      (service) => settings.value[service]?.showRating ?? true,
    ),
  set: (value) => {
    streamingServices.forEach((service) => {
      if (settings.value[service]?.watchCredits !== undefined) {
        settings.value[service].showRating = value
      }
    })
  },
})
</script>
<style scoped>
/* label {
  margin-left: auto;
} */
</style>
