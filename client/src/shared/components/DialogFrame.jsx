import { useEffect, useRef } from 'react'

export function DialogFrame({ titleId, onClose, children, className = '' }) {
  const dialogRef = useRef(null)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return undefined
    const frame = requestAnimationFrame(() => {
      if (!dialog.open && dialog.isConnected) dialog.showModal()
    })
    return () => {
      cancelAnimationFrame(frame)
      if (dialog.open) dialog.close()
    }
  }, [])
  return <dialog ref={dialogRef} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose() }} onClick={(event) => { if (event.target === event.currentTarget) onClose() }} className={`fixed left-1/2 top-1/2 m-0 max-h-[min(90dvh,760px)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-0 bg-panel p-0 text-ink shadow-xl backdrop:bg-slate-950/40 dark:bg-night-panel dark:text-night-ink sm:rounded-xl ${className}`}>
    {children}
  </dialog>
}
