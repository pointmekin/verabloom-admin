import { describe, expect, it } from 'vitest'

import {
  bangkokTodayIso,
  financeTotals,
  filterWithinPeriod,
  isWithinInclusivePeriod,
  latestMonthKeys,
  monthKeyOf,
  monthlyFinanceSeries,
  netCashThb,
  outstandingTotalThb,
  receivedIncomeThb,
  recordedExpensesThb,
  teamMemberTotals,
} from './finance'
import type { OrderWithPaymentsLike } from './finance'

const payment = (amountThb: string) => ({ amountThb })
const expense = (totalAmountThb: string) => ({ totalAmountThb })

const order = (
  status: OrderWithPaymentsLike['status'],
  orderValueThb: string | null,
  payments: { amountThb: string }[],
): OrderWithPaymentsLike => ({ status, orderValueThb, payments })

describe('receivedIncomeThb', () => {
  it('is zero for empty payments', () => {
    expect(receivedIncomeThb([])).toBe('0.00')
  })

  it('sums partial and multiple payments exactly in satang', () => {
    expect(receivedIncomeThb([payment('500')])).toBe('500.00')
    expect(
      receivedIncomeThb([payment('500'), payment('400.25'), payment('0.75')]),
    ).toBe('901.00')
    expect(receivedIncomeThb([payment('0.01'), payment('0.02')])).toBe('0.03')
  })

  it('counts retained payments on cancelled orders as income', () => {
    expect(receivedIncomeThb([payment('800'), payment('250.50')])).toBe(
      '1050.50',
    )
  })

  it('rejects invalid payment amounts', () => {
    expect(() => receivedIncomeThb([payment('12.345')])).toThrow(
      'Enter a valid Thai baht amount',
    )
  })
})

describe('recordedExpensesThb', () => {
  it('is zero for empty expenses', () => {
    expect(recordedExpensesThb([])).toBe('0.00')
  })

  it('sums expense totals exactly', () => {
    expect(recordedExpensesThb([expense('120'), expense('80.55')])).toBe(
      '200.55',
    )
  })
})

describe('netCashThb', () => {
  it('subtracts expenses from received income', () => {
    expect(netCashThb('1000.00', '300.50')).toBe('699.50')
    expect(netCashThb('0.00', '0.00')).toBe('0.00')
  })

  it('goes negative when expenses exceed income', () => {
    expect(netCashThb('100.00', '250.25')).toBe('-150.25')
  })
})

describe('outstandingTotalThb', () => {
  it('is zero without orders', () => {
    expect(outstandingTotalThb([])).toBe('0.00')
  })

  it('sums outstanding amounts of confirmed and completed orders', () => {
    expect(
      outstandingTotalThb([
        order('confirmed', '1200', [payment('500')]),
        order('completed', '900', []),
      ]),
    ).toBe('1600.00')
  })

  it('floors each order at zero and never lets one order offset another', () => {
    expect(
      outstandingTotalThb([
        order('confirmed', '1000', [payment('600'), payment('600')]),
        order('confirmed', '700', []),
      ]),
    ).toBe('700.00')
  })

  it('excludes cancelled orders while their payments stay in income', () => {
    expect(
      outstandingTotalThb([
        order('cancelled', '1500', [payment('800')]),
        order('confirmed', '500', []),
      ]),
    ).toBe('500.00')
  })

  it('treats orders without a value as having no outstanding amount', () => {
    expect(
      outstandingTotalThb([
        order('pending_review', null, [payment('100')]),
        order('confirmed', '400', []),
      ]),
    ).toBe('400.00')
  })
})

describe('financeTotals', () => {
  it('returns zero-value totals for empty data', () => {
    expect(financeTotals({ payments: [], expenses: [], orders: [] })).toEqual({
      receivedThb: '0.00',
      expensesThb: '0.00',
      netCashThb: '0.00',
      outstandingThb: '0.00',
    })
  })

  it('combines retained payments, expenses, and outstanding orders', () => {
    const totals = financeTotals({
      payments: [payment('800'), payment('200')],
      expenses: [expense('150.50'), expense('49.50')],
      orders: [
        order('cancelled', '2000', [payment('800')]),
        order('confirmed', '1500', [payment('200')]),
      ],
    })
    expect(totals.receivedThb).toBe('1000.00')
    expect(totals.expensesThb).toBe('200.00')
    expect(totals.netCashThb).toBe('800.00')
    expect(totals.outstandingThb).toBe('1300.00')
  })
})

describe('isWithinInclusivePeriod', () => {
  it('includes both boundary dates', () => {
    expect(
      isWithinInclusivePeriod('2026-08-01', '2026-08-01', '2026-08-31'),
    ).toBe(true)
    expect(
      isWithinInclusivePeriod('2026-08-31', '2026-08-01', '2026-08-31'),
    ).toBe(true)
  })

  it('excludes the day before the start and the day after the end', () => {
    expect(
      isWithinInclusivePeriod('2026-07-31', '2026-08-01', '2026-08-31'),
    ).toBe(false)
    expect(
      isWithinInclusivePeriod('2026-09-01', '2026-08-01', '2026-08-31'),
    ).toBe(false)
  })

  it('supports single-day periods and year-crossing spans', () => {
    expect(
      isWithinInclusivePeriod('2026-04-10', '2026-04-10', '2026-04-10'),
    ).toBe(true)
    expect(
      isWithinInclusivePeriod('2026-01-01', '2025-12-01', '2026-01-31'),
    ).toBe(true)
  })
})

