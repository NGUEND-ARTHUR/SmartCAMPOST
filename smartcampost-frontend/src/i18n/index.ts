import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import fr from "./locales/fr.json";

function mergeUsersNamespace(localeObj: any) {
  // If translations were nested under `users` (e.g. users.agencies.title)
  // merge them into top-level keys so code using `t('agencies.title')` works.
  if (localeObj && localeObj.users && typeof localeObj.users === "object") {
    Object.keys(localeObj.users).forEach((k) => {
      if (!localeObj[k]) localeObj[k] = localeObj.users[k];
    });
  }
}

const rawResources: any = { en, fr };

// Ensure common top-level keys exist (merge users subtree)
Object.values(rawResources).forEach((locale: any) => mergeUsersNamespace(locale));

const resources = {
  en: { translation: rawResources.en },
  fr: { translation: rawResources.fr },
};

// collector for missing keys (dev only)
if (typeof window !== "undefined") (window as any).__MISSING_I18N_KEYS__ = [];

i18n.use(LanguageDetector).use(initReactI18next).init({
  resources,
  fallbackLng: "fr",
  lng: localStorage.getItem("i18nextLng") || "fr",
  interpolation: { escapeValue: false },
  detection: { order: ["localStorage", "navigator"], caches: ["localStorage"] },
  parseMissingKeyHandler: (key) => {
    // In production don't reveal raw keys; return empty string.
    if (process.env.NODE_ENV === "production") return "";
    // Dev-friendly fallback: humanize dotted key -> "Agencies Form Name"
    return key
      .split('.')
      .map((s) => s.replace(/([a-z0-9])([A-Z])/g, "$1 $2"))
      .map((w) => w.replace(/_/g, ' '))
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  },
});

// collect missing keys and log once
i18n.on('missingKey', (lngs, ns, key) => {
  try {
    const arr = (window as any).__MISSING_I18N_KEYS__;
    if (arr && !arr.includes(key)) arr.push(key);
  } catch (e) {
    // ignore
  }
  if (process.env.NODE_ENV !== 'production') console.warn('Missing i18n key:', key);
});

export default i18n;
// Report collected missing keys once (dev only)
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  setTimeout(() => {
    const arr = (window as any).__MISSING_I18N_KEYS__ || [];
    if (arr.length > 0) {
      console.groupCollapsed(`i18n: ${arr.length} missing keys`);
      arr.forEach((k: string) => console.warn(k));
      console.groupEnd();
    }
  }, 1500);
}
