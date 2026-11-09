import { FiArrowLeft, FiArrowRight, FiBell, FiClock, FiDroplet, FiShield, FiUsers } from 'react-icons/fi'
import { PageSkeleton } from '../../../shared/components/LoadingSkeleton.jsx'

const noticeIcons = { General: FiBell, Facilities: FiDroplet, Security: FiShield, Community: FiUsers }

export function NoticesPage({ notices, loading = false, error = '', onRetry, onNoticeSelect }) {
  if (loading) return <PageSkeleton label="Loading estate notices" />
  if (error) return <section className="surface-card p-5"><p className="text-sm text-red-700">{error}</p><button className="secondary-button mt-3" onClick={onRetry}>Try again</button></section>
  if (!notices.length) return <section className="surface-card p-6 text-center"><h2 className="font-semibold">No active notices</h2><p className="mt-1 text-sm text-muted">Current estate updates will appear here. Expired notices are automatically removed.</p></section>
  return <section className="grid w-full gap-3">{notices.map((notice) => { const Icon = noticeIcons[notice.category] || FiBell; return <article key={notice.id} className="surface-card flex gap-3.5 p-4 sm:p-5"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-soft text-brand-700 dark:bg-night-soft dark:text-brand-300"><Icon size={17} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="text-[10px] font-bold uppercase tracking-wider text-muted">{notice.category}</span>{notice.unread && <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-200">New</span>}</div><h2 className="mt-2 text-sm font-semibold">{notice.title}</h2><p className="mt-1.5 text-sm leading-6 text-muted">{notice.text.length > 200 ? `${notice.text.slice(0, 200).trimEnd()}…` : notice.text}</p><span className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted"><FiClock size={13} />{notice.date}<span>·</span>{notice.time}{notice.deadline && <><span>·</span>Visible through {formatDeadline(notice.deadline)}</>}</span><button type="button" className="secondary-button mt-3" onClick={() => onNoticeSelect(notice)}>Read full notice<FiArrowRight size={14} /></button></div></article> })}</section>
}

export function NoticeDetailsPage({ notice, navigate }) {
  if (!notice) return <section className="surface-card p-5"><h2 className="font-semibold">Notice not found</h2><button className="secondary-button mt-4" onClick={() => navigate('notices')}><FiArrowLeft size={14} />Back to notices</button></section>
  const Icon = noticeIcons[notice.category] || FiBell
  return <section className="surface-card w-full overflow-hidden"><header className="border-b border-line p-4 dark:border-night-line sm:p-6"><button className="secondary-button mb-5" onClick={() => navigate('notices')}><FiArrowLeft size={14} />Back to notices</button><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-soft text-brand-700 dark:bg-night-soft dark:text-brand-300"><Icon size={19} /></span><div className="min-w-0"><p className="section-kicker">{notice.category}</p><h2 className="mt-1 text-xl font-bold">{notice.title}</h2><p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted"><span>{notice.date}</span>{notice.time && <><span>·</span><span>{notice.time}</span></>}</p></div></div></header><article className="p-4 sm:p-6"><div className="whitespace-pre-wrap text-sm leading-7 text-ink dark:text-night-ink">{notice.text}</div>{notice.deadline && <p className="mt-6 rounded-lg bg-soft px-3 py-2.5 text-xs text-muted dark:bg-night-soft">This notice is visible to residents through {formatDeadline(notice.deadline)}.</p>}</article></section>
}

function formatDeadline(value) {
  const date = new Date(`${value}T12:00:00+03:00`)
  return new Intl.DateTimeFormat('en-KE', { dateStyle: 'long', timeZone: 'Africa/Nairobi' }).format(date)
}
