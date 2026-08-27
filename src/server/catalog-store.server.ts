import { and, asc, eq, inArray, notInArray } from 'drizzle-orm'

import { getDatabase } from '#/db'
import { productImages, products } from '#/db/schema'
import { getObjectStorageUrl } from './storage.server'

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
  startingPriceThb: string | null
  visible: boolean
  displayOrder: number
  images: CatalogImage[]
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
  startingPriceThb: string | null
  visible: boolean
  images: ProductInputImage[]
}

type MemoryProduct = Omit<CatalogProduct, 'images'>

type MemoryState = {
  products: Map<number, MemoryProduct>
  images: Map<number, CatalogImage & { productId: number }>
  nextProductId: number
  nextImageId: number
}

const memoryGlobal = globalThis as typeof globalThis & {
  __verabloomCatalogMemory?: MemoryState
}
const memory =
  memoryGlobal.__verabloomCatalogMemory ??
  (memoryGlobal.__verabloomCatalogMemory = {
    products: new Map(),
    images: new Map(),
    nextProductId: 1,
    nextImageId: 1,
  })

export function clearCatalogMemoryForTests() {
  memory.products.clear()
  memory.images.clear()
  memory.nextProductId = 1
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

export async function listCatalogProducts({
  visibleOnly,
}: {
  visibleOnly: boolean
}) {
  if (!useDatabase()) return memoryProducts(visibleOnly)

  const db = getDatabase()
  const productRows = await db
    .select()
    .from(products)
    .where(visibleOnly ? eq(products.visible, true) : undefined)
    .orderBy(asc(products.displayOrder), asc(products.id))
  if (productRows.length === 0) return []

  const ids = productRows.map((product) => product.id)
  const imageRows = await db
    .select()
    .from(productImages)
    .where(inArray(productImages.productId, ids))
    .orderBy(asc(productImages.displayOrder), asc(productImages.id))

  return productRows.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    startingPriceThb: product.startingPriceThb,
    visible: product.visible,
    displayOrder: product.displayOrder,
    images: imageRows
      .filter((image) => image.productId === product.id)
      .map((image) => ({
        id: image.id,
        objectKey: image.objectKey,
        url: getObjectStorageUrl(image.objectKey),
        displayOrder: image.displayOrder,
      })),
  }))
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
  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, id))
    .orderBy(asc(productImages.displayOrder), asc(productImages.id))
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    startingPriceThb: product.startingPriceThb,
    visible: product.visible,
    displayOrder: product.displayOrder,
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
      startingPriceThb: input.startingPriceThb,
      visible: input.visible,
      displayOrder: existing?.displayOrder ?? memory.products.size,
    }
    memory.products.set(id, product)

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
          startingPriceThb: input.startingPriceThb,
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
          startingPriceThb: input.startingPriceThb,
          visible: input.visible,
          displayOrder: (await tx.select({ id: products.id }).from(products))
            .length,
        })
        .returning()
      savedId = created.id
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
