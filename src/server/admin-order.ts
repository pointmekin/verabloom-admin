import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { TEAM_MEMBERS } from '#/lib/team-members'
import type { OrderStatus } from './order-store.server'

const deliveryMethodSchema = z.enum(['postal', 'messenger', 'collection'])
const taskOwnerMemberSchema = z.enum(TEAM_MEMBERS, {
  message: 'Choose a task owner',
})
const taskOwnerSchema = z.preprocess(
  (value) => (typeof value === 'string' ? [value] : value),
  z.array(taskOwnerMemberSchema).min(1, 'Choose a task owner'),
)
const statusSchema = z.enum([
  'pending_review',
  'confirmed',
  'work_in_progress',
  'completed',
  'cancelled',
])
const orderStatusUpdateSchema = z.object({
  status: statusSchema,
})

const dateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a required date')
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number)
    if (![year, month, day].every(Number.isInteger)) return false
    const date = new Date(Date.UTC(year, month - 1, day))
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    )
  }, 'Enter a valid date')
const moneySchema = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,2})?$/, 'Enter a valid Thai baht amount')

const orderFormSchema = z.object({
  productNameSnapshot: z.string().trim().min(1).max(200),
  taskOwner: taskOwnerSchema,
  socialContact: z.string().trim().min(1).max(320),
  phone: z.string().trim().max(60).default(''),
  requestDetails: z.string().trim().max(5000).default(''),
  deliveryMethod: deliveryMethodSchema,
  orderAddress: z.string().trim().max(1000).default(''),
  requiredDate: dateSchema,
  orderValueThb: moneySchema,
})

export const orderUpdateSchema = orderFormSchema
export const directOrderSchema = orderFormSchema

const orderIdSchema = z.object({ id: z.coerce.number().int().positive() })
const orderImageUploadSchema = z.object({
  id: z.coerce.number().int().positive(),
  mimeType: z.string().min(1),
  base64: z.string().min(1),
})
const orderStatusUpdateInputSchema = orderIdSchema.and(orderStatusUpdateSchema)

const orderListSchema = z.object({
  search: z.string().optional(),
  status: statusSchema.optional(),
})

async function assertAdmin() {
  const { hasAdminSession } = await import('./auth-session.server')
  if (!(await hasAdminSession())) throw new Error('Unauthorized')
}

export const listAdminOrdersFn = createServerFn({ method: 'GET' })
  .validator(orderListSchema)
  .handler(async ({ data }) => {
    await assertAdmin()
    const { listOrderRequests } = await import('./order-store.server')
    return listOrderRequests(data)
  })

export const listAdminOrdersPageFn = createServerFn({ method: 'GET' })
  .validator(orderListSchema)
  .handler(async ({ data }) => {
    await assertAdmin()
    const { listOrderRequestsPage } = await import('./order-store.server')
    return listOrderRequestsPage(data)
  })

export const getAdminOrderFn = createServerFn({ method: 'GET' })
  .validator(orderIdSchema)
  .handler(async ({ data }) => {
    await assertAdmin()
    const { getOrderById } = await import('./order-store.server')
    return getOrderById(data.id)
  })

export const saveAdminOrderFn = createServerFn({ method: 'POST' })
  .validator(orderIdSchema.and(orderUpdateSchema))
  .handler(async ({ data }) => {
    await assertAdmin()
    const { updateOrder } = await import('./order-store.server')
    return updateOrder(data.id, data)
  })

export const updateAdminOrderStatusFn = createServerFn({ method: 'POST' })
  .validator(orderStatusUpdateInputSchema)
  .handler(async ({ data }) => {
    await assertAdmin()
    const { updateOrderStatus } = await import('./order-store.server')
    return updateOrderStatus(data.id, data.status)
  })

export const createAdminOrderFn = createServerFn({ method: 'POST' })
  .validator(directOrderSchema)
  .handler(async ({ data }) => {
    await assertAdmin()
    const { createDirectOrder } = await import('./order-store.server')
    return createDirectOrder(data)
  })

export const deleteAdminOrderFn = createServerFn({ method: 'POST' })
  .validator(orderIdSchema)
  .handler(async ({ data }) => {
    await assertAdmin()
    const { deleteOrder } = await import('./order-store.server')
    await deleteOrder(data.id)
    return { ok: true as const }
  })

export const getPendingOrderCountFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    await assertAdmin()
    const { listOrderRequests } = await import('./order-store.server')
    return (await listOrderRequests({ status: 'pending_review' })).length
  },
)

export type AdminOrderStatus = OrderStatus

export const uploadAdminOrderImageFn = createServerFn({ method: 'POST' })
  .validator(orderImageUploadSchema)
  .handler(async ({ data }) => {
    // Keep server-only persistence and storage modules out of the browser bundle.
    const { getOrderById, setOrderReferenceImage } = await import(
      './order-store.server'
    )
    if (!(await getOrderById(data.id))) throw new Error('Order not found')
    const { uploadOrderImageObject } = await import('./storage.server')
    const uploaded = await uploadOrderImageObject({
      orderId: data.id,
      mimeType: data.mimeType,
      base64: data.base64,
    })
    return setOrderReferenceImage(data.id, uploaded.objectKey)
  })
