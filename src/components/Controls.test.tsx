import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategorySelect from './CategorySelect'
import DateField from './DateField'
import type { Category } from '../domain/inventory'

afterEach(() => vi.unstubAllGlobals())

function Controls() {
  const [category, setCategory] = useState<Category>('Produce')
  const [date, setDate] = useState('2026-09-25')
  return (
    <>
      <CategorySelect value={category} onChange={setCategory} />
      <DateField value={date} onChange={setDate} />
      <button>Outside</button>
    </>
  )
}

describe('category dropdown', () => {
  it('supports arrows, selection, Escape, focus return and outside dismissal', async () => {
    const user = userEvent.setup()
    render(<Controls />)
    const trigger = screen.getByRole('button', { name: 'Category Produce' })
    await user.click(trigger)
    expect(screen.getByRole('listbox')).toBeTruthy()
    expect(document.activeElement).toBe(
      screen.getByRole('option', { name: 'Produce' }),
    )
    await user.keyboard('{ArrowDown}{Enter}')
    expect(trigger.textContent).toContain('Dairy & eggs')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(document.activeElement).toBe(trigger)
    await user.click(trigger)
    await user.keyboard('{End}')
    expect(document.activeElement).toBe(
      screen.getByRole('option', { name: 'Other' }),
    )
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(document.activeElement).toBe(trigger)
    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Outside' }))
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Outside' }),
    )
  })
  it('supports typeahead and Tab without trapping focus', async () => {
    const user = userEvent.setup()
    render(<Controls />)
    await user.click(screen.getByRole('button', { name: 'Category Produce' }))
    await user.keyboard('f')
    expect(document.activeElement).toBe(
      screen.getByRole('option', { name: 'Frozen' }),
    )
    await user.tab()
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(document.activeElement).toBe(screen.getByLabelText('Reminder date'))
  })
})

describe('reminder date', () => {
  async function openCalendar(user: ReturnType<typeof userEvent.setup>) {
    await user.click(
      screen.getByRole('button', { name: 'Choose reminder date' }),
    )
    // The dialog mounts before its lazy calendar. Cold CI imports can outlast
    // findByRole's DOM-query deadline; await the actual import, then let act
    // flush the Suspense commit and focus effects before querying the dates.
    await act(async () => {
      await vi.dynamicImportSettled()
    })
  }

  it('synchronizes typed dates, month navigation and calendar selection without UTC conversion', async () => {
    const user = userEvent.setup()
    render(<Controls />)
    const input = screen.getByLabelText('Reminder date') as HTMLInputElement
    fireEvent.change(input, { target: { value: '2026-10-12' } })
    const trigger = screen.getByRole('button', { name: 'Choose reminder date' })
    await openCalendar(user)
    const dialog = screen.getByRole('dialog', { name: 'Choose reminder date' })
    const selected = await within(dialog).findByRole('button', {
      name: /Monday, October 12th, 2026/,
    })
    expect(document.activeElement).toBe(selected)
    await user.click(
      within(dialog).getByRole('button', { name: /next month/i }),
    )
    await user.click(
      await within(dialog).findByRole('button', {
        name: /Sunday, November 15th, 2026/,
      }),
    )
    expect(input.value).toBe('2026-11-15')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(trigger)
    await openCalendar(user)
    await within(screen.getByRole('dialog')).findByRole('button', {
      name: /Sunday, November 15th, 2026/,
    })
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(trigger)
    await openCalendar(user)
    await user.click(screen.getByRole('button', { name: 'Outside' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('keeps an open calendar synchronized with typed input and focuses it on rapid reopening', async () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }))
    const user = userEvent.setup()
    render(<Controls />)
    const input = screen.getByLabelText('Reminder date') as HTMLInputElement
    await openCalendar(user)
    await screen.findByRole('button', { name: /Friday, September 25th, 2026/ })
    await user.click(input)
    fireEvent.change(input, { target: { value: '2027-01-04' } })
    await screen.findByRole('button', { name: /Monday, January 4th, 2027/ })
    await user.keyboard('{Escape}')
    await openCalendar(user)
    const selected = await screen.findByRole('button', {
      name: /Monday, January 4th, 2027/,
    })
    expect(document.activeElement).toBe(selected)
  })
  it('accepts leap dates and flags invalid dates without silently normalizing them', async () => {
    const user = userEvent.setup()
    render(<Controls />)
    const input = screen.getByLabelText('Reminder date') as HTMLInputElement
    fireEvent.change(input, { target: { value: '2024-02-29' } })
    expect(input.getAttribute('aria-invalid')).toBe('false')
    await openCalendar(user)
    await screen.findByRole('button', { name: /Thursday, February 29th, 2024/ })
    await user.keyboard('{ArrowRight}{Enter}')
    await waitFor(() => expect(input.value).toBe('2024-03-01'))
    fireEvent.change(input, { target: { value: '2025-02-29' } })
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.value).toBe('2025-02-29')
  })
  it('preserves years below 100 in calendar selection', async () => {
    const user = userEvent.setup()
    render(<Controls />)
    const input = screen.getByLabelText('Reminder date') as HTMLInputElement
    fireEvent.change(input, { target: { value: '0099-06-15' } })
    await openCalendar(user)
    await screen.findByRole('button', { name: /June 15th, 99/ })
    await user.keyboard('{ArrowRight}{Enter}')
    expect(input.value).toBe('0099-06-16')
  })
})
