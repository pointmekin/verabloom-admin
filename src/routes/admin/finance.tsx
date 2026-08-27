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
import type { TeamMember } from '#/lib/team-members'
import {
  getAdminFinanceReportFn,
  reportingPeriodSchema,
} from '#/server/admin-finance'
import { getPendingOrderCountFn } from '#/server/admin-order'
import type { FinanceReport } from '#/server/finance-report.server'
import type { AdminExpensePayer } from '#/server/admin-expense'

export const Route = createFileRoute('/admin/finance')({
  beforeLoad: () =>
    import('#/server/auth').then(({ getRequiredAdminFn }) =>
      getRequiredAdminFn(),
    ),
  loader: async () => {
    const period = defaultReportingPeriod()
    const [report, pendingCount] = await Promise.all([
      getAdminFinanceReportFn({ data: period }),
      getPendingOrderCountFn(),
    ])
    return { report, pendingCount, start: period.start, end: period.end }
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

function memberLabel(member: TeamMember | 'unassigned'): MessageKey {
  return member === 'unassigned' ? 'unassigned' : payerLabels[member]
}

function AdminFinancePage() {
  const { t } = useLocale()
  const initial = Route.useLoaderData()
  const [start, setStart] = useState(initial.start)
  const [end, setEnd] = useState(initial.end)
  const [report, setReport] = useState<FinanceReport>(initial.report)
  const [periodError, setPeriodError] = useState<MessageKey | null>(null)
  const [loading, setLoading] = useState(false)

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
    { label: t('netCash'), value: report.netCashThb },
  ]

  return (
    <div className="admin-shell">
      <AdminHeader pendingCount={initial.pendingCount} />
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
            <h2>{t('byTeamMember')}</h2>
          </div>
          <div className="orders-table-wrap">
            <Table className="orders-table">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('taskOwner')}</TableHead>
                  <TableHead>{t('earnedColumn')}</TableHead>
                  <TableHead>{t('paidColumn')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.teamMembers.map((row) => (
                  <TableRow key={row.member}>
                    <TableCell data-label={t('taskOwner')}>
                      <span
                        className={`owner-chip ${teamMemberAccentClass(
                          row.member === 'unassigned' ? null : row.member,
                        )}`}
                      >
                        {t(memberLabel(row.member))}
                      </span>
                    </TableCell>
                    <TableCell data-label={t('earnedColumn')}>
                      {formatThb(row.earnedThb)}
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
