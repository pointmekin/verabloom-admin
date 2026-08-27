import { desc, eq } from 'drizzle-orm'

import { getDatabase } from '#/db'
import { expenses } from '#/db/schema'

export type ExpensePayer = 'chompooh' | 'meen' | 'kan'

export const expensePayers: readonly ExpensePayer[] = [
  'chompooh',
  'meen',
  'kan',
]

export type ExpenseRecord = {
  id: number
  description: string
  payer: ExpensePayer
  totalAmountThb: string
  expenseDate: string
  quantity: number | null
  note: string | null
  createdAt: Date
  updatedAt: Date
}

export type ExpenseInput = {
  description: string
  payer: ExpensePayer
  totalAmountThb: string
  expenseDate: string
  quantity?: number | string | null
  note?: string | null
}

type MemoryState = {
  expenses: Map<number, ExpenseRecord>
  nextExpenseId: number
}

const memoryGlobal = globalThis as typeof globalThis & {
  __verabloomExpenseMemory?: MemoryState
}
const memory =
  memoryGlobal.__verabloomExpenseMemory ??
  (memoryGlobal.__verabloomExpenseMemory = {
    expenses: new Map(),
    nextExpenseId: 1,
  })

export function clearExpenseMemoryForTests() {
  memory.expenses.clear()
  memory.nextExpenseId = 1
}

function useDatabase() {
  if (
    process.env.VERABLOOM_EXPENSE_STORE === 'memory' ||
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

function mapDatabaseExpense(row: typeof expenses.$inferSelect): ExpenseRecord {
  return {
    id: row.id,
    description: row.description,
    payer: row.payer as ExpensePayer,
    totalAmountThb: row.totalAmountThb,
    expenseDate: row.expenseDate,
    quantity: row.quantity,
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

function normalizedQuantity(value?: number | string | null) {
  if (value === null || value === undefined || value === '') return null
  const quantity = Number(value)
  if (
    !Number.isInteger(quantity) ||
    quantity <= 0 ||
    String(quantity) !== String(value).trim()
  ) {
    throw new Error('Enter a positive whole number')
  }
  return quantity
}

function assertExpenseInput(input: ExpenseInput) {
  if (!input.description.trim()) throw new Error('Enter a description')
  if (!expensePayers.includes(input.payer)) {
    throw new Error('Choose a payer')
  }
  if (!/^\d+(?:\.\d{1,2})?$/.test(input.totalAmountThb.trim())) {
    throw new Error('Enter a valid Thai baht amount')
  }
  if (!isCalendarDate(input.expenseDate)) {
    throw new Error('Enter a valid expense date')
  }
}

function normalizedInput(input: ExpenseInput) {
  assertExpenseInput(input)
  return {
    description: input.description.trim(),
    payer: input.payer,
    totalAmountThb: input.totalAmountThb.trim(),
    expenseDate: input.expenseDate,
    quantity: normalizedQuantity(input.quantity),
    note: normalizedValue(input.note),
  }
}

export async function createExpense(input: ExpenseInput) {
  const values = normalizedInput(input)
  if (!useDatabase()) {
    const now = new Date()
    const record: ExpenseRecord = {
      id: memory.nextExpenseId,
      ...values,
      createdAt: now,
      updatedAt: now,
    }
    memory.nextExpenseId += 1
    memory.expenses.set(record.id, record)
    return { ...record }
  }
  const [created] = await getDatabase()
    .insert(expenses)
    .values(values)
    .returning()
  return mapDatabaseExpense(created)
}

export async function listExpenses(): Promise<ExpenseRecord[]> {
  if (!useDatabase()) {
    return [...memory.expenses.values()]
      .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate) || b.id - a.id)
      .map((item) => ({ ...item }))
  }
  const rows = await getDatabase()
    .select()
    .from(expenses)
    .orderBy(desc(expenses.expenseDate), desc(expenses.id))
  return rows.map(mapDatabaseExpense)
}

export async function updateExpense(id: number, input: ExpenseInput) {
  const values = normalizedInput(input)
  if (!useDatabase()) {
    const existing = memory.expenses.get(id)
    if (!existing) throw new Error('Expense not found')
    const updated: ExpenseRecord = {
      ...existing,
      ...values,
      updatedAt: new Date(),
    }
    memory.expenses.set(id, updated)
    return { ...updated }
  }
  const updatedRows = await getDatabase()
    .update(expenses)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(expenses.id, id))
    .returning()
  if (updatedRows.length === 0) throw new Error('Expense not found')
  return mapDatabaseExpense(updatedRows[0])
}

export async function deleteExpense(id: number) {
  if (!useDatabase()) {
    if (!memory.expenses.delete(id)) throw new Error('Expense not found')
    return true as const
  }
  const deleted = await getDatabase()
    .delete(expenses)
    .where(eq(expenses.id, id))
    .returning({ id: expenses.id })
  if (deleted.length === 0) throw new Error('Expense not found')
  return true as const
}
