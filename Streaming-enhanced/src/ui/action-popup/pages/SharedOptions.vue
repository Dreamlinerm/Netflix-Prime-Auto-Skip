<template>
  <div class="line flex">
    <p>IntroSwitch</p>
    <Switch v-model="value"></Switch>
  </div>
</template>
<script setup lang="ts">
const value = defineModel({ default: true })
</script>

<style scoped></style>