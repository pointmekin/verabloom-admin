import { createFileRoute } from '@tanstack/react-router'

import { listCatalogProducts } from '#/server/catalog-store.server'

export const Route = createFileRoute('/api/catalog/products')({
  server: {
    handlers: {
      GET: async () => {
        const products = await listCatalogProducts({ visibleOnly: true })
        return Response.json({ products })
      },
    },
  },
})
