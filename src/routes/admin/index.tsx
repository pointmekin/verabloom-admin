import { Link, createFileRoute } from '@tanstack/react-router'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import type { TooltipValueType } from 'recharts'

import { AdminHeader } from '#/components/admin-header'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '#/components/ui/chart'
import type { ChartConfig } from '#/components/ui/chart'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { useLocale } from '#/lib/i18n'
import type { MessageKey } from '#/lib/i18n'
import { formatThb, satangToDecimalString } from '#/lib/money'
import { requireAdmin } from '#/lib/admin-guard'
import { getAdminDashboardFn } from '#/server/admin-finance'
import { getPendingOrderCountFn } from '#/server/admin-order'

export const Route = createFileRoute('/admin/')({
  beforeLoad: () => requireAdmin(),
  loader: async () => {
    const [financials, pendingCount] = await Promise.all([
      getAdminDashboardFn(),
      getPendingOrderCountFn(),
    ])
    return { financials, pendingCount }
  },
  component: AdminHome,
})

const monthLabels: MessageKey[] = [
  'month_1',
  'month_2',
  'month_3',
  'month_4',
  'month_5',
  'month_6',
  'month_7',
  'month_8',
  'month_9',
  'month_10',
  'month_11',
  'month_12',
]

function formatChartSatang(value: TooltipValueType | undefined) {
  const satang =
    typeof value === 'number'
      ? Math.trunc(value)
      : typeof value === 'string'
        ? Number.parseInt(value, 10) || 0
        : 0
  return formatThb(satangToDecimalString(satang))
}

function AdminHome() {
  const { t } = useLocale()
  const { financials, pendingCount } = Route.useLoaderData()

  const chartData = financials.months.map((month) => {
    const [year, monthNumber] = month.monthKey.split('-')
    return {
      month: `${t(monthLabels[Number(monthNumber) - 1])} ${year}`,
      income: month.incomeSatang,
      expenses: month.expensesSatang,
    }
  })
  const chartHasData = financials.months.some(
    (month) => month.incomeSatang > 0 || month.expensesSatang > 0,
  )

  const chartConfig = {
    income: { label: t('receivedIncome'), color: 'var(--leaf)' },
    expenses: { label: t('expenses'), color: 'var(--blush)' },
  } satisfies ChartConfig

  const cards = [
    { label: t('receivedIncome'), value: financials.receivedThb },
    { label: t('totalExpenses'), value: financials.expensesThb },
    { label: t('netCash'), value: financials.netCashThb },
    { label: t('outstandingAmount'), value: financials.outstandingThb },
  ]

  return (
    <div className="admin-shell">
      <AdminHeader pendingCount={pendingCount} />
      <main className="admin-main">
        <div className="admin-page-heading">
          <div>
            <p className="eyebrow">{t('adminProtected')}</p>
            <h1>{t('adminOverview')}</h1>
          </div>
        </div>
        <div className="admin-overview-actions">
          <Button asChild className="primary-button compact-button">
            <Link to="/admin/finance">{t('viewFinance')}</Link>
          </Button>
          <Button asChild className="compact-button" variant="outline">
            <Link to="/admin/orders">{t('orders')}</Link>
          </Button>
          <Button asChild className="compact-button" variant="outline">
            <Link to="/admin/expenses">{t('expenses')}</Link>
          </Button>
        </div>

        <div className="summary-cards">
          {cards.map((card) => (
            <Card className="summary-card" key={card.label}>
              <span className="payments-summary-label">{card.label}</span>
              <strong>{formatThb(card.value)}</strong>
            </Card>
          ))}
          <Card className="summary-card">
            <span className="payments-summary-label">
              {t('pendingRequests')}
            </span>
            <strong>
              {pendingCount}
              {pendingCount > 0 ? (
                <Badge variant="destructive">{t('pendingRequests')}</Badge>
              ) : null}
            </strong>
          </Card>
        </div>

        <Card className="editor-card dashboard-chart-card">
          <div className="editor-card-heading">
            <h2>{t('monthlyTrend')}</h2>
          </div>
          {chartHasData ? (
            <ChartContainer className="dashboard-chart" config={chartConfig}>
              <BarChart data={chartData} margin={{ top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatChartSatang(value)}
                  width={78}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) =>
                        `${name === 'income' ? t('receivedIncome') : t('expenses')}: ${formatChartSatang(value)}`
                      }
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                <Bar
                  dataKey="expenses"
                  fill="var(--color-expenses)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="dashboard-chart-empty">{t('chartEmpty')}</p>
          )}
        </Card>
      </main>
    </div>
  )
}
