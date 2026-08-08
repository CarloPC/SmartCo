import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import en from '../locales/en'
import fil from '../locales/fil'
import ceb from '../locales/ceb'

// NOTE: This context is ONLY for the application UI (nav, buttons, labels,
// validation messages, etc). It intentionally has nothing to do with the
// AI Health Assistant's own conversational language mirroring — that logic
// lives entirely in aiHealthService.js and reacts to what the user types in
// the chat, not to this UI language setting. Do not wire this context into
// aiHealthService.js.

const STORAGE_KEY = 'smartco_language'
const DEFAULT_LANGUAGE = 'en'

const TRANSLATIONS = { en, fil, ceb }

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flagLabel: '🌐 English' },
  { code: 'fil', label: 'Filipino', flagLabel: '🌐 Filipino' },
  { code: 'ceb', label: 'Cebuano', flagLabel: '🌐 Cebuano' },
]

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj)
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && TRANSLATIONS[saved]) return saved
    } catch (e) {
      // localStorage unavailable (private browsing, etc) — fall back to default
    }
    return DEFAULT_LANGUAGE
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language)
    } catch (e) {
      // ignore write failures — language still works for this session
    }
  }, [language])

  const setLanguage = useCallback((lang) => {
    if (!TRANSLATIONS[lang]) return
    setLanguageState(lang)
  }, [])

  // t('common.save') -> looks up the key in the active language, falling
  // back to English, then to the raw key itself so missing translations
  // never render as a blank string.
  const t = useCallback((key, fallback) => {
    const active = getNestedValue(TRANSLATIONS[language], key)
    if (active !== undefined) return active
    const englishFallback = getNestedValue(TRANSLATIONS.en, key)
    if (englishFallback !== undefined) return englishFallback
    return fallback !== undefined ? fallback : key
  }, [language])

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    supportedLanguages: SUPPORTED_LANGUAGES,
  }), [language, setLanguage, t])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