describe('filterWithinPeriod', () => {
  it('keeps only items whose date falls inside the period', () => {
    const rows = [
      { label: 'before', date: '2026-07-31' },
      { label: 'first', date: '2026-08-01' },
      { label: 'middle', date: '2026-08-15' },
      { label: 'last', date: '2026-08-31' },
      { label: 'after', date: '2026-09-01' },
    ]
    expect(
      filterWithinPeriod(
        rows,
        (row) => row.date,
        '2026-08-01',
        '2026-08-31',
      ).map((row) => row.label),
    ).toEqual(['first', 'middle', 'last'])
  })
})

describe('bangkokTodayIso', () => {
  it('stays on the same Bangkok calendar day before midnight', () => {
    expect(bangkokTodayIso(Date.UTC(2026, 7, 27, 16, 59))).toBe('2026-08-27')
  })

  it('moves to the next Bangkok day at Bangkok midnight (16:00 UTC)', () => {
    expect(bangkokTodayIso(Date.UTC(2026, 7, 27, 17, 0))).toBe('2026-08-28')
  })

  it('handles the year boundary in Bangkok', () => {
    expect(bangkokTodayIso(Date.UTC(2026, 11, 31, 17, 0))).toBe('2027-01-01')
  })
})

describe('monthKeyOf', () => {
  it('returns the YYYY-MM key of a calendar date', () => {
    expect(monthKeyOf('2026-08-27')).toBe('2026-08')
    expect(monthKeyOf('2025-01-01')).toBe('2025-01')
  })
})

describe('latestMonthKeys', () => {
  it('returns the current month plus the five previous months, oldest first', () => {
    expect(latestMonthKeys('2026-08-27')).toEqual([
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
    ])
  })

  it('crosses the year boundary correctly', () => {
    expect(latestMonthKeys('2026-01-15')).toEqual([
      '2025-08',
      '2025-09',
      '2025-10',
      '2025-11',
      '2025-12',
      '2026-01',
    ])
  })

  it('anchors the window to the Bangkok date, not UTC', () => {
    const justAfterBangkokMidnight = Date.UTC(2026, 7, 31, 17, 0)
    expect(bangkokTodayIso(justAfterBangkokMidnight)).toBe('2026-09-01')
    expect(latestMonthKeys(bangkokTodayIso(justAfterBangkokMidnight))).toEqual([
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
    ])
  })
})

describe('monthlyFinanceSeries', () => {
  const payments = [
    { amountThb: '1000', paymentDate: '2026-05-02' },
    { amountThb: '250.50', paymentDate: '2026-07-31' },
    { amountThb: '99', paymentDate: '2026-08-01' },
  ]
  const expenses = [
    { totalAmountThb: '300', expenseDate: '2026-05-20' },
    { totalAmountThb: '120.25', expenseDate: '2026-08-15' },
  ]

  it('groups payments and expenses by month within the window', () => {
    const series = monthlyFinanceSeries(
      payments,
      expenses,
      latestMonthKeys('2026-08-27'),
    )
    expect(series).toEqual([
      { monthKey: '2026-03', incomeSatang: 0, expensesSatang: 0 },
      { monthKey: '2026-04', incomeSatang: 0, expensesSatang: 0 },
      { monthKey: '2026-05', incomeSatang: 100000, expensesSatang: 30000 },
      { monthKey: '2026-06', incomeSatang: 0, expensesSatang: 0 },
      { monthKey: '2026-07', incomeSatang: 25050, expensesSatang: 0 },
      { monthKey: '2026-08', incomeSatang: 9900, expensesSatang: 12025 },
    ])
  })

  it('ignores records outside the six-month window', () => {
    const series = monthlyFinanceSeries(
      [
        { amountThb: '5000', paymentDate: '2025-12-31' },
        { amountThb: '10', paymentDate: '2026-08-27' },
      ],
      [{ totalAmountThb: '700', expenseDate: '2026-01-31' }],
      latestMonthKeys('2026-08-27'),
    )
    const totals = series.reduce(
      (sum, month) => sum + month.incomeSatang + month.expensesSatang,
      0,
    )
    expect(totals).toBe(1000)
  })

  it('returns all-zero months for empty data', () => {
    const series = monthlyFinanceSeries([], [], latestMonthKeys('2026-08-27'))
    expect(series).toHaveLength(6)
    expect(series.every((month) => month.incomeSatang === 0)).toBe(true)
    expect(series.every((month) => month.expensesSatang === 0)).toBe(true)
  })
})

describe('teamMemberTotals', () => {
  it('attributes income to the order owner and expenses to the payer', () => {
    const totals = teamMemberTotals(
      [
        { amountThb: '500', taskOwner: 'chompooh' },
        { amountThb: '250.50', taskOwner: 'chompooh' },
        { amountThb: '100', taskOwner: 'kan' },
      ],
      [
        { totalAmountThb: '60', payer: 'meen' },
        { totalAmountThb: '40.25', payer: 'meen' },
      ],
    )
    expect(totals).toEqual([
      { member: 'chompooh', earnedThb: '750.50', paidThb: '0.00' },
      { member: 'meen', earnedThb: '0.00', paidThb: '100.25' },
      { member: 'kan', earnedThb: '100.00', paidThb: '0.00' },
    ])
  })

  it('adds an unassigned row only when an unowned order has income', () => {
    const totals = teamMemberTotals(
      [{ amountThb: '80', taskOwner: null }],
      [],
    )
    expect(totals.at(-1)).toEqual({
      member: 'unassigned',
      earnedThb: '80.00',
      paidThb: '0.00',
    })
  })
})
