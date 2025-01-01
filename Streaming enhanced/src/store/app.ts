import { defineStore } from "pinia";

export const useAppStore = defineStore("makre", {
  state: () => ({
    settings: {
      language: "",
    },
    $ready: false,
  }),
  //   getters: {
  //     content: (state) => {
  //       return state.i18n[state.settings.language]
  //     }
  //   }
});
