import { useState } from 'react'
import { FiActivity, FiCheck, FiChevronDown, FiClock, FiCopy, FiExternalLink, FiFileText, FiSearch } from 'react-icons/fi'
import { StatCard } from '../../../shared/components/StatCard.jsx'
import { PageSkeleton } from '../../../shared/components/LoadingSkeleton.jsx'

const statuses = ['All reports', 'Received', 'In progress', 'Resolved']
const pageSize = 10

export function IssuesPage({ reports, loading = false, error = '', onRetry }) {
  const [filter, setFilter] = useState('All reports')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState('')
  const [copiedId, setCopiedId] = useState('')
  const openCount = reports.filter((report) => report.status !== 'Resolved').length
  const resolvedCount = reports.length - openCount
  const normalizedQuery = query.trim().toLowerCase()
  const visible = reports.filter((report) => {
    const matchesFilter = filter === 'All reports' || report.status === filter
    const matchesQuery = !normalizedQuery || `${report.referenceCode || report.id} ${report.title} ${report.category} ${report.location}`.toLowerCase().includes(normalizedQuery)
    return matchesFilter && matchesQuery
  })
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize))
  const pageReports = visible.slice((page - 1) * pageSize, page * pageSize)

  if (loading) return <PageSkeleton label="Loading your issue reports" />
  if (error) return <section className="surface-card p-5"><p className="text-sm text-red-700">{error}</p><button className="secondary-button mt-3" onClick={onRetry}>Try again</button></section>

  const updateFilter = (value) => { setFilter(value); setPage(1) }
  const updateQuery = (value) => { setQuery(value); setPage(1) }
  const copyReference = async (report) => {
    const reference = report.referenceCode || report.id
    try {
      await navigator.clipboard.writeText(reference)
      setCopiedId(report.id)
      window.setTimeout(() => setCopiedId(''), 1800)
    } catch { setCopiedId('') }
  }

  return <section className="grid w-full content-start gap-5">
    <div className="grid gap-3 sm:grid-cols-3"><StatCard icon={FiActivity} label="All reports" value={String(reports.length).padStart(2, '0')} detail="Submitted to the estate" /><StatCard icon={FiClock} label="Being reviewed" value={String(openCount).padStart(2, '0')} detail="Received or in progress" /><StatCard icon={FiCheck} label="Resolved" value={String(resolvedCount).padStart(2, '0')} detail="Closed by the estate team" /></div>
    <article className="surface-card overflow-hidden">
      <header className="border-b border-line p-4 dark:border-night-line sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="section-kicker">ESTATE SUPPORT</p><h2 className="mt-1 text-base font-bold">Your issue reports</h2><p className="mt-1 text-sm leading-5 text-muted">Review status updates and use the reference code when following up.</p></div><a className="secondary-button" href="/track-report"><FiExternalLink size={14} />Public tracking</a></div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><label className="search-field w-full sm:max-w-sm"><FiSearch size={15} /><span className="sr-only">Search your reports</span><input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Search reference, title, location" /></label><span className="text-xs text-muted">{visible.length} {visible.length === 1 ? 'report' : 'reports'}</span></div>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter reports">{statuses.map((status) => <button key={status} type="button" className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors ${filter === status ? 'border-brand-700 bg-brand-700 text-white dark:border-brand-400 dark:bg-brand-400 dark:text-slate-950' : 'border-line text-muted hover:bg-soft dark:border-night-line dark:hover:bg-night-soft'}`} aria-pressed={filter === status} onClick={() => updateFilter(status)}>{status}{status === 'All reports' ? ` (${reports.length})` : status === 'Resolved' ? ` (${resolvedCount})` : status === 'Received' ? ` (${reports.filter((report) => report.status === 'Received').length})` : ` (${reports.filter((report) => report.status === 'In progress').length})`}</button>)}</div>
      </header>
      {pageReports.length ? <div className="divide-y divide-line dark:divide-night-line">{pageReports.map((report) => <ReportCard key={report.id} report={report} expanded={expandedId === report.id} copied={copiedId === report.id} onToggle={() => setExpandedId((current) => current === report.id ? '' : report.id)} onCopy={() => copyReference(report)} />)}</div> : <div className="p-7 text-center"><FiFileText className="mx-auto text-muted" size={22} /><h3 className="mt-3 text-sm font-semibold">{reports.length ? 'No reports match these filters' : 'You have not submitted a report yet'}</h3><p className="mt-1 text-sm text-muted">{reports.length ? 'Try a different status or search term.' : 'Use “Report an issue” above to tell the estate team what needs attention.'}</p></div>}
      {visible.length > pageSize && <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 dark:border-night-line sm:px-5"><span className="text-xs text-muted">Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, visible.length)} of {visible.length}</span><div className="flex items-center gap-2"><button type="button" className="secondary-button min-h-9" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button><span className="text-xs text-muted">Page {page} of {pageCount}</span><button type="button" className="secondary-button min-h-9" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</button></div></footer>}
    </article>
    <p className="rounded-lg bg-soft px-4 py-3 text-xs leading-5 text-muted dark:bg-night-soft">For urgent safety concerns, contact the estate security desk directly. Public tracking shows only the report status and progress notes.</p>
  </section>
}

