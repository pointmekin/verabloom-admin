import {
  bangkokTodayIso,
  centralAccountBalanceThb,
  filterWithinPeriod,
  financeTotals,
  latestMonthKeys,
  monthlyFinanceSeries,
  netCashThb,
  payoutRecipientTotals,
  receivedIncomeThb,
  recordedExpensesThb,
  recordedPayoutsThb,
  teamMemberTotals,
} from '#/lib/finance'
import type {
  MonthlyFinance,
  PayoutRecipientTotals,
  TeamMemberTotals,
} from '#/lib/finance'
import type { TeamMember } from '#/lib/team-members'
import { normalizeTeamMembers } from '#/lib/team-members'
import type { ExpenseRecord } from './expense-store.server'
import type { PaymentRecord } from './payment-store.server'
import type { PayoutRecord } from './payout-store.server'
import type { OrderRequest } from './order-store.server'

export type FinancePaymentRow = PaymentRecord & {
  customerName: string
  requestReference: string
  taskOwner: TeamMember | null
}

export type DashboardFinancials = {
  receivedThb: string
  expensesThb: string
  netCashThb: string
  outstandingThb: string
  months: MonthlyFinance[]
}

export type FinanceReport = {
  start: string
  end: string
  receivedThb: string
  expensesThb: string
  payoutsThb: string
  netCashThb: string
  centralAccountBalanceThb: string
  payments: FinancePaymentRow[]
  expenses: ExpenseRecord[]
  payouts: PayoutRecord[]
  payoutRecipients: PayoutRecipientTotals[]
  teamMembers: TeamMemberTotals[]
}

export type AllTimeFinanceReport = Omit<FinanceReport, 'start' | 'end'>

type FinanceReportInput = {
  payments: FinancePaymentRow[]
  expenses: ExpenseRecord[]
  payouts?: PayoutRecord[]
}

export function buildDashboardFinancials(input: {
  payments: PaymentRecord[]
  expenses: ExpenseRecord[]
  orders: Pick<OrderRequest, 'id' | 'status' | 'orderValueThb'>[]
  todayIso?: string
}): DashboardFinancials {
  const todayIso = input.todayIso ?? bangkokTodayIso()
  const paymentsByOrder = new Map<number, PaymentRecord[]>()
  for (const payment of input.payments) {
    const existing = paymentsByOrder.get(payment.orderId)
    if (existing) existing.push(payment)
    else paymentsByOrder.set(payment.orderId, [payment])
  }
  const totals = financeTotals({
    payments: input.payments,
    expenses: input.expenses,
    orders: input.orders.map((order) => ({
      status: order.status,
      orderValueThb: order.orderValueThb,
      payments: paymentsByOrder.get(order.id) ?? [],
    })),
  })
  return {
    ...totals,
    months: monthlyFinanceSeries(
      input.payments,
      input.expenses,
      latestMonthKeys(todayIso),
    ),
  }
}

function buildFinanceReportData(
  input: FinanceReportInput,
): AllTimeFinanceReport {
  const payouts = input.payouts ?? []
  const receivedThb = receivedIncomeThb(input.payments)
  const expensesThb = recordedExpensesThb(input.expenses)
  const payoutsThb = recordedPayoutsThb(payouts)
  return {
    receivedThb,
    expensesThb,
    payoutsThb,
    netCashThb: netCashThb(receivedThb, expensesThb),
    centralAccountBalanceThb: centralAccountBalanceThb(receivedThb, payoutsThb),
    payments: input.payments,
    expenses: input.expenses,
    payouts,
    payoutRecipients: payoutRecipientTotals(payouts),
    teamMembers: teamMemberTotals(input.expenses),
  }
}

export function buildFinanceReport(
  input: FinanceReportInput & { start: string; end: string },
): FinanceReport {
  const payments = filterWithinPeriod(
    input.payments,
    (row) => row.paymentDate,
    input.start,
    input.end,
  )
  const expenses = filterWithinPeriod(
    input.expenses,
    (row) => row.expenseDate,
    input.start,
    input.end,
  )
  const payouts = filterWithinPeriod(
    input.payouts ?? [],
    (row) => row.payoutDate,
    input.start,
    input.end,
  )
  return {
    start: input.start,
    end: input.end,
    ...buildFinanceReportData({ payments, expenses, payouts }),
  }
}

export function buildAllTimeFinanceReport(
  input: FinanceReportInput,
): AllTimeFinanceReport {
  return buildFinanceReportData(input)
}

export function joinPaymentsWithOrders(
  payments: PaymentRecord[],
  orders: Pick<
    OrderRequest,
    'id' | 'customerName' | 'requestReference' | 'taskOwner'
  >[],
): FinancePaymentRow[] {
  const ordersById = new Map(orders.map((order) => [order.id, order]))
  const rows: FinancePaymentRow[] = []
  for (const payment of payments) {
    const order = ordersById.get(payment.orderId)
    if (!order) continue
    rows.push({
      ...payment,
      customerName: order.customerName,
      requestReference: order.requestReference,
      taskOwner: normalizeTeamMembers(order.taskOwner)[0] ?? null,
    })
  }
  return rows
}
