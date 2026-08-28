import { randomUUID } from 'node:crypto'

import { and, desc, eq, ilike, or } from 'drizzle-orm'

import { getDatabase } from '#/db'
import { orders, products } from '#/db/schema'
import { isTeamMember, normalizeTeamMembers } from '#/lib/team-members'
import type { TeamMember } from '#/lib/team-members'
import { getObjectStorageUrl } from './storage.server'
import { getCatalogProduct } from './catalog-store.server'
import type { OrderRequestInput } from './order'

export type OrderStatus =
  | 'pending_review'
  | 'confirmed'
  | 'work_in_progress'
  | 'completed'
  | 'cancelled'

export type TaskOwnerValue = TeamMember | TeamMember[] | null

export type OrderRequest = {
  id: number
  requestReference: string
  status: OrderStatus
  productId: number | null
  productNameSnapshot: string
  quantity: number
  taskOwner: TaskOwnerValue
  referenceImageObjectKey: string | null
  referenceImageUrl: string | null
  customerId: number | null
  customerName: string
  socialChannel: OrderRequestInput['socialChannel']
  socialContact: string
  phone: string | null
  requestDetails: string
  deliveryMethod: OrderRequestInput['deliveryMethod']
  recipientName: string | null
  recipientPhone: string | null
  orderAddress: string | null
  requiredDate: string
  orderValueThb: string | null
  internalNote: string | null
  createdAt: Date
  updatedAt: Date
}

type LegacyOrderEditableInput = {
  productId?: number
  quantity?: number
  taskOwner: TeamMember | readonly TeamMember[]
  customerId?: number | null
  customerName: string
  socialChannel: OrderRequestInput['socialChannel']
  socialContact: string
  phone?: string | null
  requestDetails: string
  deliveryMethod: OrderRequestInput['deliveryMethod']
  recipientName?: string | null
  recipientPhone?: string | null
  orderAddress?: string | null
  requiredDate: string
  status: OrderStatus
  orderValueThb?: string | null
  internalNote?: string | null
}

export type OrderEditableInput = {
  productNameSnapshot: string
  taskOwner: TeamMember | readonly TeamMember[]
  socialContact: string
  phone?: string | null
  requestDetails: string
  deliveryMethod: 'postal' | 'messenger' | 'collection'
  orderAddress?: string | null
  requiredDate: string
  orderValueThb: string
}

