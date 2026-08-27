import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight, Flower2 } from 'lucide-react'

import { LanguageSwitcher } from '#/components/language-switcher'
import { useLocale } from '#/lib/i18n'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { t } = useLocale()
  return (
    <div className="public-shell">
      <header className="public-header">
        <Link className="brand" to="/">
          <Flower2 aria-hidden="true" size={22} />
          <span>Verabloom</span>
        </Link>
        <nav className="public-nav" aria-label="Primary">
          <span>{t('publicNav')}</span>
          <LanguageSwitcher />
          <Link className="admin-link" to="/admin/login">
            {t('adminSignIn')}
          </Link>
        </nav>
      </header>

      <main className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{t('publicKicker')}</p>
          <h1>{t('publicTitle')}</h1>
          <p className="hero-body">{t('publicBody')}</p>
          <div className="coming-soon">
            <span>{t('publicCta')}</span>
            <ArrowUpRight aria-hidden="true" size={18} />
          </div>
          <p className="hero-note">{t('publicNote')}</p>
        </div>
        <div className="botanical-mark" aria-hidden="true">
          <span className="petal petal-one" />
          <span className="petal petal-two" />
          <span className="petal petal-three" />
          <span className="petal petal-four" />
          <span className="flower-center" />
          <span className="stem" />
          <span className="leaf leaf-one" />
          <span className="leaf leaf-two" />
        </div>
      </main>
    </div>
  )
}
