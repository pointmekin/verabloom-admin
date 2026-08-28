import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { Flower2, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'

import { AdminHeader } from '#/components/admin-header'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
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
import { listAdminCustomersFn } from '#/server/admin-customer'
import { getPendingOrderCountFn } from '#/server/admin-order'
import { requireAdmin } from '#/lib/admin-guard'

function channelLabel(channel: string, t: (key: MessageKey) => string) {
  return t(channel as MessageKey)
}

const customerSearchSchema = z.object({
  search: z.string().optional().default(''),
})

export const Route = createFileRoute('/admin/customers/')({
  beforeLoad: () => requireAdmin(),
  validateSearch: customerSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const [customers, pendingCount] = await Promise.all([
      listAdminCustomersFn({ data: deps }),
      getPendingOrderCountFn(),
    ])
    return { customers, pendingCount }
  },
  component: AdminCustomersPage,
})

function AdminCustomersPage() {
  const { t } = useLocale()
  const router = useRouter()
  const { customers, pendingCount } = Route.useLoaderData()
  const search = Route.useSearch()
  const [query, setQuery] = useState(search.search)

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void router.navigate({
      to: '/admin/customers',
      search: { search: query.trim() },
    })
  }

  return (
    <div className="admin-shell">
      <AdminHeader pendingCount={pendingCount} />
      <main className="admin-main orders-admin-main">
        <div className="admin-page-heading">
          <div>
            <p className="eyebrow">{t('adminProtected')}</p>
            <h1>{t('customers')}</h1>
          </div>
          <Button asChild className="primary-button compact-button">
            <Link
              to="/admin/customers/$customerId"
              params={{ customerId: 'new' }}
            >
              <Plus size={16} />
              {t('createCustomer')}
            </Link>
          </Button>
        </div>
        <form className="orders-search customer-search" onSubmit={submit}>
          <Search aria-hidden="true" size={16} />
          <Input
            aria-label={t('searchCustomers')}
            placeholder={t('searchCustomers')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button size="sm" type="submit">
            {t('search')}
          </Button>
        </form>
        {customers.length === 0 ? (
          <div className="admin-empty">
            <Flower2 aria-hidden="true" size={30} />
            <p>{t('noCustomers')}</p>
          </div>
        ) : (
          <div className="orders-table-wrap">
            <Table className="orders-table">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('customerName')}</TableHead>
                  <TableHead>{t('socialChannel')}</TableHead>
                  <TableHead>{t('socialContact')}</TableHead>
                  <TableHead>{t('phone')}</TableHead>
                  <TableHead>{t('defaultAddress')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell data-label={t('customerName')}>
                      <Link
                        className="text-link"
                        to="/admin/customers/$customerId"
                        params={{ customerId: String(customer.id) }}
                      >
                        {customer.name}
                      </Link>
                    </TableCell>
                    <TableCell data-label={t('socialChannel')}>
                      {channelLabel(customer.socialChannel, t)}
                    </TableCell>
                    <TableCell data-label={t('socialContact')}>
                      {customer.socialContact}
                    </TableCell>
                    <TableCell data-label={t('phone')}>
                      {customer.phone ?? '—'}
                    </TableCell>
                    <TableCell data-label={t('defaultAddress')}>
                      {customer.defaultAddress ?? '—'}
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
