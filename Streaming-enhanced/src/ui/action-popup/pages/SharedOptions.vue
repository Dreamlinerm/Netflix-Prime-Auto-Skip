<template>
  <div class="line flex">
    <p>IntroSwitch</p>
    <Switch v-model="settings.Amazon.skipAd"></Switch>
    {{ settings.Amazon.skipAd }}
  </div>
</template>
<script setup lang="ts">
const value = defineModel({ default: true })
const optionsStore = useOptionsStore()
// const { toggleDark } = optionsStore
const { settings } = storeToRefs(optionsStore)
</script>
<style scoped></style>
