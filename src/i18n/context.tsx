import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import zh from './zh'
import en from './en'

type Lang = 'zh' | 'en'
type TranslationSet = typeof zh

interface I18nContextValue {
  lang: Lang
  t: TranslationSet
  toggleLang: () => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

function loadLang(): Lang {
  try {
    const saved = localStorage.getItem('i18n_lang')
    if (saved === 'zh' || saved === 'en') return saved
  } catch {}
  return 'zh'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(loadLang)

  const t = lang === 'en' ? en : zh

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'zh' ? 'en' : 'zh'
      try {
        localStorage.setItem('i18n_lang', next)
      } catch {}
      return next
    })
  }, [])

  return (
    <I18nContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
