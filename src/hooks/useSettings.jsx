import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '@/config/limits'
import { translate } from '@/i18n/dictionaries'

const THEMES = ['default', 'dark', 'beige']
const SettingsContext = createContext(null)

function readStored(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

export function SettingsProvider({ children }) {
  const [lang, setLangState] = useState(() => readStored(STORAGE_KEYS.lang, 'en'))
  const [theme, setThemeState] = useState(() => {
    const stored = readStored(STORAGE_KEYS.theme, 'default')
    return THEMES.includes(stored) ? stored : 'default'
  })

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    localStorage.setItem(STORAGE_KEYS.lang, lang)
  }, [lang])

  useEffect(() => {
    document.body.classList.remove('dark', 'beige')
    if (theme !== 'default') document.body.classList.add(theme)
    localStorage.setItem(STORAGE_KEYS.theme, theme)
  }, [theme])

  const value = useMemo(
    () => ({
      lang,
      theme,
      setLang: setLangState,
      setTheme: setThemeState,
      toggleLang: () => setLangState((current) => (current === 'en' ? 'ar' : 'en')),
      toggleTheme: () =>
        setThemeState((current) => THEMES[(THEMES.indexOf(current) + 1) % THEMES.length]),
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang, theme],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used inside SettingsProvider')
  return context
}
