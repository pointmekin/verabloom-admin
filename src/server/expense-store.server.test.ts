import { afterEach, describe, expect, it } from 'vitest'

import {
  clearExpenseMemoryForTests,
  createExpense,
  deleteExpense,
  listExpenses,
  updateExpense,
} from './expense-store.server'
import type { ExpensePayer } from './expense-store.server'

process.env.VERABLOOM_EXPENSE_STORE = 'memory'

const payers: ExpensePayer[] = ['chompooh', 'meen', 'kan']

describe('expense records', () => {
  afterEach(() => {
    clearExpenseMemoryForTests()
  })

  it('adds expenses paid by each team member with amount, date, and optional fields', async () => {
    for (const payer of payers) {
      await createExpense({
        description: `Ribbon roll by ${payer}`,
        payer,
        totalAmountThb: '250.75',
        expenseDate: '2026-08-10',
        quantity: '',
        note: '',
      })
    }
    const expenses = await listExpenses()
    expect(expenses.map((item) => item.payer)).toEqual([...payers].reverse())
    expect(expenses[0]).toMatchObject({
      description: 'Ribbon roll by kan',
      totalAmountThb: '250.75',
      expenseDate: '2026-08-10',
      quantity: null,
      note: null,
    })
  })

  it('trims description and note, and keeps quantity without unit-price math', async () => {
    const created = await createExpense({
      description: '  Wrapping paper  ',
      payer: 'meen',
      totalAmountThb: '120',
      expenseDate: '2026-08-12',
      quantity: '3',
      note: ' two packs plus tape ',
    })
    expect(created.description).toBe('Wrapping paper')
    expect(created.quantity).toBe(3)
    expect(created.note).toBe('two packs plus tape')
    const listed = await listExpenses()
    expect(listed[0]).not.toHaveProperty('unitAmountThb')
  })

  it('lists expenses newest first by expense date', async () => {
    await createExpense({
      description: 'Old glue',
      payer: 'kan',
      totalAmountThb: '90',
      expenseDate: '2026-07-01',
      quantity: '',
      note: '',
    })
    await createExpense({
      description: 'New foam',
      payer: 'chompooh',
      totalAmountThb: '180',
      expenseDate: '2026-08-20',
      quantity: '',
      note: '',
    })
    await createExpense({
      description: 'Same-day later entry',
      payer: 'meen',
      totalAmountThb: '60',
      expenseDate: '2026-08-20',
      quantity: '',
      note: '',
    })
    const expenses = await listExpenses()
    expect(expenses.map((item) => item.description)).toEqual([
      'Same-day later entry',
      'New foam',
      'Old glue',
    ])
  })

  it('rejects invalid descriptions, payers, amounts, dates, and quantities', async () => {
    const base = {
      payer: 'chompooh' as ExpensePayer,
      totalAmountThb: '100',
      expenseDate: '2026-08-01',
      quantity: '',
      note: '',
    }
    await expect(
      createExpense({ ...base, description: '   ' }),
    ).rejects.toThrow('Enter a description')
    await expect(
      createExpense({
        ...base,
        description: 'Wire',
        payer: 'boom' as ExpensePayer,
      }),
    ).rejects.toThrow('Choose a payer')
    await expect(
      createExpense({ ...base, description: 'Wire', totalAmountThb: '12.345' }),
    ).rejects.toThrow('Enter a valid Thai baht amount')
    await expect(
      createExpense({ ...base, description: 'Wire', totalAmountThb: '-5' }),
    ).rejects.toThrow('Enter a valid Thai baht amount')
    await expect(
      createExpense({
        ...base,
        description: 'Wire',
        expenseDate: '2026-02-30',
      }),
    ).rejects.toThrow('Enter a valid expense date')
    await expect(
      createExpense({ ...base, description: 'Wire', quantity: '0' }),
    ).rejects.toThrow('Enter a positive whole number')
    await expect(
      createExpense({ ...base, description: 'Wire', quantity: '2.5' }),
    ).rejects.toThrow('Enter a positive whole number')
  })

  it('edits an existing expense', async () => {
    const created = await createExpense({
      description: 'Floral wire',
      payer: 'chompooh',
      totalAmountThb: '140',
      expenseDate: '2026-08-05',
      quantity: '',
      note: '',
    })
    const updated = await updateExpense(created.id, {
      description: 'Floral wire (corrected)',
      payer: 'kan',
      totalAmountThb: '155.50',
      expenseDate: '2026-08-06',
      quantity: '2',
      note: 'receipt with Meen',
    })
    expect(updated).toMatchObject({
      id: created.id,
      description: 'Floral wire (corrected)',
      payer: 'kan',
      totalAmountThb: '155.50',
      expenseDate: '2026-08-06',
      quantity: 2,
      note: 'receipt with Meen',
    })
    expect((await listExpenses()).length).toBe(1)
  })

  it('deletes an expense and then reports missing records', async () => {
    const created = await createExpense({
      description: 'Tape',
      payer: 'meen',
      totalAmountThb: '35',
      expenseDate: '2026-08-08',
      quantity: '',
      note: '',
    })
    expect(await deleteExpense(created.id)).toBe(true)
    expect(await listExpenses()).toEqual([])
    await expect(updateExpense(created.id, created)).rejects.toThrow(
      'Expense not found',
    )
    await expect(deleteExpense(created.id)).rejects.toThrow('Expense not found')
  })

  it('stays in memory when only the catalog store is memory, matching other stores', async () => {
    delete process.env.VERABLOOM_EXPENSE_STORE
    process.env.VERABLOOM_CATALOG_STORE = 'memory'
    try {
      const created = await createExpense({
        description: 'Satay sticks',
        payer: 'kan',
        totalAmountThb: '75',
        expenseDate: '2026-08-03',
        quantity: '',
        note: '',
      })
      expect(created.id).toBeGreaterThan(0)
      expect((await listExpenses()).length).toBe(1)
    } finally {
      process.env.VERABLOOM_EXPENSE_STORE = 'memory'
      delete process.env.VERABLOOM_CATALOG_STORE
    }
  })
})
