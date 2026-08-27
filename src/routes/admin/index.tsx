import { Link, createFileRoute } from '@tanstack/react-router'
import { Flower2, LockKeyhole, LogOut } from 'lucide-react'

import { LanguageSwitcher } from '#/components/language-switcher'
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
          <button className="logout-button" onClick={logout} type="button">
            <LogOut aria-hidden="true" size={16} />
            {t('logout')}
          </button>
        </div>
      </header>
      <main className="admin-main">
        <p className="eyebrow">{t('adminProtected')}</p>
        <h1>{t('adminOverview')}</h1>
        <section className="welcome-panel">
          <div className="status-icon">
            <LockKeyhole aria-hidden="true" />
          </div>
          <div>
            <span className="status-pill">{t('adminStatus')}</span>
            <h2>{t('adminWelcome')}</h2>
            <p>{t('adminBody')}</p>
          </div>
        </section>
      </main>
    </div>
  )
}
