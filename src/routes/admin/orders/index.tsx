import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { Flower2, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { z } from 'zod'

import { AdminHeader } from '#/components/admin-header'
import { DeliveryBadge } from '#/components/delivery-badge'
import { OrderOwnerBadge } from '#/components/order-owner-badge'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Select, SelectItem } from '#/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { useLocale } from '#/lib/i18n'
import type { Locale, MessageKey } from '#/lib/i18n'
import { listAdminOrdersPageFn } from '#/server/admin-order'
import type { AdminOrderStatus } from '#/server/admin-order'
import { requireAdmin } from '#/lib/admin-guard'

const orderSearchSchema = z.object({
  search: z.string().optional().default(''),
  status: z
    .enum([
      'pending_review',
      'confirmed',
      'work_in_progress',
      'completed',
      'cancelled',
    ])
    .optional(),
})

export const Route = createFileRoute('/admin/orders/')({
  beforeLoad: () => requireAdmin(),
  validateSearch: orderSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listAdminOrdersPageFn({ data: deps }),
  component: AdminOrdersPage,
})

function statusLabel(status: AdminOrderStatus, t: (key: MessageKey) => string) {
  const key = `status_${status}` as MessageKey
  return t(key)
}

function formatRequiredDate(value: string, locale: Locale) {
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

function formatOrderValue(value: string | null) {
  if (value === null) return null
  const [whole, decimal] = value.split('.')
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${formattedWhole}${decimal ? `.${decimal}` : ''} ฿`
}

function AdminOrdersPage() {
  const { locale, t } = useLocale()
  const router = useRouter()
  const { orders, pendingCount } = Route.useLoaderData()
  const search = Route.useSearch()
  const [query, setQuery] = useState(search.search)
  const hasActiveFilters = Boolean(search.search || search.status)

  useEffect(() => {
    setQuery(search.search)
  }, [search.search])

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
        search: query.trim(),
        status: status === 'all' ? undefined : (status as AdminOrderStatus),
      },
    })
  }

  function clearFilters() {
    setQuery('')
    void router.navigate({ to: '/admin/orders', search: {} })
  }

  return (
    <div className="admin-shell">
      <AdminHeader pendingCount={pendingCount} />
      <main className="admin-main orders-admin-main">
        <div className="admin-page-heading">
          <div>
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
              onValueChange={changeStatus}
              value={search.status ?? 'all'}
            >
              <SelectItem value="all">{t('allStatuses')}</SelectItem>
              <SelectItem value="pending_review">
                {t('status_pending_review')}
              </SelectItem>
              <SelectItem value="confirmed">{t('status_confirmed')}</SelectItem>
              <SelectItem value="work_in_progress">
                {t('status_work_in_progress')}
              </SelectItem>
              <SelectItem value="completed">{t('status_completed')}</SelectItem>
              <SelectItem value="cancelled">{t('status_cancelled')}</SelectItem>
            </Select>
          </label>
          <Button
            className="orders-pending-filter"
            onClick={() => changeStatus('pending_review')}
            size="sm"
            type="button"
            variant={
              search.status === 'pending_review' ? 'secondary' : 'outline'
            }
          >
            {t('viewPending')} {pendingCount}
          </Button>
        </div>

        {hasActiveFilters ? (
          <div className="orders-filter-summary">
            <span>
              {orders.length} {t('ordersShown')}
            </span>
            <Button
              onClick={clearFilters}
              size="sm"
              type="button"
              variant="ghost"
            >
              {t('clearOrderFilters')}
            </Button>
          </div>
        ) : null}

        {orders.length === 0 ? (
          <div className="admin-empty">
            <Flower2 aria-hidden="true" size={30} />
            <p>{hasActiveFilters ? t('noMatchingOrders') : t('noOrders')}</p>
            {hasActiveFilters ? (
              <Button onClick={clearFilters} type="button" variant="outline">
                {t('clearOrderFilters')}
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="orders-table-wrap">
            <Table className="orders-table orders-list-table">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('requestReference')}</TableHead>
                  <TableHead>{t('taskOwner')}</TableHead>
                  <TableHead>{t('lineName')}</TableHead>
                  <TableHead>{t('flowerTypeAndSize')}</TableHead>
                  <TableHead>{t('deliveryMethod')}</TableHead>
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
                        aria-label={`${t('openOrder')} ${order.requestReference}`}
                      >
                        {order.requestReference}
                      </Link>
                    </TableCell>
                    <TableCell data-label={t('taskOwner')}>
                      <OrderOwnerBadge owner={order.taskOwner} />
                    </TableCell>
                    <TableCell data-label={t('lineName')}>
                      <strong>{order.socialContact}</strong>
                      {order.phone ? <small>{order.phone}</small> : null}
                    </TableCell>
                    <TableCell data-label={t('flowerTypeAndSize')}>
                      {order.productNameSnapshot}
                    </TableCell>
                    <TableCell data-label={t('deliveryMethod')}>
                      <DeliveryBadge method={order.deliveryMethod} />
                    </TableCell>
                    <TableCell data-label={t('requiredDate')}>
                      {formatRequiredDate(order.requiredDate, locale)}
                    </TableCell>
                    <TableCell data-label={t('orderValue')}>
                      {formatOrderValue(order.orderValueThb) ??
                        t('valuePending')}
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
