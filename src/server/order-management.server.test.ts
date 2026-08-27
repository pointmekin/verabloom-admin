import { afterEach, describe, expect, it } from 'vitest'

import {
  clearCatalogMemoryForTests,
  saveCatalogProduct,
} from './catalog-store.server'
import {
  clearCustomerMemoryForTests,
  createCustomer,
  deleteCustomer,
  listCustomers,
} from './customer-store.server'
import {
  clearOrderMemoryForTests,
  createDirectOrder,
  createOrderRequest,
  deleteOrder,
  getOrderById,
  listOrderRequests,
  listOrderRequestsPage,
  updateOrder,
} from './order-store.server'
import { directOrderSchema, orderUpdateSchema } from './admin-order'

process.env.VERABLOOM_CATALOG_STORE = 'memory'
process.env.VERABLOOM_ORDER_STORE = 'memory'
process.env.VERABLOOM_CUSTOMER_STORE = 'memory'
process.env.VERABLOOM_STORAGE = 'memory'

const baseInput = {
  productId: 1,
  quantity: 1,
  taskOwner: 'chompooh' as const,
  customerName: 'Mali',
  socialChannel: 'line' as const,
  socialContact: '@mali',
  phone: '',
  requestDetails: 'Pink flowers',
  deliveryMethod: 'collection' as const,
  recipientName: '',
  recipientPhone: '',
  orderAddress: '',
  requiredDate: '2026-09-10',
  honeypot: '',
}

async function fixture() {
  const product = await saveCatalogProduct({
    name: 'Spring bouquet',
    description: '',
    startingPriceThb: '890',
    visible: true,
    images: [],
  })
  if (!product) throw new Error('fixture failed')
  return { product }
}

