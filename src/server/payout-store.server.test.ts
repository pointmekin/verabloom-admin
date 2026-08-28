import { beforeEach, describe, expect, it } from 'vitest'

import {
  clearPayoutMemoryForTests,
  createPayout,
  listPayouts,
} from './payout-store.server'

process.env.VERABLOOM_PAYOUT_STORE = 'memory'

describe('payout store', () => {
  beforeEach(() => {
    clearPayoutMemoryForTests()
  })

  it('records a payout to an eligible recipient', async () => {
    const payout = await createPayout({
      recipient: 'kan',
      amountThb: '1250.50',
      payoutDate: '2026-08-28',
      note: 'August distribution',
    })

    expect(payout).toMatchObject({
      recipient: 'kan',
      amountThb: '1250.50',
      payoutDate: '2026-08-28',
      note: 'August distribution',
    })
  })

  it('rejects the central-account owner as a payout recipient', async () => {
    await expect(
      createPayout({
        recipient: 'meen',
        amountThb: '100',
        payoutDate: '2026-08-28',
      }),
    ).rejects.toThrow('Choose a payout recipient')
  })

  it('lists recent payouts first', async () => {
    await createPayout({
      recipient: 'chompooh',
      amountThb: '100',
      payoutDate: '2026-08-01',
    })
    await createPayout({
      recipient: 'kan',
      amountThb: '200',
      payoutDate: '2026-08-02',
    })

    await expect(listPayouts()).resolves.toMatchObject([
      { recipient: 'kan', amountThb: '200' },
      { recipient: 'chompooh', amountThb: '100' },
    ])
  })
})
