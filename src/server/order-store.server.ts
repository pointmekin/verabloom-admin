import { randomUUID } from 'node:crypto'

import { and, desc, eq, ilike, or } from 'drizzle-orm'

import { getDatabase } from '#/db'
import { orders, products } from '#/db/schema'
import { isTeamMember } from '#/lib/team-members'
import type { TeamMember } from '#/lib/team-members'
import { getCatalogProduct } from './catalog-store.server'
import { getCustomerById } from './customer-store.server'
import type { OrderRequestInput } from './order'

export type OrderStatus =
  | 'pending_review'
  | 'confirmed'
  | 'work_in_progress'
  | 'completed'
  | 'cancelled'

export type OrderRequest = {
  id: number
  requestReference: string
  status: OrderStatus
  productId: number
  productNameSnapshot: string
  quantity: number
  taskOwner: TeamMember | null
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

export type OrderEditableInput = {
  productId?: number
  quantity?: number
  taskOwner: TeamMember
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

export type DirectOrderInput = OrderEditableInput & {
  productId: number
  quantity: number
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
    productNameSnapshot: row.productNameSnapshot,
    quantity: row.quantity,
    taskOwner: isTeamMember(row.taskOwner) ? row.taskOwner : null,
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

const statusesRequiringValue: OrderStatus[] = [
  'confirmed',
  'work_in_progress',
  'completed',
]

function assertEditableOrder(input: OrderEditableInput) {
  if (
    input.quantity !== undefined &&
    (!Number.isSafeInteger(input.quantity) || input.quantity < 1)
  ) {
    throw new Error('Quantity must be a positive whole number')
  }
  if (!isTeamMember(input.taskOwner)) {
    throw new Error('Choose a task owner')
  }
  if (
    (input.deliveryMethod === 'postal' ||
      input.deliveryMethod === 'messenger') &&
    !input.orderAddress?.trim()
  ) {
    throw new Error('Address is required for delivery')
  }
  if (
    input.deliveryMethod === 'postal' &&
    (!input.recipientName?.trim() || !input.recipientPhone?.trim())
  ) {
    throw new Error('Postal orders require recipient details')
  }
  if (
    statusesRequiringValue.includes(input.status) &&
    !input.orderValueThb?.trim()
  ) {
    throw new Error('Confirmed orders require an order value')
  }
  if (
    input.orderValueThb?.trim() &&
    !/^\d+(?:\.\d{1,2})?$/.test(input.orderValueThb.trim())
  ) {
    throw new Error('Enter a valid Thai baht amount')
  }
}

async function resolveDirectOrderInput(input: DirectOrderInput) {
  if (input.customerId == null) return input
  const customer = await getCustomerById(input.customerId)
  if (!customer) throw new Error('Customer not found')
  if (
    input.deliveryMethod !== 'collection' &&
    !input.orderAddress?.trim() &&
    customer.defaultAddress
  ) {
    return { ...input, orderAddress: customer.defaultAddress }
  }
  return input
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
type MemoryOrderInput = Omit<OrderEditableInput, 'taskOwner'> & {
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
  const resolvedInput = await resolveDirectOrderInput(input)
  assertEditableOrder(resolvedInput)
  if (!useDatabase()) {
    const product = await catalogSnapshot(resolvedInput.productId, false)
    const order = memoryOrderFromProduct(
      nextMemoryId(),
      product,
      resolvedInput,
      resolvedInput.quantity,
      resolvedInput.status,
    )
    memory.orders.set(order.id, order)
    return normalizeMemoryOrder(order)
  }
  const db = getDatabase()
  const productRows = await db
    .select()
    .from(products)
    .where(eq(products.id, resolvedInput.productId))
  if (!productRows[0]) throw new Error('Product not found')
  const product = productRows[0]
  const [created] = await db
    .insert(orders)
    .values({
      requestReference: `pending-${randomUUID()}`,
      status: resolvedInput.status,
      productId: product.id,
      productNameSnapshot: product.name,
      quantity: resolvedInput.quantity,
      taskOwner: resolvedInput.taskOwner,
      customerId: resolvedInput.customerId ?? null,
      customerName: resolvedInput.customerName,
      socialChannel: resolvedInput.socialChannel,
      socialContact: resolvedInput.socialContact,
      phone: normalizedValue(resolvedInput.phone),
      requestDetails: resolvedInput.requestDetails,
      deliveryMethod: resolvedInput.deliveryMethod,
      recipientName: normalizedValue(resolvedInput.recipientName),
      recipientPhone: normalizedValue(resolvedInput.recipientPhone),
      orderAddress: normalizedValue(resolvedInput.orderAddress),
      requiredDate: resolvedInput.requiredDate,
      orderValueThb: normalizedValue(resolvedInput.orderValueThb),
      internalNote: normalizedValue(resolvedInput.internalNote),
    })
    .returning()
  const [saved] = await db
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
  if (input.customerId != null && !(await getCustomerById(input.customerId))) {
    throw new Error('Customer not found')
  }
  assertEditableOrder(input)
  if (!useDatabase()) {
    const existing = memory.orders.get(id)
    if (!existing) throw new Error('Order not found')
    const productId = input.productId ?? existing.productId
    const snapshot =
      productId !== existing.productId
        ? await catalogSnapshot(productId, false)
        : null
    const updated: OrderRequest = {
      ...existing,
      productId,
      productNameSnapshot: snapshot?.name ?? existing.productNameSnapshot,
      quantity: input.quantity ?? existing.quantity,
      taskOwner: input.taskOwner,
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
      status: input.status,
      orderValueThb: normalizedValue(input.orderValueThb),
      internalNote: normalizedValue(input.internalNote),
      updatedAt: new Date(),
    }
    memory.orders.set(id, updated)
    return normalizeMemoryOrder(updated)
  }
  const db = getDatabase()
  return db.transaction(async (tx) => {
    const existingRows = await tx.select().from(orders).where(eq(orders.id, id))
    if (existingRows.length === 0) throw new Error('Order not found')
    const existing = existingRows[0]
    const productId = input.productId ?? existing.productId
    let productName: string | null = null
    if (productId !== existing.productId) {
      const productRows = await tx
        .select()
        .from(products)
        .where(eq(products.id, productId))
      if (productRows.length === 0) throw new Error('Product not found')
      productName = productRows[0].name
    }
    const updatedRows = await tx
      .update(orders)
      .set({
        productId,
        productNameSnapshot: productName ?? existing.productNameSnapshot,
        quantity: input.quantity ?? existing.quantity,
        taskOwner: input.taskOwner,
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
        status: input.status,
        orderValueThb: normalizedValue(input.orderValueThb),
        internalNote: normalizedValue(input.internalNote),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning()
    if (updatedRows.length === 0) throw new Error('Order not found')
    return mapDatabaseOrder(updatedRows[0])
  })
}

export async function deleteOrder(id: number) {
  if (!useDatabase()) {
    if (!memory.orders.delete(id)) throw new Error('Order not found')
    const { deletePaymentsForOrder } = await import(
      './payment-store.server'
    )
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
