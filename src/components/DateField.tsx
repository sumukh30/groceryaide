import { lazy, Suspense, useId } from 'react'
import { localDate, validDate } from '../domain/inventory'
import { useDisclosure } from '../hooks/useDisclosure'
import LoadBoundary from './LoadBoundary'
const Calendar = lazy(() => import('./Calendar'))

export default function DateField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const { open, mounted, root, trigger, show, close } = useDisclosure()
  const id = useId()
  return (
    <div
      className="date-field sm:col-span-2"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close()
      }}
    >
      <div className="flex items-center">
        <label htmlFor={id}>Reminder date</label>
        <span className="field-hint">YYYY-MM-DD</span>
      </div>
      <div className="date-input-row">
        <input
          id={id}
          type="text"
          required
          pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
          maxLength={10}
          placeholder="YYYY-MM-DD"
          value={value}
          aria-describedby="date-help"
          aria-invalid={value !== '' && (!validDate(value) || value < localDate())}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          ref={trigger}
          type="button"
          aria-label="Choose reminder date"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={mounted ? `${id}-calendar` : undefined}
          onClick={() => (open ? close() : show())}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M3 10h18M8 3v4m8-4v4M7 14h3m4 0h3m-10 3h3" />
          </svg>
        </button>
      </div>
      {mounted && (
        <div
          id={`${id}-calendar`}
          className={`popover calendar-popover ${open ? 'is-open' : ''}`}
          role="dialog"
          aria-label="Choose reminder date"
          inert={!open}
          aria-hidden={!open}
        >
          <LoadBoundary>
            <Suspense
              fallback={
                <div className="calendar-skeleton" role="status">
                  Loading calendar…
                </div>
              }
            >
              <Calendar
                active={open}
                value={value}
                onChange={(date) => {
                  onChange(date)
                  close(true)
                }}
              />
            </Suspense>
          </LoadBoundary>
          <button
            type="button"
            className="quiet calendar-close"
            onClick={() => close(true)}
          >
            Close calendar
          </button>
        </div>
      )}
    </div>
  )
}
