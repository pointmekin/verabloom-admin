import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/admin/ping')({
  server: {
    handlers: {
      POST: async () => {
        const { hasAdminSession } = await import('#/server/auth-session.server')
        if (!(await hasAdminSession())) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return Response.json({ ok: true })
      },
    },
  },
})
