import { and, asc, eq, inArray, notInArray } from 'drizzle-orm'

import { getDatabase } from '#/db'
import { productImages, productVariations, products } from '#/db/schema'
import { getObjectStorageUrl } from './storage.server'

export type CatalogVariation = {
  id: number
  name: string
  startingPriceThb: string | null
  displayOrder: number
}

export type CatalogImage = {
  id: number
  objectKey: string
  url: string
  displayOrder: number
}

export type CatalogProduct = {
  id: number
  name: string
  description: string
  visible: boolean
  displayOrder: number
  variations: CatalogVariation[]
  images: CatalogImage[]
}

export type ProductInputVariation = {
  id?: number
  name: string
  startingPriceThb: string | null
}

export type ProductInputImage = {
  id?: number
  objectKey: string
  url?: string
}

export type ProductInput = {
  id?: number
  name: string
  description: string
  visible: boolean
  variations: ProductInputVariation[]
  images: ProductInputImage[]
}

type MemoryProduct = Omit<CatalogProduct, 'variations' | 'images'>

type MemoryState = {
  products: Map<number, MemoryProduct>
  variations: Map<number, CatalogVariation & { productId: number }>
  images: Map<number, CatalogImage & { productId: number }>
  nextProductId: number
  nextVariationId: number
  nextImageId: number
}

const memoryGlobal = globalThis as typeof globalThis & {
  __verabloomCatalogMemory?: MemoryState
}
const memory =
  memoryGlobal.__verabloomCatalogMemory ??
  (memoryGlobal.__verabloomCatalogMemory = {
    products: new Map(),
    variations: new Map(),
    images: new Map(),
    nextProductId: 1,
    nextVariationId: 1,
    nextImageId: 1,
  })

export function clearCatalogMemoryForTests() {
  memory.products.clear()
  memory.variations.clear()
  memory.images.clear()
  memory.nextProductId = 1
  memory.nextVariationId = 1
  memory.nextImageId = 1
}

function useDatabase() {
  if (process.env.VERABLOOM_CATALOG_STORE === 'memory') return false
  const databaseUrl =
    process.env.VERABLOOM_DATABASE_ENV === 'test'
      ? (process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL)
      : process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is not configured')
  return true
}

function sortByDisplayOrder<T extends { displayOrder: number; id: number }>(
  items: T[],
) {
  return items.sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
}

function memoryProduct(product: MemoryProduct): CatalogProduct {
  return {
    ...product,
    variations: sortByDisplayOrder(
      [...memory.variations.values()]
        .filter((variation) => variation.productId === product.id)
        .map(({ productId: _productId, ...variation }) => variation),
    ),
    images: sortByDisplayOrder(
      [...memory.images.values()]
        .filter((image) => image.productId === product.id)
        .map(({ productId: _productId, ...image }) => image),
    ),
  }
}

function memoryProducts(visibleOnly: boolean) {
  return sortByDisplayOrder(
    [...memory.products.values()]
      .filter((product) => !visibleOnly || product.visible)
      .map(memoryProduct),
  )
}

function filterByVariation(items: CatalogProduct[], variation?: string) {
  const query = variation?.trim().toLocaleLowerCase()
  if (!query) return items
  return items.filter((product) =>
    product.variations.some((item) => item.name.toLocaleLowerCase() === query),
  )
}

