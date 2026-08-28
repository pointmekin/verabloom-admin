import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/order-requests')({
  server: {
    handlers: {
      POST: async () =>
        Response.json({ error: 'Catalog is unavailable' }, { status: 404 }),
    },
  },
})
