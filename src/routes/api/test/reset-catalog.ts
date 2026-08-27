import { createFileRoute } from '@tanstack/react-router'

import { clearCatalogMemoryForTests } from '#/server/catalog-store.server'
import { clearOrderMemoryForTests } from '#/server/order-store.server'
import { resetObjectStorageForTests } from '#/server/storage.server'

export const Route = createFileRoute('/api/test/reset-catalog')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const configuredToken = process.env.VERABLOOM_TEST_RESET_TOKEN
        if (
          process.env.VERABLOOM_CATALOG_STORE !== 'memory' ||
          !configuredToken ||
          request.headers.get('x-verabloom-test-reset') !== configuredToken
        ) {
          return new Response('Not found', { status: 404 })
        }
        clearCatalogMemoryForTests()
        clearOrderMemoryForTests()
        resetObjectStorageForTests()
        return new Response(null, { status: 204 })
      },
    },
  },
})
