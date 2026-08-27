import { createFileRoute } from '@tanstack/react-router'

import { getLocalObject } from '#/server/storage.server'

export const Route = createFileRoute('/api/catalog/image')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const key = new URL(request.url).searchParams.get('key')
        if (!key || !key.startsWith('verabloom/')) {
          return new Response('Not found', { status: 404 })
        }
        const object = await getLocalObject(key)
        if (!object) return new Response('Not found', { status: 404 })
        return new Response(new Uint8Array(object.body), {
          headers: {
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Content-Type': object.contentType,
          },
        })
      },
    },
  },
})
