import { createFileRoute } from '@tanstack/react-router'

import { listCatalogProducts } from '#/server/catalog-store.server'

export const Route = createFileRoute('/api/catalog/products')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const variation =
          new URL(request.url).searchParams.get('variation') ?? undefined
        const products = await listCatalogProducts({
          visibleOnly: true,
          variation,
        })
        return Response.json({ products })
      },
    },
  },
})
