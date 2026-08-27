import { Languages } from 'lucide-react'

import { useLocale } from '#/lib/i18n'
import { setLocaleFn } from '#/server/locale'

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale()
  const nextLocale = locale === 'th' ? 'en' : 'th'

  async function switchLanguage() {
    setLocale(nextLocale)
    await setLocaleFn({ data: nextLocale })
  }

  return (
    <button
      aria-label={t('languageAction')}
      className="language-switcher"
      onClick={switchLanguage}
      type="button"
    >
      <Languages aria-hidden="true" size={16} />
      {t('languageName')}
    </button>
  )
}
