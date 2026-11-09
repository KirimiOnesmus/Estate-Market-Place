import { useState } from 'react'
import { ReportList } from '../../../shared/components/ReportList.jsx'
import { DialogFrame } from '../../../shared/components/DialogFrame.jsx'
import { FiCheck, FiX } from 'react-icons/fi'
import { PageSkeleton } from '../../../shared/components/LoadingSkeleton.jsx'

export function AdminIssuesPage({ reports, onUpdate, status: loadStatus = 'ready', error: loadError = '', onRetry }) {
  const [filter, setFilter] = useState('All reports')
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState('In progress')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const visible = reports.filter((report) => filter === 'All reports' || (filter === 'Open' ? report.status !== 'Resolved' : report.status === 'Resolved'))
  const open = (report) => { setSelected(report); setStatus(report.status); setMessage(''); setError('') }
  if (loadStatus === 'loading') return <PageSkeleton label="Loading issue reports" />
  if (loadStatus === 'error') return <section className="surface-card p-5"><p className="text-sm text-red-700">{loadError}</p><button className="secondary-button mt-3" onClick={onRetry}>Try again</button></section>
  const save = async (event) => { event.preventDefault(); if (!message.trim()) { setError('Add a status report for residents.'); return } setSaving(true); const saved = await onUpdate(selected.id, status, message.trim()); setSaving(false); if (saved) setSelected(null) }
  return <section className="w-full"><div className="surface-card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 dark:border-night-line sm:px-5"><div><h2 className="font-display text-base font-bold">Estate reports</h2><p className="mt-1 text-xs text-muted">Update the issue status and share a progress note with residents.</p></div><label><span className="sr-only">Filter reports</span><select className="select-field" value={filter} onChange={(event) => setFilter(event.target.value)}><option>All reports</option><option>Open</option><option>Resolved</option></select></label></div>{visible.length ? <ReportList reports={visible} onUpdate={open} /> : <p className="p-5 text-sm text-muted">There are no reports in this view.</p>}</div>
    {selected && <DialogFrame titleId="issue-status-title" onClose={() => setSelected(null)}><form onSubmit={save} className="p-5 sm:p-6" aria-busy={saving}><h2 id="issue-status-title" className="text-lg font-bold">Update issue status</h2><p className="mt-1 text-sm text-muted">{selected.id} · {selected.title}</p><label className="field-label mt-5 block" htmlFor="issue-status">New status</label><select id="issue-status" className="form-control" value={status} onChange={(event) => setStatus(event.target.value)}><option>Received</option><option>In progress</option><option>Resolved</option></select><label className="field-label mt-4 block" htmlFor="issue-report">Status report for residents</label><textarea id="issue-report" className="form-control min-h-28 resize-y" value={message} onChange={(event) => { setMessage(event.target.value); setError('') }} placeholder="Describe what changed and what happens next." aria-invalid={Boolean(error)} />{error && <span className="field-error">{error}</span>}<p className="mt-3 text-xs leading-5 text-muted">The report will appear with the updated status on the resident issue page.</p><div className="mt-5 flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end"><button type="button" className="secondary-button" onClick={() => setSelected(null)}><FiX size={15} />Cancel</button><button type="submit" disabled={saving} className="primary-button"><FiCheck size={15} />{saving ? 'Saving…' : 'Save update'}</button></div></form></DialogFrame>}
  </section>
}
