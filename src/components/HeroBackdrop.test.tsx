import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import HeroBackdrop from './HeroBackdrop'

function environment(reduced = false, saveData = false) {
  vi.useFakeTimers()
  let motionListener: (() => void) | undefined
  const motion = {
    matches: reduced,
    addEventListener: vi.fn((_event, listener) => {
      motionListener = listener
    }),
    removeEventListener: vi.fn(),
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => motion),
  )
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      callback: (entries: { isIntersecting: boolean }[]) => void
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        this.callback = callback
      }
      observe() {
        this.callback([{ isIntersecting: true }])
      }
      disconnect() {}
    },
  )
  vi.spyOn(
    navigator as Navigator & { connection: { saveData: boolean } },
    'connection',
    'get',
  ).mockReturnValue({ saveData })
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  return { motion, changeMotion: () => motionListener?.() }
}
Object.defineProperty(navigator, 'connection', {
  configurable: true,
  get: () => ({ saveData: false }),
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
const sources = {
  webm: '/media/grocery-hero.webm',
  mp4: '/media/grocery-hero.mp4',
}

describe('hero video', () => {
  it('renders a static poster without any video request when no sources are configured', () => {
    const { container } = render(<HeroBackdrop />)
    expect(container.querySelector('img')?.getAttribute('src')).toContain(
      'kitchen-poster.svg',
    )
    expect(container.querySelector('video')).toBeNull()
  })
  it.each([
    [true, false],
    [false, true],
  ])(
    'does not load video for reduced motion=%s or save data=%s',
    (reduced, saveData) => {
      environment(reduced, saveData)
      const { container } = render(<HeroBackdrop sources={sources} />)
      act(() => vi.advanceTimersByTime(2000))
      expect(container.querySelector('video')).toBeNull()
    },
  )
  it('defers video, supports pause, and removes it when motion preference changes', () => {
    const { motion, changeMotion } = environment()
    const { container } = render(<HeroBackdrop sources={sources} />)
    expect(container.querySelector('video')).toBeNull()
    act(() => vi.advanceTimersByTime(1200))
    const video = container.querySelector('video')!
    expect(video.autoplay).toBe(true)
    expect(video.controls).toBe(false)
    expect(video.className).toBe('')
    fireEvent.playing(video)
    expect(video.className).toBe('is-playing')
    expect(video.muted).toBe(true)
    expect(video.loop).toBe(true)
    expect(video.playsInline).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Pause background' }))
    expect(video.pause).toHaveBeenCalled()
    act(() => {
      motion.matches = true
      changeMotion()
    })
    expect(container.querySelector('video')).toBeNull()
  })
  it('falls back to the illustration if a configured poster is missing', () => {
    const { container } = render(
      <HeroBackdrop poster="/media/grocery-hero-poster.webp" />,
    )
    const poster = container.querySelector('img')!
    fireEvent.error(poster)
    expect(poster.getAttribute('src')).toContain('kitchen-poster.svg')
  })
  it('allows MP4 fallback after a WebM error and retains the poster if both fail', () => {
    environment()
    const { container } = render(<HeroBackdrop sources={sources} />)
    act(() => vi.advanceTimersByTime(1200))
    const candidates = container.querySelectorAll('source')
    fireEvent.error(candidates[0])
    expect(container.querySelector('video')).toBeTruthy()
    fireEvent.error(candidates[1])
    expect(container.querySelector('video')).toBeNull()
    expect(container.querySelector('img')).toBeTruthy()
  })
  it('does not treat an interrupted play request as a media failure', async () => {
    environment()
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValue(
      new DOMException('Paused before playback started', 'AbortError'),
    )
    const { container } = render(<HeroBackdrop sources={sources} />)
    await act(async () => { vi.advanceTimersByTime(1200) })
    expect(container.querySelector('video')).toBeTruthy()
    expect(container.querySelector('img')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Pause background' }))
    fireEvent.click(screen.getByRole('button', { name: 'Play background' }))
    expect(container.querySelector('video')).toBeTruthy()
  })
  it('keeps the poster when playback fails', async () => {
    environment()
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValue(
      new Error('Autoplay denied'),
    )
    const { container } = render(<HeroBackdrop sources={sources} />)
    await act(async () => {
      vi.advanceTimersByTime(1200)
    })
    expect(container.querySelector('video')).toBeNull()
    expect(container.querySelector('img')).toBeTruthy()
  })
})
