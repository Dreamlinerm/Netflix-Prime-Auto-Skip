import { createI18n } from "vue-i18n";
import en from "@/_locales/en/messages.json";
import de from "@/_locales/de/messages.json";
import dateTimeFormats from "@/i18n/dateTimeFormats.json";
import numberFormats from "@/i18n/numberFormats.json";

//@ts-ignore
export default createI18n({
  // locale: import.meta.env.VITE_DEFAULT_LOCALE, // <--- 1
  // fallbackLocale: import.meta.env.VITE_FALLBACK_LOCALE, // <--- 2
  locale: "en",
  legacy: false, // <--- 3
  defaultScope: "global",
  globalInjection: true,
  messages: {
    en,
    de,
  },
  //@ts-ignore
  datetimeFormats: dateTimeFormats,
  numberFormats,
});
