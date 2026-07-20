import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';

export type AppLanguage = 'en' | 'ar';

export const LANG_STORAGE_KEY = 'mashtal_lang';

export function getStoredLanguage(): AppLanguage {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === 'ar' || stored === 'en') return stored;
  } catch {
    /* ignore */
  }
  return 'en';
}

export function applyDocumentLanguage(lang: AppLanguage) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

const initial = getStoredLanguage();
applyDocumentLanguage(initial);

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: initial,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
