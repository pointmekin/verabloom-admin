import {
  filterWithinPeriod,
  financeTotals,
  latestMonthKeys,
  monthlyFinanceSeries,
  netCashThb,
  receivedIncomeThb,
  recordedExpensesThb,
  teamMemberTotals,
  bangkokTodayIso,
} from '#/lib/finance'
import type { MonthlyFinance, TeamMemberTotals } from '#/lib/finance'
import type { TeamMember } from '#/lib/team-members'
import { normalizeTeamMembers } from '#/lib/team-members'
import type { ExpenseRecord } from './expense-store.server'
import type { PaymentRecord } from './payment-store.server'
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
  netCashThb: string
  payments: FinancePaymentRow[]
  expenses: ExpenseRecord[]
  teamMembers: TeamMemberTotals[]
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

export function buildFinanceReport(input: {
  payments: FinancePaymentRow[]
  expenses: ExpenseRecord[]
  start: string
  end: string
}): FinanceReport {
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
  const receivedThb = receivedIncomeThb(payments)
  const expensesThb = recordedExpensesThb(expenses)
  return {
    start: input.start,
    end: input.end,
    receivedThb,
    expensesThb,
    netCashThb: netCashThb(receivedThb, expensesThb),
    payments,
    expenses,
    teamMembers: teamMemberTotals(payments, expenses),
  }
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
