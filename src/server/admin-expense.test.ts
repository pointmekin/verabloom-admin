import { describe, expect, it } from 'vitest'

import { expenseInputSchema, expensePayerSchema } from './admin-expense'

describe('expense input schema', () => {
  const base = {
    description: 'Floral foam',
    payer: 'chompooh',
    totalAmountThb: '480',
    expenseDate: '2026-08-14',
    quantity: '',
    note: '',
  }

  it('accepts a valid expense for each payer', () => {
    for (const payer of ['chompooh', 'meen', 'kan']) {
      const parsed = expenseInputSchema.parse({ ...base, payer })
      expect(parsed.payer).toBe(payer)
    }
    expect(expensePayerSchema.options).toHaveLength(3)
  })

  it('reports field-level errors for invalid fields', () => {
    const parsed = expenseInputSchema.safeParse({
      ...base,
      description: '   ',
      payer: 'boom',
      totalAmountThb: '12.345',
      expenseDate: '2026-02-30',
      quantity: '0',
    })
    expect(parsed.success).toBe(false)
    if (parsed.success) return
    const fields = new Set(parsed.error.issues.map((issue) => issue.path[0]))
    expect(fields).toEqual(
      new Set([
        'description',
        'payer',
        'totalAmountThb',
        'expenseDate',
        'quantity',
      ]),
    )
  })

  it('normalizes optional quantity and note, defaulting quantity to null', () => {
    const empty = expenseInputSchema.parse(base)
    expect(empty.quantity).toBeNull()
    expect(empty.note).toBe('')
    const full = expenseInputSchema.parse({
      ...base,
      quantity: '4',
      note: '  two packs  ',
    })
    expect(full.quantity).toBe(4)
    expect(full.note).toBe('two packs')
  })
})
