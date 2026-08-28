import { desc, eq } from 'drizzle-orm'

import { getDatabase } from '#/db'
import { payouts } from '#/db/schema'
import { PAYOUT_RECIPIENTS } from '#/lib/team-members'
import type { PayoutRecipient } from '#/lib/team-members'

export type PayoutRecord = {
  id: number
  recipient: PayoutRecipient
  amountThb: string
  payoutDate: string
  note: string | null
  createdAt: Date
}

export type PayoutInput = {
  recipient: string
  amountThb: string
  payoutDate: string
  note?: string | null
}

type MemoryState = {
  payouts: Map<number, PayoutRecord>
  nextPayoutId: number
}

const memoryGlobal = globalThis as typeof globalThis & {
  __verabloomPayoutMemory?: MemoryState
}
const memory =
  memoryGlobal.__verabloomPayoutMemory ??
  (memoryGlobal.__verabloomPayoutMemory = {
    payouts: new Map(),
    nextPayoutId: 1,
  })

export function clearPayoutMemoryForTests() {
  memory.payouts.clear()
  memory.nextPayoutId = 1
}

function useDatabase() {
  if (
    process.env.VERABLOOM_PAYOUT_STORE === 'memory' ||
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

function normalizedInput(input: PayoutInput) {
  const recipient = input.recipient.trim()
  if (!PAYOUT_RECIPIENTS.includes(recipient as PayoutRecipient)) {
    throw new Error('Choose a payout recipient')
  }
  const amountThb = input.amountThb.trim()
  if (!/^\d+(?:\.\d{1,2})?$/.test(amountThb)) {
    throw new Error('Enter a valid Thai baht amount')
  }
  const [year, month, day] = input.payoutDate.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.payoutDate) ||
    ![year, month, day].every(Number.isInteger) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error('Enter a valid payout date')
  }
  return {
    recipient: recipient as PayoutRecipient,
    amountThb,
    payoutDate: input.payoutDate,
    note: input.note?.trim() || null,
  }
}

function mapDatabasePayout(row: typeof payouts.$inferSelect): PayoutRecord {
  return {
    id: row.id,
    recipient: row.recipient as PayoutRecipient,
    amountThb: row.amountThb,
    payoutDate: row.payoutDate,
    note: row.note,
    createdAt: row.createdAt,
  }
}

export async function createPayout(input: PayoutInput) {
  const values = normalizedInput(input)
  if (!useDatabase()) {
    const record: PayoutRecord = {
      id: memory.nextPayoutId,
      ...values,
      createdAt: new Date(),
    }
    memory.nextPayoutId += 1
    memory.payouts.set(record.id, record)
    return { ...record }
  }
  const [created] = await getDatabase()
    .insert(payouts)
    .values(values)
    .returning()
  return mapDatabasePayout(created)
}

export async function updatePayout(id: number, input: PayoutInput) {
  const values = normalizedInput(input)
  if (!useDatabase()) {
    const existing = memory.payouts.get(id)
    if (!existing) throw new Error('Payout not found')
    const updated = { ...existing, ...values }
    memory.payouts.set(id, updated)
    return { ...updated }
  }
  const updatedRows = await getDatabase()
    .update(payouts)
    .set(values)
    .where(eq(payouts.id, id))
    .returning()
  if (updatedRows.length === 0) throw new Error('Payout not found')
  return mapDatabasePayout(updatedRows[0])
}

export async function listPayouts(): Promise<PayoutRecord[]> {
  if (!useDatabase()) {
    return [...memory.payouts.values()]
      .sort((a, b) => b.payoutDate.localeCompare(a.payoutDate) || b.id - a.id)
      .map((item) => ({ ...item }))
  }
  const rows = await getDatabase()
    .select()
    .from(payouts)
    .orderBy(desc(payouts.payoutDate), desc(payouts.id))
  return rows.map(mapDatabasePayout)
}
