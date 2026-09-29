import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useReducedMotion } from './useReducedMotion'

afterEach(() => vi.unstubAllGlobals())

it('updates live and unsubscribes from reduced-motion preference changes', () => {
  let listener: (() => void) | undefined
  const media = {
    matches: false,
    addEventListener: vi.fn((_event, callback) => {
      listener = callback
    }),
    removeEventListener: vi.fn(),
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => media),
  )
  const { result, unmount } = renderHook(useReducedMotion)
  expect(result.current).toBe(false)
  act(() => {
    media.matches = true
    listener?.()
  })
  expect(result.current).toBe(true)
  act(() => {
    media.matches = false
    listener?.()
  })
  expect(result.current).toBe(false)
  unmount()
  expect(media.removeEventListener).toHaveBeenCalledWith('change', listener)
})

it('defaults to reduced motion when media query support is unavailable', () => {
  vi.stubGlobal('matchMedia', undefined)
  expect(renderHook(useReducedMotion).result.current).toBe(true)
})