function ReportCard({ report, expanded, copied, onToggle, onCopy }) {
  const statusClass = report.status === 'Resolved' ? 'status-done' : report.status === 'In progress' ? 'status-warning' : 'status-info'
  const reference = report.referenceCode || report.id
  const trackingUrl = `/track-report?reference=${encodeURIComponent(reference)}`
  const lastUpdate = report.updates?.at(-1)
  const stages = ['Received', 'In progress', 'Resolved']
  const currentStage = Math.max(0, stages.indexOf(report.status))
  return <article className="p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-wider text-muted">{report.category}</span><span className={`status-pill ${statusClass}`}>{report.status}</span></div><h3 className="mt-2 text-sm font-semibold">{report.title}</h3><p className="mt-1 text-xs text-muted">{report.location} <span className="px-1">·</span> Updated {report.updated}</p></div><button type="button" className="secondary-button min-h-9" aria-expanded={expanded} onClick={onToggle}><FiChevronDown className={expanded ? 'rotate-180' : ''} size={14} />{expanded ? 'Hide updates' : 'View updates'}</button></div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-soft px-3 py-2.5 dark:bg-night-soft"><div><span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">Public reference</span><code className="mt-1 block font-mono text-xs font-bold tracking-wide">{reference}</code></div><div className="flex flex-wrap gap-2"><button type="button" className="secondary-button min-h-9" onClick={onCopy}><FiCopy size={13} />{copied ? 'Copied' : 'Copy code'}</button><a className="secondary-button min-h-9" href={trackingUrl} target="_blank" rel="noreferrer">Track report<FiExternalLink size={13} /></a></div></div>
    {!expanded && <p className="mt-3 text-sm leading-6 text-muted">{lastUpdate?.message || report.update || 'The estate team has received your report. No progress note has been added yet.'}</p>}
    {expanded && <div className="mt-4 grid gap-4 border-t border-line pt-4 dark:border-night-line sm:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]"><div><h4 className="text-xs font-bold">Report details</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">{report.description}</p><p className="mt-3 text-xs text-muted">Location: <b className="font-medium text-ink dark:text-night-ink">{report.location}</b></p></div><div><div className="flex items-center justify-between gap-2"><h4 className="text-xs font-bold">Progress timeline</h4><span className={`status-pill ${statusClass}`}>{report.status}</span></div><div className="mt-3 grid grid-cols-3 gap-1">{stages.map((stage, index) => <div key={stage}><div className={`h-1.5 rounded-full ${index <= currentStage ? 'bg-brand-600' : 'bg-line dark:bg-night-line'}`} /><span className={`mt-1.5 block text-[10px] ${index <= currentStage ? 'font-semibold text-brand-800 dark:text-brand-300' : 'text-muted'}`}>{stage}</span></div>)}</div>{report.updates?.length ? <ol className="mt-4 grid gap-3">{report.updates.slice().reverse().map((update, index) => <li key={`${update.when}-${index}`} className="border-l-2 border-brand-200 pl-3 dark:border-brand-800"><p className="text-xs font-semibold">{update.status} <span className="font-normal text-muted">· {formatUpdateDate(update.when)}</span></p><p className="mt-1 text-sm leading-5 text-muted">{update.message}</p></li>)}</ol> : <p className="mt-4 rounded-lg bg-soft p-3 text-xs leading-5 text-muted dark:bg-night-soft">The estate team has received this report. No progress note has been added yet.</p>}</div></div>}
  </article>
}

function formatUpdateDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
