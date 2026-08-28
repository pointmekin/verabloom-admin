import { useRouter } from '@tanstack/react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

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
import { formatThb, orderTotals } from '#/lib/money'
import { useLocale } from '#/lib/i18n'
import type { MessageKey } from '#/lib/i18n'
import type { AdminPaymentMethod } from '#/server/admin-payment'
import {
  addAdminPaymentFn,
  deleteAdminPaymentFn,
  paymentInputSchema,
  updateAdminPaymentFn,
} from '#/server/admin-payment'
import type { OrderStatus } from '#/server/order-store.server'
import type { PaymentRecord } from '#/server/payment-store.server'

type PaymentsSectionProps = {
  orderId: number
  status: OrderStatus
  orderValueThb: string | null
  cancelled: boolean
  payments: PaymentRecord[]
}

function bangkokToday() {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export function AdminPaymentsSection({
  orderId,
  status,
  orderValueThb,
  cancelled,
  payments,
}: PaymentsSectionProps) {
  const { t } = useLocale()
  const { toast } = useToast()
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [method, setMethod] = useState<AdminPaymentMethod>('bank_transfer')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(
    null,
  )

  const totals = orderTotals({ status, orderValueThb }, payments)

  const methodLabels: Record<AdminPaymentMethod, MessageKey> = {
    bank_transfer: 'method_bank_transfer',
    cash: 'method_cash',
    other: 'method_other',
  }

  function openAdd() {
    setEditingId(null)
    setAmount('')
    setPaymentDate(bangkokToday())
    setMethod('bank_transfer')
    setNote('')
    setError(null)
    setDialogOpen(true)
  }

  function openEdit(record: PaymentRecord) {
    setEditingId(record.id)
    setAmount(record.amountThb)
    setPaymentDate(record.paymentDate)
    setMethod(record.method)
    setNote(record.note ?? '')
    setError(null)
    setDialogOpen(true)
  }

  function localizedError(cause: unknown) {
    const message = cause instanceof Error ? cause.message : ''
    const key: MessageKey = message.includes('valid Thai baht')
      ? 'invalidPaymentAmount'
      : message.includes('valid payment date')
        ? 'invalidDate'
        : message.includes('payment method')
          ? 'checkForm'
          : 'saveError'
    return t(key)
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const parsed = paymentInputSchema.safeParse({
        amountThb: amount,
        paymentDate,
        method,
        note,
      })
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? t('checkForm'))
      }
      if (editingId === null) {
        await addAdminPaymentFn({ data: { orderId, ...parsed.data } })
        toast({ title: t('paymentSaved'), kind: 'success' })
      } else {
        await updateAdminPaymentFn({ data: { id: editingId, ...parsed.data } })
        toast({ title: t('paymentSaved'), kind: 'success' })
      }
      setDialogOpen(false)
      await router.invalidate()
    } catch (cause) {
      const message = localizedError(cause)
      setError(message)
      toast({ title: message, kind: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: number) {
    setSaving(true)
    try {
      await deleteAdminPaymentFn({ data: { id } })
      toast({ title: t('paymentDeleted'), kind: 'success' })
      setConfirmingDeleteId(null)
      await router.invalidate()
    } catch (cause) {
      const message = localizedError(cause)
      setError(message)
      toast({ title: message, kind: 'error' })
      setConfirmingDeleteId(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="editor-card">
      <div className="editor-card-heading">
        <h2>{t('payments')}</h2>
        <Button size="sm" variant="outline" type="button" onClick={openAdd}>
          <Plus size={15} />
          {t('addPayment')}
        </Button>
      </div>
      <div className="payments-summary">
        <div className="payments-summary-cell">
          <span className="payments-summary-label">{t('orderValueLabel')}</span>
          <strong>{orderValueThb ? formatThb(orderValueThb) : '—'}</strong>
        </div>
        <div className="payments-summary-cell">
          <span className="payments-summary-label">{t('totalReceived')}</span>
          <strong>{formatThb(totals.receivedThb)}</strong>
        </div>
        <div className="payments-summary-cell">
          <span className="payments-summary-label">
            {t('outstandingAmount')}
          </span>
          <strong>
            {formatThb(totals.outstandingThb)}
            {cancelled ? (
              <Badge className="payments-outstanding-badge" variant="secondary">
                {t('status_cancelled')}
              </Badge>
            ) : null}
          </strong>
        </div>
      </div>
      {cancelled ? (
        <p className="field-hint">{t('cancelledOutstandingHint')}</p>
      ) : null}
      {!dialogOpen && error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {payments.length === 0 ? (
        <p className="field-hint">{t('noPayments')}</p>
      ) : (
        <ul className="payments-list">
          {payments.map((record) => (
            <li key={record.id} className="payment-item">
              <div className="payment-item-main">
                <strong>{formatThb(record.amountThb)}</strong>
                <span>{record.paymentDate}</span>
                <Badge variant="outline">
                  {t(methodLabels[record.method])}
                </Badge>
              </div>
              {record.note ? (
                <p className="payment-note">{record.note}</p>
              ) : null}
              <div className="payment-item-actions">
                <Button
                  aria-label={t('editPayment')}
                  disabled={saving}
                  onClick={() => openEdit(record)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <Pencil size={14} />
                  {t('editPayment')}
                </Button>
                <Button
                  aria-label={t('removePayment')}
                  disabled={saving}
                  onClick={() => setConfirmingDeleteId(record.id)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 size={14} />
                  {t('removePayment')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Drawer
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        snapPoints={['420px', 1]}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {editingId === null ? t('addPayment') : t('editPayment')}
            </DrawerTitle>
            <DrawerDescription>{t('paymentDescription')}</DrawerDescription>
          </DrawerHeader>
          <form onSubmit={submit}>
            <div className="form-field">
              <Label htmlFor="payment-amount">{t('paymentAmount')}</Label>
              <Input
                id="payment-amount"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <div className="form-field">
              <Label htmlFor="payment-date">{t('paymentDate')}</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
              />
            </div>
            <div className="form-field">
              <Label htmlFor="payment-method">{t('paymentMethod')}</Label>
              <Select
                id="payment-method"
                value={method}
                onValueChange={(value) =>
                  setMethod(value as AdminPaymentMethod)
                }
              >
                <SelectItem value="bank_transfer">
                  {t('method_bank_transfer')}
                </SelectItem>
                <SelectItem value="cash">{t('method_cash')}</SelectItem>
                <SelectItem value="other">{t('method_other')}</SelectItem>
              </Select>
            </div>
            <div className="form-field">
              <Label htmlFor="payment-note">{t('paymentNote')}</Label>
              <Textarea
                id="payment-note"
                rows={2}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
              <p className="field-hint">{t('richTextHint')}</p>
            </div>
            {error ? (
              <p className="field-error" role="alert">
                {error}
              </p>
            ) : null}
            <DrawerFooter>
              <DrawerClose asChild>
                <Button type="button" variant="ghost">
                  {t('cancel')}
                </Button>
              </DrawerClose>
              <Button disabled={saving} type="submit">
                {saving ? t('saving') : t('save')}
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={confirmingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmingDeleteId(null)
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('confirmRemovePayment')}</DrawerTitle>
            <DrawerDescription>
              {t('removePaymentDescription')}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button type="button" variant="outline">
                {t('keepPayment')}
              </Button>
            </DrawerClose>
            <Button
              disabled={saving}
              onClick={() =>
                confirmingDeleteId !== null && remove(confirmingDeleteId)
              }
              type="button"
              variant="destructive"
            >
              {t('removePayment')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Card>
  )
}
