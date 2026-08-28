import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Save, Trash2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import type { z } from 'zod'

import { AdminHeader } from '#/components/admin-header'
import { AdminPaymentsSection } from '#/components/admin-payments'
import { DeliveryBadge } from '#/components/delivery-badge'
import { OrderOwnerBadge } from '#/components/order-owner-badge'
import { Alert, AlertDescription } from '#/components/ui/alert'
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
import { TEAM_MEMBERS, teamMemberAccentClass } from '#/lib/team-members'
import type { TeamMember } from '#/lib/team-members'
import {
  createAdminOrderFn,
  deleteAdminOrderFn,
  getAdminOrderFn,
  saveAdminOrderFn,
  directOrderSchema,
  orderUpdateSchema,
  getPendingOrderCountFn,
} from '#/server/admin-order'
import { listAdminCatalogFn } from '#/server/catalog'
import {
  listAdminCustomersFn,
  saveAdminCustomerFn,
} from '#/server/admin-customer'
import { listOrderPaymentsFn } from '#/server/admin-payment'
import type { AdminOrderStatus } from '#/server/admin-order'

export const Route = createFileRoute('/admin/orders/$orderId')({
  beforeLoad: () =>
    import('#/server/auth').then(({ getRequiredAdminFn }) =>
      getRequiredAdminFn(),
    ),
  loader: async ({ params }) => {
    const [order, customers, catalog, pendingCount, payments] =
      await Promise.all([
        params.orderId === 'new'
          ? Promise.resolve(null)
          : getAdminOrderFn({ data: { id: Number(params.orderId) } }),
        listAdminCustomersFn({ data: {} }),
        listAdminCatalogFn(),
        getPendingOrderCountFn(),
        params.orderId === 'new'
          ? Promise.resolve([])
          : listOrderPaymentsFn({
              data: { orderId: Number(params.orderId) },
            }),
      ])
    return { order, customers, catalog, pendingCount, payments }
  },
  component: AdminOrderEditor,
})

const ORDER_FIELDS = [
  'productId',
  'quantity',
  'taskOwner',
  'customerName',
  'socialChannel',
  'socialContact',
  'phone',
  'requestDetails',
  'deliveryMethod',
  'recipientName',
  'recipientPhone',
  'orderAddress',
  'requiredDate',
  'status',
  'orderValueThb',
  'internalNote',
] as const

type OrderField = (typeof ORDER_FIELDS)[number]

function isOrderField(value: unknown): value is OrderField {
  return ORDER_FIELDS.includes(value as OrderField)
}

const ORDER_FIELD_CONTROL_IDS: Partial<Record<OrderField, string>> = {
  productId: 'order-product',
  quantity: 'order-quantity',
  taskOwner: 'order-owner',
  customerName: 'order-customer-name',
  socialChannel: 'order-channel',
  socialContact: 'order-contact',
  deliveryMethod: 'order-delivery',
  recipientName: 'order-recipient-name',
  recipientPhone: 'order-recipient-phone',
  orderAddress: 'order-address',
  requiredDate: 'order-date',
  status: 'order-status',
  orderValueThb: 'order-value',
}

function focusField(field: OrderField | undefined) {
  const id = field && ORDER_FIELD_CONTROL_IDS[field]
  if (!id) return
  const control = document.getElementById(id)
  control?.scrollIntoView({ block: 'center' })
  control?.focus()
}

function orderFieldMessage(
  field: OrderField,
  orderValue: string,
  translate: (key: MessageKey) => string,
) {
  switch (field) {
    case 'productId':
    case 'customerName':
    case 'socialContact':
      return translate('requiredField')
    case 'quantity':
      return translate('invalidQuantity')
    case 'taskOwner':
      return translate('taskOwnerRequired')
    case 'requiredDate':
      return translate('invalidDate')
    case 'recipientName':
    case 'recipientPhone':
      return translate('recipientRequired')
    case 'orderAddress':
      return translate('deliveryAddressRequired')
    case 'orderValueThb':
      return orderValue.trim()
        ? translate('invalidOrderValue')
        : translate('confirmedValueRequired')
    case 'status':
      return translate('directOrderStatus')
    default:
      return translate('checkForm')
  }
}

