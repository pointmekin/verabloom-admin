import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Pencil, Plus, Receipt, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { AdminHeader } from '#/components/admin-header'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { Textarea } from '#/components/ui/textarea'
import { useToast } from '#/components/ui/toast'
import { useLocale } from '#/lib/i18n'
import type { MessageKey } from '#/lib/i18n'
import { formatThb } from '#/lib/money'
import {
  addAdminExpenseFn,
  deleteAdminExpenseFn,
  expenseInputSchema,
  listAdminExpensesFn,
  updateAdminExpenseFn,
} from '#/server/admin-expense'
import type { AdminExpensePayer } from '#/server/admin-expense'
import { getPendingOrderCountFn } from '#/server/admin-order'
import type { ExpenseRecord } from '#/server/expense-store.server'
import { getRequiredAdminFn } from '#/server/auth'

export const Route = createFileRoute('/admin/expenses/')({
  beforeLoad: () => getRequiredAdminFn(),
  loader: async () => {
    const [expenses, pendingCount] = await Promise.all([
      listAdminExpensesFn(),
      getPendingOrderCountFn(),
    ])
    return { expenses, pendingCount }
  },
  component: AdminExpensesPage,
})

function bangkokToday() {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

type ExpenseField =
  | 'description'
  | 'payer'
  | 'totalAmountThb'
  | 'expenseDate'
  | 'quantity'
  | 'note'

const payerLabels: Record<AdminExpensePayer, MessageKey> = {
  chompooh: 'payer_chompooh',
  meen: 'payer_meen',
  kan: 'payer_kan',
}

function fieldErrorMessage(
  field: ExpenseField,
  descriptionValue: string,
  translate: (key: MessageKey) => string,
) {
  switch (field) {
    case 'description':
      return descriptionValue.trim()
        ? translate('checkForm')
        : translate('requiredField')
    case 'payer':
      return translate('invalidPayer')
    case 'totalAmountThb':
      return translate('invalidExpenseAmount')
    case 'expenseDate':
      return translate('invalidDate')
    case 'quantity':
      return translate('invalidQuantity')
    case 'note':
      return translate('checkForm')
  }
}

function AdminExpensesPage() {
  const { t } = useLocale()
  const { toast } = useToast()
  const router = useRouter()
  const { expenses, pendingCount } = Route.useLoaderData()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  const [payer, setPayer] = useState<AdminExpensePayer>('chompooh')
  const [amount, setAmount] = useState('')
  const [expenseDate, setExpenseDate] = useState('')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<ExpenseField, string>>
  >({})
  const [formError, setFormError] = useState<MessageKey | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(
    null,
  )

  function openAdd() {
    setEditingId(null)
    setDescription('')
    setPayer('chompooh')
    setAmount('')
    setExpenseDate(bangkokToday())
    setQuantity('')
    setNote('')
    setFieldErrors({})
    setFormError(null)
    setDialogOpen(true)
  }

  function openEdit(record: ExpenseRecord) {
    setEditingId(record.id)
    setDescription(record.description)
    setPayer(record.payer)
    setAmount(record.totalAmountThb)
    setExpenseDate(record.expenseDate)
    setQuantity(record.quantity === null ? '' : String(record.quantity))
    setNote(record.note ?? '')
    setFieldErrors({})
    setFormError(null)
    setDialogOpen(true)
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const parsed = expenseInputSchema.safeParse({
      description,
      payer,
      totalAmountThb: amount,
      expenseDate,
      quantity,
      note,
    })
    if (!parsed.success) {
      const next: Partial<Record<ExpenseField, string>> = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string' && Object.hasOwn(next, field) === false) {
          next[field as ExpenseField] = fieldErrorMessage(
            field as ExpenseField,
            field === 'description' ? description : '',
            t,
          )
        }
      }
      setFieldErrors(next)
      return
    }
    setSaving(true)
    try {
      if (editingId === null) {
        await addAdminExpenseFn({ data: parsed.data })
        toast({ title: t('expenseSaved'), kind: 'success' })
      } else {
        await updateAdminExpenseFn({ data: { id: editingId, ...parsed.data } })
        toast({ title: t('expenseSaved'), kind: 'success' })
      }
      setDialogOpen(false)
      await router.invalidate()
    } catch {
      setFormError('saveError')
      toast({ title: t('saveError'), kind: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: number) {
    setSaving(true)
    try {
      await deleteAdminExpenseFn({ data: { id } })
      toast({ title: t('expenseDeleted'), kind: 'success' })
      setConfirmingDeleteId(null)
      await router.invalidate()
    } catch {
      setFormError('saveError')
      toast({ title: t('saveError'), kind: 'error' })
      setConfirmingDeleteId(null)
    } finally {
      setSaving(false)
    }
  }

  const confirmingDelete = expenses.find(
    (record) => record.id === confirmingDeleteId,
  )

  return (
    <div className="admin-shell">
      <AdminHeader pendingCount={pendingCount} />
      <main className="admin-main">
        <div className="admin-page-heading">
          <div>
            <p className="eyebrow">{t('adminProtected')}</p>
            <h1>{t('expenses')}</h1>
          </div>
          <Button className="primary-button compact-button" onClick={openAdd}>
            <Plus aria-hidden="true" size={16} />
            {t('addExpense')}
          </Button>
        </div>

        {!dialogOpen && formError ? (
          <p className="form-error" role="alert">
            {t(formError)}
          </p>
        ) : null}

        {expenses.length === 0 ? (
          <div className="admin-empty">
            <Receipt aria-hidden="true" size={30} />
            <p>{t('noExpenses')}</p>
          </div>
        ) : (
          <div className="orders-table-wrap">
            <Table className="orders-table">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('expenseDescription')}</TableHead>
                  <TableHead>{t('expensePayer')}</TableHead>
                  <TableHead>{t('expenseAmount')}</TableHead>
                  <TableHead>{t('expenseDate')}</TableHead>
                  <TableHead>{t('quantity')}</TableHead>
                  <TableHead>{t('manage')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell data-label={t('expenseDescription')}>
                      <strong>{record.description}</strong>
                      {record.note ? <small>{record.note}</small> : null}
                    </TableCell>
                    <TableCell data-label={t('expensePayer')}>
                      <Badge variant="outline">
                        {t(payerLabels[record.payer])}
                      </Badge>
                    </TableCell>
                    <TableCell data-label={t('expenseAmount')}>
                      {formatThb(record.totalAmountThb)}
                    </TableCell>
                    <TableCell data-label={t('expenseDate')}>
                      {record.expenseDate}
                    </TableCell>
                    <TableCell data-label={t('quantity')}>
                      {record.quantity ?? '—'}
                    </TableCell>
                    <TableCell data-label={t('manage')}>
                      <div className="payment-item-actions">
                        <Button
                          aria-label={t('editExpense')}
                          disabled={saving}
                          onClick={() => openEdit(record)}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          <Pencil aria-hidden="true" size={14} />
                          {t('editExpense')}
                        </Button>
                        <Button
                          aria-label={t('removeExpense')}
                          disabled={saving}
                          onClick={() => setConfirmingDeleteId(record.id)}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          <Trash2 aria-hidden="true" size={14} />
                          {t('removeExpense')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Drawer
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          snapPoints={['560px', 1]}
        >
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>
                {editingId === null ? t('addExpense') : t('editExpense')}
              </DrawerTitle>
              <DrawerDescription>
                {t('expenseDialogDescription')}
              </DrawerDescription>
            </DrawerHeader>
            <form onSubmit={submit} noValidate>
              <div className="form-field">
                <Label htmlFor="expense-description">
                  {t('expenseDescription')}
                </Label>
                <Input
                  id="expense-description"
                  aria-invalid={Boolean(fieldErrors.description)}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
                {fieldErrors.description ? (
                  <p className="field-error" role="alert">
                    {fieldErrors.description}
                  </p>
                ) : null}
              </div>
              <div className="form-field">
                <Label htmlFor="expense-payer">{t('expensePayer')}</Label>
                <Select
                  id="expense-payer"
                  aria-invalid={Boolean(fieldErrors.payer)}
                  value={payer}
                  onValueChange={(value) =>
                    setPayer(value as AdminExpensePayer)
                  }
                >
                  <SelectItem value="chompooh">
                    {t('payer_chompooh')}
                  </SelectItem>
                  <SelectItem value="meen">{t('payer_meen')}</SelectItem>
                  <SelectItem value="kan">{t('payer_kan')}</SelectItem>
                </Select>
                {fieldErrors.payer ? (
                  <p className="field-error" role="alert">
                    {fieldErrors.payer}
                  </p>
                ) : null}
              </div>
              <div className="form-field">
                <Label htmlFor="expense-amount">{t('expenseAmount')}</Label>
                <Input
                  id="expense-amount"
                  aria-invalid={Boolean(fieldErrors.totalAmountThb)}
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
                {fieldErrors.totalAmountThb ? (
                  <p className="field-error" role="alert">
                    {fieldErrors.totalAmountThb}
                  </p>
                ) : null}
              </div>
              <div className="form-field">
                <Label htmlFor="expense-date">{t('expenseDate')}</Label>
                <Input
                  id="expense-date"
                  aria-invalid={Boolean(fieldErrors.expenseDate)}
                  type="date"
                  value={expenseDate}
                  onChange={(event) => setExpenseDate(event.target.value)}
                />
                {fieldErrors.expenseDate ? (
                  <p className="field-error" role="alert">
                    {fieldErrors.expenseDate}
                  </p>
                ) : null}
              </div>
              <div className="form-field">
                <Label htmlFor="expense-quantity">{t('expenseQuantity')}</Label>
                <Input
                  id="expense-quantity"
                  aria-invalid={Boolean(fieldErrors.quantity)}
                  inputMode="numeric"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                />
                <p className="field-hint">{t('expenseQuantityHint')}</p>
                {fieldErrors.quantity ? (
                  <p className="field-error" role="alert">
                    {fieldErrors.quantity}
                  </p>
                ) : null}
              </div>
              <div className="form-field">
                <Label htmlFor="expense-note">{t('expenseNote')}</Label>
                <Textarea
                  id="expense-note"
                  aria-invalid={Boolean(fieldErrors.note)}
                  rows={2}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <p className="field-hint">{t('richTextHint')}</p>
                {fieldErrors.note ? (
                  <p className="field-error" role="alert">
                    {fieldErrors.note}
                  </p>
                ) : null}
              </div>
              {formError ? (
                <p className="field-error" role="alert">
                  {t(formError)}
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
              <DrawerTitle>{t('confirmRemoveExpense')}</DrawerTitle>
              <DrawerDescription>
                {confirmingDelete
                  ? `${confirmingDelete.description} · ${formatThb(confirmingDelete.totalAmountThb)} — ${t('removeExpenseDescription')}`
                  : t('removeExpenseDescription')}
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button type="button" variant="outline">
                  {t('keepExpense')}
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
                {t('removeExpense')}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </main>
    </div>
  )
}
