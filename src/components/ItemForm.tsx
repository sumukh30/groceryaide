import { useState } from 'react'
import type { FormEvent } from 'react'
import { localDate, validateInput } from '../domain/inventory'
import type { Category, Grocery, GroceryInput } from '../domain/inventory'

import CategorySelect from './CategorySelect'
import DateField from './DateField'

type Props = {
  item?: Grocery
  onSave: (input: GroceryInput) => void
  onCancel: () => void
}
export default function ItemForm({ item, onSave, onCancel }: Props) {
  const [name, setName] = useState(item?.name ?? '')
  const [category, setCategory] = useState<Category>(
    item?.category ?? 'Produce',
  )
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 1))
  const [date, setDate] = useState(item?.date ?? localDate())
  const [error, setError] = useState('')
  function submit(event: FormEvent) {
    event.preventDefault()
    try {
      onSave(
        validateInput({ name, category, quantity: Number(quantity), date }),
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save item.')
    }
  }
  return (
    <section
      className="panel form-panel"
      aria-labelledby="form-title"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !event.defaultPrevented) onCancel()
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="form-title">{item ? 'Edit grocery' : 'Add a grocery'}</h2>
        <button type="button" className="quiet" onClick={onCancel}>
          Cancel
        </button>
      </div>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          Item name
          <input
            autoFocus
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Spinach"
          />
        </label>
        <CategorySelect value={category} onChange={setCategory} />
        <label>
          Quantity
          <input
            type="number"
            required
            min="1"
            max="999"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>
        <DateField value={date} onChange={setDate} />
        <p id="date-help" className="muted sm:col-span-2">
          Choose a label date or a day to check this item. A reminder does not
          determine whether food is safe.
        </p>
        {error && (
          <p role="alert" className="error sm:col-span-2">
            {error}
          </p>
        )}
        <button className="primary sm:col-span-2" type="submit">
          {item ? 'Save changes' : 'Add to inventory'}
        </button>
      </form>
    </section>
  )
}
