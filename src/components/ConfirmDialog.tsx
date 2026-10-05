import { useEffect, useRef } from 'react'

type Props = {
  title: string
  message: string
  label: string
  onConfirm: () => void
  onClose: () => void
  onFocusFallback: () => void
}
export default function ConfirmDialog({ title, message, label, onConfirm, onClose, onFocusFallback }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const focusFallback = useRef(onFocusFallback)
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null
    const element = dialog.current!
    const fallback = focusFallback.current
    element.showModal()
    element.querySelector<HTMLButtonElement>('button')?.focus()
    return () => {
      element.close()
      if (trigger?.isConnected) trigger.focus()
      else fallback()
    }
  }, [])
  return (
    <dialog
      ref={dialog}
      className="confirm-dialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
      onCancel={(event) => { event.preventDefault(); onClose() }}
    >
      <h2 id="confirm-title" className="wrap-anywhere">{title}</h2>
      <p id="confirm-description" className="muted wrap-anywhere">{message}</p>
      <div className="flex justify-end gap-2 mt-4">
        <button className="quiet" onClick={onClose}>Cancel</button>
        <button className="confirm-destructive" onClick={onConfirm}>{label}</button>
      </div>
    </dialog>
  )
}
