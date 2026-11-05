import { useState } from 'react'
import { FiShield, FiUsers } from 'react-icons/fi'
import { EmptyState } from '../../../shared/components/EmptyState.jsx'
import { ResidentDecisionDialog } from '../components/ResidentDecisionDialog.jsx'

export function ResidentApprovalsPage({ requests, setRequests, notify, onApprove }) {
  const [decision, setDecision] = useState(null)
  const decide = () => {
    const selected = decision
    setRequests((items) => items.filter((item) => item.id !== selected.id))
    if (selected.action === 'Approve') onApprove(selected)
    notify(`${selected.name} was ${selected.action.toLowerCase()} in this preview.`)
    setDecision(null)
  }
  return <section className="w-full">
    <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-sm text-muted">Compare each request with the committee resident list before deciding.</p><p className="mt-1 text-xs text-muted">{requests.length} waiting for review</p></div><FiShield className="text-brand-700 dark:text-brand-300" size={20} /></div>
    <div className="surface-card overflow-hidden">
      {requests.length ? <div className="divide-y divide-line dark:divide-night-line">{requests.map((request) => <article key={request.id} className="grid min-w-0 gap-4 p-4 sm:p-5">
        <div><h2 className="text-sm font-semibold">{request.name}</h2><span className="mt-1 block text-xs text-muted">Request {request.id}</span></div>
        <div className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 text-xs sm:grid-cols-4">
          <Detail label="Phone">{request.phone}</Detail><Detail label="Unit">{request.unit}</Detail><Detail label="Occupancy">{request.occupancy}</Detail><Detail label="Requested">{request.submitted}</Detail>
        </div>
        <div className="flex gap-2 sm:justify-end"><button className="primary-button min-h-11 flex-1 sm:flex-none" onClick={() => setDecision({ ...request, action: 'Approve' })}>Approve</button><button className="secondary-button min-h-11 flex-1 sm:flex-none" onClick={() => setDecision({ ...request, action: 'Decline' })}>Decline</button></div>
      </article>)}</div> : <EmptyState icon={FiUsers} title="All caught up" text="There are no resident requests waiting for review." />}
    </div>
    <p className="mt-4 text-xs leading-5 text-muted">Resident identity and unit details are sensitive. Use them only to verify membership.</p>
    {decision && <ResidentDecisionDialog request={decision} onCancel={() => setDecision(null)} onConfirm={decide} />}
  </section>
}

function Detail({ label, children }) {
  return <div className="min-w-0"><span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</span><span className="mt-0.5 block break-words text-xs text-ink dark:text-night-ink">{children}</span></div>
}