export async function listCatalogProducts({
  visibleOnly,
  variation,
}: {
  visibleOnly: boolean
  variation?: string
}) {
  if (!useDatabase())
    return filterByVariation(memoryProducts(visibleOnly), variation)

  const db = getDatabase()
  const productRows = await db
    .select()
    .from(products)
    .where(visibleOnly ? eq(products.visible, true) : undefined)
    .orderBy(asc(products.displayOrder), asc(products.id))
  if (productRows.length === 0) return []

  const ids = productRows.map((product) => product.id)
  const variationRows = await db
    .select()
    .from(productVariations)
    .where(inArray(productVariations.productId, ids))
    .orderBy(asc(productVariations.displayOrder), asc(productVariations.id))
  const imageRows = await db
    .select()
    .from(productImages)
    .where(inArray(productImages.productId, ids))
    .orderBy(asc(productImages.displayOrder), asc(productImages.id))

  const result = productRows.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    visible: product.visible,
    displayOrder: product.displayOrder,
    variations: variationRows
      .filter((row) => row.productId === product.id)
      .map((row) => ({
        id: row.id,
        name: row.name,
        startingPriceThb: row.startingPriceThb,
        displayOrder: row.displayOrder,
      })),
    images: imageRows
      .filter((image) => image.productId === product.id)
      .map((image) => ({
        id: image.id,
        objectKey: image.objectKey,
        url: getObjectStorageUrl(image.objectKey),
        displayOrder: image.displayOrder,
      })),
  }))
  return filterByVariation(result, variation)
}

export async function getCatalogProduct({
  id,
  visibleOnly,
}: {
  id: number
  visibleOnly: boolean
}) {
  if (!useDatabase()) {
    const product = memory.products.get(id)
    return product && (!visibleOnly || product.visible)
      ? memoryProduct(product)
      : null
  }

  const db = getDatabase()
  const productRows = await db
    .select()
    .from(products)
    .where(
      visibleOnly
        ? and(eq(products.id, id), eq(products.visible, true))
        : eq(products.id, id),
    )
  if (productRows.length === 0) return null
  const product = productRows[0]
  const variations = await db
    .select()
    .from(productVariations)
    .where(eq(productVariations.productId, id))
    .orderBy(asc(productVariations.displayOrder), asc(productVariations.id))
  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, id))
    .orderBy(asc(productImages.displayOrder), asc(productImages.id))
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    visible: product.visible,
    displayOrder: product.displayOrder,
    variations: variations.map((variation) => ({
      id: variation.id,
      name: variation.name,
      startingPriceThb: variation.startingPriceThb,
      displayOrder: variation.displayOrder,
    })),
    images: images.map((image) => ({
      id: image.id,
      objectKey: image.objectKey,
      url: getObjectStorageUrl(image.objectKey),
      displayOrder: image.displayOrder,
    })),
  } satisfies CatalogProduct
}

