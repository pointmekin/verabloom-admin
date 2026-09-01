import { createFileRoute } from '@tanstack/react-router'
import { CalendarRange, Pencil } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { AdminHeader } from '#/components/admin-header'
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
  updateAdminPayoutFn,
} from '#/server/admin-payout'
import type { AdminPayoutRecipient } from '#/server/admin-payout'
import { requireAdmin } from '#/lib/admin-guard'
import type {
  AllTimeFinanceReport,
  FinanceReport,
} from '#/server/finance-report.server'
import type { PayoutRecord } from '#/server/payout-store.server'
import type { AdminExpensePayer } from '#/server/admin-expense'

export const Route = createFileRoute('/admin/finance')({
  beforeLoad: () => requireAdmin(),
  loader: async () => {
    const period = defaultReportingPeriod()
    const report = await getAdminFinanceReportFn({ data: period })
    return { ...report, start: period.start, end: period.end }
  },
  component: AdminFinancePage,
})

function defaultReportingPeriod() {
  const today = bangkokTodayIso()
  return { start: `2026-07-01`, end: today }
}

const financeViews = {
  allTime: 'all-time',
  selectedDateRange: 'selected-date-range',
} as const

type FinanceView = (typeof financeViews)[keyof typeof financeViews]

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
  const [view, setView] = useState<FinanceView>(financeViews.selectedDateRange)
  const [viewTransitionActive, setViewTransitionActive] = useState(false)
  const initialViewRef = useRef(true)
  useEffect(() => {
    if (initialViewRef.current) {
      initialViewRef.current = false
      return
    }
    setViewTransitionActive(true)
    const timeoutId = window.setTimeout(
      () => setViewTransitionActive(false),
      220,
    )
    return () => window.clearTimeout(timeoutId)
  }, [view])
  const [selectedReport, setSelectedReport] = useState<FinanceReport>(
    initial.report,
  )
  const [allTimeReport, setAllTimeReport] = useState<AllTimeFinanceReport>(
    initial.allTime,
  )
  const report = view === financeViews.allTime ? allTimeReport : selectedReport
  const [periodError, setPeriodError] = useState<MessageKey | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [recipient, setRecipient] = useState<AdminPayoutRecipient>('chompooh')
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutDate, setPayoutDate] = useState(bangkokTodayIso())
  const [payoutNote, setPayoutNote] = useState('')
  const [payoutError, setPayoutError] = useState<MessageKey | null>(null)
  const [savingPayout, setSavingPayout] = useState(false)
  const [editingPayoutId, setEditingPayoutId] = useState<number | null>(null)
  const payoutFormHeadingRef = useRef<HTMLHeadingElement>(null)

  function resetPayoutForm() {
    setEditingPayoutId(null)
    setRecipient('chompooh')
    setPayoutAmount('')
    setPayoutDate(bangkokTodayIso())
    setPayoutNote('')
    setPayoutError(null)
  }

  function editPayout(payout: PayoutRecord) {
    setEditingPayoutId(payout.id)
    setRecipient(payout.recipient)
    setPayoutAmount(payout.amountThb)
    setPayoutDate(payout.payoutDate)
    setPayoutNote(payout.note ?? '')
    setPayoutError(null)
    payoutFormHeadingRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

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
    const isEditing = editingPayoutId !== null
    setSavingPayout(true)
    try {
      if (!isEditing) {
        await addAdminPayoutFn({ data: parsed.data })
      } else {
        await updateAdminPayoutFn({
          data: { id: editingPayoutId, ...parsed.data },
        })
      }
      const next = await getAdminFinanceReportFn({
        data: { start: selectedReport.start, end: selectedReport.end },
      })
      setSelectedReport(next.report)
      setAllTimeReport(next.allTime)
      resetPayoutForm()
      toast({
        title: t(isEditing ? 'payoutUpdated' : 'payoutSaved'),
        kind: 'success',
      })
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
      setSelectedReport(next.report)
      setAllTimeReport(next.allTime)
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
  const expenseScopeHint =
    view === financeViews.allTime
      ? t('expensesPaidAllTime')
      : `${t('expensesPaidInPeriod')}: ${selectedReport.start} — ${selectedReport.end}`
  const noPayoutsMessage =
    view === financeViews.allTime ? 'noPayoutsAllTime' : 'noPayoutsInPeriod'

  return (
    <div className="admin-shell">
      <AdminHeader />
      <main className="admin-main finance-main">
        <div className="admin-page-heading">
          <div>
            <p className="eyebrow">{t('adminProtected')}</p>
            <h1>{t('finance')}</h1>
          </div>
          <div
            aria-label={t('financeView')}
            className="finance-view-tabs"
            role="tablist"
          >
            <button
              aria-controls="finance-view-panel"
              aria-selected={view === financeViews.allTime}
              className="finance-view-tab"
              id="finance-view-tab-all-time"
              onClick={() => setView(financeViews.allTime)}
              role="tab"
              type="button"
            >
              {t('allTime')}
            </button>
            <button
              aria-controls="finance-view-panel"
              aria-selected={view === financeViews.selectedDateRange}
              className="finance-view-tab"
              id="finance-view-tab-selected-date-range"
              onClick={() => setView(financeViews.selectedDateRange)}
              role="tab"
              type="button"
            >
              {t('selectedDateRange')}
            </button>
          </div>
        </div>
        <div
          aria-labelledby={`finance-view-tab-${view}`}
          className="finance-view-panel"
          id="finance-view-panel"
          role="tabpanel"
        >
          <div
            className={
              viewTransitionActive ? 'finance-view-transition' : undefined
            }
          >
            <div className="summary-cards period-cards">
              {summaryCards.map((card) => (
                <Card className="summary-card" key={card.label}>
                  <span className="payments-summary-label">{card.label}</span>
                  <strong>{formatThb(card.value)}</strong>
                </Card>
              ))}
            </div>

            {view === financeViews.selectedDateRange ? (
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
                  <Button
                    className="compact-button"
                    disabled={loading}
                    type="submit"
                  >
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
                  {selectedReport.start} — {selectedReport.end}
                </p>
              </Card>
            ) : null}

            <Card className="editor-card">
              <div className="editor-card-heading">
                <h2>{t('byTeamMember')}</h2>
              </div>
              <p className="field-hint">{expenseScopeHint}</p>
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
          </div>

          <Card className="editor-card">
            <div className="editor-card-heading">
              <h2 ref={payoutFormHeadingRef}>
                {t(editingPayoutId === null ? 'recordPayout' : 'editPayout')}
              </h2>
            </div>
            <p className="field-hint">{t('payoutDescription')}</p>
            <form onSubmit={recordPayout} noValidate>
              <div className="editor-columns">
                <div className="form-field">
                  <Label htmlFor="payout-recipient">
                    {t('payoutRecipient')}
                  </Label>
                  <Select
                    id="payout-recipient"
                    value={recipient}
                    onValueChange={(value) =>
                      setRecipient(value as AdminPayoutRecipient)
                    }
                  >
                    <SelectItem value="chompooh">
                      {t('payer_chompooh')}
                    </SelectItem>
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
              <div className="payment-item-actions">
                {editingPayoutId !== null ? (
                  <Button
                    disabled={savingPayout}
                    onClick={resetPayoutForm}
                    type="button"
                    variant="outline"
                  >
                    {t('cancel')}
                  </Button>
                ) : null}
                <Button
                  className="compact-button"
                  disabled={savingPayout}
                  type="submit"
                >
                  {t(editingPayoutId === null ? 'recordPayout' : 'save')}
                </Button>
              </div>
            </form>
          </Card>

          <Card
            className={
              viewTransitionActive
                ? 'editor-card finance-view-transition'
                : 'editor-card'
            }
          >
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
              <p className="field-hint">{t(noPayoutsMessage)}</p>
            ) : (
              <div className="orders-table-wrap">
                <Table className="orders-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('payoutRecipient')}</TableHead>
                      <TableHead>{t('payoutAmount')}</TableHead>
                      <TableHead>{t('payoutDate')}</TableHead>
                      <TableHead>{t('payoutNote')}</TableHead>
                      <TableHead>{t('manage')}</TableHead>
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
                        <TableCell data-label={t('manage')}>
                          <Button
                            aria-label={t('editPayout')}
                            disabled={savingPayout}
                            onClick={() => editPayout(row)}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            <Pencil aria-hidden="true" size={14} />
                            {t('editPayout')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
