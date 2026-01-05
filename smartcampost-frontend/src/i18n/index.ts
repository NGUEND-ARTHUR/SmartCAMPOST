import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import fr from "./locales/fr.json";

const STORAGE_KEY = "smartcampost_lang";

function getInitialLanguage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "en" || saved === "fr") return saved;
  return "en"; // ✅ default English
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr }
  },
  lng: getInitialLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
});

export function setLanguage(lang: "en" | "fr") {
  i18n.changeLanguage(lang);
  localStorage.setItem(STORAGE_KEY, lang);
}

export default i18n;
