import { asc, eq, ilike, or } from 'drizzle-orm'

import { getDatabase } from '#/db'
import { customers, orders } from '#/db/schema'

export type CustomerSocialChannel = 'line' | 'instagram' | 'tiktok'

export type Customer = {
  id: number
  name: string
  socialChannel: CustomerSocialChannel
  socialContact: string
  phone: string | null
  defaultAddress: string | null
  createdAt: Date
  updatedAt: Date
}

export type CustomerInput = {
  id?: number
  name: string
  socialChannel: CustomerSocialChannel
  socialContact: string
  phone?: string
  defaultAddress?: string
}

type MemoryState = {
  customers: Map<number, Customer>
  nextCustomerId: number
}

const memoryGlobal = globalThis as typeof globalThis & {
  __verabloomCustomerMemory?: MemoryState
}
const memory =
  memoryGlobal.__verabloomCustomerMemory ??
  (memoryGlobal.__verabloomCustomerMemory = {
    customers: new Map(),
    nextCustomerId: 1,
  })

export function clearCustomerMemoryForTests() {
  memory.customers.clear()
  memory.nextCustomerId = 1
}

function useDatabase() {
  if (
    process.env.VERABLOOM_CUSTOMER_STORE === 'memory' ||
    process.env.VERABLOOM_ORDER_STORE === 'memory' ||
    process.env.VERABLOOM_CATALOG_STORE === 'memory'
  )
    return false
  const databaseUrl =
    process.env.VERABLOOM_DATABASE_ENV === 'test'
      ? process.env.DATABASE_URL_TEST
      : process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is not configured')
  return true
}

function normalize(value: Customer): Customer {
  return {
    ...value,
    createdAt: new Date(value.createdAt),
    updatedAt: new Date(value.updatedAt),
  }
}

function mapRow(row: typeof customers.$inferSelect): Customer {
  return {
    id: row.id,
    name: row.name,
    socialChannel: row.socialChannel as CustomerSocialChannel,
    socialContact: row.socialContact,
    phone: row.phone,
    defaultAddress: row.defaultAddress,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function valuesMatch(customer: Customer, search: string) {
  const query = search.toLocaleLowerCase()
  return [customer.name, customer.socialContact, customer.phone ?? ''].some(
    (value) => value.toLocaleLowerCase().includes(query),
  )
}

export async function listCustomers(search?: string) {
  const query = search?.trim()
  if (!useDatabase()) {
    return [...memory.customers.values()]
      .filter((customer) => !query || valuesMatch(customer, query))
      .sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id)
      .map(normalize)
  }

  const db = getDatabase()
  const rows = await db
    .select()
    .from(customers)
    .where(
      query
        ? or(
            ilike(customers.name, `%${query}%`),
            ilike(customers.socialContact, `%${query}%`),
            ilike(customers.phone, `%${query}%`),
          )
        : undefined,
    )
    .orderBy(asc(customers.name), asc(customers.id))
  return rows.map(mapRow)
}

export async function getCustomerById(id: number) {
  if (!useDatabase()) {
    const customer = memory.customers.get(id)
    return customer ? normalize(customer) : null
  }
  const rows = await getDatabase()
    .select()
    .from(customers)
    .where(eq(customers.id, id))
  return rows[0] ? mapRow(rows[0]) : null
}

export async function createCustomer(input: CustomerInput) {
  const now = new Date()
  if (!useDatabase()) {
    const id = input.id ?? memory.nextCustomerId++
    if (input.id && id >= memory.nextCustomerId) memory.nextCustomerId = id + 1
    const existing = memory.customers.get(id)
    const customer: Customer = {
      id,
      name: input.name,
      socialChannel: input.socialChannel,
      socialContact: input.socialContact,
      phone: input.phone?.trim() || null,
      defaultAddress: input.defaultAddress?.trim() || null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    memory.customers.set(id, customer)
    return normalize(customer)
  }

  const db = getDatabase()
  if (input.id) {
    const updatedRows = await db
      .update(customers)
      .set({
        name: input.name,
        socialChannel: input.socialChannel,
        socialContact: input.socialContact,
        phone: input.phone?.trim() || null,
        defaultAddress: input.defaultAddress?.trim() || null,
        updatedAt: now,
      })
      .where(eq(customers.id, input.id))
      .returning()
    if (updatedRows.length === 0) throw new Error('Customer not found')
    const updated = updatedRows[0]
    return mapRow(updated)
  }
  const [created] = await db
    .insert(customers)
    .values({
      name: input.name,
      socialChannel: input.socialChannel,
      socialContact: input.socialContact,
      phone: input.phone?.trim() || null,
      defaultAddress: input.defaultAddress?.trim() || null,
    })
    .returning()
  return mapRow(created)
}

export async function deleteCustomer(id: number) {
  if (!useDatabase()) {
    const customer = memory.customers.get(id)
    if (!customer) throw new Error('Customer not found')
    const orderMemory = (
      globalThis as typeof globalThis & {
        __verabloomOrderMemory?: {
          orders: Map<number, { customerId?: number | null }>
        }
      }
    ).__verabloomOrderMemory
    if (
      orderMemory &&
      [...orderMemory.orders.values()].some((order) => order.customerId === id)
    ) {
      throw new Error('Customer has orders')
    }
    memory.customers.delete(id)
    return true as const
  }

  const db = getDatabase()
  const orderRows = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.customerId, id))
  if (orderRows.length > 0) throw new Error('Customer has orders')
  const deleted = await db
    .delete(customers)
    .where(eq(customers.id, id))
    .returning({ id: customers.id })
  if (deleted.length === 0) throw new Error('Customer not found')
  return true as const
}
