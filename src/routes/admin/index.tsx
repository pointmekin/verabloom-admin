import { Link, createFileRoute } from '@tanstack/react-router'
import { Flower2, LockKeyhole, LogOut } from 'lucide-react'

import { LanguageSwitcher } from '#/components/language-switcher'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { useLocale } from '#/lib/i18n'
import { getRequiredAdminFn, logoutFn } from '#/server/auth'

export const Route = createFileRoute('/admin/')({
  beforeLoad: () => getRequiredAdminFn(),
  component: AdminHome,
})

function AdminHome() {
  const { t } = useLocale()

  async function logout() {
    await logoutFn()
    window.location.assign('/admin/login')
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <Link to="/admin" className="admin-brand">
          <Flower2 aria-hidden="true" size={20} />
          {t('adminBrand')}
        </Link>
        <div className="admin-actions">
          <LanguageSwitcher />
          <Button
            className="logout-button"
            onClick={logout}
            type="button"
            variant="ghost"
          >
            <LogOut aria-hidden="true" size={16} />
            {t('logout')}
          </Button>
        </div>
      </header>
      <main className="admin-main">
        <p className="eyebrow">{t('adminProtected')}</p>
        <h1>{t('adminOverview')}</h1>
        <Card className="welcome-panel">
          <div className="status-icon">
            <LockKeyhole aria-hidden="true" />
          </div>
          <div>
            <Badge className="status-pill" variant="secondary">
              {t('adminStatus')}
            </Badge>
            <h2>{t('adminWelcome')}</h2>
            <p>{t('adminBody')}</p>
          </div>
        </Card>
      </main>
    </div>
  )
}
