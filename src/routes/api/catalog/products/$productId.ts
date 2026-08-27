import { createFileRoute } from '@tanstack/react-router'

import { getCatalogProduct } from '#/server/catalog-store.server'

export const Route = createFileRoute('/api/catalog/products/$productId')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = Number(params.productId)
        if (!Number.isSafeInteger(id) || id < 1)
          return Response.json({ error: 'Not found' }, { status: 404 })
        const product = await getCatalogProduct({ id, visibleOnly: true })
        return product
          ? Response.json({ product })
          : Response.json({ error: 'Not found' }, { status: 404 })
      },
    },
  },
})