export async function saveCatalogProduct(input: ProductInput) {
  if (!useDatabase()) {
    const id = input.id ?? memory.nextProductId++
    const existing = memory.products.get(id)
    const product: MemoryProduct = {
      id,
      name: input.name,
      description: input.description,
      visible: input.visible,
      displayOrder: existing?.displayOrder ?? memory.products.size,
    }
    memory.products.set(id, product)

    const variationIds = new Set<number>()
    input.variations.forEach((variation, index) => {
      const variationId = variation.id ?? memory.nextVariationId++
      variationIds.add(variationId)
      memory.variations.set(variationId, {
        id: variationId,
        productId: id,
        name: variation.name,
        startingPriceThb: variation.startingPriceThb,
        displayOrder: index,
      })
    })
    for (const [variationId, variation] of memory.variations) {
      if (variation.productId === id && !variationIds.has(variationId)) {
        memory.variations.delete(variationId)
      }
    }

    const imageIds = new Set<number>()
    input.images.forEach((image, index) => {
      const imageId = image.id ?? memory.nextImageId++
      imageIds.add(imageId)
      memory.images.set(imageId, {
        id: imageId,
        productId: id,
        objectKey: image.objectKey,
        url: image.url ?? getObjectStorageUrl(image.objectKey),
        displayOrder: index,
      })
    })
    for (const [imageId, image] of memory.images) {
      if (image.productId === id && !imageIds.has(imageId))
        memory.images.delete(imageId)
    }
    return memoryProduct(product)
  }

  const db = getDatabase()
  const productId = await db.transaction(async (tx) => {
    let savedId: number
    if (input.id) {
      savedId = input.id
      const updatedRows = await tx
        .update(products)
        .set({
          name: input.name,
          description: input.description,
          visible: input.visible,
          updatedAt: new Date(),
        })
        .where(eq(products.id, savedId))
        .returning()
      if (updatedRows.length === 0) throw new Error('Product not found')
    } else {
      const [created] = await tx
        .insert(products)
        .values({
          name: input.name,
          description: input.description,
          visible: input.visible,
          displayOrder: (await tx.select({ id: products.id }).from(products))
            .length,
        })
        .returning()
      savedId = created.id
    }

    const currentVariations = await tx
      .select({ id: productVariations.id })
      .from(productVariations)
      .where(eq(productVariations.productId, savedId))
    const variationIds = input.variations.flatMap((variation) =>
      variation.id ? [variation.id] : [],
    )
    if (variationIds.length > 0) {
      await tx
        .delete(productVariations)
        .where(
          and(
            eq(productVariations.productId, savedId),
            notInArray(productVariations.id, variationIds),
          ),
        )
    } else if (currentVariations.length > 0) {
      await tx
        .delete(productVariations)
        .where(eq(productVariations.productId, savedId))
    }
    for (const [index, variation] of input.variations.entries()) {
      if (variation.id) {
        await tx
          .update(productVariations)
          .set({
            name: variation.name,
            startingPriceThb: variation.startingPriceThb,
            displayOrder: index,
          })
          .where(
            and(
              eq(productVariations.id, variation.id),
              eq(productVariations.productId, savedId),
            ),
          )
      } else {
        await tx.insert(productVariations).values({
          productId: savedId,
          name: variation.name,
          startingPriceThb: variation.startingPriceThb,
          displayOrder: index,
        })
      }
    }

    const currentImages = await tx
      .select({ id: productImages.id })
      .from(productImages)
      .where(eq(productImages.productId, savedId))
    const imageIds = input.images.flatMap((image) =>
      image.id ? [image.id] : [],
    )
    if (imageIds.length > 0) {
      await tx
        .delete(productImages)
        .where(
          and(
            eq(productImages.productId, savedId),
            notInArray(productImages.id, imageIds),
          ),
        )
    } else if (currentImages.length > 0) {
      await tx.delete(productImages).where(eq(productImages.productId, savedId))
    }
    for (const [index, image] of input.images.entries()) {
      if (image.id) {
        await tx
          .update(productImages)
          .set({ objectKey: image.objectKey, displayOrder: index })
          .where(
            and(
              eq(productImages.id, image.id),
              eq(productImages.productId, savedId),
            ),
          )
      } else {
        await tx.insert(productImages).values({
          productId: savedId,
          objectKey: image.objectKey,
          displayOrder: index,
        })
      }
    }
    return savedId
  })
  return getCatalogProduct({ id: productId, visibleOnly: false })
}

export async function reorderCatalogProducts(orderedIds: number[]) {
  if (!useDatabase()) {
    orderedIds.forEach((id, index) => {
      const product = memory.products.get(id)
      if (product) memory.products.set(id, { ...product, displayOrder: index })
    })
    return memoryProducts(false)
  }
  const db = getDatabase()
  await db.transaction(async (tx) => {
    for (const [index, id] of orderedIds.entries()) {
      await tx
        .update(products)
        .set({ displayOrder: index })
        .where(eq(products.id, id))
    }
  })
  return listCatalogProducts({ visibleOnly: false })
}

export async function setCatalogVisibility(id: number, visible: boolean) {
  if (!useDatabase()) {
    const product = memory.products.get(id)
    if (!product) throw new Error('Product not found')
    memory.products.set(id, { ...product, visible })
    return memoryProduct({ ...product, visible })
  }
  const db = getDatabase()
  await db
    .update(products)
    .set({ visible, updatedAt: new Date() })
    .where(eq(products.id, id))
  return getCatalogProduct({ id, visibleOnly: false })
}
