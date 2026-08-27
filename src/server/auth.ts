import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().min(1).max(320),
  password: z.string().min(1).max(1024),
})

export const getRequiredAdminFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { hasAdminSession } = await import('./auth-session.server')
    if (!(await hasAdminSession())) {
      throw redirect({ to: '/admin/login' })
    }
    return { authenticated: true as const }
  },
)

export const loginFn = createServerFn({ method: 'POST' })
  .validator(loginSchema)
  .handler(async ({ data }) => {
    const { authenticateAdmin } = await import('./auth-session.server')
    return { ok: await authenticateAdmin(data.email, data.password) }
  })

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const { clearAdminSession } = await import('./auth-session.server')
  await clearAdminSession()
  return { ok: true as const }
})
