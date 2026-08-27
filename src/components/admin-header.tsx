import { Link } from '@tanstack/react-router'
import { Flower2, LogOut } from 'lucide-react'

import { LanguageSwitcher } from '#/components/language-switcher'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { useLocale } from '#/lib/i18n'

export function AdminHeader({ pendingCount }: { pendingCount: number }) {
  const { t } = useLocale()

  async function logout() {
    const { logoutFn } = await import('#/server/auth')
    await logoutFn()
    window.location.assign('/admin/login')
  }

  return (
    <header className="admin-header">
      <Link to="/admin" className="admin-brand">
        <Flower2 aria-hidden="true" size={20} />
        {t('adminBrand')}
      </Link>
      <div className="admin-actions">
        <Link className="admin-section-link" to="/admin/orders">
          {t('orders')}{' '}
          <Badge variant={pendingCount > 0 ? 'destructive' : 'secondary'}>
            {pendingCount}
          </Badge>
        </Link>
        <Link className="admin-section-link" to="/admin/customers">
          {t('customers')}
        </Link>
        <Link className="admin-section-link" to="/admin/expenses">
          {t('expenses')}
        </Link>
        <Link className="admin-section-link" to="/admin/catalog">
          {t('catalog')}
        </Link>
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
  )
}
