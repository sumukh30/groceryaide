import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  addItem,
  addShopping,
  categorizeDate,
  deleteItem,
  editItem,
  emptyInventory,
  localDate,
  removeShopping,
  setStatus,
  summary,
} from './domain/inventory'
import type {
  DateGroup,
  Grocery,
  GroceryInput,
  Inventory,
} from './domain/inventory'
import {
  exportBackup,
  MAX_BACKUP_BYTES,
  parseBackup,
  STORAGE_KEY,
} from './domain/storage'
import { useInventory } from './hooks/useInventory'
import HeroBackdrop from './components/HeroBackdrop'
import LoadBoundary from './components/LoadBoundary'
const ItemForm = lazy(() => import('./components/ItemForm'))
import ItemCard from './components/ItemCard'

function download(content: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([content], { type: 'application/json' }),
  )
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
const groups: { key: DateGroup; title: string; hint: string; icon: string }[] =
  [
    {
      key: 'today',
      title: 'Check today',
      hint: 'Today and past reminder dates',
      icon: '◷',
    },
    {
      key: 'soon',
      title: 'Coming up',
      hint: 'Over the next 3 days',
      icon: '↗',
    },
    {
      key: 'later',
      title: 'For later',
      hint: 'More than 3 days away',
      icon: '▤',
    },
  ]

