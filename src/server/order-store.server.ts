import { randomUUID } from 'node:crypto'

import { and, asc, eq } from 'drizzle-orm'

import { getDatabase } from '#/db'
import { orders, productVariations, products } from '#/db/schema'
import { getCatalogProduct } from './catalog-store.server'
import type { OrderRequestInput } from './order'

export type OrderStatus =
  'pending_review' | 'confirmed' | 'completed' | 'cancelled'

export type OrderRequest = {
  id: number
  requestReference: string
  status: OrderStatus
  productId: number
  variationId: number
  productNameSnapshot: string
  variationNameSnapshot: string
  startingPriceThbSnapshot: string | null
  quantity: number
  customerName: string
  socialChannel: OrderRequestInput['socialChannel']
  socialContact: string
  phone: string | null
  requestDetails: string
  deliveryMethod: OrderRequestInput['deliveryMethod']
  orderAddress: string | null
  requiredDate: string
  orderValueThb: string | null
  internalNote: string | null
  createdAt: Date
  updatedAt: Date
}

type MemoryState = {
  orders: Map<number, OrderRequest>
  nextOrderId: number
}

const memoryGlobal = globalThis as typeof globalThis & {
  __verabloomOrderMemory?: MemoryState
}
const memory =
  memoryGlobal.__verabloomOrderMemory ??
  (memoryGlobal.__verabloomOrderMemory = {
    orders: new Map(),
    nextOrderId: 1,
  })

export function clearOrderMemoryForTests() {
  memory.orders.clear()
  memory.nextOrderId = 1
}

function useDatabase() {
  if (
    process.env.VERABLOOM_ORDER_STORE === 'memory' ||
    process.env.VERABLOOM_CATALOG_STORE === 'memory'
  ) {
    return false
  }
  const databaseUrl =
    process.env.VERABLOOM_DATABASE_ENV === 'test'
      ? (process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL)
      : process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is not configured')
  return true
}

function requestReference(id: number) {
  return `VB-${String(id).padStart(6, '0')}`
}

function normalizeMemoryOrder(order: OrderRequest): OrderRequest {
  return {
    ...order,
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
  }
}

function mapDatabaseOrder(row: typeof orders.$inferSelect): OrderRequest {
  return {
    id: row.id,
    requestReference: row.requestReference,
    status: row.status as OrderStatus,
    productId: row.productId,
    variationId: row.variationId,
    productNameSnapshot: row.productNameSnapshot,
    variationNameSnapshot: row.variationNameSnapshot,
    startingPriceThbSnapshot: row.startingPriceThbSnapshot,
    quantity: row.quantity,
    customerName: row.customerName,
    socialChannel: row.socialChannel as OrderRequestInput['socialChannel'],
    socialContact: row.socialContact,
    phone: row.phone,
    requestDetails: row.requestDetails,
    deliveryMethod: row.deliveryMethod as OrderRequestInput['deliveryMethod'],
    orderAddress: row.orderAddress,
    requiredDate: row.requiredDate,
    orderValueThb: row.orderValueThb,
    internalNote: row.internalNote,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function memoryOrder(
  id: number,
  product: Awaited<ReturnType<typeof getCatalogProduct>>,
  input: OrderRequestInput,
): OrderRequest {
  if (!product) throw new Error('Product not found')
  const variation = product.variations.find(
    (item) => item.id === input.variationId,
  )
  if (!variation) throw new Error('Variation not found')
  const now = new Date()
  return {
    id,
    requestReference: requestReference(id),
    status: 'pending_review',
    productId: product.id,
    variationId: variation.id,
    productNameSnapshot: product.name,
    variationNameSnapshot: variation.name,
    startingPriceThbSnapshot: variation.startingPriceThb,
    quantity: input.quantity,
    customerName: input.customerName,
    socialChannel: input.socialChannel,
    socialContact: input.socialContact,
    phone: input.phone || null,
    requestDetails: input.requestDetails,
    deliveryMethod: input.deliveryMethod,
    orderAddress: input.orderAddress || null,
    requiredDate: input.requiredDate,
    orderValueThb: null,
    internalNote: null,
    createdAt: now,
    updatedAt: now,
  }
}

export async function createOrderRequest(
  input: OrderRequestInput,
): Promise<OrderRequest> {
  if (input.honeypot || input.website) {
    throw new Error('Bot submission rejected')
  }

  if (!useDatabase()) {
    const product = await getCatalogProduct({
      id: input.productId,
      visibleOnly: true,
    })
    const id = memory.nextOrderId
    const order = memoryOrder(id, product, input)
    memory.nextOrderId += 1
    memory.orders.set(id, order)
    return normalizeMemoryOrder(order)
  }

  const db = getDatabase()
  return db.transaction(async (tx) => {
    const productRows = await tx
      .select()
      .from(products)
      .where(and(eq(products.id, input.productId), eq(products.visible, true)))
    if (productRows.length === 0) throw new Error('Product not found')
    const product = productRows[0]

    const variationRows = await tx
      .select()
      .from(productVariations)
      .where(
        and(
          eq(productVariations.id, input.variationId),
          eq(productVariations.productId, product.id),
        ),
      )
    if (variationRows.length === 0) throw new Error('Variation not found')
    const variation = variationRows[0]

    const [created] = await tx
      .insert(orders)
      .values({
        requestReference: `pending-${randomUUID()}`,
        status: 'pending_review',
        productId: product.id,
        variationId: variation.id,
        productNameSnapshot: product.name,
        variationNameSnapshot: variation.name,
        startingPriceThbSnapshot: variation.startingPriceThb,
        quantity: input.quantity,
        customerName: input.customerName,
        socialChannel: input.socialChannel,
        socialContact: input.socialContact,
        phone: input.phone || null,
        requestDetails: input.requestDetails,
        deliveryMethod: input.deliveryMethod,
        orderAddress: input.orderAddress || null,
        requiredDate: input.requiredDate,
      })
      .returning()

    const [saved] = await tx
      .update(orders)
      .set({ requestReference: requestReference(created.id) })
      .where(eq(orders.id, created.id))
      .returning()
    return mapDatabaseOrder(saved)
  })
}

export async function getOrderRequestByReference(reference: string) {
  if (!useDatabase()) {
    const order = [...memory.orders.values()].find(
      (item) => item.requestReference === reference,
    )
    return order ? normalizeMemoryOrder(order) : null
  }

  const rows = await getDatabase()
    .select()
    .from(orders)
    .where(eq(orders.requestReference, reference))
  return rows.length > 0 ? mapDatabaseOrder(rows[0]) : null
}

export async function listOrderRequests() {
  if (!useDatabase()) {
    return [...memory.orders.values()]
      .sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id,
      )
      .map(normalizeMemoryOrder)
  }

  const rows = await getDatabase()
    .select()
    .from(orders)
    .orderBy(asc(orders.createdAt), asc(orders.id))
  return rows.reverse().map(mapDatabaseOrder)
}
