<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Blank</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Blank</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="container">
        <strong>Ready to create an app?</strong>
        <p>Start with Ionic <a target="_blank" rel="noopener noreferrer"
            href="https://ionicframework.com/docs/components">UI Components</a></p>
      </div>
      <p class="text-xl bg-red-900">
        {{ $t('test') }}<br>
        {{ $d(new Date(), "long") }}<br>
        {{ $n(1234.56, "currency") }}<br>
        {{ settings }}
      </p>
      <DotsVerticalIcon></DotsVerticalIcon>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { mapWritableState } from 'pinia'
import { useAppStore } from '@/store/app'
import DotsVerticalIcon from 'vue-material-design-icons/DotsVertical.vue'
export default {
  name: 'HomePage',
  computed: {
    ...mapWritableState(useAppStore, ['settings']),
  },
  components: {
    IonContent, IonHeader, IonPage, IonTitle, IonToolbar,

    DotsVerticalIcon
  },
  mounted() {
    const supportedLanguages = ['en', 'de'];
    // set language to browser language
    // navigator language or Device.getLanguageCode()
    if (!this.settings.language) {
      for (const language of supportedLanguages) {
        if (navigator.language.includes(language)) {
          console.log("set language", language)
          this.settings.language = language
          this.$i18n.locale = language
          break
        }
      }
      if (!this.settings.language) {
        this.settings.language = 'en'
        this.$i18n.locale = 'en'
      }
    }
  }
};
</script>

<style scoped>
#container {
  text-align: center;

  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;

  color: #8c8c8c;

  margin: 0;
}

#container a {
  text-decoration: none;
}
</style>
