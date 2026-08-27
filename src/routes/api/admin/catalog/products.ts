import { createFileRoute } from '@tanstack/react-router'

import { productInputSchema } from '#/server/catalog'
import { saveCatalogProduct } from '#/server/catalog-store.server'

export const Route = createFileRoute('/api/admin/catalog/products')({
  server: {
    handlers: {
      POST: async ({ request }) => saveProduct(request),
      PUT: async ({ request }) => saveProduct(request),
      PATCH: async ({ request }) => saveProduct(request),
    },
  },
})

async function saveProduct(request: Request) {
  const { hasAdminSession } = await import('#/server/auth-session.server')
  if (!(await hasAdminSession())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const parsed = productInputSchema.safeParse(await request.json())
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const product = await saveCatalogProduct(parsed.data)
  return Response.json({ product })
}
