import { useEffect, useId, useRef, useState } from 'react'
import { categories } from '../domain/inventory'
import type { Category } from '../domain/inventory'
import { useDisclosure } from '../hooks/useDisclosure'

export default function CategorySelect({
  value,
  onChange,
}: {
  value: Category
  onChange: (value: Category) => void
}) {
  const { open, mounted, root, trigger, show, close } = useDisclosure()
  const id = useId()
  const [active, setActive] = useState(categories.indexOf(value))
  const options = useRef<(HTMLButtonElement | null)[]>([])
  useEffect(() => {
    if (open) options.current[active]?.focus()
  }, [open, active])
  return (
    <div
      className="field dropdown"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close()
      }}
    >
      <span id={`${id}-label`} className="field-label">
        Category
      </span>
      <button
        type="button"
        className="select-trigger"
        ref={trigger}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={mounted ? id : undefined}
        onClick={() => {
          if (open) close()
          else {
            setActive(categories.indexOf(value))
            show()
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            setActive(categories.indexOf(value))
            show()
          }
        }}
      >
        <span id={`${id}-value`}>{value}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {mounted && (
        <div
          className={`popover category-options ${open ? 'is-open' : ''}`}
          inert={!open}
          aria-hidden={!open}
          id={id}
          role="listbox"
          aria-labelledby={`${id}-label`}
          onKeyDown={(event) => {
            let next = active
            if (event.key === 'ArrowDown')
              next = (active + 1) % categories.length
            else if (event.key === 'ArrowUp')
              next = (active + categories.length - 1) % categories.length
            else if (event.key === 'Home') next = 0
            else if (event.key === 'End') next = categories.length - 1
            else if (event.key.length === 1 && /[a-z]/i.test(event.key)) {
              const match = categories.findIndex((category) =>
                category.toLowerCase().startsWith(event.key.toLowerCase()),
              )
              if (match >= 0) next = match
            } else return
            event.preventDefault()
            setActive(next)
          }}
        >
          {categories.map((category, index) => (
            <button
              key={category}
              type="button"
              role="option"
              aria-selected={value === category}
              tabIndex={active === index ? 0 : -1}
              ref={(element) => {
                options.current[index] = element
              }}
              onClick={() => {
                onChange(category)
                close(true)
              }}
            >
              {category}
              <span aria-hidden="true">{value === category ? '✓' : ''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
