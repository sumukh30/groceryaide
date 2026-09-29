import { useEffect, useRef, useState } from 'react'
import { emptyInventory } from '../domain/inventory'
import type { Inventory } from '../domain/inventory'
import {
  exportBackup,
  loadInventory,
  saveInventory,
  STORAGE_KEY,
} from '../domain/storage'

export function useInventory() {
  const [initial] = useState(() => {
    try {
      return {
        ...loadInventory(window.localStorage),
        raw: window.localStorage.getItem(STORAGE_KEY),
      }
    } catch {
      return {
        data: emptyInventory(),
        error:
          'Browser storage is unavailable. Changes will stay in this tab only; export a backup before closing.',
        blocked: false,
        raw: null,
      }
    }
  })
  const [data, setData] = useState(initial.data)
  const [error, setError] = useState(initial.error)
  const [blocked, setBlocked] = useState(initial.blocked)
  const [saved, setSaved] = useState(!initial.error)
  const baseline = useRef(initial.raw)
  const conflict = useRef(false)
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY || event.key === null) {
        conflict.current = true
        setSaved(false)
        setError(
          'Data changed in another tab. Export this tab’s data if needed, then reload before making changes.',
        )
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  function commit(next: Inventory, replace = false) {
    // Never accept a state that cannot be exported for recovery.
    exportBackup(next)
    if (blocked && !replace)
      throw new Error(
        'Resolve the saved-data warning before changing your inventory.',
      )
    if (conflict.current)
      throw new Error(
        'Another tab changed your data. Export this tab’s data and reload first.',
      )
    // Detect another tab's write even if its storage event has not arrived yet.
    let current = baseline.current
    try {
      current = window.localStorage.getItem(STORAGE_KEY)
    } catch {
      /* Memory-only mode. */
    }
    if (current !== baseline.current) {
      conflict.current = true
      throw new Error(
        'Another tab changed your data. Export this tab’s data and reload first.',
      )
    }
    setData(next)
    setBlocked(false)
    try {
      saveInventory(window.localStorage, next)
      baseline.current = window.localStorage.getItem(STORAGE_KEY)
      setError('')
      setSaved(true)
    } catch {
      setSaved(false)
      setError(
        'Changes are only in memory: browser storage is unavailable or full. Export a backup before closing this tab, or retry saving.',
      )
    }
  }
  return { data, commit, error, blocked, saved }
}
