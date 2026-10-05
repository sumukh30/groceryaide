export const categories = [
  'Produce',
  'Dairy & eggs',
  'Meat & fish',
  'Bakery',
  'Pantry',
  'Frozen',
  'Other',
] as const
export type Category = (typeof categories)[number]
export type Status = 'active' | 'used' | 'discarded'
export type GroceryInput = {
  name: string
  category: Category
  quantity: number
  date: string
}
export type Grocery = GroceryInput & { id: string; status: Status }
export type ShoppingItem = { id: string; name: string }
export type Inventory = {
  version: 1
  items: Grocery[]
  shopping: ShoppingItem[]
}
export type DateGroup = 'today' | 'soon' | 'later'
export const emptyInventory = (): Inventory => ({
  version: 1,
  items: [],
  shopping: [],
})
export const MAX_ITEMS = 5000

export function localDate(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function validDate(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value < '0001-01-01'
  )
    return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  )
}

// UTC is used only for calendar arithmetic, so DST cannot shorten or lengthen a day.
export function daysUntil(date: string, today = localDate()): number {
  if (!validDate(date) || !validDate(today))
    throw new Error('Enter a valid calendar date.')
  return (
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) /
    86400000
  )
}
export function categorizeDate(date: string, today = localDate()): DateGroup {
  const days = daysUntil(date, today)
  return days <= 0 ? 'today' : days <= 3 ? 'soon' : 'later'
}
export function validateInput(input: GroceryInput): GroceryInput {
  const name = input.name.trim()
  if (!name || name.length > 100)
    throw new Error('Use an item name between 1 and 100 characters.')
  if (!categories.includes(input.category))
    throw new Error('Choose a valid category.')
  if (
    !Number.isInteger(input.quantity) ||
    input.quantity < 1 ||
    input.quantity > 999
  )
    throw new Error('Quantity must be a whole number from 1 to 999.')
  if (!validDate(input.date)) throw new Error('Enter a valid calendar date.')
  return {
    name,
    category: input.category,
    quantity: input.quantity,
    date: input.date,
  }
}
export function validateSaveInput(input: GroceryInput): GroceryInput {
  const valid = validateInput(input)
  if (valid.date < localDate())
    throw new Error('Reminder date must be today or later.')
  return valid
}
export function addItem(
  state: Inventory,
  input: GroceryInput,
  id: string = crypto.randomUUID(),
): Inventory {
  if (state.items.length >= MAX_ITEMS)
    throw new Error(
      'Inventory limit reached. Export a backup and remove older history.',
    )
  if (state.items.some((item) => item.id === id))
    throw new Error('Item ID already exists.')
  return {
    ...state,
    items: [...state.items, { ...validateSaveInput(input), id, status: 'active' }],
  }
}
export function editItem(
  state: Inventory,
  id: string,
  input: GroceryInput,
): Inventory {
  const valid = validateSaveInput(input)
  if (!state.items.some((item) => item.id === id))
    throw new Error('Item no longer exists.')
  return {
    ...state,
    items: state.items.map((item) =>
      item.id === id ? { ...item, ...valid } : item,
    ),
  }
}
export function setStatus(
  state: Inventory,
  id: string,
  status: Status,
): Inventory {
  return {
    ...state,
    items: state.items.map((item) =>
      item.id === id ? { ...item, status } : item,
    ),
  }
}
export function deleteItem(state: Inventory, id: string): Inventory {
  return { ...state, items: state.items.filter((item) => item.id !== id) }
}
export function addShopping(
  state: Inventory,
  name: string,
  id: string = crypto.randomUUID(),
): Inventory {
  name = name.trim()
  if (!name || name.length > 100)
    throw new Error('Use a shopping item name between 1 and 100 characters.')
  if (state.shopping.length >= MAX_ITEMS)
    throw new Error('Shopping list limit reached.')
  if (
    state.shopping.some(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    )
  )
    throw new Error('That item is already on your shopping list.')
  if (state.shopping.some((item) => item.id === id))
    throw new Error('Shopping item ID already exists.')
  return { ...state, shopping: [...state.shopping, { id, name }] }
}
export function removeShopping(state: Inventory, id: string): Inventory {
  return { ...state, shopping: state.shopping.filter((item) => item.id !== id) }
}
export function summary(state: Inventory, today = localDate()) {
  return {
    active: state.items.filter((item) => item.status === 'active').length,
    today: state.items.filter(
      (item) =>
        item.status === 'active' &&
        categorizeDate(item.date, today) === 'today',
    ).length,
    used: state.items.filter((item) => item.status === 'used').length,
    discarded: state.items.filter((item) => item.status === 'discarded').length,
  }
}
