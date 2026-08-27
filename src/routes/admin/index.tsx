import { Link, createFileRoute } from '@tanstack/react-router'
import { LockKeyhole } from 'lucide-react'

import { AdminHeader } from '#/components/admin-header'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { useLocale } from '#/lib/i18n'
import { getRequiredAdminFn } from '#/server/auth'
import { getPendingOrderCountFn } from '#/server/admin-order'

export const Route = createFileRoute('/admin/')({
  beforeLoad: () => getRequiredAdminFn(),
  loader: () => getPendingOrderCountFn(),
  component: AdminHome,
})

function AdminHome() {
  const { t } = useLocale()
  const pendingCount = Route.useLoaderData()

  return (
    <div className="admin-shell">
      <AdminHeader pendingCount={pendingCount} />
      <main className="admin-main">
        <p className="eyebrow">{t('adminProtected')}</p>
        <h1>{t('adminOverview')}</h1>
        <div className="admin-overview-actions">
          <Button asChild className="primary-button compact-button">
            <Link to="/admin/orders">{t('orders')}</Link>
          </Button>
          <Button asChild className="compact-button" variant="outline">
            <Link to="/admin/expenses">{t('expenses')}</Link>
          </Button>
          <Button asChild className="compact-button" variant="outline">
            <Link to="/admin/catalog">{t('adminCatalog')}</Link>
          </Button>
        </div>
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
            <p className="pending-summary">
              {t('pendingRequests')}: <strong>{pendingCount}</strong>
            </p>
          </div>
        </Card>
      </main>
    </div>
  )
}