export type DirectOrderInput = OrderEditableInput

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
  const owners = normalizeTeamMembers(row.taskOwner)
  return {
    id: row.id,
    requestReference: row.requestReference,
    status: row.status as OrderStatus,
    productId: row.productId,
    productNameSnapshot: row.productNameSnapshot,
    quantity: row.quantity,
    taskOwner: owners.length > 0 ? owners : null,
    referenceImageObjectKey: row.referenceImageObjectKey,
    referenceImageUrl: row.referenceImageObjectKey
      ? getObjectStorageUrl(row.referenceImageObjectKey)
      : null,
    customerId: row.customerId,
    customerName: row.customerName,
    socialChannel: row.socialChannel as OrderRequestInput['socialChannel'],
    socialContact: row.socialContact,
    phone: row.phone,
    requestDetails: row.requestDetails,
    deliveryMethod: row.deliveryMethod as OrderRequestInput['deliveryMethod'],
    recipientName: row.recipientName,
    recipientPhone: row.recipientPhone,
    orderAddress: row.orderAddress,
    requiredDate: row.requiredDate,
    orderValueThb: row.orderValueThb,
    internalNote: row.internalNote,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function normalizedValue(value?: string | null) {
  return value?.trim() || null
}

function assertOrderFormInput(input: OrderEditableInput) {
  if (!input.productNameSnapshot.trim()) {
    throw new Error('Flower type and size are required')
  }
  if (!input.socialContact.trim()) {
    throw new Error('LINE name is required')
  }
  const owners = Array.isArray(input.taskOwner)
    ? input.taskOwner
    : [input.taskOwner]
  if (owners.length === 0 || !owners.every(isTeamMember)) {
    throw new Error('Choose a task owner')
  }
  if (!['postal', 'messenger', 'collection'].includes(input.deliveryMethod)) {
    throw new Error('Choose a valid delivery method')
  }
  if (!/^\d+(?:\.\d{1,2})?$/.test(input.orderValueThb.trim())) {
    throw new Error('Enter a valid Thai baht amount')
  }
}

function taskOwnerValue(value: TeamMember | readonly TeamMember[]) {
  const owners = normalizeTeamMembers(value)
  return Array.isArray(value) ? owners : owners[0] ?? null
}

const statusesRequiringValue: OrderStatus[] = [
  'confirmed',
  'work_in_progress',
  'completed',
]

function assertStatusUpdate(status: OrderStatus, orderValueThb: string | null) {
  if (statusesRequiringValue.includes(status) && !orderValueThb?.trim()) {
    throw new Error('Confirmed orders require an order value')
  }
}

function nextMemoryId() {
  const id = memory.nextOrderId
  memory.nextOrderId += 1
  return id
}

async function catalogSnapshot(productId: number, visibleOnly: boolean) {
  const product = await getCatalogProduct({ id: productId, visibleOnly })
  if (!product) throw new Error('Product not found')
  return product
}

/** A public request has no task owner, so the owner stays nullable here. */
type MemoryOrderInput = Omit<LegacyOrderEditableInput, 'taskOwner'> & {
  taskOwner: TeamMember | null
}

function memoryOrderFromProduct(
  id: number,
  product: Awaited<ReturnType<typeof getCatalogProduct>>,
  input: MemoryOrderInput,
  quantity: number,
  status: OrderStatus,
): OrderRequest {
  if (!product) throw new Error('Product not found')
  const now = new Date()
  return {
    id,
    requestReference: requestReference(id),
    status,
    productId: product.id,
    productNameSnapshot: product.name,
    quantity,
    taskOwner: input.taskOwner,
    referenceImageObjectKey: null,
    referenceImageUrl: null,
    customerId: input.customerId ?? null,
    customerName: input.customerName,
    socialChannel: input.socialChannel,
    socialContact: input.socialContact,
    phone: normalizedValue(input.phone),
    requestDetails: input.requestDetails,
    deliveryMethod: input.deliveryMethod,
    recipientName: normalizedValue(input.recipientName),
    recipientPhone: normalizedValue(input.recipientPhone),
    orderAddress: normalizedValue(input.orderAddress),
    requiredDate: input.requiredDate,
    orderValueThb: normalizedValue(input.orderValueThb),
    internalNote: normalizedValue(input.internalNote),
    createdAt: now,
    updatedAt: now,
  }
}

export async function createOrderRequest(
  input: OrderRequestInput,
): Promise<OrderRequest> {
  if (input.honeypot || input.website)
    throw new Error('Bot submission rejected')
  const editable: MemoryOrderInput = {
    taskOwner: null,
    customerId: null,
    customerName: input.customerName,
    socialChannel: input.socialChannel,
    socialContact: input.socialContact,
    phone: input.phone,
    requestDetails: input.requestDetails,
    deliveryMethod: input.deliveryMethod,
    recipientName: input.recipientName,
    recipientPhone: input.recipientPhone,
    orderAddress: input.orderAddress,
    requiredDate: input.requiredDate,
    status: 'pending_review',
  }

  if (!useDatabase()) {
    const product = await catalogSnapshot(input.productId, true)
    const order = memoryOrderFromProduct(
      nextMemoryId(),
      product,
      editable,
      input.quantity,
      'pending_review',
    )
    memory.orders.set(order.id, order)
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
    const [created] = await tx
      .insert(orders)
      .values({
        requestReference: `pending-${randomUUID()}`,
        status: 'pending_review',
        productId: product.id,
        productNameSnapshot: product.name,
        quantity: input.quantity,
        taskOwner: null,
        customerId: null,
        customerName: input.customerName,
        socialChannel: input.socialChannel,
        socialContact: input.socialContact,
        phone: normalizedValue(input.phone),
        requestDetails: input.requestDetails,
        deliveryMethod: input.deliveryMethod,
        recipientName: normalizedValue(input.recipientName),
        recipientPhone: normalizedValue(input.recipientPhone),
        orderAddress: normalizedValue(input.orderAddress),
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

export async function createDirectOrder(input: DirectOrderInput) {
  assertOrderFormInput(input)
  if (!useDatabase()) {
    const id = nextMemoryId()
    const now = new Date()
    const order: OrderRequest = {
      id,
      requestReference: requestReference(id),
      status: 'confirmed',
      productId: null,
      productNameSnapshot: input.productNameSnapshot.trim(),
      quantity: 1,
      taskOwner: taskOwnerValue(input.taskOwner),
      referenceImageObjectKey: null,
      referenceImageUrl: null,
      customerId: null,
      customerName: input.socialContact.trim(),
      socialChannel: 'line',
      socialContact: input.socialContact.trim(),
      phone: normalizedValue(input.phone),
      requestDetails: input.requestDetails,
      deliveryMethod: input.deliveryMethod,
      recipientName: null,
      recipientPhone: null,
      orderAddress: normalizedValue(input.orderAddress),
      requiredDate: input.requiredDate,
      orderValueThb: input.orderValueThb.trim(),
      internalNote: null,
      createdAt: now,
      updatedAt: now,
    }
    memory.orders.set(order.id, order)
    return normalizeMemoryOrder(order)
  }
  const [created] = await getDatabase()
    .insert(orders)
    .values({
      requestReference: `pending-${randomUUID()}`,
      status: 'confirmed',
      productId: null,
      productNameSnapshot: input.productNameSnapshot.trim(),
      quantity: 1,
      taskOwner: normalizeTeamMembers(input.taskOwner),
      customerId: null,
      customerName: input.socialContact.trim(),
      socialChannel: 'line',
      socialContact: input.socialContact.trim(),
      phone: normalizedValue(input.phone),
      requestDetails: input.requestDetails,
      deliveryMethod: input.deliveryMethod,
      recipientName: null,
      recipientPhone: null,
      orderAddress: normalizedValue(input.orderAddress),
      requiredDate: input.requiredDate,
      orderValueThb: input.orderValueThb.trim(),
      internalNote: null,
    })
    .returning()
  const [saved] = await getDatabase()
    .update(orders)
    .set({ requestReference: requestReference(created.id) })
    .where(eq(orders.id, created.id))
    .returning()
  return mapDatabaseOrder(saved)
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
  return rows[0] ? mapDatabaseOrder(rows[0]) : null
}

export async function getOrderById(id: number) {
  if (!useDatabase()) {
    const order = memory.orders.get(id)
    return order ? normalizeMemoryOrder(order) : null
  }
  const rows = await getDatabase()
    .select()
    .from(orders)
    .where(eq(orders.id, id))
  return rows[0] ? mapDatabaseOrder(rows[0]) : null
}

function memorySearch(order: OrderRequest, query: string) {
  const normalized = query.toLocaleLowerCase()
  return [
    order.requestReference,
    order.customerName,
    order.socialContact,
    order.phone ?? '',
  ].some((value) => value.toLocaleLowerCase().includes(normalized))
}

export async function listOrderRequests(options?: {
  search?: string
  status?: OrderStatus
}) {
  const query = options?.search?.trim()
  if (!useDatabase()) {
    return [...memory.orders.values()]
      .filter((order) => !query || memorySearch(order, query))
      .filter((order) => !options?.status || order.status === options.status)
      .sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id,
      )
      .map(normalizeMemoryOrder)
  }
  const conditions = []
  if (query) {
    conditions.push(
      or(
        ilike(orders.requestReference, `%${query}%`),
        ilike(orders.customerName, `%${query}%`),
        ilike(orders.socialContact, `%${query}%`),
        ilike(orders.phone, `%${query}%`),
      ),
    )
  }
  if (options?.status) conditions.push(eq(orders.status, options.status))
  const rows = await getDatabase()
    .select()
    .from(orders)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(orders.createdAt), desc(orders.id))
  return rows.map(mapDatabaseOrder)
}

export async function listOrderRequestsPage(options?: {
  search?: string
  status?: OrderStatus
}) {
  const [matchingOrders, pendingOrders] = await Promise.all([
    listOrderRequests(options),
    listOrderRequests({ status: 'pending_review' }),
  ])
  return { orders: matchingOrders, pendingCount: pendingOrders.length }
}

export async function updateOrder(id: number, input: OrderEditableInput) {
  assertOrderFormInput(input)
  if (!useDatabase()) {
    const existing = memory.orders.get(id)
    if (!existing) throw new Error('Order not found')
    const updated: OrderRequest = {
      ...existing,
      productNameSnapshot: input.productNameSnapshot.trim(),
      taskOwner: taskOwnerValue(input.taskOwner),
      customerName: input.socialContact.trim(),
      socialChannel: 'line',
      socialContact: input.socialContact.trim(),
      phone: normalizedValue(input.phone),
      requestDetails: input.requestDetails,
      deliveryMethod: input.deliveryMethod,
      orderAddress: normalizedValue(input.orderAddress),
      requiredDate: input.requiredDate,
      orderValueThb: input.orderValueThb.trim(),
      updatedAt: new Date(),
    }
    memory.orders.set(id, updated)
    return normalizeMemoryOrder(updated)
  }
  const updatedRows = await getDatabase()
    .update(orders)
    .set({
      productNameSnapshot: input.productNameSnapshot.trim(),
      customerName: input.socialContact.trim(),
      socialChannel: 'line',
      socialContact: input.socialContact.trim(),
      phone: normalizedValue(input.phone),
      requestDetails: input.requestDetails,
      deliveryMethod: input.deliveryMethod,
      orderAddress: normalizedValue(input.orderAddress),
      requiredDate: input.requiredDate,
      orderValueThb: input.orderValueThb.trim(),
      updatedAt: new Date(),
      taskOwner: normalizeTeamMembers(input.taskOwner),
    })
    .where(eq(orders.id, id))
    .returning()
  if (updatedRows.length === 0) throw new Error('Order not found')
  return mapDatabaseOrder(updatedRows[0])
}
export async function setOrderReferenceImage(id: number, objectKey: string) {
  if (!objectKey.trim()) throw new Error('Image object key is required')
  if (!useDatabase()) {
    const existing = memory.orders.get(id)
    if (!existing) throw new Error('Order not found')
    const updated: OrderRequest = {
      ...existing,
      referenceImageObjectKey: objectKey,
      referenceImageUrl: getObjectStorageUrl(objectKey),
      updatedAt: new Date(),
    }
    memory.orders.set(id, updated)
    return normalizeMemoryOrder(updated)
  }

  const updatedRows = await getDatabase()
    .update(orders)
    .set({ referenceImageObjectKey: objectKey, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning()
  if (updatedRows.length === 0) throw new Error('Order not found')
  return mapDatabaseOrder(updatedRows[0])
}

export async function updateOrderStatus(id: number, status: OrderStatus) {
  if (!useDatabase()) {
    const existing = memory.orders.get(id)
    if (!existing) throw new Error('Order not found')
    assertStatusUpdate(status, existing.orderValueThb)
    const updated: OrderRequest = {
      ...existing,
      status,
      updatedAt: new Date(),
    }
    memory.orders.set(id, updated)
    return normalizeMemoryOrder(updated)
  }

  const db = getDatabase()
  const existingRows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
  if (existingRows.length === 0) throw new Error('Order not found')
  assertStatusUpdate(status, existingRows[0].orderValueThb)
  const updatedRows = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning()
  if (updatedRows.length === 0) throw new Error('Order not found')
  return mapDatabaseOrder(updatedRows[0])
}

export async function deleteOrder(id: number) {
  if (!useDatabase()) {
    if (!memory.orders.delete(id)) throw new Error('Order not found')
    const { deletePaymentsForOrder } = await import('./payment-store.server')
    await deletePaymentsForOrder(id)
    return true as const
  }
  const deleted = await getDatabase()
    .delete(orders)
    .where(eq(orders.id, id))
    .returning({ id: orders.id })
  if (deleted.length === 0) throw new Error('Order not found')
  return true as const
}
