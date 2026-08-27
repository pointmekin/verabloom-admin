import { asc, eq } from 'drizzle-orm'

import { getDatabase } from '#/db'
import { payments } from '#/db/schema'

export type PaymentMethod = 'bank_transfer' | 'cash' | 'other'

export type PaymentRecord = {
  id: number
  orderId: number
  amountThb: string
  paymentDate: string
  method: PaymentMethod
  note: string | null
  createdAt: Date
  updatedAt: Date
}

export type PaymentInput = {
  amountThb: string
  paymentDate: string
  method: PaymentMethod
  note?: string | null
}

type MemoryState = {
  payments: Map<number, PaymentRecord>
  nextPaymentId: number
}

const memoryGlobal = globalThis as typeof globalThis & {
  __verabloomPaymentMemory?: MemoryState
}
const memory =
  memoryGlobal.__verabloomPaymentMemory ??
  (memoryGlobal.__verabloomPaymentMemory = {
    payments: new Map(),
    nextPaymentId: 1,
  })

export function clearPaymentMemoryForTests() {
  memory.payments.clear()
  memory.nextPaymentId = 1
}

function useDatabase() {
  if (
    process.env.VERABLOOM_PAYMENT_STORE === 'memory' ||
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

function mapDatabasePayment(row: typeof payments.$inferSelect): PaymentRecord {
  return {
    id: row.id,
    orderId: row.orderId,
    amountThb: row.amountThb,
    paymentDate: row.paymentDate,
    method: row.method as PaymentMethod,
    note: row.note,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function normalizedValue(value?: string | null) {
  return value?.trim() || null
}

function isCalendarDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  if (![year, month, day].every(Number.isInteger)) return false
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

async function assertOrderExists(orderId: number) {
  const { getOrderById } = await import('./order-store.server')
  if (!(await getOrderById(orderId))) throw new Error('Order not found')
}

function assertPaymentInput(input: PaymentInput) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(input.amountThb.trim())) {
    throw new Error('Enter a valid Thai baht amount')
  }
  if (!isCalendarDate(input.paymentDate)) {
    throw new Error('Enter a valid payment date')
  }
  if (!['bank_transfer', 'cash', 'other'].includes(input.method)) {
    throw new Error('Choose a payment method')
  }
}

export async function createPayment(orderId: number, input: PaymentInput) {
  await assertOrderExists(orderId)
  assertPaymentInput(input)
  if (!useDatabase()) {
    const now = new Date()
    const record: PaymentRecord = {
      id: memory.nextPaymentId,
      orderId,
      amountThb: input.amountThb.trim(),
      paymentDate: input.paymentDate,
      method: input.method,
      note: normalizedValue(input.note),
      createdAt: now,
      updatedAt: now,
    }
    memory.nextPaymentId += 1
    memory.payments.set(record.id, record)
    return { ...record }
  }
  const [created] = await getDatabase()
    .insert(payments)
    .values({
      orderId,
      amountThb: input.amountThb.trim(),
      paymentDate: input.paymentDate,
      method: input.method,
      note: normalizedValue(input.note),
    })
    .returning()
  return mapDatabasePayment(created)
}

export async function listPaymentsForOrder(orderId: number) {
  if (!useDatabase()) {
    return [...memory.payments.values()]
      .filter((item) => item.orderId === orderId)
      .sort(
        (a, b) =>
          a.paymentDate.localeCompare(b.paymentDate) || a.id - b.id,
      )
      .map((item) => ({ ...item }))
  }
  const rows = await getDatabase()
    .select()
    .from(payments)
    .where(eq(payments.orderId, orderId))
    .orderBy(asc(payments.paymentDate), asc(payments.id))
  return rows.map(mapDatabasePayment)
}

export async function updatePayment(id: number, input: PaymentInput) {
  assertPaymentInput(input)
  if (!useDatabase()) {
    const existing = memory.payments.get(id)
    if (!existing) throw new Error('Payment not found')
    const updated: PaymentRecord = {
      ...existing,
      amountThb: input.amountThb.trim(),
      paymentDate: input.paymentDate,
      method: input.method,
      note: normalizedValue(input.note),
      updatedAt: new Date(),
    }
    memory.payments.set(id, updated)
    return { ...updated }
  }
  const updatedRows = await getDatabase()
    .update(payments)
    .set({
      amountThb: input.amountThb.trim(),
      paymentDate: input.paymentDate,
      method: input.method,
      note: normalizedValue(input.note),
      updatedAt: new Date(),
    })
    .where(eq(payments.id, id))
    .returning()
  if (updatedRows.length === 0) throw new Error('Payment not found')
  return mapDatabasePayment(updatedRows[0])
}

export async function deletePayment(id: number) {
  if (!useDatabase()) {
    if (!memory.payments.delete(id)) throw new Error('Payment not found')
    return true as const
  }
  const deleted = await getDatabase()
    .delete(payments)
    .where(eq(payments.id, id))
    .returning({ id: payments.id })
  if (deleted.length === 0) throw new Error('Payment not found')
  return true as const
}

export async function deletePaymentsForOrder(orderId: number) {
  if (!useDatabase()) {
    for (const [id, item] of memory.payments) {
      if (item.orderId === orderId) memory.payments.delete(id)
    }
    return true as const
  }
  await getDatabase().delete(payments).where(eq(payments.orderId, orderId))
  return true as const
}
