import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { TEAM_MEMBERS } from '#/lib/team-members'
import type { OrderStatus } from './order-store.server'

const socialChannelSchema = z.enum(['line', 'instagram', 'tiktok'])
const deliveryMethodSchema = z.enum(['postal', 'messenger', 'collection'])
const taskOwnerSchema = z.enum(TEAM_MEMBERS, {
  message: 'Choose a task owner',
})
const statusSchema = z.enum([
  'pending_review',
  'confirmed',
  'work_in_progress',
  'completed',
  'cancelled',
])
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

const nullableIdSchema = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.coerce.number().int().positive().nullable(),
)

const editableOrderShape = z.object({
  taskOwner: taskOwnerSchema,
  customerId: nullableIdSchema.default(null),
  customerName: z.string().trim().min(1).max(200),
  socialChannel: socialChannelSchema,
  socialContact: z.string().trim().min(1).max(320),
  phone: z.string().trim().max(60).default(''),
  requestDetails: z.string().trim().max(5000).default(''),
  deliveryMethod: deliveryMethodSchema,
  recipientName: z.string().trim().max(200).default(''),
  recipientPhone: z.string().trim().max(60).default(''),
  orderAddress: z.string().trim().max(1000).default(''),
  requiredDate: dateSchema,
  status: statusSchema,
  orderValueThb: z.string().trim().default(''),
  internalNote: z.string().trim().max(5000).default(''),
})

const statusesRequiringValue = ['confirmed', 'work_in_progress', 'completed']

function withOrderRules<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((value, context) => {
    const order = value as {
      deliveryMethod: string
      recipientName: string
      recipientPhone: string
      orderAddress: string
      status: string
      orderValueThb: string
    }
    if (
      (order.deliveryMethod === 'postal' ||
        order.deliveryMethod === 'messenger') &&
      !order.orderAddress
    ) {
      context.addIssue({
        code: 'custom',
        path: ['orderAddress'],
        message: 'Address is required for delivery',
      })
    }
    if (order.deliveryMethod === 'postal') {
      if (!order.recipientName) {
        context.addIssue({
          code: 'custom',
          path: ['recipientName'],
          message: 'Postal orders require recipient details',
        })
      }
      if (!order.recipientPhone) {
        context.addIssue({
          code: 'custom',
          path: ['recipientPhone'],
          message: 'Postal orders require recipient details',
        })
      }
    }
    if (statusesRequiringValue.includes(order.status) && !order.orderValueThb) {
      context.addIssue({
        code: 'custom',
        path: ['orderValueThb'],
        message: 'Confirmed orders require an order value',
      })
    }
    if (
      order.orderValueThb &&
      !moneySchema.safeParse(order.orderValueThb).success
    ) {
      context.addIssue({
        code: 'custom',
        path: ['orderValueThb'],
        message: 'Enter a valid Thai baht amount',
      })
    }
  })
}

const editableOrderWithProductShape = editableOrderShape.extend({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
})

export const orderUpdateSchema = withOrderRules(editableOrderWithProductShape)

export const directOrderSchema = withOrderRules(
  editableOrderWithProductShape,
).refine(
  (value) =>
    value.status === 'pending_review' ||
    value.status === 'confirmed' ||
    value.status === 'work_in_progress',
  {
    path: ['status'],
    message: 'Direct orders must start pending or confirmed',
  },
)

const orderIdSchema = z.object({ id: z.coerce.number().int().positive() })
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
