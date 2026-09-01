import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { listPayouts } from './payout-store.server'

const calendarDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date')
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

export const reportingPeriodSchema = z
  .object({ start: calendarDateSchema, end: calendarDateSchema })
  .refine((value) => value.start <= value.end, {
    message: 'Enter a valid reporting period',
  })

async function assertAdmin() {
  const { hasAdminSession } = await import('./auth-session.server')
  if (!(await hasAdminSession())) throw new Error('Unauthorized')
}

async function loadFinanceInputs() {
  const [paymentStore, expenseStore, orderStore] = await Promise.all([
    import('./payment-store.server'),
    import('./expense-store.server'),
    import('./order-store.server'),
  ])
  return Promise.all([
    paymentStore.listAllPayments(),
    expenseStore.listExpenses(),
    orderStore.listOrderRequests(),
  ])
}

export const getAdminDashboardFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    await assertAdmin()
    const [{ buildDashboardFinancials }, [payments, expenses, orders]] =
      await Promise.all([
        import('./finance-report.server'),
        loadFinanceInputs(),
      ])
    return buildDashboardFinancials({ payments, expenses, orders })
  },
)

export const getAdminFinanceReportFn = createServerFn({ method: 'GET' })
  .validator(reportingPeriodSchema)
  .handler(async ({ data }) => {
    await assertAdmin()
    const [
      { buildAllTimeFinanceReport, buildFinanceReport, joinPaymentsWithOrders },
      [payments, expenses, orders],
      payouts,
    ] = await Promise.all([
      import('./finance-report.server'),
      loadFinanceInputs(),
      listPayouts(),
    ])
    const joinedPayments = joinPaymentsWithOrders(payments, orders)
    return {
      report: buildFinanceReport({
        payments: joinedPayments,
        expenses,
        start: data.start,
        end: data.end,
        payouts,
      }),
      allTime: buildAllTimeFinanceReport({
        payments: joinedPayments,
        expenses,
        payouts,
      }),
    }
  })
