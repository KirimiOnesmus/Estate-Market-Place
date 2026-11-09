import { useState } from 'react'
import { FiBell, FiCalendar, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { DialogFrame } from '../../../shared/components/DialogFrame.jsx'
import { PaginationControls, PAGE_SIZE } from '../../../shared/components/PaginationControls.jsx'
import { PageSkeleton } from '../../../shared/components/LoadingSkeleton.jsx'

export function AdminNoticesPage({ notices, onEdit, onDelete, status = 'ready', error = '', onRetry }) {
  const [page, setPage] = useState(1)
  const [toDelete, setToDelete] = useState(null)
  const pageNotices = notices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  if (status === 'loading') return <PageSkeleton label="Loading estate notices" />
  if (status === 'error') return <section className="surface-card p-5"><p className="text-sm text-red-700">{error}</p><button className="secondary-button mt-3" onClick={onRetry}>Try again</button></section>
  return <section className="grid gap-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted">Create and maintain notices visible to residents in their Notices area.</p></div>
    {pageNotices.length ? pageNotices.map((notice) => { const Icon = notice.icon || FiBell; return <article key={notice.id} className="surface-card flex flex-wrap items-start gap-3.5 p-4 sm:p-5"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-soft text-brand-700 dark:bg-night-soft dark:text-brand-300"><Icon size={17} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="section-kicker">{notice.category}</span><span className="status-pill status-done">Published</span></div><h2 className="mt-2 text-sm font-semibold">{notice.title}</h2><p className="mt-1.5 text-sm leading-6 text-muted">{notice.text}</p><span className="mt-3 flex items-center gap-1.5 text-xs text-muted"><FiCalendar size={13} />{notice.date}<span>·</span>{notice.time}</span></div><div className="flex gap-2"><button className="secondary-button" onClick={() => onEdit(notice)}><FiEdit2 size={14} />Edit</button><button className="secondary-button text-red-700 dark:text-red-300" onClick={() => setToDelete(notice)}><FiTrash2 size={14} />Delete</button></div></article> }) : <article className="surface-card p-7 text-center"><h2 className="font-bold">No notices yet</h2><p className="mt-1 text-sm text-muted">Create a notice to share an update with residents.</p></article>}
    {notices.length > PAGE_SIZE && <PaginationControls page={page} total={notices.length} onPageChange={setPage} />}
    {toDelete && <DialogFrame titleId="delete-notice-title" onClose={() => setToDelete(null)} className="p-5 sm:max-w-md sm:p-6"><h2 id="delete-notice-title" className="font-bold">Delete this notice?</h2><p className="mt-2 text-sm leading-6 text-muted">“{toDelete.title}” will be removed from resident notices. The action is recorded in the estate audit log.</p><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button className="secondary-button" onClick={() => setToDelete(null)}>Cancel</button><button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-700 px-4 text-xs font-semibold text-white" onClick={() => { onDelete(toDelete); setToDelete(null) }}><FiTrash2 size={14} />Delete notice</button></div></DialogFrame>}
  </section>
}
