import { useState } from 'react'
import { FiCopy, FiExternalLink, FiShield, FiUsers } from 'react-icons/fi'
import { EmptyState } from '../../../shared/components/EmptyState.jsx'
import { ResidentDecisionDialog } from '../components/ResidentDecisionDialog.jsx'

export function ResidentApprovalsPage({ requests, setRequests, notify, onApprove, onDecline, loading = false, error = '', onRetry }) {
  const [decision, setDecision] = useState(null)
  const [saving, setSaving] = useState(false)
  const [decisionError, setDecisionError] = useState('')
  const [setupLink, setSetupLink] = useState('')
  const [copied, setCopied] = useState(false)
  const decide = async (note = '') => {
    const selected = decision
    setSaving(true)
    setDecisionError('')
    try {
      if (selected.action === 'Approve') {
        const result = await onApprove(selected)
        if (result?.setupUrl) { setSetupLink(result.setupUrl); setCopied(false) }
      }
      else await onDecline?.({ ...selected, note })
      setRequests((items) => items.filter((item) => item.id !== selected.id))
      notify(`${selected.name} was ${selected.action.toLowerCase()}.`)
      setDecision(null)
    } catch (error) {
      setDecisionError(error.message || 'The decision could not be saved. Please try again.')
    } finally {
      setSaving(false)
    }
  }
  return <section className="w-full">
    {loading && <p className="surface-card mb-4 p-4 text-sm text-muted">Loading registration requests…</p>}
    {error && <div className="surface-card mb-4 p-4"><p className="text-sm text-red-700">{error}</p><button className="secondary-button mt-3" onClick={onRetry}>Try again</button></div>}
    {setupLink && <article className="surface-card mb-4 p-4 sm:p-5"><p className="section-kicker">ACCOUNT SETUP</p><h2 className="mt-1 font-bold">Share the password setup link</h2><p className="mt-1 text-sm text-muted">This link expires in 48 hours. Send it to the approved household representative.</p><div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]"><input className="form-control min-w-0" aria-label="Password setup link" value={setupLink} readOnly onFocus={(event) => event.target.select()} /><button className="secondary-button" onClick={async () => { try { await navigator.clipboard.writeText(setupLink); setCopied(true) } catch { setCopied(false) } }}>{copied ? 'Copied' : <><FiCopy size={14} />Copy link</>}</button><a className="secondary-button" href={setupLink} target="_blank" rel="noreferrer"><FiExternalLink size={14} />Open link</a></div></article>}
    <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-sm text-muted">Compare each request with the committee resident list before deciding.</p><p className="mt-1 text-xs text-muted">{requests.length} waiting for review</p></div><FiShield className="text-brand-700 dark:text-brand-300" size={20} /></div>
    <div className="surface-card overflow-hidden">
      {requests.length ? <div className="divide-y divide-line dark:divide-night-line">{requests.map((request) => <article key={request.id} className="grid min-w-0 gap-4 p-4 sm:p-5">
        <div><h2 className="text-sm font-semibold">{request.name}</h2><span className="mt-1 block text-xs text-muted">Registration request · {request.location}</span></div>
        <div className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 text-xs sm:grid-cols-4">
          <Detail label="Phone">{request.phone}</Detail><Detail label="Unit">{request.unit}</Detail><Detail label="Occupancy">{request.occupancy}</Detail><Detail label="Requested">{request.submitted}</Detail>
        </div>
        <div className="flex gap-2 sm:justify-end"><button className="primary-button min-h-11 flex-1 sm:flex-none" onClick={() => { setDecisionError(''); setDecision({ ...request, action: 'Approve' }) }}>Approve</button><button className="secondary-button min-h-11 flex-1 sm:flex-none" onClick={() => { setDecisionError(''); setDecision({ ...request, action: 'Decline' }) }}>Decline</button></div>
      </article>)}</div> : <EmptyState icon={FiUsers} title="All caught up" text="There are no resident requests waiting for review." />}
    </div>
    <p className="mt-4 text-xs leading-5 text-muted">Resident identity and unit details are sensitive. Use them only to verify membership.</p>
    {decision && <ResidentDecisionDialog request={decision} error={decisionError} onCancel={() => setDecision(null)} onConfirm={decide} saving={saving} />}
  </section>
}

function Detail({ label, children }) {
  return <div className="min-w-0"><span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</span><span className="mt-0.5 block break-words text-xs text-ink dark:text-night-ink">{children}</span></div>
}
