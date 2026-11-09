import { useMemo, useState } from 'react'
import { FiActivity, FiCheck, FiClock, FiTool } from 'react-icons/fi'
import { StatCard } from '../../../shared/components/StatCard.jsx'
import { ReportList } from '../../../shared/components/ReportList.jsx'
import { PageSkeleton } from '../../../shared/components/LoadingSkeleton.jsx'

export function IssuesPage({ reports, loading = false, error = '', onRetry }) {
  const [filter, setFilter] = useState('All reports')
  const visible = useMemo(() => reports.filter((report) => filter === 'All reports' || (filter === 'Open' ? report.status !== 'Resolved' : report.status === 'Resolved')), [reports, filter])
  if (loading) return <PageSkeleton label="Loading your issue reports" />
  if (error) return <section className="surface-card p-5"><p className="text-sm text-red-700">{error}</p><button className="secondary-button mt-3" onClick={onRetry}>Try again</button></section>
  return <section className="w-full"><div className="mb-5 grid gap-3 sm:grid-cols-3"><StatCard icon={FiActivity} label="All reports" value={String(reports.length).padStart(2, '0')} detail="Submitted to the estate" /><StatCard icon={FiClock} label="Being reviewed" value={String(reports.filter((report) => report.status !== 'Resolved').length).padStart(2, '0')} detail="Open with the estate team" /><StatCard icon={FiCheck} label="Resolved" value={String(reports.filter((report) => report.status === 'Resolved').length).padStart(2, '0')} detail="Recently closed reports" /></div><div className="surface-card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 dark:border-night-line sm:px-5"><div><h2 className="font-display text-base font-bold">Your reports</h2><p className="mt-1 text-xs text-muted">Follow requests sent to the estate team.</p></div><label><span className="sr-only">Filter reports</span><select className="select-field" value={filter} onChange={(event) => setFilter(event.target.value)}><option>All reports</option><option>Open</option><option>Resolved</option></select></label></div>{visible.length ? <ReportList reports={visible} /> : <div className="p-4"><FiTool className="text-muted" /><p className="mt-2 text-sm font-semibold">No reports in this view</p><p className="mt-1 text-sm text-muted">Try another filter.</p></div>}</div><p className="mt-4 text-xs leading-5 text-muted">For urgent safety concerns, contact the estate security desk directly.</p></section>
}
