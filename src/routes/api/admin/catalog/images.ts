import { createFileRoute } from '@tanstack/react-router'

import { uploadProductImageObject } from '#/server/storage.server'
import { getCatalogProduct } from '#/server/catalog-store.server'

export const Route = createFileRoute('/api/admin/catalog/images')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { hasAdminSession } = await import('#/server/auth-session.server')
        if (!(await hasAdminSession()))
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        const body = await request.json()
        if (
          typeof body?.productId !== 'number' ||
          typeof body?.mimeType !== 'string' ||
          typeof body?.base64 !== 'string'
        ) {
          return Response.json(
            { error: 'Invalid image payload' },
            { status: 400 },
          )
        }
        if (
          !(await getCatalogProduct({ id: body.productId, visibleOnly: false }))
        ) {
          return Response.json({ error: 'Product not found' }, { status: 404 })
        }
        try {
          return Response.json(
            await uploadProductImageObject({
              productId: body.productId,
              mimeType: body.mimeType,
              base64: body.base64,
            }),
          )
        } catch (error) {
          return Response.json(
            {
              error:
                error instanceof Error ? error.message : 'Image upload failed',
            },
            { status: 400 },
          )
        }
      },
    },
  },
})
