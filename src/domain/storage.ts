import {
  categories,
  emptyInventory,
  MAX_ITEMS,
  validateInput,
} from './inventory'
import type { Category, Grocery, Inventory, ShoppingItem } from './inventory'

export const STORAGE_KEY = 'groceryaide.inventory'
export const MAX_BACKUP_BYTES = 2_000_000
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const validId = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= 100

export function parseBackup(raw: string): Inventory {
  if (new Blob([raw]).size > MAX_BACKUP_BYTES)
    throw new Error('Backup must be smaller than 2 MB.')
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    throw new Error('This file is not valid JSON.')
  }
  if (!record(value) || value.version !== 1)
    throw new Error('Unsupported backup. Expected GroceryAide version 1.')
  if (
    !Array.isArray(value.items) ||
    !Array.isArray(value.shopping) ||
    value.items.length > MAX_ITEMS ||
    value.shopping.length > MAX_ITEMS
  )
    throw new Error('Invalid backup lists or too many items.')
  const ids = new Set<string>()
  const items: Grocery[] = value.items.map((item: unknown) => {
    if (
      !record(item) ||
      !validId(item.id) ||
      ids.has(item.id) ||
      typeof item.name !== 'string' ||
      typeof item.quantity !== 'number' ||
      typeof item.date !== 'string' ||
      !categories.includes(item.category as Category) ||
      typeof item.status !== 'string' ||
      !['active', 'used', 'discarded'].includes(item.status)
    )
      throw new Error('Backup contains an invalid or duplicate grocery item.')
    ids.add(item.id)
    return {
      ...validateInput({
        name: item.name,
        category: item.category as Category,
        quantity: item.quantity,
        date: item.date,
      }),
      id: item.id,
      status: item.status as Grocery['status'],
    }
  })
  ids.clear()
  const shopping: ShoppingItem[] = value.shopping.map((item: unknown) => {
    if (
      !record(item) ||
      !validId(item.id) ||
      ids.has(item.id) ||
      typeof item.name !== 'string' ||
      !item.name.trim() ||
      item.name.trim().length > 100
    )
      throw new Error('Backup contains an invalid or duplicate shopping item.')
    ids.add(item.id)
    return { id: item.id, name: item.name.trim() }
  })
  return { version: 1, items, shopping }
}
export function exportBackup(state: Inventory): string {
  const raw = JSON.stringify(parseBackup(JSON.stringify(state)), null, 2)
  if (new Blob([raw]).size > MAX_BACKUP_BYTES)
    throw new Error(
      'Inventory is too large for a 2 MB backup. Remove some entries first.',
    )
  return raw
}
export type LoadedInventory = {
  data: Inventory
  error: string
  blocked: boolean
}
export function loadInventory(
  storage: Pick<Storage, 'getItem'>,
): LoadedInventory {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    return {
      data: raw === null ? emptyInventory() : parseBackup(raw),
      error: '',
      blocked: false,
    }
  } catch {
    return {
      data: emptyInventory(),
      error:
        'Saved data could not be read. It has not been overwritten. Export the saved data for recovery, then import a valid backup or explicitly start fresh.',
      blocked: true,
    }
  }
}
export function saveInventory(
  storage: Pick<Storage, 'setItem'>,
  state: Inventory,
): void {
  storage.setItem(STORAGE_KEY, exportBackup(state))
}
