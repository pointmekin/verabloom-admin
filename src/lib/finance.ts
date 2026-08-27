import {
  orderOutstandingSatang,
  parseBahtToSatang,
  satangToDecimalString,
  sumPaymentsSatang,
} from './money'
import type { OrderStatusForTotals, PaymentLike } from './money'

export type PaymentAmountLike = PaymentLike
export type ExpenseAmountLike = { totalAmountThb: string }
export type OrderWithPaymentsLike = {
  status: OrderStatusForTotals
  orderValueThb: string | null
  payments: readonly PaymentAmountLike[]
}

export type FinanceTotalsInput = {
  payments: readonly PaymentAmountLike[]
  expenses: readonly ExpenseAmountLike[]
  orders: readonly OrderWithPaymentsLike[]
}

export type FinanceTotals = {
  receivedThb: string
  expensesThb: string
  netCashThb: string
  outstandingThb: string
}

export type MonthlyFinance = {
  monthKey: string
  incomeSatang: number
  expensesSatang: number
}

const invalidAmount = 'Enter a valid Thai baht amount'

function requireSatang(value: string | null | undefined) {
  const satang = parseBahtToSatang(value)
  if (satang === null) throw new Error(invalidAmount)
  return satang
}

export function receivedIncomeThb(payments: readonly PaymentAmountLike[]) {
  return satangToDecimalString(sumPaymentsSatang(payments))
}

export function recordedExpensesThb(expenses: readonly ExpenseAmountLike[]) {
  let total = 0
  for (const item of expenses) total += requireSatang(item.totalAmountThb)
  return satangToDecimalString(total)
}

export function netCashThb(receivedThb: string, expensesThb: string) {
  const received = requireSatang(receivedThb)
  const expenses = requireSatang(expensesThb)
  return satangToDecimalString(received - expenses)
}

export function outstandingTotalThb(orders: readonly OrderWithPaymentsLike[]) {
  let total = 0
  for (const item of orders) {
    total += orderOutstandingSatang(item, sumPaymentsSatang(item.payments))
  }
  return satangToDecimalString(total)
}

export function financeTotals(input: FinanceTotalsInput): FinanceTotals {
  const receivedThb = receivedIncomeThb(input.payments)
  const expensesThb = recordedExpensesThb(input.expenses)
  return {
    receivedThb,
    expensesThb,
    netCashThb: netCashThb(receivedThb, expensesThb),
    outstandingThb: outstandingTotalThb(input.orders),
  }
}

export function isWithinInclusivePeriod(
  dateIso: string,
  startIso: string,
  endIso: string,
) {
  return dateIso >= startIso && dateIso <= endIso
}

export function filterWithinPeriod<T>(
  items: readonly T[],
  getDate: (item: T) => string,
  startIso: string,
  endIso: string,
) {
  return items.filter((item) =>
    isWithinInclusivePeriod(getDate(item), startIso, endIso),
  )
}

export function bangkokTodayIso(nowMs: number = Date.now()) {
  return new Date(nowMs + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export function monthKeyOf(dateIso: string) {
  return dateIso.slice(0, 7)
}

export function latestMonthKeys(todayIso: string, count: number = 6) {
  const year = Number(todayIso.slice(0, 4))
  const month = Number(todayIso.slice(5, 7))
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    throw new Error('Enter a valid date')
  }
  const current = year * 12 + (month - 1)
  const keys: string[] = []
  for (let index = count - 1; index >= 0; index -= 1) {
    const total = current - index
    keys.push(
      `${String(Math.floor(total / 12)).padStart(4, '0')}-${String((total % 12) + 1).padStart(2, '0')}`,
    )
  }
  return keys
}

export function monthlyFinanceSeries(
  payments: readonly (PaymentAmountLike & { paymentDate: string })[],
  expenses: readonly (ExpenseAmountLike & { expenseDate: string })[],
  monthKeys: readonly string[],
): MonthlyFinance[] {
  const buckets = new Map<string, MonthlyFinance>(
    monthKeys.map((monthKey) => [
      monthKey,
      { monthKey, incomeSatang: 0, expensesSatang: 0 },
    ]),
  )
  for (const item of payments) {
    const bucket = buckets.get(monthKeyOf(item.paymentDate))
    if (bucket) bucket.incomeSatang += requireSatang(item.amountThb)
  }
  for (const item of expenses) {
    const bucket = buckets.get(monthKeyOf(item.expenseDate))
    if (bucket) bucket.expensesSatang += requireSatang(item.totalAmountThb)
  }
  return monthKeys.map((monthKey) => buckets.get(monthKey) as MonthlyFinance)
}
