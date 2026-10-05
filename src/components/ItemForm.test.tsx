import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ItemForm from './ItemForm'

beforeEach(() => vi.setSystemTime(new Date(2026, 8, 24, 23, 59)))
afterEach(() => vi.useRealTimers())

it.each([false, true])('validates typed dates before saving (editing: %s)', async (editing) => {
  const save = vi.fn()
  const user = userEvent.setup()
  render(<ItemForm item={editing ? { id: 'milk', name: 'Milk', category: 'Produce', quantity: 1, date: '2026-09-23', status: 'active' } : undefined} onSave={save} onCancel={() => {}} />)
  if (!editing) await user.type(screen.getByLabelText('Item name'), 'Milk')
  const input = screen.getByLabelText('Reminder date')
  const submit = screen.getByRole('button', { name: editing ? 'Save changes' : 'Add to inventory' })
  fireEvent.change(input, { target: { value: '2026-09-23' } })
  await user.click(submit)
  expect(save).not.toHaveBeenCalled()
  expect(screen.getByRole('alert').textContent).toContain('today or later')
  for (const date of ['2026-09-24', '2026-09-25', '2027-01-01']) {
    fireEvent.change(input, { target: { value: date } })
    await user.click(submit)
    expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ date }))
  }
})
