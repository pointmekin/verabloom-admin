import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, CalendarRange } from 'lucide-react'
import { useState } from 'react'

import { AdminHeader } from '#/components/admin-header'
import { OrderOwnerBadge } from '#/components/order-owner-badge'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Select, SelectItem } from '#/components/ui/select'
import { Textarea } from '#/components/ui/textarea'
import { useToast } from '#/components/ui/toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { bangkokTodayIso } from '#/lib/finance'
import { useLocale } from '#/lib/i18n'
import type { MessageKey } from '#/lib/i18n'
import { formatThb } from '#/lib/money'
import { teamMemberAccentClass } from '#/lib/team-members'
import {
  getAdminFinanceReportFn,
  reportingPeriodSchema,
} from '#/server/admin-finance'
import {
  addAdminPayoutFn,
  payoutInputSchema,
} from '#/server/admin-payout'
import type { AdminPayoutRecipient } from '#/server/admin-payout'
import { requireAdmin } from '#/lib/admin-guard'
import type { FinanceReport } from '#/server/finance-report.server'
import type { AdminExpensePayer } from '#/server/admin-expense'

export const Route = createFileRoute('/admin/finance')({
  beforeLoad: () => requireAdmin(),
  loader: async () => {
    const period = defaultReportingPeriod()
    const report = await getAdminFinanceReportFn({ data: period })
    return { report, start: period.start, end: period.end }
  },
  component: AdminFinancePage,
})

function defaultReportingPeriod() {
  const today = bangkokTodayIso()
  return { start: `${today.slice(0, 7)}-01`, end: today }
}

const payerLabels: Record<AdminExpensePayer, MessageKey> = {
  chompooh: 'payer_chompooh',
  meen: 'payer_meen',
  kan: 'payer_kan',
}

