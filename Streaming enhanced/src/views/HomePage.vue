<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <p class="text-xl bg-red-900">
        {{ $t('test') }}<br>
        {{ $d(new Date(), "long") }}<br>
        {{ $n(1234.56, "currency") }}<br>
      </p>
      <DotsVerticalIcon></DotsVerticalIcon>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonContent, IonPage, } from '@ionic/vue';
import DotsVerticalIcon from 'vue-material-design-icons/DotsVertical.vue'
export default {
  name: 'HomePage',
  components: {
    IonContent, IonPage,

    DotsVerticalIcon
  },
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
