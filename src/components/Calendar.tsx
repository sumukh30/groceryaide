import { useEffect, useRef, useState } from 'react'
import { DayPicker } from '@daypicker/react'
import '@daypicker/react/style.css'
import './Calendar.css'
import { validDate } from '../domain/inventory'
import { useReducedMotion } from '../hooks/useReducedMotion'

// Local noon avoids UTC parsing and supports four-digit years, including 0001–0099.
function calendarDate(value: string): Date | undefined {
  return validDate(value) ? new Date(`${value}T12:00:00`) : undefined
}
function calendarValue(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export default function Calendar({
  value,
  onChange,
  active,
}: {
  value: string
  onChange: (value: string) => void
  active: boolean
}) {
  const reducedMotion = useReducedMotion()
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (active)
      root.current
        ?.querySelector<HTMLButtonElement>(
          '.rdp-day_button[tabindex="0"]:not([aria-hidden="true"] *)',
        )
        ?.focus()
  }, [active])
  const selected = calendarDate(value)
  const [month, setMonth] = useState(selected ?? new Date())
  const [previousValue, setPreviousValue] = useState(value)
  if (previousValue !== value) {
    setPreviousValue(value)
    if (selected) setMonth(selected)
  }
  return (
    <div ref={root}>
      <DayPicker
        mode="single"
        animate={!reducedMotion}
        autoFocus={active}
        selected={selected}
        month={month}
        onMonthChange={setMonth}
        startMonth={calendarDate('0001-01-01')}
        endMonth={calendarDate('9999-12-31')}
        onSelect={(date) => {
          if (date) onChange(calendarValue(date))
        }}
      />
    </div>
  )
}
