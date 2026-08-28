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
import { Card } from '#/components/ui/card'
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
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<number>>(
    () => new Set(),
  )
  const hasActiveFilters = Boolean(search.search || search.status)

  function toggleOrderDetails(orderId: number) {
    setExpandedOrderIds((current) => {
      const next = new Set(current)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

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
      <AdminHeader />
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
          <div className="orders-list">
            {orders.map((order) => {
              const isExpanded = expandedOrderIds.has(order.id)
              const detailsId = `order-details-${order.id}`

              return (
                <Card className="order-card" key={order.id}>
                  <div className="order-card-header">
                    <Link
                      className="order-card-link"
                      to="/admin/orders/$orderId"
                      params={{ orderId: String(order.id) }}
                      aria-label={`${t('openOrder')} ${order.id}`}
                    >
                      <span className="order-card-reference">#{order.id}</span>
                      <span className="order-card-contact">
                        <span className="order-card-label">
                          {t('lineName')}
                        </span>
                        <strong>{order.socialContact}</strong>
                        {order.phone ? <small>{order.phone}</small> : null}
                      </span>
                    </Link>
                    <Badge
                      className="order-card-status"
                      variant={
                        order.status === 'cancelled'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {statusLabel(order.status, t)}
                    </Badge>
                    <div className="order-card-summary">
                      <div>
                        <span className="order-card-label">
                          {t('requiredDate')}
                        </span>
                        <strong>
                          {formatRequiredDate(order.requiredDate, locale)}
                        </strong>
                      </div>
                      <div>
                        <span className="order-card-label">
                          {t('orderValue')}
                        </span>
                        <strong>
                          {formatOrderValue(order.orderValueThb) ??
                            t('valuePending')}
                        </strong>
                      </div>
                    </div>
                  </div>
                  <dl className="order-card-owner-field">
                    <dt className="order-card-label">{t('taskOwner')}</dt>
                    <dd
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                      }}
                    >
                      <OrderOwnerBadge owner={order.taskOwner} />
                      <Button
                        aria-controls={detailsId}
                        aria-expanded={isExpanded}
                        className="order-card-more"
                        onClick={() => toggleOrderDetails(order.id)}
                        type="button"
                        variant="ghost"
                      >
                        {isExpanded ? t('viewLess') : t('viewMore')}
                      </Button>
                    </dd>
                  </dl>
                  {isExpanded ? (
                    <dl className="order-card-fields" id={detailsId}>
                      <div className="order-card-field order-card-product">
                        <dt className="order-card-label">
                          {t('flowerTypeAndSize')}
                        </dt>
                        <dd className="order-card-value">
                          {order.productNameSnapshot}
                        </dd>
                      </div>
                      <div className="order-card-field order-card-request">
                        <dt className="order-card-label">
                          {t('requestDetails')}
                        </dt>
                        <dd className="order-card-copy">
                          {order.requestDetails || '—'}
                        </dd>
                      </div>
                      <div className="order-card-field order-card-address">
                        <dt className="order-card-label">
                          {t('optionalOrderAddress')}
                        </dt>
                        <dd className="order-card-copy">
                          {order.orderAddress || '—'}
                        </dd>
                      </div>
                      <div className="order-card-field order-card-delivery">
                        <dt className="order-card-label">
                          {t('deliveryMethod')}
                        </dt>
                        <dd>
                          <DeliveryBadge method={order.deliveryMethod} />
                        </dd>
                      </div>
                    </dl>
                  ) : null}
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
