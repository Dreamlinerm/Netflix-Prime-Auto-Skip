<template>
  <ion-app>
    <template>
      <ion-router-outlet />
    </template>
  </ion-app>
</template>

<script lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
export default {
  name: 'App',
  components: {
    IonApp,
    IonRouterOutlet,
  },
};
</script>
