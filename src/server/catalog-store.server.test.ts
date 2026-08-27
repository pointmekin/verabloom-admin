import { afterEach, describe, expect, it } from 'vitest'
import {
  clearCatalogMemoryForTests,
  getCatalogProduct,
  listCatalogProducts,
  reorderCatalogProducts,
  saveCatalogProduct,
  setCatalogVisibility,
} from './catalog-store.server'

process.env.VERABLOOM_CATALOG_STORE = 'memory'
process.env.VERABLOOM_STORAGE = 'memory'

describe('catalog store', () => {
  afterEach(() => clearCatalogMemoryForTests())

  it('keeps the starting price and image ordering while editing a product', async () => {
    const product = await saveCatalogProduct({
      name: 'Spring',
      description: '**Fresh**',
      startingPriceThb: '1200',
      visible: true,
      images: [
        { objectKey: 'verabloom/products/1/first.jpg', url: '/first' },
        { objectKey: 'verabloom/products/1/second.jpg', url: '/second' },
      ],
    })
    if (!product) throw new Error('product was not saved')

    expect(product.startingPriceThb).toBe('1200')
    expect(product.images.map((item) => item.objectKey)).toEqual([
      'verabloom/products/1/first.jpg',
      'verabloom/products/1/second.jpg',
    ])

    const edited = await saveCatalogProduct({
      id: product.id,
      name: 'Spring updated',
      description: product.description,
      startingPriceThb: '600',
      visible: true,
      images: [
        {
          id: product.images[1]?.id,
          objectKey: product.images[1]?.objectKey ?? '',
          url: '/second',
        },
      ],
    })
    if (!edited) throw new Error('product was not edited')

    expect(edited.name).toBe('Spring updated')
    expect(edited.startingPriceThb).toBe('600')
    expect(edited.images).toHaveLength(1)
  })

  it('hides invisible products from the public catalog only', async () => {
    const first = await saveCatalogProduct({
      name: 'One',
      description: '',
      startingPriceThb: null,
      visible: true,
      images: [],
    })
    if (!first) throw new Error('first product was not saved')
    const second = await saveCatalogProduct({
      name: 'Two',
      description: '',
      startingPriceThb: null,
      visible: true,
      images: [],
    })
    if (!second) throw new Error('second product was not saved')
    const third = await saveCatalogProduct({
      name: 'Three',
      description: '',
      startingPriceThb: null,
      visible: true,
      images: [],
    })
    if (!third) throw new Error('third product was not saved')
    await setCatalogVisibility(first.id, false)
    await reorderCatalogProducts([second.id, first.id, third.id])

    expect(await listCatalogProducts({ visibleOnly: true })).toHaveLength(2)
    expect(await listCatalogProducts({ visibleOnly: false })).toHaveLength(3)
    expect(
      (await getCatalogProduct({ id: first.id, visibleOnly: false }))?.visible,
    ).toBe(false)
    expect(
      await getCatalogProduct({ id: first.id, visibleOnly: true }),
    ).toBeNull()
  })
})
