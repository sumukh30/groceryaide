import { useSyncExternalStore } from 'react'

const query = '(prefers-reduced-motion: reduce)'
function subscribe(update: () => void) {
  const media = window.matchMedia?.(query)
  media?.addEventListener('change', update)
  return () => media?.removeEventListener('change', update)
}
function snapshot() {
  return window.matchMedia?.(query).matches ?? true
}
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, snapshot, () => true)
}
