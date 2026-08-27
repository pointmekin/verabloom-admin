import { afterEach, describe, expect, it } from 'vitest'

import { clearCatalogMemoryForTests, saveCatalogProduct } from './catalog-store.server'
import {
  clearOrderMemoryForTests,
  createDirectOrder,
  deleteOrder,
  getOrderById,
} from './order-store.server'
import {
  clearPaymentMemoryForTests,
  createPayment,
  deletePayment,
  listPaymentsForOrder,
  updatePayment,
} from './payment-store.server'
import type { PaymentMethod } from './payment-store.server'

process.env.VERABLOOM_CATALOG_STORE = 'memory'
process.env.VERABLOOM_ORDER_STORE = 'memory'
process.env.VERABLOOM_CUSTOMER_STORE = 'memory'
process.env.VERABLOOM_PAYMENT_STORE = 'memory'

const baseInput = {
  productId: 1,
  variationId: 1,
  quantity: 1,
  customerName: 'Mali',
  socialChannel: 'line' as const,
  socialContact: '@mali',
  phone: '',
  requestDetails: '',
  deliveryMethod: 'collection' as const,
  orderAddress: '',
  requiredDate: '2026-09-10',
  status: 'confirmed' as const,
  orderValueThb: '1200',
}

async function fixtureConfirmedOrder() {
  const product = await saveCatalogProduct({
    name: 'Spring bouquet',
    description: '',
    visible: true,
    variations: [{ name: 'Medium', startingPriceThb: '890' }],
    images: [],
  })
  if (!product || !product.variations[0]) throw new Error('fixture failed')
  await createDirectOrder({
    ...baseInput,
    productId: product.id,
    variationId: product.variations[0].id,
  })
  const order = await getOrderById(1)
  if (!order) throw new Error('fixture failed')
  return order
}

describe('payment records', () => {
  afterEach(() => {
    clearPaymentMemoryForTests()
    clearOrderMemoryForTests()
    clearCatalogMemoryForTests()
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
    await expect(deletePayment(created.id)).rejects.toThrow(
      'Payment not found',
    )
  })

  it('keeps retained payments recorded when an order is cancelled', async () => {
    const { updateOrder } = await import('./order-store.server')
    const order = await fixtureConfirmedOrder()
    await createPayment(order.id, {
      amountThb: '800',
      paymentDate: '2026-08-01',
      method: 'cash',
      note: '',
    })
    await updateOrder(order.id, {
      ...order,
      status: 'cancelled',
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
})
