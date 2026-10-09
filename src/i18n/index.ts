import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import es from './locales/es.json'
import en from './locales/en.json'

// Spanish is primary; English is the fallback. Colombian 'es-CO' resolves to 'es'
// via i18next's base-language fallback (load: 'languageOnly' is the default behavior
// when only base-language resources are provided).
i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['navigator', 'htmlTag', 'localStorage'],
      caches: ['localStorage'],
    },
  })

export default i18next
