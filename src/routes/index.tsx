import { Link, createFileRoute } from '@tanstack/react-router'
import { Flower2 } from 'lucide-react'

import { LanguageSwitcher } from '#/components/language-switcher'
import type { MessageKey } from '#/lib/i18n'
import { useLocale } from '#/lib/i18n'
import { getSocialContactsFn } from '#/server/order'

export const Route = createFileRoute('/')({
  loader: () => getSocialContactsFn(),
  component: Home,
})

function Home() {
  const { t } = useLocale()
  const contacts = Route.useLoaderData()

  return (
    <div className="public-shell">
      <header className="public-header">
        <Link className="brand" to="/">
          <Flower2 aria-hidden="true" size={22} />
          <span>Verabloom</span>
        </Link>
        <nav className="public-nav" aria-label="Primary">
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
          {contacts.length > 0 ? (
            <div className="landing-social-links">
              <p>{t('contactUs')}</p>
              <ul>
                {contacts.map((contact) => (
                  <li key={contact.channel}>
                    <a href={contact.url} target="_blank" rel="noreferrer">
                      {t(contact.channel as MessageKey)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
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
