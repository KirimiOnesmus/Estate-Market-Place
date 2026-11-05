import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

export const PAGE_SIZE = 10

export function PaginationControls({ page, total, onPageChange, pageSize = PAGE_SIZE }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  return <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 dark:border-night-line sm:px-5"><p className="text-xs text-muted">Showing <b className="text-ink dark:text-night-ink">{start}–{end}</b> of <b className="text-ink dark:text-night-ink">{total}</b> entries <span className="hidden sm:inline">· 10 per page</span></p><div className="flex items-center gap-2"><button type="button" className="secondary-button min-h-9 px-3" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}><FiChevronLeft size={15} />Previous</button><span className="min-w-16 text-center text-xs text-muted">Page {page} of {pageCount}</span><button type="button" className="secondary-button min-h-9 px-3" disabled={page >= pageCount} onClick={() => onPageChange(Math.min(pageCount, page + 1))}>Next<FiChevronRight size={15} /></button></div></footer>
}
