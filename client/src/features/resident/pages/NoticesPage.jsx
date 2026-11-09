import { FiBell, FiClock, FiDroplet, FiShield, FiUsers } from 'react-icons/fi'
import { PageSkeleton } from '../../../shared/components/LoadingSkeleton.jsx'

const noticeIcons = { General: FiBell, Facilities: FiDroplet, Security: FiShield, Community: FiUsers }

export function NoticesPage({ notices, loading = false, error = '', onRetry }) {
  if (loading) return <PageSkeleton label="Loading estate notices" />
  if (error) return <section className="surface-card p-5"><p className="text-sm text-red-700">{error}</p><button className="secondary-button mt-3" onClick={onRetry}>Try again</button></section>
  if (!notices.length) return <section className="surface-card p-6 text-center"><h2 className="font-semibold">No notices yet</h2><p className="mt-1 text-sm text-muted">Published estate updates will appear here.</p></section>
  return <section className="grid w-full gap-3">{notices.map((notice) => { const Icon = noticeIcons[notice.category] || FiBell; return <article key={notice.id} className="surface-card flex gap-3.5 p-4 sm:p-5"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-soft text-brand-700 dark:bg-night-soft dark:text-brand-300"><Icon size={17} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="text-[10px] font-bold uppercase tracking-wider text-muted">{notice.category}</span>{notice.unread && <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-200">New</span>}</div><h2 className="mt-2 text-sm font-semibold">{notice.title}</h2><p className="mt-1.5 text-sm leading-6 text-muted">{notice.text}</p><span className="mt-3 flex items-center gap-1.5 text-xs text-muted"><FiClock size={13} />{notice.date}<span>·</span>{notice.time}</span></div></article> })}</section>
}
