<template>
  <div class="line flex">
    <p>IntroSwitch</p>
    <Switch v-model="settings.Amazon.skipAd"></Switch>
  </div>
</template>
<script setup lang="ts">
const optionsStore = useOptionsStore()
const { settings } = storeToRefs(optionsStore)
</script>
<style scoped></style>
