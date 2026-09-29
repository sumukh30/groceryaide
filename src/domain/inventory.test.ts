import { describe, expect, it } from 'vitest'
import {
  addItem,
  addShopping,
  categorizeDate,
  daysUntil,
  deleteItem,
  editItem,
  emptyInventory,
  localDate,
  removeShopping,
  setStatus,
  summary,
  validDate,
} from './inventory'
import type { GroceryInput } from './inventory'
const input: GroceryInput = {
  name: ' Spinach ',
  category: 'Produce',
  quantity: 2,
  date: '2026-09-24',
}

describe('calendar reminders', () => {
  it.each([
    ['2026-09-23', 'today'],
    ['2026-09-24', 'today'],
    ['2026-09-25', 'soon'],
    ['2026-09-27', 'soon'],
    ['2026-09-28', 'later'],
  ])('groups %s as %s', (date, expected) => {
    expect(categorizeDate(date, '2026-09-24')).toBe(expected)
  })
  it('handles leap days, month/year boundaries and DST with calendar arithmetic', () => {
    expect(daysUntil('2024-03-01', '2024-02-28')).toBe(2)
    expect(daysUntil('2027-01-01', '2026-12-31')).toBe(1)
    expect(daysUntil('2026-03-09', '2026-03-07')).toBe(2)
    expect(daysUntil('2026-11-02', '2026-10-31')).toBe(2)
    expect(validDate('2025-02-29')).toBe(false)
    expect(validDate('2024-02-29')).toBe(true)
  })
  it.each([
    '2026-02-30',
    '2026-13-01',
    '2026-9-1',
    '',
    '0000-01-01',
    'not a date',
  ])('rejects invalid date %s', (date) => {
    expect(validDate(date)).toBe(false)
    expect(() => categorizeDate(date, '2026-09-24')).toThrow()
  })
  it('uses the local calendar day', () => {
    expect(localDate(new Date(2026, 8, 24, 23, 59))).toBe('2026-09-24')
  })
})

describe('inventory operations', () => {
  it('adds, edits, changes status, restores, and deletes without mutating previous state', () => {
    const original = emptyInventory()
    const added = addItem(original, input, 'g1')
    expect(original.items).toHaveLength(0)
    expect(added.items[0].name).toBe('Spinach')
    const edited = editItem(added, 'g1', {
      ...input,
      name: 'Kale',
      quantity: 3,
    })
    expect(edited.items[0]).toMatchObject({
      id: 'g1',
      name: 'Kale',
      quantity: 3,
    })
    expect(added.items[0].name).toBe('Spinach')
    const used = setStatus(edited, 'g1', 'used')
    expect(summary(used, input.date)).toEqual({
      active: 0,
      today: 0,
      used: 1,
      discarded: 0,
    })
    const discarded = setStatus(used, 'g1', 'discarded')
    expect(summary(discarded, input.date).discarded).toBe(1)
    const restored = setStatus(discarded, 'g1', 'active')
    expect(summary(restored, input.date)).toEqual({
      active: 1,
      today: 1,
      used: 0,
      discarded: 0,
    })
    expect(deleteItem(restored, 'g1').items).toEqual([])
  })
  it.each([
    { name: ' ' },
    { name: 'x'.repeat(101) },
    { quantity: 0 },
    { quantity: 1.5 },
    { quantity: 1000 },
    { quantity: NaN },
    { date: '2026-02-30' },
  ])('rejects invalid input %j', (overrides) => {
    expect(() =>
      addItem(emptyInventory(), { ...input, ...overrides }),
    ).toThrow()
  })
  it('rejects unknown edits and duplicate IDs', () => {
    expect(() => editItem(emptyInventory(), 'missing', input)).toThrow()
    const added = addItem(emptyInventory(), input, 'g1')
    expect(() => addItem(added, input, 'g1')).toThrow()
  })
  it('adds and removes shopping items, rejecting empty and duplicate names', () => {
    const state = addShopping(emptyInventory(), ' Oats ', 's1')
    expect(state.shopping).toEqual([{ id: 's1', name: 'Oats' }])
    expect(() => addShopping(state, 'oats')).toThrow()
    expect(() => addShopping(state, ' ')).toThrow()
    expect(removeShopping(state, 's1').shopping).toEqual([])
    expect(state.shopping).toHaveLength(1)
  })
})
