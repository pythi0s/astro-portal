import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from '@/locales/en/common.json';
import hiCommon from '@/locales/hi/common.json';

export const SUPPORTED_LANGUAGES = ['en', 'hi'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Initialise i18next with browser detection + localStorage persistence.
 *
 * `common` is the only namespace for now; feature namespaces can be added
 * lazily as more strings get extracted.  All defaults return English so a
 * missing key surfaces as English rather than the key itself.
 */
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon },
      hi: { common: hiCommon },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'lang',
    },
    returnNull: false,
  });

export default i18n;
