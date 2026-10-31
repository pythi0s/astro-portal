import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from '@/locales/en/common.json';
import hiCommon from '@/locales/hi/common.json';

/**
 * Initialise i18next.
 *
 * `common` is the only namespace for now; feature namespaces can be added
 * lazily as more strings get extracted.  All defaults return English so a
 * missing key surfaces as English rather than the key itself.
 */
void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon },
      hi: { common: hiCommon },
    },
    // UI is English-only; Hindi strings are kept for a possible future toggle.
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    returnNull: false,
  });

export default i18n;
