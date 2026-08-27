import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { AdminHeader } from '#/components/admin-header'
import { Alert, AlertDescription } from '#/components/ui/alert'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Select } from '#/components/ui/select'
import { Textarea } from '#/components/ui/textarea'
import { useLocale } from '#/lib/i18n'
import type { MessageKey } from '#/lib/i18n'
import {
  deleteAdminCustomerFn,
  getAdminCustomerFn,
  saveAdminCustomerFn,
} from '#/server/admin-customer'
import { getPendingOrderCountFn } from '#/server/admin-order'

function statusLabel(status: string, t: (key: MessageKey) => string) {
  return t(`status_${status}` as MessageKey)
}

export const Route = createFileRoute('/admin/customers/$customerId')({
  beforeLoad: () =>
    import('#/server/auth').then(({ getRequiredAdminFn }) =>
      getRequiredAdminFn(),
    ),
  loader: async ({ params }) => {
    const [data, pendingCount] = await Promise.all([
      params.customerId === 'new'
        ? Promise.resolve(null)
        : getAdminCustomerFn({ data: { id: Number(params.customerId) } }),
      getPendingOrderCountFn(),
    ])
    return { data, pendingCount }
  },
  component: AdminCustomerEditor,
})

function AdminCustomerEditor() {
  const { t } = useLocale()
  const navigate = useNavigate()
  const { data, pendingCount } = Route.useLoaderData()
  const customer = data?.customer ?? null
  const [name, setName] = useState(customer?.name ?? '')
  const [socialChannel, setSocialChannel] = useState(
    customer?.socialChannel ?? 'line',
  )
  const [socialContact, setSocialContact] = useState(
    customer?.socialContact ?? '',
  )
  const [phone, setPhone] = useState(customer?.phone ?? '')
  const [defaultAddress, setDefaultAddress] = useState(
    customer?.defaultAddress ?? '',
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const saved = await saveAdminCustomerFn({
        data: {
          id: customer?.id,
          name,
          socialChannel,
          socialContact,
          phone,
          defaultAddress,
        },
      })
      await navigate({
        to: '/admin/customers/$customerId',
        params: { customerId: String(saved.id) },
        replace: true,
      })
    } catch {
      setError(t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!customer) return
    setSaving(true)
    try {
      await deleteAdminCustomerFn({ data: { id: customer.id } })
      await navigate({ to: '/admin/customers' })
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message === 'Customer has orders'
          ? t('customerHasOrders')
          : t('saveError'),
      )
      setSaving(false)
    } finally {
      setConfirmingDelete(false)
    }
  }

  return (
    <div className="admin-shell">
      <AdminHeader pendingCount={pendingCount} />
      <main className="admin-main product-editor-main">
        <Link to="/admin/customers" className="back-link">
          <ArrowLeft size={16} />
          {t('customers')}
        </Link>
        <div className="admin-page-heading editor-heading">
          <div>
            <p className="eyebrow">{t('adminProtected')}</p>
            <h1>{customer?.name ?? t('createCustomer')}</h1>
          </div>
          {customer ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 size={16} />
              {t('deleteCustomer')}
            </Button>
          ) : null}
        </div>
        <form className="product-editor-form" onSubmit={submit}>
          {error ? (
            <Alert className="form-error" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Card className="editor-card">
            <div className="form-field">
              <Label htmlFor="customer-name">{t('customerName')}</Label>
              <Input
                id="customer-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="editor-columns">
              <div className="form-field">
                <Label htmlFor="customer-channel">{t('socialChannel')}</Label>
                <Select
                  id="customer-channel"
                  value={socialChannel}
                  onChange={(event) =>
                    setSocialChannel(event.target.value as typeof socialChannel)
                  }
                >
                  <option value="line">LINE</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                </Select>
              </div>
              <div className="form-field">
                <Label htmlFor="customer-contact">{t('socialContact')}</Label>
                <Input
                  id="customer-contact"
                  value={socialContact}
                  onChange={(event) => setSocialContact(event.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-field">
              <Label htmlFor="customer-phone">{t('phone')}</Label>
              <Input
                id="customer-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
            <div className="form-field">
              <Label htmlFor="customer-address">{t('defaultAddress')}</Label>
              <Textarea
                id="customer-address"
                rows={4}
                value={defaultAddress}
                onChange={(event) => setDefaultAddress(event.target.value)}
              />
            </div>
          </Card>
          <div className="editor-footer">
            <Button asChild type="button" variant="ghost">
              <Link to="/admin/customers">{t('cancel')}</Link>
            </Button>
            <Button
              className="primary-button compact-button"
              disabled={saving}
              type="submit"
            >
              <Save size={16} />
              {saving ? t('saving') : t('save')}
            </Button>
          </div>
        </form>
        <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('confirmDeleteCustomer')}</DialogTitle>
              <DialogDescription>
                {t('deleteCustomerDescription')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t('keepCustomer')}
                </Button>
              </DialogClose>
              <Button
                type="button"
                variant="destructive"
                disabled={saving}
                onClick={remove}
              >
                {t('deleteCustomer')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {customer ? (
          <Card className="editor-card customer-history">
            <div className="editor-card-heading">
              <h2>{t('orderHistory')}</h2>
              <Badge variant="secondary">{data?.orders.length ?? 0}</Badge>
            </div>
            {data?.orders.length ? (
              <div className="history-list">
                {data.orders.map((order) => (
                  <Link
                    className="history-row"
                    key={order.id}
                    to="/admin/orders/$orderId"
                    params={{ orderId: String(order.id) }}
                  >
                    <span>
                      <strong>{order.requestReference}</strong>
                      <small>
                        {order.productNameSnapshot} · {order.requiredDate}
                      </small>
                    </span>
                    <Badge>{statusLabel(order.status, t)}</Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="field-hint">{t('noOrders')}</p>
            )}
          </Card>
        ) : null}
      </main>
    </div>
  )
}
