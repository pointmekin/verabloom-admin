import { createFileRoute } from '@tanstack/react-router'

import { orderRequestSchema } from '#/server/order'
import { createOrderRequest } from '#/server/order-store.server'

export const Route = createFileRoute('/api/order-requests')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown
        try {
          body = await request.json()
        } catch {
          return Response.json(
            { error: 'Invalid request body' },
            { status: 400 },
          )
        }
        const parsed = orderRequestSchema.safeParse(body)
        if (!parsed.success) {
          return Response.json(
            { error: parsed.error.flatten() },
            { status: 400 },
          )
        }
        try {
          const orderRequest = await createOrderRequest(parsed.data)
          return Response.json(
            {
              orderRequest,
              requestReference: orderRequest.requestReference,
            },
            { status: 201 },
          )
        } catch (error) {
          if (error instanceof Error && error.message === 'Product not found') {
            return Response.json(
              {
                error: {
                  fieldErrors: { productId: ['Choose a valid product'] },
                },
              },
              { status: 400 },
            )
          }
          console.error('Order request submission failed', error)
          return Response.json(
            { error: 'Unable to submit order request' },
            { status: 400 },
          )
        }
      },
    },
  },
})
