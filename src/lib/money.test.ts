import { describe, expect, it } from 'vitest'

import {
  formatThb,
  orderTotals,
  parseBahtToSatang,
  satangToDecimalString,
} from './money'

type OrderShape = {
  status:
    | 'pending_review'
    | 'confirmed'
    | 'work_in_progress'
    | 'completed'
    | 'cancelled'
  orderValueThb: string | null
}

type PaymentShape = { amountThb: string }

const payment = (amountThb: string): PaymentShape => ({ amountThb })

describe('parseBahtToSatang', () => {
  it('parses exact decimal strings into integer satang', () => {
    expect(parseBahtToSatang('1200')).toBe(120000)
    expect(parseBahtToSatang('1200.5')).toBe(120050)
    expect(parseBahtToSatang('1200.55')).toBe(120055)
    expect(parseBahtToSatang('0.01')).toBe(1)
    expect(parseBahtToSatang(' 890 ')).toBe(89000)
  })

  it('rejects invalid or empty amounts', () => {
    expect(parseBahtToSatang('')).toBeNull()
    expect(parseBahtToSatang(null)).toBeNull()
    expect(parseBahtToSatang(undefined)).toBeNull()
    expect(parseBahtToSatang('12.345')).toBeNull()
    expect(parseBahtToSatang('-5')).toBeNull()
    expect(parseBahtToSatang('abc')).toBeNull()
    expect(parseBahtToSatang('1,200')).toBeNull()
  })
})

describe('satangToDecimalString', () => {
  it('renders satang as an exact two-decimal string', () => {
    expect(satangToDecimalString(120000)).toBe('1200.00')
    expect(satangToDecimalString(120055)).toBe('1200.55')
    expect(satangToDecimalString(1)).toBe('0.01')
    expect(satangToDecimalString(0)).toBe('0.00')
  })
})

describe('orderTotals', () => {
  const confirmed = (orderValueThb: string | null): OrderShape => ({
    status: 'confirmed',
    orderValueThb,
  })

  it('covers empty payments for an order without a value', () => {
    const totals = orderTotals(
      { status: 'pending_review', orderValueThb: null },
      [],
    )
    expect(totals).toEqual({ receivedThb: '0.00', outstandingThb: '0.00' })
  })

  it('shows the full order value as outstanding with empty payments', () => {
    const totals = orderTotals(confirmed('1200'), [])
    expect(totals.receivedThb).toBe('0.00')
    expect(totals.outstandingThb).toBe('1200.00')
  })

  it('keeps an outstanding amount while an order is in progress', () => {
    const totals = orderTotals(
      { status: 'work_in_progress', orderValueThb: '1200' },
      [payment('500')],
    )
    expect(totals).toEqual({
      receivedThb: '500.00',
      outstandingThb: '700.00',
    })
  })

  it('subtracts a deposit from the outstanding amount', () => {
    const totals = orderTotals(confirmed('1200'), [payment('500')])
    expect(totals.receivedThb).toBe('500.00')
    expect(totals.outstandingThb).toBe('700.00')
  })

  it('sums multiple payments exactly', () => {
    const totals = orderTotals(confirmed('1200.50'), [
      payment('500'),
      payment('400.25'),
      payment('300.10'),
    ])
    expect(totals.receivedThb).toBe('1200.35')
    expect(totals.outstandingThb).toBe('0.15')
  })

  it('clears the outstanding amount on full payment', () => {
    const totals = orderTotals(confirmed('890'), [payment('889'), payment('1')])
    expect(totals.receivedThb).toBe('890.00')
    expect(totals.outstandingThb).toBe('0.00')
  })

  it('floors the outstanding amount at zero for overpayments', () => {
    const totals = orderTotals(confirmed('1000'), [
      payment('600'),
      payment('600'),
    ])
    expect(totals.receivedThb).toBe('1200.00')
    expect(totals.outstandingThb).toBe('0.00')
  })

  it('lets a completed order retain an outstanding amount', () => {
    const totals = orderTotals(
      { status: 'completed', orderValueThb: '1500' },
      [payment('1000')],
    )
    expect(totals.receivedThb).toBe('1000.00')
    expect(totals.outstandingThb).toBe('500.00')
  })

  it('gives a cancelled order zero outstanding while keeping received payments', () => {
    const totals = orderTotals(
      { status: 'cancelled', orderValueThb: '1500' },
      [payment('800')],
    )
    expect(totals.receivedThb).toBe('800.00')
    expect(totals.outstandingThb).toBe('0.00')
  })

  it('treats an order value recorded after confirmation as the basis once present', () => {
    const totals = orderTotals(
      { status: 'pending_review', orderValueThb: '990.99' },
      [payment('90.98')],
    )
    expect(totals.outstandingThb).toBe('900.01')
  })
})

describe('formatThb', () => {
  it('formats exact decimal strings with thousands separators', () => {
    expect(formatThb('0.00')).toBe('฿0.00')
    expect(formatThb('1234567.89')).toBe('฿1,234,567.89')
    expect(formatThb('999')).toBe('฿999.00')
  })
})
