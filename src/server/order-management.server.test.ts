import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'

import { directOrderSchema, orderUpdateSchema } from './admin-order'
import {
  clearOrderMemoryForTests,
  createDirectOrder,
  deleteOrder,
  getOrderById,
  listOrderRequests,
  listOrderRequestsPage,
  setOrderReferenceImage,
  updateOrder,
  updateOrderStatus,
} from './order-store.server'
import {
  resetObjectStorageForTests,
  setObjectStorageForTests,
} from './storage.server'

process.env.VERABLOOM_ORDER_STORE = 'memory'

const baseInput = {
  productNameSnapshot: 'ช่อทิวลิป ไซส์ M',
  taskOwner: 'chompooh' as const,
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
    resetObjectStorageForTests()
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

  it('keeps the nullable product migration after the previous order migration', () => {
    const journal = JSON.parse(
      readFileSync(new URL('../../drizzle/meta/_journal.json', import.meta.url), 'utf8'),
    ) as {
      entries: Array<{ tag: string; when: number }>
    }
    const previousOrderMigration = journal.entries.find(
      (entry) => entry.tag === '0006_task_owner_and_product_price',
    )
    const nullableProductMigration = journal.entries.find(
      (entry) => entry.tag === '0007_heavy_colonel_america',
    )

    expect(nullableProductMigration?.when).toBeGreaterThan(
      previousOrderMigration?.when ?? 0,
    )
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
    expect(order.taskOwner).toBe('chompooh')
    expect(order.status).toBe('confirmed')
    expect(order.orderValueThb).toBe('1200.50')
  })

  it('stores a task owner and rejects unknown or missing owners', async () => {
    expect(
      directOrderSchema.safeParse({ ...baseInput, taskOwner: 'meen' }).success,
    ).toBe(true)
    expect(
      directOrderSchema.safeParse({ ...baseInput, taskOwner: 'unknown' })
        .success,
    ).toBe(false)
    expect(
      directOrderSchema.safeParse({ ...baseInput, taskOwner: null }).success,
    ).toBe(false)

    const order = await createDirectOrder({
      ...baseInput,
      taskOwner: 'chompooh',
    })
    expect(order.taskOwner).toBe('chompooh')

    const updated = await updateOrder(order.id, {
      ...baseInput,
      taskOwner: 'kan',
    })
    expect(updated.taskOwner).toBe('kan')
  })

  it('links an uploaded reference image to the order', async () => {
    setObjectStorageForTests({
      putObject: async () => {},
      publicUrl: (key) => `https://cdn.example.test/${key}`,
    })
    const order = await createDirectOrder(baseInput)

    const updated = await setOrderReferenceImage(
      order.id,
      'verabloom/orders/1/reference.png',
    )

    expect(updated.referenceImageObjectKey).toBe(
      'verabloom/orders/1/reference.png',
    )
    expect(updated.referenceImageUrl).toBe(
      'https://cdn.example.test/verabloom/orders/1/reference.png',
    )
    expect((await getOrderById(order.id))?.referenceImageObjectKey).toBe(
      'verabloom/orders/1/reference.png',
    )
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