describe('customer and order management', () => {
  afterEach(() => {
    clearOrderMemoryForTests()
    clearCustomerMemoryForTests()
    clearCatalogMemoryForTests()
  })

  it('validates money and confirmed status at the server boundary', () => {
    expect(
      directOrderSchema.safeParse({
        ...baseInput,
        status: 'confirmed',
        orderValueThb: '',
        customerId: null,
      }).success,
    ).toBe(false)
    expect(
      directOrderSchema.safeParse({
        ...baseInput,
        status: 'confirmed',
        orderValueThb: '1200.50',
        customerId: null,
      }).success,
    ).toBe(true)
    expect(
      directOrderSchema.safeParse({
        ...baseInput,
        status: 'cancelled',
        orderValueThb: '',
        customerId: null,
      }).success,
    ).toBe(false)
    expect(
      orderUpdateSchema.safeParse({
        ...baseInput,
        status: 'pending_review',
        orderValueThb: '12.345',
        customerId: null,
      }).success,
    ).toBe(false)
  })

  it('requires a task owner, an order value in progress, and postal recipients', () => {
    const { taskOwner: _owner, ...withoutOwner } = baseInput
    expect(
      directOrderSchema.safeParse({
        ...withoutOwner,
        status: 'pending_review',
        orderValueThb: '',
        customerId: null,
      }).success,
    ).toBe(false)
    expect(
      directOrderSchema.safeParse({
        ...baseInput,
        status: 'work_in_progress',
        orderValueThb: '',
        customerId: null,
      }).success,
    ).toBe(false)
    expect(
      directOrderSchema.safeParse({
        ...baseInput,
        status: 'work_in_progress',
        orderValueThb: '1200',
        customerId: null,
      }).success,
    ).toBe(true)
    const postal = {
      ...baseInput,
      deliveryMethod: 'postal' as const,
      orderAddress: '12 Rose Road',
      status: 'pending_review' as const,
      orderValueThb: '',
      customerId: null,
    }
    expect(directOrderSchema.safeParse(postal).success).toBe(false)
    expect(
      directOrderSchema.safeParse({
        ...postal,
        recipientName: 'Nok',
        recipientPhone: '0812345678',
      }).success,
    ).toBe(true)
    expect(
      directOrderSchema.safeParse({
        ...baseInput,
        deliveryMethod: 'messenger',
        orderAddress: 'Nok, 12 Rose Road, 0812345678',
        status: 'pending_review',
        orderValueThb: '',
        customerId: null,
      }).success,
    ).toBe(true)
  })

  it('creates customers, links requests, and keeps the order address independent', async () => {
    const { product } = await fixture()
    const customer = await createCustomer({
      name: 'Mali',
      socialChannel: 'line',
      socialContact: '@mali',
      phone: '',
      defaultAddress: 'Old address',
    })
    const request = await createOrderRequest({
      ...baseInput,
      productId: product.id,
      deliveryMethod: 'postal',
      recipientName: 'Mali',
      recipientPhone: '0812345678',
      orderAddress: customer.defaultAddress ?? '',
    })
    expect(request.taskOwner).toBeNull()
    const updated = await updateOrder(request.id, {
      ...request,
      taskOwner: 'meen',
      customerId: customer.id,
      orderAddress: 'Order address',
      status: 'confirmed',
      orderValueThb: '1200',
    })
    expect(updated.customerId).toBe(customer.id)
    expect(updated.taskOwner).toBe('meen')
    expect(updated.orderAddress).toBe('Order address')
    const replacement = await saveCatalogProduct({
      name: 'Summer bouquet',
      description: '',
      startingPriceThb: '1500',
      visible: false,
      images: [],
    })
    if (!replacement) throw new Error('fixture failed')
    const changed = await updateOrder(request.id, {
      ...updated,
      taskOwner: 'meen',
      productId: replacement.id,
      quantity: 2,
    })
    expect(changed.productNameSnapshot).toBe('Summer bouquet')
    expect(changed.quantity).toBe(2)
    expect((await listCustomers())[0]?.name).toBe('Mali')

    const changedCustomer = await createCustomer({
      id: customer.id,
      name: customer.name,
      socialChannel: customer.socialChannel,
      socialContact: customer.socialContact,
      phone: customer.phone ?? '',
      defaultAddress: 'New address',
    })
    expect(changedCustomer.defaultAddress).toBe('New address')
    expect((await getOrderById(request.id))?.orderAddress).toBe('Order address')
  })

  it('searches and filters newest orders and protects customer history from deletion', async () => {
    const { product } = await fixture()
    const customer = await createCustomer({
      name: 'Nok',
      socialChannel: 'instagram',
      socialContact: '@nok',
      phone: '0812345678',
      defaultAddress: 'Nok address',
    })
    const first = await createDirectOrder({
      ...baseInput,
      productId: product.id,
      customerId: customer.id,
      customerName: customer.name,
      socialChannel: customer.socialChannel,
      socialContact: customer.socialContact,
      phone: customer.phone ?? '',
      status: 'pending_review',
      orderValueThb: '',
    })
    const second = await createDirectOrder({
      ...baseInput,
      productId: product.id,
      customerId: customer.id,
      customerName: customer.name,
      socialChannel: customer.socialChannel,
      socialContact: customer.socialContact,
      phone: customer.phone ?? '',
      status: 'confirmed',
      orderValueThb: '999',
    })
    const delivery = await createDirectOrder({
      ...baseInput,
      productId: product.id,
      customerId: customer.id,
      customerName: customer.name,
      socialChannel: customer.socialChannel,
      socialContact: customer.socialContact,
      phone: customer.phone ?? '',
      deliveryMethod: 'messenger',
      orderAddress: '',
      status: 'pending_review',
      orderValueThb: '',
    })
    expect(delivery.orderAddress).toBe(customer.defaultAddress)
    expect(
      (await listOrderRequests({ search: '0812345678' })).map((o) => o.id),
    ).toEqual([delivery.id, second.id, first.id])
    const page = await listOrderRequestsPage({ search: '0812345678' })
    expect(page.orders.map((o) => o.id)).toEqual([
      delivery.id,
      second.id,
      first.id,
    ])
    expect(page.pendingCount).toBe(2)
    expect(
      (await listOrderRequests({ status: 'confirmed' })).map((o) => o.id),
    ).toEqual([second.id])
    await expect(deleteCustomer(customer.id)).rejects.toThrow(
      'Customer has orders',
    )
    await deleteOrder(delivery.id)
    await deleteOrder(second.id)
    await deleteOrder(first.id)
    await expect(deleteCustomer(customer.id)).resolves.toBe(true)
  })
})
