import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Order } from '#/db/schema'
import { updateOrderStatus } from './order-store.server'

const { getDatabase } = vi.hoisted(() => ({
  getDatabase: vi.fn(),
}))

vi.mock('#/db', () => ({ getDatabase }))

process.env.DATABASE_URL = 'postgresql://user:password@host/database'
delete process.env.VERABLOOM_ORDER_STORE
delete process.env.VERABLOOM_CATALOG_STORE

const existingRow = {
  id: 42,
  requestReference: 'VB-000042',
  status: 'confirmed',
  productId: null,
  productNameSnapshot: 'Rose bouquet',
  quantity: 1,
  taskOwner: ['chompooh'],
  referenceImageObjectKey: null,
  customerName: 'Mali',
  socialChannel: 'line',
  socialContact: 'mali.line',
  phone: null,
  requestDetails: '',
  deliveryMethod: 'collection',
  recipientName: null,
  recipientPhone: null,
  orderAddress: null,
  requiredDate: '2026-08-28',
  customerId: null,
  orderValueThb: '1200',
  internalNote: null,
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
  updatedAt: new Date('2026-08-01T00:00:00.000Z'),
} as Order

describe('database order status updates', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('updates status without using unsupported transactions', async () => {
    const updatedRow = { ...existingRow, status: 'cancelled' }
    const transaction = vi.fn(() => {
      throw new Error('No transactions support in neon-http driver')
    })
    const select = vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(async () => [existingRow]),
      })),
    }))
    const update = vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => [updatedRow]),
        })),
      })),
    }))
    getDatabase.mockReturnValue({ select, update, transaction })

    const updated = await updateOrderStatus(42, 'cancelled')

    expect(updated.status).toBe('cancelled')
    expect(transaction).not.toHaveBeenCalled()
  })
})
