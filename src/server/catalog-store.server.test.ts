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

  it('keeps variation and image ordering while editing a product', async () => {
    const product = await saveCatalogProduct({
      name: 'Spring',
      description: '**Fresh**',
      visible: true,
      variations: [
        { name: 'Large', startingPriceThb: '1200' },
        { name: 'Small', startingPriceThb: null },
      ],
      images: [
        { objectKey: 'verabloom/products/1/first.jpg', url: '/first' },
        { objectKey: 'verabloom/products/1/second.jpg', url: '/second' },
      ],
    })
    if (!product) throw new Error('product was not saved')

    expect(product.variations.map((item) => item.name)).toEqual([
      'Large',
      'Small',
    ])
    expect(product.images.map((item) => item.objectKey)).toEqual([
      'verabloom/products/1/first.jpg',
      'verabloom/products/1/second.jpg',
    ])

    const edited = await saveCatalogProduct({
      id: product.id,
      name: 'Spring updated',
      description: product.description,
      visible: true,
      variations: [
        {
          id: product.variations[1]?.id,
          name: 'Small',
          startingPriceThb: '600',
        },
      ],
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
    expect(edited.variations).toHaveLength(1)
    expect(edited.variations[0]?.startingPriceThb).toBe('600')
    expect(edited.images).toHaveLength(1)
  })

  it('filters visible products by variation and preserves hidden products for admins', async () => {
    const first = await saveCatalogProduct({
      name: 'One',
      description: '',
      visible: true,
      variations: [{ name: 'Classic', startingPriceThb: null }],
      images: [],
    })
    if (!first) throw new Error('first product was not saved')
    const second = await saveCatalogProduct({
      name: 'Two',
      description: '',
      visible: true,
      variations: [{ name: 'Modern', startingPriceThb: null }],
      images: [],
    })
    if (!second) throw new Error('second product was not saved')
    const third = await saveCatalogProduct({
      name: 'Three',
      description: '',
      visible: true,
      variations: [{ name: 'Classic Tall', startingPriceThb: null }],
      images: [],
    })
    if (!third) throw new Error('third product was not saved')
    await setCatalogVisibility(first.id, false)
    await reorderCatalogProducts([second.id, first.id, third.id])

    expect(
      await listCatalogProducts({ visibleOnly: true, variation: 'classic' }),
    ).toHaveLength(0)
    expect(await listCatalogProducts({ visibleOnly: true })).toHaveLength(2)
    expect(
      await listCatalogProducts({
        visibleOnly: true,
        variation: 'classic tall',
      }),
    ).toHaveLength(1)
    expect(await listCatalogProducts({ visibleOnly: false })).toHaveLength(3)
    expect(
      (await getCatalogProduct({ id: first.id, visibleOnly: false }))?.visible,
    ).toBe(false)
    expect(
      await getCatalogProduct({ id: first.id, visibleOnly: true }),
    ).toBeNull()
  })
})
