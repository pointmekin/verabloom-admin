import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { hasAdminSession } from './auth-session.server'
import { createPayout, listPayouts, updatePayout } from './payout-store.server'

import { PAYOUT_RECIPIENTS } from '#/lib/team-members'

const payoutDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid payout date')
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number)
    if (![year, month, day].every(Number.isInteger)) return false
    const date = new Date(Date.UTC(year, month - 1, day))
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    )
  }, 'Enter a valid payout date')

export const payoutInputSchema = z.object({
  recipient: z.enum(PAYOUT_RECIPIENTS),
  amountThb: z
    .string()
    .trim()
    .regex(/^\d+(?:\.\d{1,2})?$/, 'Enter a valid Thai baht amount'),
  payoutDate: payoutDateSchema,
  note: z.string().trim().max(500, 'Enter a shorter note').default(''),
})

const payoutIdSchema = z.object({ id: z.coerce.number().int().positive() })

async function assertAdmin() {
  if (!(await hasAdminSession())) throw new Error('Unauthorized')
}

export const listAdminPayoutsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    await assertAdmin()
    return listPayouts()
  },
)

export const addAdminPayoutFn = createServerFn({ method: 'POST' })
  .validator(payoutInputSchema)
  .handler(async ({ data }) => {
    await assertAdmin()
    return createPayout(data)
  })

export const updateAdminPayoutFn = createServerFn({ method: 'POST' })
  .validator(payoutIdSchema.and(payoutInputSchema))
  .handler(async ({ data }) => {
    await assertAdmin()
    return updatePayout(data.id, data)
  })

export type AdminPayoutRecipient = z.infer<
  typeof payoutInputSchema
>['recipient']
