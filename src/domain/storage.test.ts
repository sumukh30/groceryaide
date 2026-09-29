import { describe, expect, it, vi } from 'vitest'
import { addItem, addShopping, emptyInventory, setStatus } from './inventory'
import {
  exportBackup,
  loadInventory,
  MAX_BACKUP_BYTES,
  parseBackup,
  saveInventory,
  STORAGE_KEY,
} from './storage'
const data = addShopping(
  setStatus(
    addItem(
      emptyInventory(),
      {
        name: 'Milk',
        category: 'Dairy & eggs',
        quantity: 2,
        date: '2026-09-24',
      },
      'g1',
    ),
    'g1',
    'used',
  ),
  'Bread',
  's1',
)

describe('versioned backup validation', () => {
  it('rejects an export whose formatted size would exceed the import limit', () => {
    const large = {
      ...emptyInventory(),
      items: Array.from({ length: 5000 }, (_, index) => ({
        ...data.items[0],
        id: String(index),
        name: '中'.repeat(90),
      })),
    }
    expect(() => parseBackup(JSON.stringify(large))).not.toThrow()
    expect(() => exportBackup(large)).toThrow('too large')
  })
  it('round-trips every field, history and shopping list', () => {
    expect(parseBackup(exportBackup(data))).toEqual(data)
    expect(JSON.parse(exportBackup(data)).version).toBe(1)
    expect(parseBackup(exportBackup(emptyInventory()))).toEqual(
      emptyInventory(),
    )
  })
  it.each([
    '{',
    'null',
    '[]',
    '42',
    '{}',
    '{"version":2,"items":[],"shopping":[]}',
    '{"version":1,"items":{}}',
  ])('rejects malformed or unsupported data: %s', (raw) => {
    expect(() => parseBackup(raw)).toThrow()
  })
  it.each([
    { quantity: '2' },
    { quantity: -1 },
    { name: null },
    { name: ' ' },
    { date: '2026-02-30' },
    { status: 'expired' },
    { status: ['used'] },
    { category: 'Unknown' },
    { id: '' },
  ])('rejects corrupt grocery fields %j', (overrides) => {
    expect(() =>
      parseBackup(
        JSON.stringify({
          ...data,
          items: [{ ...data.items[0], ...overrides }],
        }),
      ),
    ).toThrow()
  })
  it('rejects duplicate IDs, malformed shopping and oversized input', () => {
    expect(() =>
      parseBackup(
        JSON.stringify({ ...data, items: [data.items[0], data.items[0]] }),
      ),
    ).toThrow()
    expect(() =>
      parseBackup(
        JSON.stringify({ ...data, shopping: [{ id: 's1', name: false }] }),
      ),
    ).toThrow()
    expect(() =>
      parseBackup(
        JSON.stringify({
          ...data,
          shopping: [data.shopping[0], data.shopping[0]],
        }),
      ),
    ).toThrow()
    expect(() => parseBackup(' '.repeat(MAX_BACKUP_BYTES + 1))).toThrow()
  })
  it('strips unknown properties instead of propagating them', () => {
    const raw = JSON.stringify({
      ...data,
      untrusted: true,
      items: [{ ...data.items[0], html: '<script>bad</script>' }],
    })
    expect(parseBackup(raw)).toEqual(data)
  })
})

describe('browser persistence', () => {
  it('loads missing data as an empty inventory', () => {
    expect(loadInventory({ getItem: () => null })).toEqual({
      data: emptyInventory(),
      error: '',
      blocked: false,
    })
  })
  it('loads valid saved data and writes the versioned schema', () => {
    expect(loadInventory({ getItem: () => exportBackup(data) }).data).toEqual(
      data,
    )
    const setItem = vi.fn()
    saveInventory({ setItem }, data)
    expect(setItem).toHaveBeenCalledWith(STORAGE_KEY, exportBackup(data))
  })
  it('blocks malformed or inaccessible saved data without writing over it', () => {
    expect(loadInventory({ getItem: () => '{bad' }).blocked).toBe(true)
    expect(
      loadInventory({
        getItem: () => {
          throw new Error('denied')
        },
      }).error,
    ).not.toBe('')
  })
  it('reports failed writes to the caller', () => {
    expect(() =>
      saveInventory(
        {
          setItem: () => {
            throw new Error('quota')
          },
        },
        data,
      ),
    ).toThrow('quota')
  })
})
