import type { Status } from '../domain/inventory'

type HistoryStatus = Exclude<Status, 'active'>

/** History status describes what happened to food, independently of deleting its record. */
export default function StatusBadge({ status }: { status: HistoryStatus }) {
  const used = status === 'used'
  return (
    <span className={`badge status-badge status-badge--${status}`}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {used ? (
          <path d="m5 12 4 4L19 6" />
        ) : (
          <>
            <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5m4-5v5" />
          </>
        )}
      </svg>
      {used ? 'Used' : 'Discarded'}
    </span>
  )
}
