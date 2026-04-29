import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en/en';
import de from './locales/de/de';
import fr from './locales/fr/fr';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    resources: {
      en,
      de,
      fr,
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'de', 'fr'],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;