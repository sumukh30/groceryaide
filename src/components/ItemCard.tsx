import StatusBadge from './StatusBadge'
import { daysUntil } from '../domain/inventory'
import type { Grocery, Status } from '../domain/inventory'

type Props = {
  item: Grocery
  today: string
  onEdit: () => void
  onDelete: () => void
  onStatus: (status: Status) => void
}
export default function ItemCard({
  item,
  today,
  onEdit,
  onDelete,
  onStatus,
}: Props) {
  const days = daysUntil(item.date, today)
  const dateLabel = new Date(`${item.date}T12:00:00`).toLocaleDateString(
    undefined,
    { month: 'short', day: 'numeric', year: 'numeric' },
  )
  const reminder =
    days < 0
      ? `${Math.abs(days)}d past date`
      : days === 0
        ? 'Today'
        : `In ${days}d`
  return (
    <article
      className={`item-card status-${item.status}`}
      aria-label={item.name}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">
            {item.category} · Qty {item.quantity}
          </p>
          <h3 className="wrap-anywhere">{item.name}</h3>
        </div>
        {item.status === 'active' ? (
          <span className={`badge ${days <= 3 ? 'amber' : ''}`}>
            {reminder}
          </span>
        ) : (
          <StatusBadge status={item.status} />
        )}
      </div>
      <p className="muted mt-2">
        Reminder: <time dateTime={item.date}>{dateLabel}</time>
      </p>
      <div className="item-actions flex flex-wrap gap-2">
        {item.status === 'active' ? (
          <>
            <button className="action-used" onClick={() => onStatus('used')}>Used</button>
            <button className="action-discard" onClick={() => onStatus('discarded')}>Discard</button>
            <button className="action-edit" onClick={onEdit}>Edit</button>
          </>
        ) : (
          <button onClick={() => onStatus('active')}>Restore</button>
        )}
        <button
          className="danger"
          aria-label={`Delete ${item.name}`}
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </article>
  )
}