function AdminOrderEditor() {
  const { t } = useLocale()
  const { toast } = useToast()
  const navigate = useNavigate()
  const {
    order,
    customers: initialCustomers,
    catalog,
    pendingCount,
    payments,
  } = Route.useLoaderData()
  const isNew = Route.useParams().orderId === 'new'
  if (!isNew && !order) {
    return (
      <main className="admin-empty">
        <p>{t('noOrders')}</p>
        <Link className="text-link" to="/admin/orders">
          {t('orders')}
        </Link>
      </main>
    )
  }
  if (catalog.length === 0) {
    return (
      <main className="admin-empty">
        <p>{t('noProducts')}</p>
      </main>
    )
  }
  const initialProduct = catalog[0]
  const [productId, setProductId] = useState(
    String(order ? order.productId : initialProduct.id),
  )
  const [quantity, setQuantity] = useState(String(order ? order.quantity : 1))
  const [taskOwner, setTaskOwner] = useState<TeamMember | ''>(
    order?.taskOwner ?? '',
  )
  const [customerId, setCustomerId] = useState(
    String(order ? (order.customerId ?? '') : ''),
  )
  const [customerName, setCustomerName] = useState(order?.customerName ?? '')
  const [socialChannel, setSocialChannel] = useState(
    order?.socialChannel ?? 'line',
  )
  const [socialContact, setSocialContact] = useState(order?.socialContact ?? '')
  const [phone, setPhone] = useState(order?.phone ?? '')
  const [requestDetails, setRequestDetails] = useState(
    order?.requestDetails ?? '',
  )
  const [deliveryMethod, setDeliveryMethod] = useState(
    order?.deliveryMethod ?? 'collection',
  )
  const [recipientName, setRecipientName] = useState(order?.recipientName ?? '')
  const [recipientPhone, setRecipientPhone] = useState(
    order?.recipientPhone ?? '',
  )
  const [orderAddress, setOrderAddress] = useState(order?.orderAddress ?? '')
  const [requiredDate, setRequiredDate] = useState(order?.requiredDate ?? '')
  const [status, setStatus] = useState<AdminOrderStatus>(
    order?.status ?? 'pending_review',
  )
  const [orderValueThb, setOrderValueThb] = useState(order?.orderValueThb ?? '')
  const [internalNote, setInternalNote] = useState(order?.internalNote ?? '')
  const [customers, setCustomers] = useState(initialCustomers)
  const [customerSearch, setCustomerSearch] = useState('')
  const [creatingCustomer, setCreatingCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerChannel, setNewCustomerChannel] = useState<
    'line' | 'instagram' | 'tiktok'
  >('line')
  const [newCustomerContact, setNewCustomerContact] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [newCustomerAddress, setNewCustomerAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<OrderField, string>>
  >({})
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const filteredCustomers = customers.filter((item) => {
    const query = customerSearch.trim().toLocaleLowerCase()
    return (
      !query ||
      [item.name, item.socialContact, item.phone ?? ''].some((value) =>
        value.toLocaleLowerCase().includes(query),
      )
    )
  })

  function chooseCustomer(value: string) {
    setCustomerId(value)
    const selected = customers.find((item) => item.id === Number(value))
    if (!selected) return
    setCustomerName(selected.name)
    setSocialChannel(selected.socialChannel)
    setSocialContact(selected.socialContact)
    setPhone(selected.phone ?? '')
    if (isNew && deliveryMethod !== 'collection' && selected.defaultAddress) {
      setOrderAddress(selected.defaultAddress)
    }
  }

  function localizedError(cause: unknown) {
    const message = cause instanceof Error ? cause.message : ''
    const key: MessageKey =
      message === 'Address is required for delivery'
        ? 'deliveryAddressRequired'
        : message.includes('recipient details')
          ? 'recipientRequired'
          : message.includes('task owner')
            ? 'taskOwnerRequired'
            : message.includes('Confirmed orders require')
              ? 'confirmedValueRequired'
              : message.includes('valid Thai baht')
                ? 'invalidOrderValue'
                : message.includes('Quantity must')
                  ? 'invalidQuantity'
                  : message.includes('Direct orders must')
                    ? 'directOrderStatus'
                    : 'saveError'
    return t(key)
  }

  async function saveInlineCustomer() {
    const saved = await saveAdminCustomerFn({
      data: {
        name: newCustomerName,
        socialChannel: newCustomerChannel,
        socialContact: newCustomerContact,
        phone: newCustomerPhone,
        defaultAddress: newCustomerAddress,
      },
    })
    setCustomers((current) =>
      [...current, saved].sort((a, b) => a.name.localeCompare(b.name)),
    )
    chooseCustomer(String(saved.id))
    setCreatingCustomer(false)
    return saved
  }

  function reportIssues(issues: readonly z.core.$ZodIssue[]) {
    const next: Partial<Record<OrderField, string>> = {}
    for (const issue of issues) {
      const field = issue.path[0]
      if (!isOrderField(field) || next[field]) continue
      next[field] = orderFieldMessage(field, orderValueThb, t)
    }
    setFieldErrors(next)
    const firstField = ORDER_FIELDS.find((field) => next[field])
    setError(firstField ? next[firstField]! : t('checkForm'))
    focusField(firstField)
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setSaving(true)
    try {
      let effectiveCustomerId = customerId ? Number(customerId) : null
      let effectiveCustomerName = customerName
      let effectiveSocialChannel = socialChannel
      let effectiveSocialContact = socialContact
      let effectivePhone = phone
      if (creatingCustomer) {
        const saved = await saveInlineCustomer()
        effectiveCustomerId = saved.id
        effectiveCustomerName = saved.name
        effectiveSocialChannel = saved.socialChannel
        effectiveSocialContact = saved.socialContact
        effectivePhone = saved.phone ?? ''
      }
      const base = {
        productId: Number(productId),
        quantity: Number(quantity),
        taskOwner,
        customerId: effectiveCustomerId,
        customerName: effectiveCustomerName,
        socialChannel: effectiveSocialChannel,
        socialContact: effectiveSocialContact,
        phone: effectivePhone,
        requestDetails,
        deliveryMethod,
        recipientName,
        recipientPhone,
        orderAddress,
        requiredDate,
        status,
        orderValueThb,
        internalNote,
      }
      if (isNew) {
        const parsed = directOrderSchema.safeParse(base)
        if (!parsed.success) {
          reportIssues(parsed.error.issues)
          return
        }
        const saved = await createAdminOrderFn({ data: parsed.data })
        toast({ title: t('orderSaved'), kind: 'success' })
        await navigate({
          to: '/admin/orders/$orderId',
          params: { orderId: String(saved.id) },
        })
      } else {
        const parsed = orderUpdateSchema.safeParse(base)
        if (!parsed.success) {
          reportIssues(parsed.error.issues)
          return
        }
        await saveAdminOrderFn({ data: { id: order!.id, ...parsed.data } })
        toast({ title: t('orderSaved'), kind: 'success' })
        await navigate({
          to: '/admin/orders/$orderId',
          params: { orderId: String(order!.id) },
          replace: true,
        })
      }
    } catch (cause) {
      const message = localizedError(cause)
      setError(message)
      toast({ title: message, kind: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!order) return
    setSaving(true)
    try {
      await deleteAdminOrderFn({ data: { id: order.id } })
      toast({ title: t('orderDeleted'), kind: 'success' })
      await navigate({ to: '/admin/orders' })
    } catch (cause) {
      const message = localizedError(cause)
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
        <Link to="/admin/orders" className="back-link">
          <ArrowLeft aria-hidden="true" size={16} />
          {t('orders')}
        </Link>
        <div className="admin-page-heading editor-heading">
          <div>
            <p className="eyebrow">{t('adminProtected')}</p>
            <h1>{isNew ? t('createOrder') : order!.requestReference}</h1>
            <div className="order-heading-badges">
              <OrderOwnerBadge owner={taskOwner || null} size="large" />
              <DeliveryBadge method={deliveryMethod} size="large" />
            </div>
          </div>
          {order ? (
            <Button
              onClick={() => setConfirmingDelete(true)}
              variant="destructive"
              type="button"
            >
              <Trash2 size={16} />
              {t('deleteOrder')}
            </Button>
          ) : null}
        </div>
        <form className="product-editor-form" onSubmit={submit}>
          {error ? (
            <Alert className="form-error" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Card
            className={`editor-card ${teamMemberAccentClass(taskOwner || null)}`}
          >
            <div className="editor-card-heading">
              <h2>{t('taskOwner')}</h2>
              <OrderOwnerBadge owner={taskOwner || null} />
            </div>
            <div className="form-field owner-field-accent">
              <Label htmlFor="order-owner">{t('taskOwner')}</Label>
              <Select
                id="order-owner"
                value={taskOwner}
                onValueChange={(value) =>
                  setTaskOwner(value as TeamMember | '')
                }
              >
                <SelectItem value="">{t('unassigned')}</SelectItem>
                {TEAM_MEMBERS.map((member) => (
                  <SelectItem key={member} value={member}>
                    {t(`payer_${member}` as MessageKey)}
                  </SelectItem>
                ))}
              </Select>
              {fieldErrors.taskOwner ? (
                <p className="field-error" role="alert">
                  {fieldErrors.taskOwner}
                </p>
              ) : (
                <p className="field-hint">{t('taskOwnerRequired')}</p>
              )}
            </div>
          </Card>
          <Card className="editor-card">
            <div className="editor-card-heading">
              <h2>{t('selectedProduct')}</h2>
            </div>
            <div className="editor-columns">
              <div className="form-field">
                <Label htmlFor="order-product">{t('selectedProduct')}</Label>
                <Select
                  id="order-product"
                  value={productId}
                  onValueChange={setProductId}
                >
                  <SelectItem value="">{t('selectedProduct')}</SelectItem>
                  {catalog.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name}
                    </SelectItem>
                  ))}
                </Select>
                {fieldErrors.productId ? (
                  <p className="field-error" role="alert">
                    {fieldErrors.productId}
                  </p>
                ) : null}
              </div>
              <div className="form-field">
                <Label htmlFor="order-quantity">{t('quantity')}</Label>
                <Input
                  id="order-quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                />
                {fieldErrors.quantity ? (
                  <p className="field-error" role="alert">
                    {fieldErrors.quantity}
                  </p>
                ) : null}
              </div>
            </div>
            <Drawer
              open={confirmingDelete}
              onOpenChange={setConfirmingDelete}
              snapPoints={['240px', 1]}
            >
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>{t('confirmDeleteOrder')}</DrawerTitle>
                  <DrawerDescription>
                    {t('deleteOrderDescription')}
                  </DrawerDescription>
                </DrawerHeader>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button type="button" variant="outline">
                      {t('keepOrder')}
                    </Button>
                  </DrawerClose>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={saving}
                    onClick={remove}
                  >
                    {t('deleteOrder')}
                  </Button>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </Card>
          <Card className="editor-card">
            <div className="editor-card-heading">
              <h2>{t('customer')}</h2>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setCreatingCustomer((value) => !value)}
              >
                <UserPlus size={15} />
                {t('createCustomer')}
              </Button>
            </div>
            {creatingCustomer ? (
              <div className="inline-customer-card">
                <div className="form-field">
                  <Label htmlFor="new-customer-name">{t('customerName')}</Label>
                  <Input
                    id="new-customer-name"
                    value={newCustomerName}
                    onChange={(event) => setNewCustomerName(event.target.value)}
                  />
                </div>
                <div className="form-field">
                  <Label htmlFor="new-customer-channel">
                    {t('socialChannel')}
                  </Label>
                  <Select
                    id="new-customer-channel"
                    value={newCustomerChannel}
                    onValueChange={(value) =>
                      setNewCustomerChannel(value as typeof newCustomerChannel)
                    }
                  >
                    <SelectItem value="line">LINE</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </Select>
                </div>
                <div className="form-field">
                  <Label htmlFor="new-customer-contact">
                    {t('socialContact')}
                  </Label>
                  <Input
                    id="new-customer-contact"
                    value={newCustomerContact}
                    onChange={(event) =>
                      setNewCustomerContact(event.target.value)
                    }
                  />
                </div>
                <div className="form-field">
                  <Label htmlFor="new-customer-phone">{t('phone')}</Label>
                  <Input
                    id="new-customer-phone"
                    value={newCustomerPhone}
                    onChange={(event) =>
                      setNewCustomerPhone(event.target.value)
                    }
                  />
                </div>
                <div className="form-field">
                  <Label htmlFor="new-customer-address">
                    {t('defaultAddress')}
                  </Label>
                  <Textarea
                    id="new-customer-address"
                    value={newCustomerAddress}
                    onChange={(event) =>
                      setNewCustomerAddress(event.target.value)
                    }
                    rows={3}
                  />
                </div>
              </div>
            ) : null}
            <div className="form-field">
              <Label htmlFor="order-customer">{t('selectCustomer')}</Label>
              <Input
                aria-label={t('searchCustomerToLink')}
                placeholder={t('searchCustomerToLink')}
                value={customerSearch}
                onChange={(event) => setCustomerSearch(event.target.value)}
              />
              <Select
                id="order-customer"
                value={customerId}
                onValueChange={chooseCustomer}
              >
                <SelectItem value="">{t('noCustomerLinked')}</SelectItem>
                {filteredCustomers.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.name} · {item.socialContact}
                  </SelectItem>
                ))}
              </Select>
            </div>
            <div className="editor-columns">
              <div className="form-field">
                <Label htmlFor="order-customer-name">{t('customerName')}</Label>
                <Input
                  id="order-customer-name"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                />
                {fieldErrors.customerName ? (
                  <p className="field-error" role="alert">
                    {fieldErrors.customerName}
                  </p>
                ) : null}
              </div>
              <div className="form-field">
                <Label htmlFor="order-channel">{t('socialChannel')}</Label>
                <Select
                  id="order-channel"
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
            </div>
            <div className="editor-columns">
              <div className="form-field">
                <Label htmlFor="order-contact">{t('socialContact')}</Label>
                <Input
                  id="order-contact"
                  value={socialContact}
                  onChange={(event) => setSocialContact(event.target.value)}
                />
                {fieldErrors.socialContact ? (
                  <p className="field-error" role="alert">
                    {fieldErrors.socialContact}
                  </p>
                ) : null}
              </div>
              <div className="form-field">
                <Label htmlFor="order-phone">{t('phone')}</Label>
                <Input
                  id="order-phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
            </div>
          </Card>
          <Card className="editor-card">
            <div className="editor-columns">
              <div className="form-field">
                <Label htmlFor="order-status">{t('filterStatus')}</Label>
                <Select
                  id="order-status"
                  value={status}
                  onValueChange={(value) =>
                    setStatus(value as AdminOrderStatus)
                  }
                >
                  <SelectItem value="pending_review">
                    {t('status_pending_review')}
                  </SelectItem>
                  <SelectItem value="confirmed">
                    {t('status_confirmed')}
                  </SelectItem>
                  <SelectItem value="work_in_progress">
                    {t('status_work_in_progress')}
                  </SelectItem>
                  {isNew ? null : (
                    <SelectItem value="completed">
                      {t('status_completed')}
                    </SelectItem>
                  )}
                  {isNew ? null : (
                    <SelectItem value="cancelled">
                      {t('status_cancelled')}
                    </SelectItem>
                  )}
                </Select>
                {fieldErrors.status ? (
                  <p className="field-error" role="alert">
                    {fieldErrors.status}
                  </p>
                ) : null}
              </div>
              <div className="form-field">
                <Label htmlFor="order-value">{t('orderValue')}</Label>
                <Input
                  id="order-value"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={orderValueThb}
                  onChange={(event) => setOrderValueThb(event.target.value)}
                />
                {fieldErrors.orderValueThb ? (
                  <p className="field-error" role="alert">
                    {fieldErrors.orderValueThb}
                  </p>
                ) : (
                  <p className="field-hint">{t('orderValueHint')}</p>
                )}
              </div>
            </div>
            <div className="editor-columns">
              <div className="form-field">
                <Label htmlFor="order-delivery">{t('deliveryMethod')}</Label>
                <Select
                  id="order-delivery"
                  value={deliveryMethod}
                  onValueChange={(value) => {
                    const method = value as typeof deliveryMethod
                    setDeliveryMethod(method)
                    if (isNew && method !== 'collection' && customerId) {
                      const selected = customers.find(
                        (item) => item.id === Number(customerId),
                      )
                      if (selected?.defaultAddress)
                        setOrderAddress(selected.defaultAddress)
                    }
                  }}
                >
                  <SelectItem value="postal">{t('postal')}</SelectItem>
                  <SelectItem value="messenger">{t('messenger')}</SelectItem>
                  <SelectItem value="collection">{t('collection')}</SelectItem>
                </Select>
                <DeliveryBadge method={deliveryMethod} />
              </div>
              <div className="form-field">
                <Label htmlFor="order-date">{t('requiredDate')}</Label>
                <Input
                  id="order-date"
                  type="date"
                  value={requiredDate}
                  onChange={(event) => setRequiredDate(event.target.value)}
                />
                {fieldErrors.requiredDate ? (
                  <p className="field-error" role="alert">
                    {fieldErrors.requiredDate}
                  </p>
                ) : null}
              </div>
            </div>
            {deliveryMethod === 'messenger' ? (
              <div className="form-field">
                <Label htmlFor="order-address">{t('messengerDetails')}</Label>
                <Textarea
                  id="order-address"
                  rows={5}
                  value={orderAddress}
                  onChange={(event) => setOrderAddress(event.target.value)}
                />
                {fieldErrors.orderAddress ? (
                  <p className="field-error" role="alert">
                    {fieldErrors.orderAddress}
                  </p>
                ) : (
                  <p className="field-hint">{t('messengerDetailsHint')}</p>
                )}
              </div>
            ) : null}
            {deliveryMethod === 'postal' ? (
              <>
                <div className="editor-columns">
                  <div className="form-field">
                    <Label htmlFor="order-recipient-name">
                      {t('recipientName')}
                    </Label>
                    <Input
                      id="order-recipient-name"
                      value={recipientName}
                      onChange={(event) => setRecipientName(event.target.value)}
                    />
                    {fieldErrors.recipientName ? (
                      <p className="field-error" role="alert">
                        {fieldErrors.recipientName}
                      </p>
                    ) : null}
                  </div>
                  <div className="form-field">
                    <Label htmlFor="order-recipient-phone">
                      {t('recipientPhone')}
                    </Label>
                    <Input
                      id="order-recipient-phone"
                      value={recipientPhone}
                      onChange={(event) =>
                        setRecipientPhone(event.target.value)
                      }
                    />
                    {fieldErrors.recipientPhone ? (
                      <p className="field-error" role="alert">
                        {fieldErrors.recipientPhone}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="form-field">
                  <Label htmlFor="order-address">{t('orderAddress')}</Label>
                  <Textarea
                    id="order-address"
                    rows={4}
                    value={orderAddress}
                    onChange={(event) => setOrderAddress(event.target.value)}
                  />
                  {fieldErrors.orderAddress ? (
                    <p className="field-error" role="alert">
                      {fieldErrors.orderAddress}
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}
            <div className="form-field">
              <Label htmlFor="order-details">{t('requestDetails')}</Label>
              <Textarea
                id="order-details"
                rows={5}
                value={requestDetails}
                onChange={(event) => setRequestDetails(event.target.value)}
              />
              <p className="field-hint">{t('richTextHint')}</p>
            </div>
            <div className="form-field">
              <Label htmlFor="order-note">{t('internalNote')}</Label>
              <Textarea
                id="order-note"
                rows={4}
                value={internalNote}
                onChange={(event) => setInternalNote(event.target.value)}
              />
              <p className="field-hint">{t('richTextHint')}</p>
            </div>
          </Card>
          <div className="editor-footer">
            <Button asChild type="button" variant="ghost">
              <Link to="/admin/orders">{t('cancel')}</Link>
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
        {order && !isNew ? (
          <div className="payments-section">
            <AdminPaymentsSection
              cancelled={order.status === 'cancelled'}
              orderId={order.id}
              orderValueThb={order.orderValueThb}
              payments={payments}
              status={order.status}
            />
          </div>
        ) : null}
      </main>
    </div>
  )
}
