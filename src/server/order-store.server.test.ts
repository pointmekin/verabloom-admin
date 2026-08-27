import { afterEach, describe, expect, it } from 'vitest'

import {
  clearCatalogMemoryForTests,
  saveCatalogProduct,
} from './catalog-store.server'
import {
  clearOrderMemoryForTests,
  createOrderRequest,
  getOrderRequestByReference,
} from './order-store.server'
import { getConfiguredSocialContacts, orderRequestSchema } from './order'

process.env.VERABLOOM_CATALOG_STORE = 'memory'
process.env.VERABLOOM_ORDER_STORE = 'memory'
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

describe('order request validation and store', () => {
  afterEach(() => {
    clearOrderMemoryForTests()
    clearCatalogMemoryForTests()
  })

  it('requires an address for delivery but not collection', () => {
    expect(
      orderRequestSchema.safeParse({
        ...baseInput,
        deliveryMethod: 'postal',
      }).success,
    ).toBe(false)
    expect(
      orderRequestSchema.safeParse({
        ...baseInput,
        deliveryMethod: 'messenger',
      }).success,
    ).toBe(false)
    expect(
      orderRequestSchema.safeParse({
        ...baseInput,
        deliveryMethod: 'collection',
        orderAddress: '',
      }).success,
    ).toBe(true)
    const collectionWithoutAddress = { ...baseInput }
    delete (collectionWithoutAddress as { orderAddress?: string }).orderAddress
    expect(
      orderRequestSchema.safeParse({
        ...collectionWithoutAddress,
        deliveryMethod: 'collection',
      }).success,
    ).toBe(true)
  })

  it('rejects fractional or non-positive quantities and invalid dates', () => {
    expect(
      orderRequestSchema.safeParse({ ...baseInput, quantity: 0 }).success,
    ).toBe(false)
    expect(
      orderRequestSchema.safeParse({ ...baseInput, quantity: 1.5 }).success,
    ).toBe(false)
    expect(
      orderRequestSchema.safeParse({
        ...baseInput,
        requiredDate: '2026-02-30',
      }).success,
    ).toBe(false)
  })

  it('snapshots selected catalog details and creates a pending reference', async () => {
    const product = await saveCatalogProduct({
      name: 'Spring bouquet',
      description: '',
      visible: true,
      variations: [{ name: 'Medium', startingPriceThb: '890' }],
      images: [],
    })
    const variation = product?.variations[0]
    if (!product || !variation) throw new Error('fixture was not saved')

    const request = await createOrderRequest({
      ...baseInput,
      productId: product.id,
      variationId: variation.id,
    })

    expect(request.status).toBe('pending_review')
    expect(request.requestReference).toBe('VB-000001')
    expect(request.productNameSnapshot).toBe('Spring bouquet')
    expect(request.variationNameSnapshot).toBe('Medium')
    expect(request.startingPriceThbSnapshot).toBe('890')

    await saveCatalogProduct({
      id: product.id,
      name: 'Renamed bouquet',
      description: '',
      visible: true,
      variations: [
        { id: variation.id, name: 'Large', startingPriceThb: '1200' },
      ],
      images: [],
    })

    expect(request.productNameSnapshot).toBe('Spring bouquet')
    expect(request.variationNameSnapshot).toBe('Medium')
    expect(request.startingPriceThbSnapshot).toBe('890')
    const persisted = await getOrderRequestByReference(request.requestReference)
    expect(persisted?.productNameSnapshot).toBe('Spring bouquet')
    expect(persisted?.variationNameSnapshot).toBe('Medium')
    expect(persisted?.startingPriceThbSnapshot).toBe('890')

    const secondRequest = await createOrderRequest({
      ...baseInput,
      productId: product.id,
      variationId: variation.id,
      customerName: 'Nok',
    })
    expect(secondRequest.requestReference).toBe('VB-000002')
  })

  it('rejects a filled honeypot without creating a request', async () => {
    await expect(
      createOrderRequest({ ...baseInput, honeypot: 'bot-value' }),
    ).rejects.toThrow('Bot submission rejected')
  })

  it('returns only configured social contacts', () => {
    const previousLine = process.env.VERABLOOM_LINE_URL
    const previousInstagram = process.env.VERABLOOM_INSTAGRAM_URL
    const previousTikTok = process.env.VERABLOOM_TIKTOK_URL
    try {
      process.env.VERABLOOM_LINE_URL = 'https://line.example.test/verabloom'
      delete process.env.VERABLOOM_INSTAGRAM_URL
      delete process.env.VERABLOOM_TIKTOK_URL
      expect(getConfiguredSocialContacts()).toEqual([
        {
          channel: 'line',
          url: 'https://line.example.test/verabloom',
        },
      ])
    } finally {
      if (previousLine === undefined) delete process.env.VERABLOOM_LINE_URL
      else process.env.VERABLOOM_LINE_URL = previousLine
      if (previousInstagram === undefined)
        delete process.env.VERABLOOM_INSTAGRAM_URL
      else process.env.VERABLOOM_INSTAGRAM_URL = previousInstagram
      if (previousTikTok === undefined) delete process.env.VERABLOOM_TIKTOK_URL
      else process.env.VERABLOOM_TIKTOK_URL = previousTikTok
    }
  })
})
