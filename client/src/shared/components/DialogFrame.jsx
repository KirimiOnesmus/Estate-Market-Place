import { useEffect, useRef } from 'react'

export function DialogFrame({ titleId, onClose, children, className = '' }) {
  const dialogRef = useRef(null)
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => { if (dialog?.open) dialog.close() }
  }, [])
  return <dialog ref={dialogRef} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose() }} onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose() }} className={`fixed inset-x-0 bottom-0 m-0 max-h-[min(90dvh,760px)] w-full overflow-y-auto border-0 bg-panel p-0 text-ink shadow-xl backdrop:bg-slate-950/40 dark:bg-night-panel dark:text-night-ink sm:inset-x-auto sm:bottom-auto sm:m-auto sm:max-w-lg sm:rounded-xl ${className}`}>
    {children}
  </dialog>
}
