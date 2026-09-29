import { useEffect, useRef, useState } from 'react'

/** Keep the panel mounted for its exit transition, but immediately remove it from interaction. */
export function useDisclosure() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const restore = useRef(false)
  const trigger = useRef<HTMLButtonElement>(null)
  function show() {
    setMounted(true)
    setOpen(true)
  }
  function close(restoreFocus = false) {
    restore.current = restoreFocus
    setOpen(false)
  }
  useEffect(() => {
    if (open) return
    if (restore.current) {
      trigger.current?.focus()
      restore.current = false
    }
    const timer = window.setTimeout(() => setMounted(false), 200)
    return () => window.clearTimeout(timer)
  }, [open])
  useEffect(() => {
    if (!open) return
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        restore.current = true
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', outside)
    root.current?.addEventListener('keydown', escape)
    const element = root.current
    return () => {
      document.removeEventListener('pointerdown', outside)
      element?.removeEventListener('keydown', escape)
    }
  }, [open])
  return { open, mounted, root, trigger, show, close }
}
