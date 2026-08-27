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
  variationId: 1,
  quantity: 1,
  customerName: 'Mali',
  socialChannel: 'line' as const,
  socialContact: '@mali',
  phone: '',
  requestDetails: 'Pink flowers',
  deliveryMethod: 'collection' as const,
  orderAddress: '',
  requiredDate: '2026-09-10',
  honeypot: '',
}

async function fixture() {
  const product = await saveCatalogProduct({
    name: 'Spring bouquet',
    description: '',
    visible: true,
    variations: [{ name: 'Medium', startingPriceThb: '890' }],
    images: [],
  })
  if (!product || !product.variations[0]) throw new Error('fixture failed')
  return { product, variation: product.variations[0] }
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

  it('creates customers, links requests, and keeps the order address independent', async () => {
    const { product, variation } = await fixture()
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
      variationId: variation.id,
      deliveryMethod: 'postal',
      orderAddress: customer.defaultAddress ?? '',
    })
    const updated = await updateOrder(request.id, {
      ...request,
      customerId: customer.id,
      orderAddress: 'Order address',
      status: 'confirmed',
      orderValueThb: '1200',
    })
    expect(updated.customerId).toBe(customer.id)
    expect(updated.orderAddress).toBe('Order address')
    const replacement = await saveCatalogProduct({
      name: 'Summer bouquet',
      description: '',
      visible: false,
      variations: [{ name: 'Large', startingPriceThb: '1500' }],
      images: [],
    })
    if (!replacement || !replacement.variations[0])
      throw new Error('fixture failed')
    const changed = await updateOrder(request.id, {
      ...updated,
      productId: replacement.id,
      variationId: replacement.variations[0].id,
      quantity: 2,
    })
    expect(changed.productNameSnapshot).toBe('Summer bouquet')
    expect(changed.variationNameSnapshot).toBe('Large')
    expect(changed.quantity).toBe(2)
    const noPriceProduct = await saveCatalogProduct({
      name: 'No-price bouquet',
      description: '',
      visible: false,
      variations: [{ name: 'Custom', startingPriceThb: null }],
      images: [],
    })
    if (!noPriceProduct || !noPriceProduct.variations[0])
      throw new Error('fixture failed')
    const noPriceChanged = await updateOrder(changed.id, {
      ...changed,
      productId: noPriceProduct.id,
      variationId: noPriceProduct.variations[0].id,
    })
    expect(noPriceChanged.startingPriceThbSnapshot).toBeNull()
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
    const { product, variation } = await fixture()
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
      variationId: variation.id,
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
      variationId: variation.id,
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
      variationId: variation.id,
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
