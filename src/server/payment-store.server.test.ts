import { afterEach, describe, expect, it } from 'vitest'

import {
  clearOrderMemoryForTests,
  createDirectOrder,
  deleteOrder,
  getOrderById,
  updateOrder,
} from './order-store.server'
import {
  clearPaymentMemoryForTests,
  createPayment,
  deletePayment,
  listAllPayments,
  listPaymentsForOrder,
  updatePayment,
} from './payment-store.server'
import type { PaymentMethod } from './payment-store.server'

process.env.VERABLOOM_ORDER_STORE = 'memory'
process.env.VERABLOOM_PAYMENT_STORE = 'memory'

const baseInput = {
  productNameSnapshot: 'Spring bouquet',
  taskOwner: 'chompooh' as const,
  socialContact: '@mali',
  phone: '',
  requestDetails: '',
  deliveryMethod: 'messenger' as const,
  orderAddress: '',
  requiredDate: '2026-09-10',
  orderValueThb: '1200',
}

async function fixtureConfirmedOrder() {
  const order = await createDirectOrder(baseInput)
  const saved = await getOrderById(order.id)
  if (!saved) throw new Error('fixture failed')
  return saved
}

describe('payment records', () => {
  afterEach(() => {
    clearPaymentMemoryForTests()
    clearOrderMemoryForTests()
  })

  it('adds multiple payments to an order with amount, date, method, and note', async () => {
    const order = await fixtureConfirmedOrder()
    const deposit = await createPayment(order.id, {
      amountThb: '500',
      paymentDate: '2026-08-01',
      method: 'bank_transfer',
      note: '',
    })
    expect(deposit.orderId).toBe(order.id)
    expect(deposit.amountThb).toBe('500')
    const cash = await createPayment(order.id, {
      amountThb: '700.50',
      paymentDate: '2026-08-20',
      method: 'cash',
      note: ' remainder on pickup ',
    })
    expect(cash.note).toBe('remainder on pickup')
    const payments = await listPaymentsForOrder(order.id)
    expect(payments.map((item) => item.amountThb)).toEqual(['500', '700.50'])
  })

  it('rejects invalid amounts, dates, methods, and missing orders', async () => {
    const order = await fixtureConfirmedOrder()
    await expect(
      createPayment(order.id, {
        amountThb: '12.345',
        paymentDate: '2026-08-01',
        method: 'cash',
        note: '',
      }),
    ).rejects.toThrow('Enter a valid Thai baht amount')
    await expect(
      createPayment(order.id, {
        amountThb: '100',
        paymentDate: '2026-02-30',
        method: 'cash',
        note: '',
      }),
    ).rejects.toThrow('Enter a valid payment date')
    await expect(
      createPayment(order.id, {
        amountThb: '100',
        paymentDate: '2026-08-01',
        method: 'credit' as PaymentMethod,
        note: '',
      }),
    ).rejects.toThrow('Choose a payment method')
    await expect(
      createPayment(9999, {
        amountThb: '100',
        paymentDate: '2026-08-01',
        method: 'cash',
        note: '',
      }),
    ).rejects.toThrow('Order not found')
  })

  it('edits and deletes a payment', async () => {
    const order = await fixtureConfirmedOrder()
    const created = await createPayment(order.id, {
      amountThb: '500',
      paymentDate: '2026-08-01',
      method: 'bank_transfer',
      note: '',
    })
    const updated = await updatePayment(created.id, {
      amountThb: '450',
      paymentDate: '2026-08-02',
      method: 'other',
      note: 'corrected deposit',
    })
    expect(updated).toMatchObject({
      amountThb: '450',
      paymentDate: '2026-08-02',
      method: 'other',
      note: 'corrected deposit',
    })
    expect(await deletePayment(created.id)).toBe(true)
    expect(await listPaymentsForOrder(order.id)).toEqual([])
    await expect(updatePayment(created.id, updated)).rejects.toThrow(
      'Payment not found',
    )
    await expect(deletePayment(created.id)).rejects.toThrow('Payment not found')
  })

  it('keeps recorded payments when an order is edited', async () => {
    const order = await fixtureConfirmedOrder()
    await createPayment(order.id, {
      amountThb: '800',
      paymentDate: '2026-08-01',
      method: 'cash',
      note: '',
    })
    await updateOrder(order.id, {
      ...baseInput,
      requestDetails: 'Updated details',
    })
    const payments = await listPaymentsForOrder(order.id)
    expect(payments.map((item) => item.amountThb)).toEqual(['800'])
  })

  it('removes stored payments when the owning order is deleted', async () => {
    const order = await fixtureConfirmedOrder()
    await createPayment(order.id, {
      amountThb: '300',
      paymentDate: '2026-08-01',
      method: 'bank_transfer',
      note: '',
    })
    await deleteOrder(order.id)
    expect(await listPaymentsForOrder(order.id)).toEqual([])
  })

  it('lists every payment across orders newest payment date first', async () => {
    const order = await fixtureConfirmedOrder()
    const other = await createDirectOrder({
      ...baseInput,
      socialContact: '@nok',
    })
    await createPayment(order.id, {
      amountThb: '500',
      paymentDate: '2026-08-01',
      method: 'bank_transfer',
      note: '',
    })
    await createPayment(other.id, {
      amountThb: '250.50',
      paymentDate: '2026-08-10',
      method: 'cash',
      note: '',
    })
    await createPayment(order.id, {
      amountThb: '100',
      paymentDate: '2026-08-10',
      method: 'other',
      note: '',
    })
    const all = await listAllPayments()
    expect(all.map((item) => item.amountThb)).toEqual(['100', '250.50', '500'])
    expect(all.every((item) => typeof item.orderId === 'number')).toBe(true)
  })

  it('stays in memory when the order store is memory', async () => {
    delete process.env.VERABLOOM_PAYMENT_STORE
    try {
      const order = await fixtureConfirmedOrder()
      const payment = await createPayment(order.id, {
        amountThb: '250',
        paymentDate: '2026-08-03',
        method: 'cash',
        note: '',
      })
      expect(payment.orderId).toBe(order.id)
      expect((await listPaymentsForOrder(order.id)).length).toBe(1)
    } finally {
      process.env.VERABLOOM_PAYMENT_STORE = 'memory'
    }
  })
})
