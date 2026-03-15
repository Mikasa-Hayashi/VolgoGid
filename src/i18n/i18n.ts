import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import en from "./en.json";
import ru from "./ru.json";

const deviceLanguage = Localization.getLocales()[0]?.languageCode || "ru";

i18n
  .use(initReactI18next)
  .init({
    lng: deviceLanguage,
    fallbackLng: "en",

    resources: {
      en: { translation: en },
      ru: { translation: ru }
    },

    interpolation: {
      escapeValue: false
    }
  });

export default i18n;