import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import type { CustomerSocialChannel } from './customer-store.server'

export const customerInputSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(1).max(200),
  socialChannel: z.enum(['line', 'instagram', 'tiktok']),
  socialContact: z.string().trim().min(1).max(320),
  phone: z.string().trim().max(60).default(''),
  defaultAddress: z.string().trim().max(1000).default(''),
})

const customerIdSchema = z.object({ id: z.coerce.number().int().positive() })

async function assertAdmin() {
  const { hasAdminSession } = await import('./auth-session.server')
  if (!(await hasAdminSession())) throw new Error('Unauthorized')
}

export const listAdminCustomersFn = createServerFn({ method: 'GET' })
  .validator(z.object({ search: z.string().optional() }))
  .handler(async ({ data }) => {
    await assertAdmin()
    const { listCustomers } = await import('./customer-store.server')
    return listCustomers(data.search)
  })

export const getAdminCustomerFn = createServerFn({ method: 'GET' })
  .validator(customerIdSchema)
  .handler(async ({ data }) => {
    await assertAdmin()
    const [{ getCustomerById }, { listOrderRequests }] = await Promise.all([
      import('./customer-store.server'),
      import('./order-store.server'),
    ])
    const customer = await getCustomerById(data.id)
    if (!customer) return null
    const orders = (await listOrderRequests()).filter(
      (order) => order.customerId === data.id,
    )
    return { customer, orders }
  })

export const saveAdminCustomerFn = createServerFn({ method: 'POST' })
  .validator(customerInputSchema)
  .handler(async ({ data }) => {
    await assertAdmin()
    const { createCustomer } = await import('./customer-store.server')
    return createCustomer(data)
  })

export const deleteAdminCustomerFn = createServerFn({ method: 'POST' })
  .validator(customerIdSchema)
  .handler(async ({ data }) => {
    await assertAdmin()
    const { deleteCustomer } = await import('./customer-store.server')
    await deleteCustomer(data.id)
    return { ok: true as const }
  })

export type AdminCustomerSocialChannel = CustomerSocialChannel
