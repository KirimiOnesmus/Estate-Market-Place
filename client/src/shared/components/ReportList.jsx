import { useState } from 'react'
import { FiChevronDown } from 'react-icons/fi'

export function ReportList({ reports, onUpdate }) {
  return <div className="@container overflow-hidden">
    <div className="hidden border-b border-line bg-soft px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted @4xl:grid @4xl:grid-cols-[minmax(0,1.5fr)_minmax(120px,.8fr)_minmax(140px,.8fr)_auto] dark:border-night-line dark:bg-night-soft">
      <span>Report</span><span>Status</span><span>Last update</span><span>Details</span>
    </div>
    <div className="divide-y divide-line dark:divide-night-line">
      {reports.map((report) => <ReportRow key={report.id} report={report} onUpdate={onUpdate} />)}
    </div>
  </div>
}

function ReportRow({ report, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const statusClass = report.status === 'Resolved' ? 'status-done' : report.status === 'In progress' ? 'status-warning' : 'status-info'
  return <article className="grid gap-3 p-4 @4xl:grid-cols-[minmax(0,1.5fr)_minmax(120px,.8fr)_minmax(140px,.8fr)_auto] @4xl:items-center sm:p-5">
    <div><h3 className="text-sm font-semibold">{report.title}</h3><span className="mt-1 block text-xs text-muted">{report.id}<span className="px-1.5">·</span>{report.category}</span></div>
    <div><span className={`status-pill ${statusClass}`}>{report.status}</span></div>
    <div className="text-xs text-muted"><span className="font-semibold text-ink dark:text-night-ink @4xl:hidden">Last update · </span>{report.updated}</div>
    <div className="flex flex-wrap gap-2 @4xl:justify-self-end">
      {onUpdate && <button className="secondary-button min-h-11" onClick={() => onUpdate(report)}>Update status</button>}
      <button className="secondary-button min-h-11" aria-expanded={expanded} aria-controls={`report-${report.id}`} onClick={() => setExpanded((value) => !value)}><FiChevronDown className={expanded ? 'rotate-180' : ''} size={15} />{expanded ? 'Hide details' : 'View details'}</button>
    </div>
    {expanded && <div id={`report-${report.id}`} className="grid gap-2 rounded-lg bg-soft p-3 text-xs leading-5 text-muted @4xl:col-span-4 sm:grid-cols-2 dark:bg-night-soft">
      <div><b className="text-ink dark:text-night-ink">Location</b><p>{report.location}</p><b className="mt-2 block text-ink dark:text-night-ink">Description</b><p>{report.description}</p>{report.reporter && <><b className="mt-2 block text-ink dark:text-night-ink">Reported by</b><p>{report.reporter}</p></>}</div>
      <div><b className="text-ink dark:text-night-ink">Status report</b><p className="mt-1">{report.update}</p>{report.updates?.length > 0 && <ol className="mt-2 grid gap-1">{report.updates.slice().reverse().map((entry, index) => <li key={`${entry.when}-${index}`}><b>{entry.status}</b> · {entry.message} <span className="text-muted">({entry.when})</span></li>)}</ol>}</div>
    </div>}
  </article>
}
