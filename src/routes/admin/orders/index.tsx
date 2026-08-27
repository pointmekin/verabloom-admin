import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { Flower2, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'

import { AdminHeader } from '#/components/admin-header'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Select } from '#/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { useLocale } from '#/lib/i18n'
import type { MessageKey } from '#/lib/i18n'
import { getPendingOrderCountFn, listAdminOrdersFn } from '#/server/admin-order'
import type { AdminOrderStatus } from '#/server/admin-order'

const orderSearchSchema = z.object({
  search: z.string().optional().default(''),
  status: z
    .enum(['pending_review', 'confirmed', 'completed', 'cancelled'])
    .optional(),
})

export const Route = createFileRoute('/admin/orders/')({
  beforeLoad: () =>
    import('#/server/auth').then(({ getRequiredAdminFn }) =>
      getRequiredAdminFn(),
    ),
  validateSearch: orderSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const [orders, pendingCount] = await Promise.all([
      listAdminOrdersFn({ data: deps }),
      getPendingOrderCountFn(),
    ])
    return { orders, pendingCount }
  },
  component: AdminOrdersPage,
})

function statusLabel(status: AdminOrderStatus, t: (key: MessageKey) => string) {
  const key = `status_${status}` as MessageKey
  return t(key)
}

function AdminOrdersPage() {
  const { t } = useLocale()
  const router = useRouter()
  const { orders, pendingCount } = Route.useLoaderData()
  const search = Route.useSearch()
  const [query, setQuery] = useState(search.search)

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void router.navigate({
      to: '/admin/orders',
      search: { ...search, search: query.trim() },
    })
  }

  function changeStatus(status: string) {
    void router.navigate({
      to: '/admin/orders',
      search: {
        search: search.search,
        status: status === 'all' ? undefined : (status as AdminOrderStatus),
      },
    })
  }

  return (
    <div className="admin-shell">
      <AdminHeader pendingCount={pendingCount} />
      <main className="admin-main orders-admin-main">
        <div className="admin-page-heading">
          <div>
            <p className="eyebrow">{t('adminProtected')}</p>
            <h1>{t('orders')}</h1>
          </div>
          <Button asChild className="primary-button compact-button">
            <Link to="/admin/orders/$orderId" params={{ orderId: 'new' }}>
              <Plus aria-hidden="true" size={16} />
              {t('createOrder')}
            </Link>
          </Button>
        </div>

        <div className="orders-toolbar">
          <form className="orders-search" onSubmit={submitSearch}>
            <Search aria-hidden="true" size={16} />
            <Input
              aria-label={t('searchOrders')}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('searchOrders')}
              value={query}
            />
            <Button size="sm" type="submit">
              {t('search')}
            </Button>
          </form>
          <label className="status-filter">
            <span>{t('filterStatus')}</span>
            <Select
              aria-label={t('filterStatus')}
              onChange={(event) => changeStatus(event.target.value)}
              value={search.status ?? 'all'}
            >
              <option value="all">{t('allStatuses')}</option>
              <option value="pending_review">
                {t('status_pending_review')}
              </option>
              <option value="confirmed">{t('status_confirmed')}</option>
              <option value="completed">{t('status_completed')}</option>
              <option value="cancelled">{t('status_cancelled')}</option>
            </Select>
          </label>
        </div>

        {orders.length === 0 ? (
          <div className="admin-empty">
            <Flower2 aria-hidden="true" size={30} />
            <p>{t('noOrders')}</p>
          </div>
        ) : (
          <div className="orders-table-wrap">
            <Table className="orders-table">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('requestReference')}</TableHead>
                  <TableHead>{t('customerName')}</TableHead>
                  <TableHead>{t('selectedProduct')}</TableHead>
                  <TableHead>{t('requiredDate')}</TableHead>
                  <TableHead>{t('orderValue')}</TableHead>
                  <TableHead>{t('filterStatus')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell data-label={t('requestReference')}>
                      <Link
                        className="text-link"
                        to="/admin/orders/$orderId"
                        params={{ orderId: String(order.id) }}
                      >
                        {order.requestReference}
                      </Link>
                    </TableCell>
                    <TableCell data-label={t('customerName')}>
                      <strong>{order.customerName}</strong>
                      <small>{order.socialContact}</small>
                    </TableCell>
                    <TableCell data-label={t('selectedProduct')}>
                      {order.productNameSnapshot} ·{' '}
                      {order.variationNameSnapshot}
                    </TableCell>
                    <TableCell data-label={t('requiredDate')}>
                      {order.requiredDate}
                    </TableCell>
                    <TableCell data-label={t('orderValue')}>
                      {order.orderValueThb ?? '—'} ฿
                    </TableCell>
                    <TableCell data-label={t('filterStatus')}>
                      <Badge
                        variant={
                          order.status === 'cancelled'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {statusLabel(order.status, t)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  )
}
