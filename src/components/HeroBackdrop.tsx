import { useEffect, useRef, useState } from 'react'

export type HeroVideo = { webm?: string; mp4?: string }
export default function HeroBackdrop({
  sources,
  poster,
}: {
  sources?: HeroVideo
  poster?: string
}) {
  const illustration = `${import.meta.env.BASE_URL}media/kitchen-poster.svg`
  const [failedPoster, setFailedPoster] = useState<string | null>(null)
  const posterSource = poster && poster !== failedPoster ? poster : illustration
  const root = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const [eligible, setEligible] = useState(false)
  const [requested, setRequested] = useState(false)
  const [visible, setVisible] = useState(false)
  const [failed, setFailed] = useState(false)
  const [paused, setPaused] = useState(false)
  const [playing, setPlaying] = useState(false)
  const hasSource = Boolean(sources?.webm || sources?.mp4)
  useEffect(() => {
    if (!hasSource || !window.matchMedia) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string }
      }
    ).connection
    let timer: number | undefined
    function update() {
      window.clearTimeout(timer)
      setEligible(false)
      if (
        !motion.matches &&
        !connection?.saveData &&
        !/2g/.test(connection?.effectiveType ?? '')
      ) {
        timer = window.setTimeout(() => setEligible(true), 1200)
      }
    }
    update()
    motion.addEventListener('change', update)
    return () => {
      window.clearTimeout(timer)
      motion.removeEventListener('change', update)
    }
  }, [hasSource])
  useEffect(() => {
    if (!eligible || !root.current || !('IntersectionObserver' in window))
      return
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting)
      if (entry.isIntersecting) setRequested(true)
    })
    observer.observe(root.current)
    return () => observer.disconnect()
  }, [eligible])
  useEffect(() => {
    const element = video.current
    if (!element) return
    let cancelled = false
    function update() {
      if (!element) return
      if (paused || document.hidden || !visible) element.pause()
      else void element.play().catch((error: unknown) => {
        // A pause, unmount, or visibility change can interrupt a pending play().
        if (!cancelled && !(error instanceof DOMException && error.name === 'AbortError'))
          setFailed(true)
      })
    }
    update()
    document.addEventListener('visibilitychange', update)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', update)
    }
  }, [eligible, requested, visible, paused, failed])
  return (
    <>
      <div className="hero-backdrop" ref={root} aria-hidden="true">
        <img
          src={posterSource}
          onError={() => {
            if (poster) setFailedPoster(poster)
          }}
          alt=""
          width="1200"
          height="420"
          fetchPriority="high"
        />
        {hasSource && eligible && requested && !failed && (
          <video
            ref={video}
            className={playing ? 'is-playing' : undefined}
            onPlaying={() => setPlaying(true)}
            muted
            loop
            playsInline
            autoPlay
            preload="none"
            poster={posterSource}
            onError={(event) => {
              if (event.target === event.currentTarget) setFailed(true)
            }}
          >
            {sources?.webm && (
              <source
                src={sources.webm}
                type="video/webm"
                onError={() => {
                  if (!sources.mp4) setFailed(true)
                }}
              />
            )}
            {sources?.mp4 && (
              <source
                src={sources.mp4}
                type="video/mp4"
                onError={() => setFailed(true)}
              />
            )}
          </video>
        )}
      </div>
      {hasSource && eligible && visible && !failed && (
        <button
          className="media-toggle"
          type="button"
          onClick={() => setPaused(!paused)}
          aria-pressed={paused}
        >
          {paused ? 'Play background' : 'Pause background'}
        </button>
      )}
    </>
  )
}
