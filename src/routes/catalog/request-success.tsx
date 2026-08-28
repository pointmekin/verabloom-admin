import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { Check, Flower2 } from 'lucide-react'
import { z } from 'zod'

import { LanguageSwitcher } from '#/components/language-switcher'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import type { MessageKey } from '#/lib/i18n'
import { useLocale } from '#/lib/i18n'
import { getSocialContactsFn } from '#/server/order'

const successSearchSchema = z.object({
  reference: z.string().min(1).optional(),
})

export const Route = createFileRoute('/catalog/request-success')({
  beforeLoad: () => {
    throw redirect({ to: '/' })
  },
  validateSearch: successSearchSchema,
  loader: () => getSocialContactsFn(),
  component: RequestSuccessPage,
})

function RequestSuccessPage() {
  const { t } = useLocale()
  const contacts = Route.useLoaderData()
  const { reference } = Route.useSearch()

  return (
    <div className="public-shell catalog-shell">
      <header className="public-header">
        <Link className="brand" to="/">
          <Flower2 aria-hidden="true" size={22} />
          <span>Verabloom</span>
        </Link>
        <nav className="public-nav" aria-label="Primary">
          <Link to="/catalog" className="catalog-nav-link">
            {t('catalog')}
          </Link>
          <LanguageSwitcher />
          <Link className="admin-link" to="/admin/login">
            {t('adminSignIn')}
          </Link>
        </nav>
      </header>

      <main className="success-main">
        <Card className="success-card">
          <div className="success-icon" aria-hidden="true">
            <Check size={26} />
          </div>
          <p className="eyebrow">{t('publicKicker')}</p>
          <h1>{t('requestSubmitted')}</h1>
          {reference ? (
            <div className="reference-block">
              <span>{t('requestReference')}</span>
              <strong data-testid="request-reference">{reference}</strong>
            </div>
          ) : null}
          <p className="screenshot-instruction">{t('screenshotInstruction')}</p>
          {contacts.length > 0 ? (
            <div className="success-contacts">
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
          <Button asChild className="primary-button compact-button">
            <Link to="/catalog">{t('backToCatalog')}</Link>
          </Button>
        </Card>
      </main>
    </div>
  )
}