export default function App() {
  const { data, commit, error, blocked, saved } = useInventory()
  const [today, setToday] = useState(localDate())
  const [query, setQuery] = useState('')
  const [shoppingName, setShoppingName] = useState('')
  const [editor, setEditor] = useState<Grocery | 'new' | null>(null)
  const [message, setMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [pendingImport, setPendingImport] = useState<Inventory | null>(null)
  const [importing, setImporting] = useState(false)
  const [history, setHistory] = useState(false)
  const addButton = useRef<HTMLButtonElement>(null)
  const editorTrigger = useRef<HTMLElement | null>(null)
  const counts = summary(data, today)
  useEffect(() => {
    const update = () => setToday(localDate())
    const interval = window.setInterval(update, 30_000)
    window.addEventListener('focus', update)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', update)
    }
  }, [])
  function action(work: () => void, success: string) {
    try {
      work()
      setActionError('')
      setMessage(success)
    } catch (cause) {
      setMessage('')
      setActionError(
        cause instanceof Error ? cause.message : 'Something went wrong.',
      )
    }
  }
  function closeEditor() {
    setEditor(null)
    const target = editorTrigger.current
    if (target?.isConnected) target.focus()
    else addButton.current?.focus()
  }
  function saveItem(input: GroceryInput) {
    commit(
      editor === 'new'
        ? addItem(data, input)
        : editItem(data, (editor as Grocery).id, input),
    )
    setMessage(editor === 'new' ? 'Grocery added.' : 'Grocery updated.')
    setActionError('')
    closeEditor()
  }
  function submitShopping(event: FormEvent) {
    event.preventDefault()
    action(() => {
      commit(addShopping(data, shoppingName))
      setShoppingName('')
    }, 'Added to your shopping list.')
  }
  async function readImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setPendingImport(null)
    setImporting(true)
    try {
      if (file.size > MAX_BACKUP_BYTES)
        throw new Error('Backup must be smaller than 2 MB.')
      const imported = parseBackup(await file.text())
      setPendingImport(imported)
      setActionError('')
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : 'Could not read this file.',
      )
    } finally {
      setImporting(false)
    }
  }
  const matches = data.items.filter((item) =>
    `${item.name} ${item.category}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  )
  const active = matches
    .filter((item) => item.status === 'active')
    .sort(
      (a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name),
    )
  function card(item: Grocery) {
    return (
      <ItemCard
        key={item.id}
        item={item}
        today={today}
        onEdit={() => {
          editorTrigger.current = document.activeElement as HTMLElement
          setEditor(item)
          window.scrollTo({ top: 0, behavior: 'auto' })
        }}
        onStatus={(status) =>
          action(
            () => commit(setStatus(data, item.id, status)),
            `${item.name}: ${status === 'active' ? 'restored to inventory' : `marked ${status}`}.`,
          )
        }
        onDelete={() => {
          if (
            window.confirm(
              `Permanently delete “${item.name}”? This also removes it from summary counts.`,
            )
          )
            action(() => commit(deleteItem(data, item.id)), 'Grocery deleted.')
        }}
      />
    )
  }
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to inventory
      </a>
      <header className="site-header">
        <div className="page-width flex flex-wrap items-center justify-between gap-4">
          <a className="brand" href="#main">
            <span className="brand-mark" aria-hidden="true">
              g.
            </span>{' '}
            GroceryAide
          </a>
          <span className="local-label">
            <span aria-hidden="true">●</span>{' '}
            {saved ? 'Saved on this browser' : 'Storage needs attention'}
          </span>
        </div>
      </header>
      <main id="main" className="page-width pb-12">
        <div className="hero">
          <HeroBackdrop
            sources={{
              mp4: `${import.meta.env.BASE_URL}media/groceryaide_backgrnd.mp4`,
            }}
          />
          <div className="hero-content">
            <p className="eyebrow">A little less waste. A little more ease.</p>
            <h1>Your kitchen, in check.</h1>
            <p className="muted">Know what you have. Make the most of it.</p>
            <button
              ref={addButton}
              className="primary"
              onClick={() => {
                editorTrigger.current = addButton.current
                setEditor('new')
              }}
              disabled={blocked}
            >
              + Add grocery
            </button>
          </div>
        </div>
        <div
          role="status"
          aria-live="polite"
          className={message ? 'notice success' : 'sr-only'}
        >
          {message}
        </div>
        {actionError && (
          <p role="alert" className="notice error">
            {actionError}
          </p>
        )}
        {error && (
          <div role="alert" className="notice error">
            <p>{error}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {blocked ? (
                <>
                  <button
                    onClick={() =>
                      action(() => {
                        const raw = localStorage.getItem(STORAGE_KEY)
                        if (raw === null)
                          throw new Error('No saved data is available.')
                        download(raw, 'groceryaide-recovery.json')
                      }, 'Original saved data downloaded.')
                    }
                  >
                    Export original saved data
                  </button>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          'Start fresh? This replaces unreadable saved data. Export the original first if you need to recover it.',
                        )
                      )
                        action(
                          () => commit(emptyInventory(), true),
                          'Started a fresh inventory.',
                        )
                    }}
                  >
                    Start fresh
                  </button>
                </>
              ) : (
                <button
                  onClick={() =>
                    action(
                      () => commit(data),
                      'Save attempted; check the storage status above.',
                    )
                  }
                >
                  Retry save
                </button>
              )}
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      'Reload? Any changes only in memory will be lost. Export them first.',
                    )
                  )
                    window.location.reload()
                }}
              >
                Reload
              </button>
            </div>
          </div>
        )}
        <section
          aria-label="Inventory summary"
          className="grid grid-cols-2 gap-3 lg:grid-cols-4 stats"
        >
          {[
            ['kitchen', 'In your kitchen', counts.active, 'active entries'],
            ['today', 'Check today', counts.today, 'date reminders'],
            ['used', 'Used', counts.used, 'entries marked used'],
            [
              'discarded',
              'Discarded',
              counts.discarded,
              'entries marked discarded',
            ],
          ].map(([tone, label, count, hint]) => (
            <div className={`stat stat--${tone}`} key={tone}>
              <p>{label}</p>
              <strong>{count}</strong>
              <span>{hint}</span>
            </div>
          ))}
        </section>
        <div className="dashboard-grid">
          <div className="min-w-0">
            {editor && (
              <LoadBoundary>
                <Suspense
                  fallback={
                    <div className="panel editor-skeleton" role="status">
                      Opening your grocery editor…
                    </div>
                  }
                >
                  <ItemForm
                    key={editor === 'new' ? 'new' : editor.id}
                    item={editor === 'new' ? undefined : editor}
                    onSave={saveItem}
                    onCancel={closeEditor}
                  />
                </Suspense>
              </LoadBoundary>
            )}
            <section aria-labelledby="inventory-title">
              <div className="section-heading flex flex-wrap items-center justify-between gap-3">
                <h2 id="inventory-title">Your inventory</h2>
                <label className="search">
                  <span className="sr-only">Search inventory and history</span>
                  <svg
                    className="search-icon"
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <circle cx="10.5" cy="10.5" r="6.5" />
                    <path d="m16 16 5 5" />
                  </svg>
                  <input
                    type="search"
                    placeholder="Search name or category…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
              </div>
              {counts.active === 0 && !query && (
                <div className="empty hero-empty">
                  <span aria-hidden="true">✳</span>
                  <h3>A fresh start for your kitchen</h3>
                  <p>
                    Add your first grocery and a date to check it.
                    <br />
                    Your reminders will appear right here.
                  </p>
                </div>
              )}
              {query && active.length === 0 && (
                <p className="empty">
                  No active groceries match “{query}”. Try another name or
                  category.
                </p>
              )}
              {groups.map((group) => (
                <section
                  key={group.key}
                  className={`date-group ${group.key}`}
                  aria-labelledby={`group-${group.key}`}
                >
                  <div className="group-title">
                    <span className="group-icon" aria-hidden="true">
                      {group.icon}
                    </span>
                    <div>
                      <h3 id={`group-${group.key}`}>
                        {group.title}{' '}
                        <span className="group-count">
                          {
                            active.filter(
                              (item) =>
                                categorizeDate(item.date, today) === group.key,
                            ).length
                          }
                        </span>
                      </h3>
                      <p className="muted">{group.hint}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {active
                      .filter(
                        (item) =>
                          categorizeDate(item.date, today) === group.key,
                      )
                      .map(card)}
                  </div>
                  {!active.some(
                    (item) => categorizeDate(item.date, today) === group.key,
                  ) && (
                    <p className="group-empty">
                      {query
                        ? 'No matching items in this group.'
                        : 'Nothing here yet.'}
                    </p>
                  )}
                </section>
              ))}
            </section>
            <section className="history">
              <button
                aria-expanded={history}
                aria-controls="history-items"
                className="history-toggle"
                onClick={() => setHistory(!history)}
              >
                {history ? '−' : '+'} Used & discarded history{' '}
                <span>{counts.used + counts.discarded}</span>
              </button>
              {history && (
                <div
                  id="history-items"
                  className="grid gap-3 sm:grid-cols-2 mt-4"
                >
                  {matches.filter((item) => item.status !== 'active').map(card)}
                  {!matches.some((item) => item.status !== 'active') && (
                    <p className="muted">
                      No matching history. Items you mark used or discarded
                      appear here.
                    </p>
                  )}
                </div>
              )}
            </section>
          </div>
          <aside className="space-y-5">
            <section
              className="panel shopping-panel"
              aria-labelledby="shopping-title"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 id="shopping-title">Shopping list</h2>
                <span className="badge">{data.shopping.length}</span>
              </div>
              <p className="muted mb-4">A little note for your next trip.</p>
              <form
                onSubmit={submitShopping}
                className="shopping-form flex gap-2"
              >
                <label className="min-w-0 flex-1">
                  <span className="field-label">Shopping item</span>
                  <input
                    required
                    maxLength={100}
                    placeholder="e.g. Oat milk"
                    value={shoppingName}
                    onChange={(e) => setShoppingName(e.target.value)}
                    disabled={blocked}
                  />
                </label>
                <button type="submit" className="primary" disabled={blocked}>
                  Add
                </button>
              </form>
              {data.shopping.length ? (
                <ul className="shopping-list">
                  {data.shopping.map((item) => (
                    <li key={item.id}>
                      <span className="wrap-anywhere min-w-0">{item.name}</span>
                      <button
                        className="quiet shrink-0"
                        aria-label={`Remove ${item.name} from shopping list`}
                        onClick={() =>
                          action(
                            () => commit(removeShopping(data, item.id)),
                            'Shopping item removed.',
                          )
                        }
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty shopping-empty">
                  All set for now.
                  <br />
                  Add what you need as you go.
                </p>
              )}
            </section>
            <section className="panel backup" aria-labelledby="backup-title">
              <span className="eyebrow">Local by design</span>
              <h2 id="backup-title">Your kitchen. Your data.</h2>
              <p className="muted">
                Stored in this browser, with no account required. Download a
                backup to keep your list safe or move it to another device.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  disabled={blocked}
                  onClick={() =>
                    action(
                      () =>
                        download(
                          exportBackup(data),
                          `groceryaide-${today}.json`,
                        ),
                      'Backup downloaded.',
                    )
                  }
                >
                  Export backup
                </button>
                <label
                  className={`file-button ${importing ? 'opacity-50' : ''}`}
                >
                  {importing ? 'Reading…' : 'Import backup'}
                  <input
                    className="sr-only"
                    type="file"
                    accept=".json,application/json"
                    disabled={importing}
                    onChange={readImport}
                  />
                </label>
              </div>
              {pendingImport && (
                <div
                  className="import-preview"
                  role="region"
                  aria-label="Confirm backup import"
                >
                  <p>
                    Replace this browser’s inventory with{' '}
                    <strong>{pendingImport.items.length} groceries</strong> and{' '}
                    <strong>
                      {pendingImport.shopping.length} shopping items
                    </strong>
                    ?
                  </p>
                  <p className="muted mt-2">
                    Export your current data first. Import replaces all items
                    and history.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      className="primary"
                      onClick={() =>
                        action(() => {
                          commit(pendingImport, true)
                          setPendingImport(null)
                          setEditor(null)
                        }, 'Backup imported.')
                      }
                    >
                      Replace with backup
                    </button>
                    <button onClick={() => setPendingImport(null)}>
                      Cancel import
                    </button>
                  </div>
                </div>
              )}
            </section>
            <section className="reminder-note">
              <h2>Dates are a nudge.</h2>
              <p>
                Reminders use the dates you enter. They are not food-safety
                determinations and do not mean an item is safe or unsafe to eat.
              </p>
              <p className="mt-3">
                Reminders appear here while the app is open; no background
                notifications are sent.
              </p>
            </section>
          </aside>
        </div>
        <footer>
          GroceryAide <span aria-hidden="true">·</span> A calmer kitchen, one
          item at a time.
        </footer>
      </main>
    </>
  )
}
