import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/catalog/products')({
  server: {
    handlers: {
      GET: async () =>
        Response.json({ error: 'Catalog is unavailable' }, { status: 404 }),
    },
  },
})
