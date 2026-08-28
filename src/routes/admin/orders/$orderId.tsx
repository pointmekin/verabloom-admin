import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Save, Trash2, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { z } from 'zod'

import { AdminHeader } from '#/components/admin-header'
import { AdminPaymentsSection } from '#/components/admin-payments'
import { OrderOwnerBadge } from '#/components/order-owner-badge'
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
import { requireAdmin } from '#/lib/admin-guard'
import { TEAM_MEMBERS, teamMemberAccentClass } from '#/lib/team-members'
import type { TeamMember } from '#/lib/team-members'
import { useLocale } from '#/lib/i18n'
import type { MessageKey } from '#/lib/i18n'
import type { AdminOrderStatus } from '#/server/admin-order'
import {
  createAdminOrderFn,
  deleteAdminOrderFn,
  directOrderSchema,
  getAdminOrderFn,
  getPendingOrderCountFn,
  orderUpdateSchema,
  saveAdminOrderFn,
  updateAdminOrderStatusFn,
  uploadAdminOrderImageFn,
} from '#/server/admin-order'
import { listOrderPaymentsFn } from '#/server/admin-payment'

export const Route = createFileRoute('/admin/orders/$orderId')({
  beforeLoad: () => requireAdmin(),
  loader: async ({ params }) => {
    const [order, pendingCount, payments] = await Promise.all([
      params.orderId === 'new'
        ? Promise.resolve(null)
        : getAdminOrderFn({ data: { id: Number(params.orderId) } }),
      getPendingOrderCountFn(),
      params.orderId === 'new'
        ? Promise.resolve([])
        : listOrderPaymentsFn({ data: { orderId: Number(params.orderId) } }),
    ])
    return { order, pendingCount, payments }
  },
  component: AdminOrderEditor,
})

const ORDER_FIELDS = [
  'taskOwner',
  'productNameSnapshot',
  'socialContact',
  'phone',
  'requestDetails',
  'deliveryMethod',
  'orderAddress',
  'requiredDate',
  'orderValueThb',
] as const

type OrderField = (typeof ORDER_FIELDS)[number]

const ORDER_FIELD_CONTROL_IDS: Record<OrderField, string> = {
  taskOwner: 'order-owner',
  productNameSnapshot: 'order-flower-type',
  socialContact: 'order-line-name',
  phone: 'order-phone',
  requestDetails: 'order-details',
  deliveryMethod: 'order-delivery',
  orderAddress: 'order-address',
  requiredDate: 'order-date',
  orderValueThb: 'order-value',
}

function isOrderField(value: unknown): value is OrderField {
  return ORDER_FIELDS.includes(value as OrderField)
}

function focusField(field: OrderField | undefined) {
  if (!field) return
  const control = document.getElementById(ORDER_FIELD_CONTROL_IDS[field])
  control?.scrollIntoView({ block: 'center' })
  control?.focus()
}

function orderFieldMessage(
  field: OrderField,
  translate: (key: MessageKey) => string,
) {
  switch (field) {
    case 'taskOwner':
      return translate('taskOwnerRequired')
    case 'productNameSnapshot':
    case 'socialContact':
      return translate('requiredField')
    case 'requiredDate':
      return translate('invalidDate')
    case 'orderValueThb':
      return translate('invalidOrderValue')
    default:
      return translate('checkForm')
  }
}

