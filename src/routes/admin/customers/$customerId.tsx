import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { AdminHeader } from '#/components/admin-header'
import { Alert, AlertDescription } from '#/components/ui/alert'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '#/components/ui/drawer'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Select, SelectItem } from '#/components/ui/select'
import { Textarea } from '#/components/ui/textarea'
import { useToast } from '#/components/ui/toast'
import { useLocale } from '#/lib/i18n'
import type { MessageKey } from '#/lib/i18n'
import {
  deleteAdminCustomerFn,
  customerInputSchema,
  getAdminCustomerFn,
  saveAdminCustomerFn,
} from '#/server/admin-customer'
import { getPendingOrderCountFn } from '#/server/admin-order'
import { getRequiredAdminFn } from '#/server/auth'

function statusLabel(status: string, t: (key: MessageKey) => string) {
  return t(`status_${status}` as MessageKey)
}

export const Route = createFileRoute('/admin/customers/$customerId')({
  beforeLoad: () => getRequiredAdminFn(),
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
  const { toast } = useToast()
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
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<'name' | 'socialContact', string>>
  >({})
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setFieldErrors({})
    try {
      const parsed = customerInputSchema.safeParse({
        id: customer?.id,
        name,
        socialChannel,
        socialContact,
        phone,
        defaultAddress,
      })
      if (!parsed.success) {
        const next: Partial<Record<'name' | 'socialContact', string>> = {}
        for (const issue of parsed.error.issues) {
          const field = issue.path[0]
          if ((field === 'name' || field === 'socialContact') && !next[field]) {
            next[field] = t('requiredField')
          }
        }
        setFieldErrors(next)
        setError(t('checkForm'))
        return
      }
      const saved = await saveAdminCustomerFn({ data: parsed.data })
      toast({ title: t('customerSaved'), kind: 'success' })
      await navigate({
        to: '/admin/customers/$customerId',
        params: { customerId: String(saved.id) },
        replace: true,
      })
    } catch {
      setError(t('saveError'))
      toast({ title: t('saveError'), kind: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!customer) return
    setSaving(true)
    try {
      await deleteAdminCustomerFn({ data: { id: customer.id } })
      toast({ title: t('customerDeleted'), kind: 'success' })
      await navigate({ to: '/admin/customers' })
    } catch (cause) {
      const message =
        cause instanceof Error && cause.message === 'Customer has orders'
          ? t('customerHasOrders')
          : t('saveError')
      setError(message)
      toast({ title: message, kind: 'error' })
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
                aria-invalid={Boolean(fieldErrors.name)}
              />
              {fieldErrors.name ? (
                <p className="field-error" role="alert">
                  {fieldErrors.name}
                </p>
              ) : null}
            </div>
            <div className="editor-columns">
              <div className="form-field">
                <Label htmlFor="customer-channel">{t('socialChannel')}</Label>
                <Select
                  id="customer-channel"
                  value={socialChannel}
                  onValueChange={(value) =>
                    setSocialChannel(value as typeof socialChannel)
                  }
                >
                  <SelectItem value="line">LINE</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </Select>
              </div>
              <div className="form-field">
                <Label htmlFor="customer-contact">{t('socialContact')}</Label>
                <Input
                  id="customer-contact"
                  value={socialContact}
                  onChange={(event) => setSocialContact(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.socialContact)}
                />
                {fieldErrors.socialContact ? (
                  <p className="field-error" role="alert">
                    {fieldErrors.socialContact}
                  </p>
                ) : null}
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
        <Drawer
          open={confirmingDelete}
          onOpenChange={setConfirmingDelete}
          snapPoints={['240px', 1]}
        >
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t('confirmDeleteCustomer')}</DrawerTitle>
              <DrawerDescription>
                {t('deleteCustomerDescription')}
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button type="button" variant="outline">
                  {t('keepCustomer')}
                </Button>
              </DrawerClose>
              <Button
                type="button"
                variant="destructive"
                disabled={saving}
                onClick={remove}
              >
                {t('deleteCustomer')}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
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
