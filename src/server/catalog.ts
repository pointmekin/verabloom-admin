import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const priceSchema = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,2})?$/, 'Enter a valid Thai baht amount')
  .nullable()

const variationSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1).max(160),
  startingPriceThb: priceSchema.default(null),
})

const imageSchema = z.object({
  id: z.number().int().positive().optional(),
  objectKey: z
    .string()
    .trim()
    .min(1)
    .refine((value) => value.startsWith('verabloom/'), {
      message: 'Images must use the verabloom storage prefix',
    }),
  url: z.string().optional(),
})

export const productInputSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1).max(240),
  description: z.string().max(50_000).default(''),
  visible: z.boolean().default(true),
  variations: z.array(variationSchema).max(50).default([]),
  images: z.array(imageSchema).max(30).default([]),
})

const productIdSchema = z.object({ id: z.number().int().positive() })

async function assertAdmin() {
  const { hasAdminSession } = await import('./auth-session.server')
  if (!(await hasAdminSession())) throw new Error('Unauthorized')
}

export const listPublicCatalogFn = createServerFn({ method: 'GET' })
  .validator(z.object({ variation: z.string().optional() }))
  .handler(async ({ data }) => {
    const { listCatalogProducts } = await import('./catalog-store.server')
    return listCatalogProducts({ visibleOnly: true, variation: data.variation })
  })

export const listCatalogVariationsFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { listCatalogProducts } = await import('./catalog-store.server')
  const products = await listCatalogProducts({ visibleOnly: true })
  return [
    ...new Set(
      products.flatMap((product) =>
        product.variations.map((item) => item.name),
      ),
    ),
  ].sort((a, b) => a.localeCompare(b))
})

export const getPublicProductFn = createServerFn({ method: 'GET' })
  .validator(productIdSchema)
  .handler(async ({ data }) => {
    const { getCatalogProduct } = await import('./catalog-store.server')
    return getCatalogProduct({ id: data.id, visibleOnly: true })
  })

export const listAdminCatalogFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    await assertAdmin()
    const { listCatalogProducts } = await import('./catalog-store.server')
    return listCatalogProducts({ visibleOnly: false })
  },
)

export const getAdminProductFn = createServerFn({ method: 'GET' })
  .validator(productIdSchema)
  .handler(async ({ data }) => {
    await assertAdmin()
    const { getCatalogProduct } = await import('./catalog-store.server')
    return getCatalogProduct({ id: data.id, visibleOnly: false })
  })

export const saveCatalogProductFn = createServerFn({ method: 'POST' })
  .validator(productInputSchema)
  .handler(async ({ data }) => {
    await assertAdmin()
    const { saveCatalogProduct } = await import('./catalog-store.server')
    return saveCatalogProduct(data)
  })

export const reorderCatalogProductsFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({ orderedIds: z.array(z.number().int().positive()).max(500) }),
  )
  .handler(async ({ data }) => {
    await assertAdmin()
    const { reorderCatalogProducts } = await import('./catalog-store.server')
    await reorderCatalogProducts(data.orderedIds)
    return { ok: true as const }
  })

export const setCatalogVisibilityFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({ id: z.number().int().positive(), visible: z.boolean() }),
  )
  .handler(async ({ data }) => {
    await assertAdmin()
    const { setCatalogVisibility } = await import('./catalog-store.server')
    await setCatalogVisibility(data.id, data.visible)
    return { ok: true as const }
  })

export const uploadProductImageFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      productId: z.number().int().positive(),
      mimeType: z.string(),
      base64: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    await assertAdmin()
    const { getCatalogProduct } = await import('./catalog-store.server')
    const product = await getCatalogProduct({
      id: data.productId,
      visibleOnly: false,
    })
    if (!product) throw new Error('Product not found')
    const { uploadProductImageObject } = await import('./storage.server')
    return uploadProductImageObject(data)
  })
