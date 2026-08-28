import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildDashboardFinancials,
  buildFinanceReport,
} from './finance-report.server'
import type { FinancePaymentRow } from './finance-report.server'
import type { ExpenseRecord } from './expense-store.server'
import type { PaymentRecord } from './payment-store.server'
import type { PayoutRecord } from './payout-store.server'


process.env.VERABLOOM_CATALOG_STORE = 'memory'
process.env.VERABLOOM_ORDER_STORE = 'memory'
process.env.VERABLOOM_EXPENSE_STORE = 'memory'
process.env.VERABLOOM_PAYMENT_STORE = 'memory'

let paymentId = 0
let expenseId = 0

function paymentRecord(
  overrides: Partial<PaymentRecord> &
    Pick<PaymentRecord, 'orderId' | 'amountThb' | 'paymentDate'>,
): PaymentRecord {
  paymentId += 1
  return {
    id: paymentId,
    method: 'cash',
    note: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

function expenseRecord(
  overrides: Partial<ExpenseRecord> &
    Pick<ExpenseRecord, 'totalAmountThb' | 'expenseDate'>,
): ExpenseRecord {
  expenseId += 1
  return {
    id: expenseId,
    description: 'Ribbon',
    payer: 'chompooh',
    quantity: null,
    note: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

function payoutRecord(
  overrides: Partial<PayoutRecord> &
    Pick<PayoutRecord, 'amountThb' | 'payoutDate'>,
): PayoutRecord {
  return {
    id: 1,
    recipient: 'kan',
    note: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

function orderRecord(
  id: number,
  status: 'pending_review' | 'confirmed' | 'completed' | 'cancelled',
  orderValueThb: string | null,
) {
  return { id, status, orderValueThb }
}

describe('buildDashboardFinancials', () => {
  beforeEach(() => {
    paymentId = 0
    expenseId = 0
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns zero-value cards and an all-zero six-month series for empty data', () => {
    vi.setSystemTime(Date.UTC(2026, 7, 27, 10, 0))
    const dashboard = buildDashboardFinancials({
      payments: [],
      expenses: [],
      orders: [],
    })
    expect(dashboard).toEqual({
      receivedThb: '0.00',
      expensesThb: '0.00',
      netCashThb: '0.00',
      outstandingThb: '0.00',
      months: [
        { monthKey: '2026-03', incomeSatang: 0, expensesSatang: 0 },
        { monthKey: '2026-04', incomeSatang: 0, expensesSatang: 0 },
        { monthKey: '2026-05', incomeSatang: 0, expensesSatang: 0 },
        { monthKey: '2026-06', incomeSatang: 0, expensesSatang: 0 },
        { monthKey: '2026-07', incomeSatang: 0, expensesSatang: 0 },
        { monthKey: '2026-08', incomeSatang: 0, expensesSatang: 0 },
      ],
    })
  })

  it('counts retained payments on cancelled orders as income but not outstanding', () => {
    vi.setSystemTime(Date.UTC(2026, 7, 27, 10, 0))
    const cancelledPayment = paymentRecord({
      orderId: 1,
      amountThb: '800',
      paymentDate: '2026-08-05',
    })
    const dashboard = buildDashboardFinancials({
      payments: [cancelledPayment],
      expenses: [
        expenseRecord({ totalAmountThb: '300', expenseDate: '2026-08-10' }),
      ],
      orders: [orderRecord(1, 'cancelled', '2000')],
    })
    expect(dashboard.receivedThb).toBe('800.00')
    expect(dashboard.expensesThb).toBe('300.00')
    expect(dashboard.netCashThb).toBe('500.00')
    expect(dashboard.outstandingThb).toBe('0.00')
    expect(dashboard.months[5]).toEqual({
      monthKey: '2026-08',
      incomeSatang: 80000,
      expensesSatang: 30000,
    })
  })

  it('groups payments per order so excess on one order never offsets another', () => {
    vi.setSystemTime(Date.UTC(2026, 7, 27, 10, 0))
    const dashboard = buildDashboardFinancials({
      payments: [
        paymentRecord({
          orderId: 1,
          amountThb: '600',
          paymentDate: '2026-06-01',
        }),
        paymentRecord({
          orderId: 1,
          amountThb: '600',
          paymentDate: '2026-06-02',
        }),
        paymentRecord({
          orderId: 2,
          amountThb: '100',
          paymentDate: '2026-07-01',
        }),
      ],
      expenses: [],
      orders: [
        orderRecord(1, 'confirmed', '1000'),
        orderRecord(2, 'confirmed', '900'),
      ],
    })
    expect(dashboard.receivedThb).toBe('1300.00')
    expect(dashboard.outstandingThb).toBe('800.00')
  })

  it('excludes payments and expenses older than the six-month window', () => {
    vi.setSystemTime(Date.UTC(2026, 1, 15, 10, 0))
    const dashboard = buildDashboardFinancials({
      payments: [
        paymentRecord({
          orderId: 1,
          amountThb: '500',
          paymentDate: '2025-07-31',
        }),
        paymentRecord({
          orderId: 1,
          amountThb: '250',
          paymentDate: '2025-09-01',
        }),
      ],
      expenses: [
        expenseRecord({ totalAmountThb: '90', expenseDate: '2025-12-31' }),
      ],
      orders: [orderRecord(1, 'confirmed', '1000')],
    })
    expect(dashboard.receivedThb).toBe('750.00')
    expect(dashboard.months[0]).toEqual({
      monthKey: '2025-09',
      incomeSatang: 25000,
      expensesSatang: 0,
    })
    expect(
      dashboard.months.reduce((sum, month) => sum + month.incomeSatang, 0),
    ).toBe(25000)
  })
})

describe('buildFinanceReport', () => {
  beforeEach(() => {
    paymentId = 0
    expenseId = 0
  })

  function joinedRow(
    overrides: Partial<FinancePaymentRow> &
      Pick<FinancePaymentRow, 'orderId' | 'amountThb' | 'paymentDate'>,
  ): FinancePaymentRow {
    return {
      ...paymentRecord(overrides),
      customerName: 'Mali',
      requestReference: 'VB-000001',
      taskOwner: null,
      ...overrides,
    }
  }

  it('returns an empty report with zero totals for empty data', () => {
    const report = buildFinanceReport({
      payments: [],
      expenses: [],
      start: '2026-08-01',
      end: '2026-08-31',
    })
    expect(report).toEqual({
      start: '2026-08-01',
      end: '2026-08-31',
      receivedThb: '0.00',
      expensesThb: '0.00',
      payoutsThb: '0.00',
      netCashThb: '0.00',
      centralAccountBalanceThb: '0.00',
      payments: [],
      expenses: [],
      payouts: [],
      payoutRecipients: [
        { recipient: 'chompooh', payoutsThb: '0.00' },
        { recipient: 'kan', payoutsThb: '0.00' },
        { recipient: 'meen', payoutsThb: '0.00' },
      ],
      teamMembers: [
        { member: 'chompooh', paidThb: '0.00' },
        { member: 'meen', paidThb: '0.00' },
        { member: 'kan', paidThb: '0.00' },
      ],
    })
  })

  it('includes only rows inside the inclusive period and recalculates totals', () => {
    const payments = [
      joinedRow({ orderId: 1, amountThb: '500', paymentDate: '2026-07-31' }),
      joinedRow({ orderId: 1, amountThb: '300', paymentDate: '2026-08-01' }),
      joinedRow({ orderId: 2, amountThb: '120.50', paymentDate: '2026-08-20' }),
      joinedRow({ orderId: 2, amountThb: '75', paymentDate: '2026-09-01' }),
    ]
    const expenses = [
      expenseRecord({ totalAmountThb: '60', expenseDate: '2026-07-15' }),
      expenseRecord({ totalAmountThb: '40', expenseDate: '2026-08-31' }),
    ]
    const report = buildFinanceReport({
      payments,
      expenses,
      start: '2026-08-01',
      end: '2026-08-31',
    })
    expect(report.payments.map((row) => row.amountThb)).toEqual([
      '300',
      '120.50',
    ])
    expect(report.expenses.map((row) => row.totalAmountThb)).toEqual(['40'])
    expect(report.receivedThb).toBe('420.50')
    expect(report.expensesThb).toBe('40.00')
    expect(report.netCashThb).toBe('380.50')
  })

  it('totals what each team member paid across every recorded expense', () => {
    const report = buildFinanceReport({
      payments: [],
      expenses: [
        expenseRecord({
          totalAmountThb: '838.84',
          expenseDate: '2026-07-10',
          payer: 'meen',
        }),
        expenseRecord({
          totalAmountThb: '55',
          expenseDate: '2026-08-28',
          payer: 'chompooh',
        }),
        expenseRecord({
          totalAmountThb: '290',
          expenseDate: '2026-07-04',
          payer: 'chompooh',
        }),
      ],
      start: '2026-08-01',
      end: '2026-08-31',
    })

    expect(report.expensesThb).toBe('55.00')
    expect(report.teamMembers).toEqual([
      { member: 'chompooh', paidThb: '345.00' },
      { member: 'meen', paidThb: '838.84' },
      { member: 'kan', paidThb: '0.00' },
    ])
  })

  it('deducts payouts from the central-account balance', () => {
    const report = buildFinanceReport({
      payments: [joinedRow({ orderId: 1, amountThb: '500', paymentDate: '2026-08-01' })],
      expenses: [
        expenseRecord({ totalAmountThb: '100', expenseDate: '2026-08-02' }),
      ],
      payouts: [payoutRecord({ amountThb: '250', payoutDate: '2026-08-03' })],
      start: '2026-08-01',
      end: '2026-08-31',
    })

    expect(report.payoutsThb).toBe('250.00')
    expect(report.centralAccountBalanceThb).toBe('150.00')
  })

  it('totals payouts per recipient inside the period', () => {
    const report = buildFinanceReport({
      payments: [],
      expenses: [],
      payouts: [
        payoutRecord({
          id: 1,
          recipient: 'kan',
          amountThb: '250',
          payoutDate: '2026-08-03',
        }),
        payoutRecord({
          id: 2,
          recipient: 'chompooh',
          amountThb: '100.50',
          payoutDate: '2026-08-04',
        }),
        payoutRecord({
          id: 3,
          recipient: 'chompooh',
          amountThb: '900',
          payoutDate: '2026-09-01',
        }),
      ],
      start: '2026-08-01',
      end: '2026-08-31',
    })

    expect(report.payoutRecipients).toEqual([
      { recipient: 'chompooh', payoutsThb: '100.50' },
      { recipient: 'kan', payoutsThb: '250.00' },
      { recipient: 'meen', payoutsThb: '0.00' },
    ])
  })
})
