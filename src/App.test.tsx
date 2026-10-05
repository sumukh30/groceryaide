import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { addItem, emptyInventory } from './domain/inventory'
import { exportBackup, parseBackup, STORAGE_KEY } from './domain/storage'

beforeEach(() => {
  vi.restoreAllMocks()
  vi.setSystemTime(new Date(2026, 8, 24, 12))
  localStorage.clear()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

afterEach(() => vi.useRealTimers())

describe('kitchen workflow', () => {
  it('downloads a valid backup without changing the saved inventory', async () => {
    const inventory = addItem(emptyInventory(), {
      name: 'Exported apples', category: 'Produce', quantity: 2, date: '2026-09-29',
    }, 'exported')
    localStorage.setItem(STORAGE_KEY, exportBackup(inventory))
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:backup')
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Export backup' }))
    expect(click).toHaveBeenCalledOnce()
    const blob = create.mock.calls[0][0] as Blob
    expect(parseBackup(await blob.text())).toEqual(inventory)
    expect(parseBackup(localStorage.getItem(STORAGE_KEY)!)).toEqual(inventory)
    expect(screen.getByRole('status').textContent).toBe('Backup downloaded.')
  })
  it('adds, edits, searches, uses, restores, deletes and persists a grocery', async () => {
    const user = userEvent.setup()
    const mounted = render(<App />)
    await user.click(screen.getByRole('button', { name: '+ Add grocery' }))
    await user.type(await screen.findByLabelText('Item name'), 'Spinach')
    fireEvent.change(screen.getByLabelText('Reminder date'), {
      target: { value: '2026-09-24' },
    })
    await user.click(screen.getByRole('button', { name: 'Add to inventory' }))
    let card = screen.getByRole('article', { name: 'Spinach' })
    await user.click(within(card).getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByLabelText('Item name'))
    await user.type(screen.getByLabelText('Item name'), 'Baby spinach')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    const search = screen.getByRole('searchbox')
    await user.type(search, 'no match')
    expect(screen.queryByRole('article')).toBeNull()
    await user.clear(search)
    card = screen.getByRole('article', { name: 'Baby spinach' })
    await user.click(within(card).getByRole('button', { name: 'Used' }))
    expect(
      parseBackup(localStorage.getItem(STORAGE_KEY)!).items[0].status,
    ).toBe('used')
    await user.click(
      screen.getByRole('button', { name: /Used & discarded history/ }),
    )
    expect(
      within(screen.getByRole('article', { name: 'Baby spinach' })).getByText(
        'Used',
      ),
    ).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Restore' }))
    mounted.unmount()
    render(<App />)
    expect(screen.getByRole('article', { name: 'Baby spinach' })).toBeTruthy()
    await user.click(
      screen.getByRole('button', { name: 'Delete Baby spinach' }),
    )
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }))
    expect(parseBackup(localStorage.getItem(STORAGE_KEY)!).items).toHaveLength(
      0,
    )
  })
  it('persists distinct history badges and keeps discard different from permanent deletion', async () => {
    const user = userEvent.setup()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    let inventory = emptyInventory()
    for (const name of ['Milk', 'Carrots']) {
      inventory = addItem(
        inventory,
        { name, category: 'Produce', quantity: 1, date: '2026-09-25' },
        name,
      )
    }
    localStorage.setItem(STORAGE_KEY, exportBackup(inventory))
    const mounted = render(<App />)
    await user.click(
      within(screen.getByRole('article', { name: 'Milk' })).getByRole(
        'button',
        { name: 'Used' },
      ),
    )
    await user.click(
      within(screen.getByRole('article', { name: 'Carrots' })).getByRole(
        'button',
        { name: 'Discard' },
      ),
    )
    expect(confirm).not.toHaveBeenCalled()
    expect(
      parseBackup(localStorage.getItem(STORAGE_KEY)!).items.map(
        (item) => item.status,
      ),
    ).toEqual(['used', 'discarded'])
    mounted.unmount()
    render(<App />)
    await user.click(
      screen.getByRole('button', { name: /Used & discarded history/ }),
    )
    expect(
      within(screen.getByRole('article', { name: 'Milk' })).getByText('Used'),
    ).toBeTruthy()
    const discarded = screen.getByRole('article', { name: 'Carrots' })
    expect(within(discarded).getByText('Discarded')).toBeTruthy()
    await user.type(screen.getByRole('searchbox'), 'carrots')
    expect(screen.queryByRole('article', { name: 'Milk' })).toBeNull()
    expect(screen.getByRole('article', { name: 'Carrots' })).toBeTruthy()
    await user.clear(screen.getByRole('searchbox'))
    await user.click(
      within(discarded).getByRole('button', { name: 'Delete Carrots' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Delete Carrots?' })
    expect(dialog.textContent).toContain('permanently delete Carrots')
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: 'Cancel' }))
    // Escape dispatches the native dialog cancel event; jsdom lacks that browser default.
    fireEvent(dialog, new Event('cancel', { bubbles: false, cancelable: true }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(within(discarded).getByRole('button', { name: 'Delete Carrots' }))
    await user.click(within(discarded).getByRole('button', { name: 'Delete Carrots' }))
    expect(parseBackup(localStorage.getItem(STORAGE_KEY)!).items).toHaveLength(
      2,
    )
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))
    await user.click(
      within(discarded).getByRole('button', { name: 'Delete Carrots' }),
    )
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }))
    expect(screen.queryByRole('article', { name: 'Carrots' })).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '+ Add grocery' }))
    expect(
      parseBackup(localStorage.getItem(STORAGE_KEY)!).items.map(
        (item) => item.name,
      ),
    ).toEqual(['Milk'])
    expect(
      within(screen.getByRole('article', { name: 'Milk' })).getByText('Used'),
    ).toBeTruthy()
  })
  it('adds and removes shopping list items', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByLabelText('Shopping item'), 'Oats')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(
      parseBackup(localStorage.getItem(STORAGE_KEY)!).shopping[0].name,
    ).toBe('Oats')
    await user.click(
      screen.getByRole('button', { name: 'Remove Oats from shopping list' }),
    )
    expect(parseBackup(localStorage.getItem(STORAGE_KEY)!).shopping).toEqual([])
  })
  it('preserves corrupt storage until the user explicitly starts fresh', async () => {
    localStorage.setItem(STORAGE_KEY, '{corrupt')
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('alert').textContent).toContain(
      'has not been overwritten',
    )
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{corrupt')
    await user.click(screen.getByRole('button', { name: 'Start fresh' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Start fresh' }))
    expect(parseBackup(localStorage.getItem(STORAGE_KEY)!)).toEqual(
      emptyInventory(),
    )
  })
  it('keeps in-memory edits and warns when storage fails', async () => {
    const user = userEvent.setup()
    render(<App />)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded')
    })
    await user.type(screen.getByLabelText('Shopping item'), 'Apples')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(
      screen.getByRole('button', { name: 'Remove Apples from shopping list' }),
    ).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toContain('only in memory')
  })
  it('prevents a stale tab from overwriting a newer inventory', async () => {
    const user = userEvent.setup()
    render(<App />)
    const otherData = addItem(
      emptyInventory(),
      {
        name: 'Milk',
        category: 'Dairy & eggs',
        quantity: 1,
        date: '2026-09-24',
      },
      'other',
    )
    localStorage.setItem(STORAGE_KEY, exportBackup(otherData))
    await user.type(screen.getByLabelText('Shopping item'), 'Oats')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByRole('alert').textContent).toContain('Another tab')
    expect(parseBackup(localStorage.getItem(STORAGE_KEY)!)).toEqual(otherData)
  })
  it('validates imports, previews them, supports cancellation, and replaces only on confirmation', async () => {
    const user = userEvent.setup()
    render(<App />)
    const imported = addItem(
      emptyInventory(),
      {
        name: 'Imported carrots',
        category: 'Produce',
        quantity: 3,
        date: '2026-09-24',
      },
      'imported',
    )
    // jsdom does not implement File.text; provide the browser contract for this file.
    const file = new File([exportBackup(imported)], 'backup.json', {
      type: 'application/json',
    })
    Object.defineProperty(file, 'text', {
      value: async () => exportBackup(imported),
    })
    await user.upload(screen.getByLabelText('Import backup'), file)
    expect(
      screen.getByRole('region', { name: 'Confirm backup import' }),
    ).toBeTruthy()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Cancel import' }))
    expect(
      screen.queryByRole('region', { name: 'Confirm backup import' }),
    ).toBeNull()
    await user.upload(screen.getByLabelText('Import backup'), file)
    await user.click(
      screen.getByRole('button', { name: 'Replace with backup' }),
    )
    expect(
      screen.getByRole('article', { name: 'Imported carrots' }),
    ).toBeTruthy()
    expect(parseBackup(localStorage.getItem(STORAGE_KEY)!)).toEqual(imported)
    const bad = new File(['oops'], 'bad.json', { type: 'application/json' })
    Object.defineProperty(bad, 'text', { value: async () => 'oops' })
    await user.upload(screen.getByLabelText('Import backup'), bad)
    expect(screen.getByRole('alert').textContent).toContain('not valid JSON')
    expect(parseBackup(localStorage.getItem(STORAGE_KEY)!)).toEqual(imported)
  })
})
