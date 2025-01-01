<template>
  <ion-app>
    <template v-if="$ready">
      <ion-router-outlet />
    </template>
  </ion-app>
</template>

<script lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { mapState } from 'pinia'
import { useAppStore } from '@/store/app'
export default {
  name: 'App',
  components: {
    IonApp,
    IonRouterOutlet,
  },
  computed: {
    ...mapState(useAppStore, ['$ready']),
  },
};
</script>