function AdminFinancePage() {
  const { t } = useLocale()
  const initial = Route.useLoaderData()
  const [start, setStart] = useState(initial.start)
  const [end, setEnd] = useState(initial.end)
  const [report, setReport] = useState<FinanceReport>(initial.report)
  const [periodError, setPeriodError] = useState<MessageKey | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [recipient, setRecipient] = useState<AdminPayoutRecipient>('chompooh')
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutDate, setPayoutDate] = useState(bangkokTodayIso())
  const [payoutNote, setPayoutNote] = useState('')
  const [payoutError, setPayoutError] = useState<MessageKey | null>(null)
  const [savingPayout, setSavingPayout] = useState(false)

  async function recordPayout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPayoutError(null)
    const parsed = payoutInputSchema.safeParse({
      recipient,
      amountThb: payoutAmount,
      payoutDate,
      note: payoutNote,
    })
    if (!parsed.success) {
      setPayoutError('checkForm')
      return
    }
    setSavingPayout(true)
    try {
      await addAdminPayoutFn({ data: parsed.data })
      const next = await getAdminFinanceReportFn({
        data: { start: report.start, end: report.end },
      })
      setReport(next)
      setPayoutAmount('')
      setPayoutNote('')
      toast({ title: t('payoutSaved'), kind: 'success' })
    } catch {
      setPayoutError('saveError')
      toast({ title: t('saveError'), kind: 'error' })
    } finally {
      setSavingPayout(false)
    }
  }


  async function applyPeriod(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPeriodError(null)
    const parsed = reportingPeriodSchema.safeParse({ start, end })
    if (!parsed.success) {
      setPeriodError('invalidPeriod')
      return
    }
    setLoading(true)
    try {
      const next = await getAdminFinanceReportFn({
        data: parsed.data,
      })
      setReport(next)
    } catch {
      setPeriodError('invalidPeriod')
    } finally {
      setLoading(false)
    }
  }

  const summaryCards = [
    { label: t('receivedIncome'), value: report.receivedThb },
    { label: t('totalExpenses'), value: report.expensesThb },
    { label: t('payouts'), value: report.payoutsThb },
    {
      label: t('centralAccountBalance'),
      value: report.centralAccountBalanceThb,
    },
  ]

  return (
    <div className="admin-shell">
      <AdminHeader />
      <main className="admin-main finance-main">
        <div className="admin-page-heading">
          <div>
            <p className="eyebrow">{t('adminProtected')}</p>
            <h1>{t('finance')}</h1>
          </div>
        </div>

        <div className="summary-cards period-cards">
          {summaryCards.map((card) => (
            <Card className="summary-card" key={card.label}>
              <span className="payments-summary-label">{card.label}</span>
              <strong>{formatThb(card.value)}</strong>
            </Card>
          ))}
        </div>

        <Card className="editor-card">
          <div className="editor-card-heading">
            <h2>{t('reportingPeriod')}</h2>
          </div>
          <p className="field-hint">{t('financeReportHint')}</p>
          <form className="period-form" onSubmit={applyPeriod} noValidate>
            <div className="form-field">
              <Label htmlFor="period-start">{t('periodStart')}</Label>
              <Input
                id="period-start"
                type="date"
                value={start}
                onChange={(event) => setStart(event.target.value)}
              />
            </div>
            <div className="form-field">
              <Label htmlFor="period-end">{t('periodEnd')}</Label>
              <Input
                id="period-end"
                type="date"
                value={end}
                onChange={(event) => setEnd(event.target.value)}
              />
            </div>
            <Button className="compact-button" disabled={loading} type="submit">
              <CalendarRange aria-hidden="true" size={16} />
              {t('applyPeriod')}
            </Button>
          </form>
          {periodError ? (
            <p className="form-error" role="alert">
              {t(periodError)}
            </p>
          ) : null}
          <p className="period-range">
            {report.start} — {report.end}
          </p>
        </Card>

        <Card className="editor-card">
          <div className="editor-card-heading">
            <h2>{t('recordPayout')}</h2>
          </div>
          <p className="field-hint">{t('payoutDescription')}</p>
          <form onSubmit={recordPayout} noValidate>
            <div className="editor-columns">
              <div className="form-field">
                <Label htmlFor="payout-recipient">{t('payoutRecipient')}</Label>
                <Select
                  id="payout-recipient"
                  value={recipient}
                  onValueChange={(value) =>
                    setRecipient(value as AdminPayoutRecipient)
                  }
                >
                  <SelectItem value="chompooh">{t('payer_chompooh')}</SelectItem>
                  <SelectItem value="kan">{t('payer_kan')}</SelectItem>
                  <SelectItem value="meen">{t('payer_meen')}</SelectItem>
                </Select>
              </div>
              <div className="form-field">
                <Label htmlFor="payout-amount">{t('payoutAmount')}</Label>
                <Input
                  id="payout-amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={payoutAmount}
                  onChange={(event) => setPayoutAmount(event.target.value)}
                />
              </div>
              <div className="form-field">
                <Label htmlFor="payout-date">{t('payoutDate')}</Label>
                <Input
                  id="payout-date"
                  type="date"
                  value={payoutDate}
                  onChange={(event) => setPayoutDate(event.target.value)}
                />
              </div>
              <div className="form-field">
                <Label htmlFor="payout-note">{t('payoutNote')}</Label>
                <Textarea
                  id="payout-note"
                  rows={2}
                  value={payoutNote}
                  onChange={(event) => setPayoutNote(event.target.value)}
                />
              </div>
            </div>
            {payoutError ? (
              <p className="form-error" role="alert">
                {t(payoutError)}
              </p>
            ) : null}
            <Button
              className="compact-button"
              disabled={savingPayout}
              type="submit"
            >
              {t('recordPayout')}
            </Button>
          </form>
        </Card>

        <Card className="editor-card">
          <div className="editor-card-heading">
            <h2>{t('payouts')}</h2>
            <Badge variant="secondary">{report.payouts.length}</Badge>
          </div>
          <div className="payments-summary">
            {report.payoutRecipients.map((row) => (
              <div className="payments-summary-cell" key={row.recipient}>
                <span className="payments-summary-label">
                  {t(payerLabels[row.recipient])}
                </span>
                <strong>{formatThb(row.payoutsThb)}</strong>
              </div>
            ))}
            <div className="payments-summary-cell">
              <span className="payments-summary-label">{t('payouts')}</span>
              <strong>{formatThb(report.payoutsThb)}</strong>
            </div>
          </div>
          {report.payouts.length === 0 ? (
            <p className="field-hint">{t('noPayoutsInPeriod')}</p>
          ) : (
            <div className="orders-table-wrap">
              <Table className="orders-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('payoutRecipient')}</TableHead>
                    <TableHead>{t('payoutAmount')}</TableHead>
                    <TableHead>{t('payoutDate')}</TableHead>
                    <TableHead>{t('payoutNote')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.payouts.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell data-label={t('payoutRecipient')}>
                        <Badge variant="outline">
                          {t(payerLabels[row.recipient])}
                        </Badge>
                      </TableCell>
                      <TableCell data-label={t('payoutAmount')}>
                        {formatThb(row.amountThb)}
                      </TableCell>
                      <TableCell data-label={t('payoutDate')}>
                        {row.payoutDate}
                      </TableCell>
                      <TableCell data-label={t('payoutNote')}>
                        {row.note ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        <Card className="editor-card">
          <div className="editor-card-heading">
            <h2>{t('byTeamMember')}</h2>
          </div>
          <p className="field-hint">{t('allRecordedExpenses')}</p>
          <div className="orders-table-wrap">
            <Table className="orders-table">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('taskOwner')}</TableHead>
                  <TableHead>{t('paidColumn')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.teamMembers.map((row) => (
                  <TableRow key={row.member}>
                    <TableCell data-label={t('taskOwner')}>
                      <span
                        className={`owner-chip ${teamMemberAccentClass(
                          row.member,
                        )}`}
                      >
                        {t(payerLabels[row.member])}
                      </span>
                    </TableCell>
                    <TableCell data-label={t('paidColumn')}>
                      {formatThb(row.paidThb)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="editor-card">
          <div className="editor-card-heading">
            <h2>{t('payments')}</h2>
            <Badge variant="secondary">{report.payments.length}</Badge>
          </div>
          {report.payments.length === 0 ? (
            <p className="field-hint">{t('noPaymentsInPeriod')}</p>
          ) : (
            <div className="orders-table-wrap">
              <Table className="orders-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('customerColumn')}</TableHead>
                    <TableHead>{t('taskOwner')}</TableHead>
                    <TableHead>{t('requestReference')}</TableHead>
                    <TableHead>{t('amountColumn')}</TableHead>
                    <TableHead>{t('paymentDate')}</TableHead>
                    <TableHead>{t('paymentMethod')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.payments.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell data-label={t('customerColumn')}>
                        <strong>{row.customerName}</strong>
                      </TableCell>
                      <TableCell data-label={t('taskOwner')}>
                        <OrderOwnerBadge owner={row.taskOwner} />
                      </TableCell>
                      <TableCell data-label={t('requestReference')}>
                        <Link
                          aria-label={`${t('viewOrder')} ${row.requestReference}`}
                          className="text-link"
                          to="/admin/orders/$orderId"
                          params={{ orderId: String(row.orderId) }}
                        >
                          {row.requestReference}
                          <ArrowRight aria-hidden="true" size={13} />
                        </Link>
                      </TableCell>
                      <TableCell data-label={t('amountColumn')}>
                        {formatThb(row.amountThb)}
                      </TableCell>
                      <TableCell data-label={t('paymentDate')}>
                        {row.paymentDate}
                      </TableCell>
                      <TableCell data-label={t('paymentMethod')}>
                        <Badge variant="outline">
                          {t(
                            (
                              {
                                bank_transfer: 'method_bank_transfer',
                                cash: 'method_cash',
                                other: 'method_other',
                              } as const
                            )[row.method],
                          )}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        <Card className="editor-card">
          <div className="editor-card-heading">
            <h2>{t('expenses')}</h2>
            <Badge variant="secondary">{report.expenses.length}</Badge>
          </div>
          {report.expenses.length === 0 ? (
            <p className="field-hint">{t('noExpensesInPeriod')}</p>
          ) : (
            <div className="orders-table-wrap">
              <Table className="orders-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('expenseDescription')}</TableHead>
                    <TableHead>{t('expensePayer')}</TableHead>
                    <TableHead>{t('amountColumn')}</TableHead>
                    <TableHead>{t('expenseDate')}</TableHead>
                    <TableHead>{t('quantity')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.expenses.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell data-label={t('expenseDescription')}>
                        <strong>{row.description}</strong>
                        {row.note ? <small>{row.note}</small> : null}
                      </TableCell>
                      <TableCell data-label={t('expensePayer')}>
                        <Badge variant="outline">
                          {t(payerLabels[row.payer])}
                        </Badge>
                      </TableCell>
                      <TableCell data-label={t('amountColumn')}>
                        {formatThb(row.totalAmountThb)}
                      </TableCell>
                      <TableCell data-label={t('expenseDate')}>
                        {row.expenseDate}
                      </TableCell>
                      <TableCell data-label={t('quantity')}>
                        {row.quantity ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