function statusLabel(
  status: AdminOrderStatus,
  translate: (key: MessageKey) => string,
) {
  return translate(`status_${status}` as MessageKey)
}
async function fileToBase64(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function AdminOrderEditor() {
  const { t } = useLocale()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { order, pendingCount, payments } = Route.useLoaderData()
  const isNew = Route.useParams().orderId === 'new'

  const [productNameSnapshot, setProductNameSnapshot] = useState(
    order?.productNameSnapshot ?? '',
  )
  const [socialContact, setSocialContact] = useState(order?.socialContact ?? '')
  const [phone, setPhone] = useState(order?.phone ?? '')
  const [requestDetails, setRequestDetails] = useState(
    order?.requestDetails ?? '',
  )
  const [deliveryMethod, setDeliveryMethod] = useState<
    'postal' | 'messenger' | 'collection'
  >(order?.deliveryMethod ?? 'messenger')
  const [orderAddress, setOrderAddress] = useState(order?.orderAddress ?? '')
  const [requiredDate, setRequiredDate] = useState(order?.requiredDate ?? '')
  const [orderValueThb, setOrderValueThb] = useState(order?.orderValueThb ?? '')
  const [taskOwner, setTaskOwner] = useState<TeamMember | null>(
    order?.taskOwner ?? null,
  )
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [status, setStatus] = useState<AdminOrderStatus>(
    order?.status ?? 'pending_review',
  )
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<OrderField, string>>
  >({})
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  useEffect(() => {
    setStatus(order?.status ?? 'pending_review')
  }, [order?.id, order?.status])

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

  function reportIssues(issues: readonly z.core.$ZodIssue[]) {
    const next: Partial<Record<OrderField, string>> = {}
    for (const issue of issues) {
      const field = issue.path[0]
      if (!isOrderField(field) || next[field]) continue
      next[field] = orderFieldMessage(field, t)
    }
    console.log('reportIssues', issues, next)
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
      const input = {
        productNameSnapshot,
        taskOwner,
        socialContact,
        phone,
        requestDetails,
        deliveryMethod,
        orderAddress,
        requiredDate,
        orderValueThb,
      }
      const parsed = (isNew ? directOrderSchema : orderUpdateSchema).safeParse(
        input,
      )
      if (!parsed.success) {
        reportIssues(parsed.error.issues)
        return
      }
      let savedOrderId: number
      if (isNew) {
        const saved = await createAdminOrderFn({ data: parsed.data })
        savedOrderId = saved.id
      } else {
        await saveAdminOrderFn({ data: { id: order!.id, ...parsed.data } })
        savedOrderId = order!.id
      }
      if (imageFile) {
        await uploadAdminOrderImageFn({
          data: {
            id: savedOrderId,
            mimeType: imageFile.type,
            base64: await fileToBase64(imageFile),
          },
        })
      }
      toast({ title: t('orderSaved'), kind: 'success' })
      if (isNew) {
        await navigate({
          to: '/admin/orders/$orderId',
          params: { orderId: String(savedOrderId) },
        })
      } else {
        await navigate({
          to: '/admin/orders/$orderId',
          params: { orderId: String(savedOrderId) },
          replace: true,
        })
      }
    } catch {
      setError(t('saveError'))
      toast({ title: t('saveError'), kind: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function saveStatus() {
    if (!order || status === order.status) return
    setStatusError(null)
    setStatusSaving(true)
    try {
      await updateAdminOrderStatusFn({
        data: { id: order.id, status },
      })
      toast({ title: t('statusSaved'), kind: 'success' })
      await navigate({
        to: '/admin/orders/$orderId',
        params: { orderId: String(order.id) },
        replace: true,
      })
    } catch (cause) {
      const message =
        cause instanceof Error &&
        cause.message.includes('Confirmed orders require')
          ? t('confirmedValueRequired')
          : t('saveError')
      setStatusError(message)
      toast({ title: message, kind: 'error' })
    } finally {
      setStatusSaving(false)
    }
  }

  async function remove() {
    if (!order) return
    setSaving(true)
    try {
      await deleteAdminOrderFn({ data: { id: order.id } })
      toast({ title: t('orderDeleted'), kind: 'success' })
      await navigate({ to: '/admin/orders' })
    } catch {
      setError(t('saveError'))
      toast({ title: t('saveError'), kind: 'error' })
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
            <h1>{isNew ? t('createOrder') : order!.requestReference}</h1>
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

        {order ? (
          <Card
            aria-labelledby="order-status-heading"
            className="order-status-card"
          >
            <div className="order-status-card-heading">
              <div>
                <p className="order-status-kicker">{t('orderStatus')}</p>
                <h2 id="order-status-heading">
                  {statusLabel(order.status, t)}
                </h2>
              </div>
              <Badge
                className="order-status-badge"
                data-status={order.status}
                variant="outline"
              >
                {statusLabel(order.status, t)}
              </Badge>
            </div>
            <div className="order-status-controls">
              <div className="form-field">
                <Label htmlFor="order-status">{t('orderStatus')}</Label>
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
                  <SelectItem value="completed">
                    {t('status_completed')}
                  </SelectItem>
                  <SelectItem value="cancelled">
                    {t('status_cancelled')}
                  </SelectItem>
                </Select>
              </div>
              <Button
                className="order-status-save"
                disabled={statusSaving || status === order.status}
                onClick={() => void saveStatus()}
                type="button"
              >
                {statusSaving ? t('saving') : t('saveStatus')}
              </Button>
            </div>
            {statusError ? (
              <p className="order-status-error" role="alert">
                {statusError}
              </p>
            ) : null}
          </Card>
        ) : null}

        <form className="product-editor-form" onSubmit={submit}>
          <Card className={`editor-card ${teamMemberAccentClass(taskOwner)}`}>
            <div className="editor-card-heading">
              <div>
                <h2>{t('taskOwner')}</h2>
                <OrderOwnerBadge owner={taskOwner} />
              </div>
            </div>
            <div className="form-field owner-field-accent">
              <Label htmlFor="order-owner">{t('taskOwner')}</Label>
              <Select
                id="order-owner"
                value={taskOwner ?? ''}
                onValueChange={(value) =>
                  setTaskOwner(value ? (value as TeamMember) : null)
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
              ) : null}
            </div>
          </Card>
          {error ? (
            <Alert className="form-error" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Card className="editor-card">
            <div className="editor-card-heading">
              <h2>{t('orderDetails')}</h2>
            </div>
            <div className="editor-columns">
              <div className="form-field">
                <Label htmlFor="order-line-name">{t('lineName')}</Label>
                <Input
                  id="order-line-name"
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
                <Label htmlFor="order-flower-type">
                  {t('flowerTypeAndSize')}
                </Label>
                <Input
                  id="order-flower-type"
                  value={productNameSnapshot}
                  onChange={(event) =>
                    setProductNameSnapshot(event.target.value)
                  }
                />
                {fieldErrors.productNameSnapshot ? (
                  <p className="field-error" role="alert">
                    {fieldErrors.productNameSnapshot}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="form-field">
              <Label htmlFor="order-details">{t('requestDetails')}</Label>
              <Textarea
                id="order-details"
                rows={5}
                value={requestDetails}
                onChange={(event) => setRequestDetails(event.target.value)}
              />
            </div>
            <div className="editor-columns">
              <div className="form-field">
                <Label htmlFor="order-delivery">{t('deliveryMethod')}</Label>
                <Select
                  id="order-delivery"
                  value={deliveryMethod}
                  onValueChange={(value) =>
                    setDeliveryMethod(
                      value as 'postal' | 'messenger' | 'collection',
                    )
                  }
                >
                  <SelectItem value="messenger">{t('messenger')}</SelectItem>
                  <SelectItem value="postal">{t('postal')}</SelectItem>
                  <SelectItem value="collection">{t('collection')}</SelectItem>
                </Select>
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
            <div className="form-field">
              <Label htmlFor="order-address">{t('optionalOrderAddress')}</Label>
              <Textarea
                id="order-address"
                rows={4}
                value={orderAddress}
                onChange={(event) => setOrderAddress(event.target.value)}
              />
            </div>
            <div className="editor-columns">
              <div className="form-field">
                <Label htmlFor="order-phone">{t('phone')}</Label>
                <Input
                  id="order-phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
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
                ) : null}
              </div>
            </div>
          </Card>
          <Card className="editor-card">
            <div className="editor-card-heading">
              <div>
                <h2>{t('orderReferenceImage')}</h2>
                <p>{t('orderReferenceImageHint')}</p>
              </div>
              <label className="upload-button">
                <Upload aria-hidden="true" size={15} />
                {t('uploadOrderImage')}
                <input
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  aria-label={t('uploadOrderImage')}
                  onChange={(event) => {
                    setImageFile(event.target.files?.[0] ?? null)
                    event.target.value = ''
                  }}
                  type="file"
                />
              </label>
            </div>
            {order?.referenceImageUrl ? (
              <div className="order-reference-image">
                <img
                  src={order.referenceImageUrl}
                  alt={t('orderReferenceImage')}
                />
              </div>
            ) : null}
            {imageFile ? (
              <div>
                <img
                  className="pending-image"
                  src={URL.createObjectURL(imageFile)}
                  alt={t('selectedImage')}
                />
                <p className="pending-files">
                  {t('selectedImage')}: {imageFile.name}
                </p>
              </div>
            ) : null}
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

        {order ? (
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
      </main>
    </div>
  )
}
