import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/catalog/products/$productId')({
  server: {
    handlers: {
      GET: async () =>
        Response.json({ error: 'Catalog is unavailable' }, { status: 404 }),
    },
  },
})
