import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { TEAM_MEMBERS } from '#/lib/team-members'

const dateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid expense date')
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number)
    if (![year, month, day].every(Number.isInteger)) return false
    const date = new Date(Date.UTC(year, month - 1, day))
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    )
  }, 'Enter a valid expense date')

const moneySchema = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,2})?$/, 'Enter a valid Thai baht amount')

export const expensePayerSchema = z.enum(TEAM_MEMBERS)

const optionalQuantitySchema = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.coerce.number().int().positive('Enter a positive whole number').nullable(),
)

export const expenseInputSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, 'Enter a description')
    .max(300, 'Enter a shorter description'),
  payer: expensePayerSchema,
  totalAmountThb: moneySchema,
  expenseDate: dateSchema,
  quantity: optionalQuantitySchema,
  note: z.string().trim().max(500, 'Enter a shorter note').default(''),
})

const expenseIdSchema = z.object({ id: z.coerce.number().int().positive() })

async function assertAdmin() {
  const { hasAdminSession } = await import('./auth-session.server')
  if (!(await hasAdminSession())) throw new Error('Unauthorized')
}

export const listAdminExpensesFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    await assertAdmin()
    const { listExpenses } = await import('./expense-store.server')
    return listExpenses()
  },
)

export const addAdminExpenseFn = createServerFn({ method: 'POST' })
  .validator(expenseInputSchema)
  .handler(async ({ data }) => {
    await assertAdmin()
    const { createExpense } = await import('./expense-store.server')
    return createExpense(data)
  })

export const updateAdminExpenseFn = createServerFn({ method: 'POST' })
  .validator(expenseIdSchema.and(expenseInputSchema))
  .handler(async ({ data }) => {
    await assertAdmin()
    const { updateExpense } = await import('./expense-store.server')
    return updateExpense(data.id, data)
  })

export const deleteAdminExpenseFn = createServerFn({ method: 'POST' })
  .validator(expenseIdSchema)
  .handler(async ({ data }) => {
    await assertAdmin()
    const { deleteExpense } = await import('./expense-store.server')
    await deleteExpense(data.id)
    return { ok: true as const }
  })

export type AdminExpensePayer = z.infer<typeof expensePayerSchema>
