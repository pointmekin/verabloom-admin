import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const dateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid payment date')
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number)
    if (![year, month, day].every(Number.isInteger)) return false
    const date = new Date(Date.UTC(year, month - 1, day))
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    )
  }, 'Enter a valid payment date')

const moneySchema = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,2})?$/, 'Enter a valid Thai baht amount')

export const paymentMethodSchema = z.enum(['bank_transfer', 'cash', 'other'])

export const paymentInputSchema = z.object({
  amountThb: moneySchema,
  paymentDate: dateSchema,
  method: paymentMethodSchema,
  note: z.string().trim().max(500).default(''),
})

const paymentIdSchema = z.object({ id: z.coerce.number().int().positive() })
const orderPaymentsSchema = z.object({
  orderId: z.coerce.number().int().positive(),
})

async function assertAdmin() {
  const { hasAdminSession } = await import('./auth-session.server')
  if (!(await hasAdminSession())) throw new Error('Unauthorized')
}

export const listOrderPaymentsFn = createServerFn({ method: 'GET' })
  .validator(orderPaymentsSchema)
  .handler(async ({ data }) => {
    await assertAdmin()
    const { listPaymentsForOrder } = await import('./payment-store.server')
    return listPaymentsForOrder(data.orderId)
  })

export const addAdminPaymentFn = createServerFn({ method: 'POST' })
  .validator(orderPaymentsSchema.and(paymentInputSchema))
  .handler(async ({ data }) => {
    await assertAdmin()
    const { createPayment } = await import('./payment-store.server')
    return createPayment(data.orderId, data)
  })

export const updateAdminPaymentFn = createServerFn({ method: 'POST' })
  .validator(paymentIdSchema.and(paymentInputSchema))
  .handler(async ({ data }) => {
    await assertAdmin()
    const { updatePayment } = await import('./payment-store.server')
    return updatePayment(data.id, data)
  })

export const deleteAdminPaymentFn = createServerFn({ method: 'POST' })
  .validator(paymentIdSchema)
  .handler(async ({ data }) => {
    await assertAdmin()
    const { deletePayment } = await import('./payment-store.server')
    await deletePayment(data.id)
    return { ok: true as const }
  })

export type AdminPaymentMethod = z.infer<typeof paymentMethodSchema>
