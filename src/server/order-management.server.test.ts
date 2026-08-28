import { afterEach, describe, expect, it } from 'vitest'

import { directOrderSchema, orderUpdateSchema } from './admin-order'
import {
  clearOrderMemoryForTests,
  createDirectOrder,
  deleteOrder,
  getOrderById,
  listOrderRequests,
  listOrderRequestsPage,
  updateOrder,
  updateOrderStatus,
} from './order-store.server'

process.env.VERABLOOM_ORDER_STORE = 'memory'

const baseInput = {
  productNameSnapshot: 'ช่อทิวลิป ไซส์ M',
  socialContact: 'mali.line',
  phone: '',
  requestDetails: 'Pink wrapping',
  deliveryMethod: 'messenger' as const,
  orderAddress: '',
  requiredDate: '2026-09-10',
  orderValueThb: '1200.50',
}

describe('direct order management', () => {
  afterEach(() => {
    clearOrderMemoryForTests()
  })

  it('accepts optional address and phone but requires the core order fields', () => {
    expect(directOrderSchema.safeParse(baseInput).success).toBe(true)
    expect(orderUpdateSchema.safeParse(baseInput).success).toBe(true)
    expect(
      directOrderSchema.safeParse({ ...baseInput, orderAddress: undefined })
        .success,
    ).toBe(true)
    expect(
      directOrderSchema.safeParse({ ...baseInput, phone: undefined }).success,
    ).toBe(true)
    expect(
      directOrderSchema.safeParse({ ...baseInput, productNameSnapshot: '' })
        .success,
    ).toBe(false)
    expect(
      directOrderSchema.safeParse({ ...baseInput, socialContact: '' }).success,
    ).toBe(false)
    expect(
      directOrderSchema.safeParse({ ...baseInput, orderValueThb: '12.345' })
        .success,
    ).toBe(false)
    expect(
      directOrderSchema.safeParse({
        ...baseInput,
        deliveryMethod: 'collection',
      }).success,
    ).toBe(false)
  })

  it('creates an order without a catalog product or saved customer', async () => {
    const order = await createDirectOrder(baseInput)

    expect(order.productId).toBeNull()
    expect(order.productNameSnapshot).toBe('ช่อทิวลิป ไซส์ M')
    expect(order.customerId).toBeNull()
    expect(order.customerName).toBe('mali.line')
    expect(order.socialChannel).toBe('line')
    expect(order.socialContact).toBe('mali.line')
    expect(order.phone).toBeNull()
    expect(order.orderAddress).toBeNull()
    expect(order.quantity).toBe(1)
    expect(order.taskOwner).toBeNull()
    expect(order.status).toBe('confirmed')
    expect(order.orderValueThb).toBe('1200.50')
  })

  it('updates only fields from the simplified form', async () => {
    const order = await createDirectOrder(baseInput)
    const updated = await updateOrder(order.id, {
      ...baseInput,
      productNameSnapshot: 'ช่อกุหลาบ ไซส์ L',
      socialContact: 'new.line',
      deliveryMethod: 'postal',
      orderAddress: '12 Rose Road',
      phone: '0812345678',
      orderValueThb: '1500',
    })

    expect(updated.productNameSnapshot).toBe('ช่อกุหลาบ ไซส์ L')
    expect(updated.customerName).toBe('new.line')
    expect(updated.socialContact).toBe('new.line')
    expect(updated.deliveryMethod).toBe('postal')
    expect(updated.orderAddress).toBe('12 Rose Road')
    expect(updated.phone).toBe('0812345678')
    expect(updated.orderValueThb).toBe('1500')
    expect(updated.status).toBe('confirmed')
    expect((await getOrderById(order.id))?.productId).toBeNull()
  })

  it('updates an order status without changing the form details', async () => {
    const order = await createDirectOrder(baseInput)
    const updated = await updateOrderStatus(order.id, 'work_in_progress')

    expect(updated.status).toBe('work_in_progress')
    expect(updated.productNameSnapshot).toBe(order.productNameSnapshot)
    expect(updated.orderValueThb).toBe(order.orderValueThb)
    expect((await getOrderById(order.id))?.status).toBe('work_in_progress')
  })

  it('searches direct orders and removes them', async () => {
    const first = await createDirectOrder(baseInput)
    const second = await createDirectOrder({
      ...baseInput,
      socialContact: 'nok.line',
      phone: '0899999999',
    })

    expect(
      (await listOrderRequests({ search: '0899999999' })).map(
        (order) => order.id,
      ),
    ).toEqual([second.id])
    const page = await listOrderRequestsPage({ search: 'line' })
    expect(page.orders.map((order) => order.id)).toEqual([second.id, first.id])
    expect(page.pendingCount).toBe(0)

    await expect(deleteOrder(first.id)).resolves.toBe(true)
    await expect(deleteOrder(second.id)).resolves.toBe(true)
  })
})
