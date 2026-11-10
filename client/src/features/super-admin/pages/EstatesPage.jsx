import { useState } from 'react'
import { FiArchive, FiEdit2, FiExternalLink, FiMapPin, FiPlus, FiRotateCcw, FiUsers, FiUserX } from 'react-icons/fi'
import { DialogFrame } from '../../../shared/components/DialogFrame.jsx'

export function PlatformEstatesPage({ estates, loading, loadError, onRetry, onAdd, onEdit, onSetAccess, onSelectEstate, onCommunications }) {
  const [decision, setDecision] = useState(null)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')

  const confirm = async () => {
    setSaving(true)
    setActionError('')
    try {
      await onSetAccess(decision.estate, decision.nextStatus)
      setDecision(null)
    } catch (requestError) {
      setActionError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return <section className="grid w-full gap-4">
    <p className="text-sm leading-6 text-muted">Estate workspaces are stored in the platform database. Edit their details, open active workspaces, suspend access temporarily, or archive a workspace while retaining its records.</p>
    {loadError && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200" role="alert"><span>{loadError}</span><button className="secondary-button min-h-9" onClick={onRetry}>Retry</button></div>}
    {loading && estates.length === 0 ? <article className="surface-card p-7 text-sm text-muted" role="status">Loading estate workspaces…</article>
      : estates.length ? estates.map((estate) => <article key={estate.id} className="surface-card overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5 dark:border-night-line sm:p-6">
        <div className="flex min-w-0 items-start gap-3"><span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-soft text-brand-700 dark:bg-night-soft dark:text-brand-300">{estate.logo ? <img src={estate.logo} alt="" className="size-full object-contain p-1" /> : <FiMapPin size={17} />}</span><div className="min-w-0"><p className="section-kicker">{estate.id}</p><h2 className="mt-1 truncate font-bold">{estate.name}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><FiMapPin size={14} />{estate.location}</p></div></div>
        <div className="flex flex-wrap gap-2"><span className={`status-pill ${estate.accessStatus === 'Active' ? 'status-done' : 'status-warning'}`}>{estate.accessStatus} access</span><span className={`status-pill ${estate.billingStatus === 'CURRENT' ? 'status-done' : 'status-warning'}`}>{billingLabel(estate.billingStatus)}</span></div>
      </header>
      <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6"><Detail label="Estate administrator">{estate.administrator?.fullName || 'Not assigned'}{estate.administrator?.email && <small className="mt-1 block font-normal text-muted">{estate.administrator.email}</small>}</Detail><Detail label="Active memberships"><span className="inline-flex items-center gap-1.5"><FiUsers size={14} />{estate.accountCount || 0}</span></Detail><Detail label="Workspace created">{estate.created || '—'}</Detail></div>
      <footer className="flex flex-wrap gap-2 border-t border-line p-4 dark:border-night-line sm:px-5">
        <button className="secondary-button" onClick={() => onEdit(estate)}><FiEdit2 size={14} />Edit details</button>
        {onCommunications && <button className="secondary-button" onClick={() => onCommunications(estate)}>Communication channels</button>}
        {onSelectEstate && <button className="primary-button" onClick={() => onSelectEstate(estate)} disabled={estate.accessStatus !== 'Active'}><FiExternalLink size={14} />Open workspace</button>}
        {estate.accessStatus === 'Archived'
          ? <button className="secondary-button" onClick={() => setDecision({ estate, nextStatus: 'ACTIVE' })}><FiRotateCcw size={14} />Restore workspace</button>
          : <button className="secondary-button" onClick={() => setDecision({ estate, nextStatus: estate.accessStatus === 'Suspended' ? 'ACTIVE' : 'SUSPENDED' })}><FiUserX size={14} />{estate.accessStatus === 'Suspended' ? 'Restore access' : 'Suspend access'}</button>}
        {estate.accessStatus !== 'Archived' && <button className="secondary-button" onClick={() => setDecision({ estate, nextStatus: 'ARCHIVED' })}><FiArchive size={14} />Archive</button>}
      </footer>
    </article>) : loadError ? null : <article className="surface-card p-7 text-center"><h2 className="font-bold">No estate workspaces yet</h2><p className="mt-1 text-sm text-muted">Add an estate to create its platform workspace.</p><button className="primary-button mt-4" onClick={onAdd}><FiPlus size={15} />Add estate</button></article>}

    {decision && <DialogFrame titleId="estate-decision-title" onClose={() => !saving && setDecision(null)} className="p-5 sm:max-w-md sm:p-6"><p className="section-kicker">ESTATE ACCESS</p><h2 id="estate-decision-title" className="mt-1 font-bold">{decision.nextStatus === 'ARCHIVED' ? 'Archive this workspace?' : decision.nextStatus === 'SUSPENDED' ? 'Suspend estate access?' : 'Restore estate access?'}</h2><p className="mt-2 text-sm leading-6 text-muted">{decision.nextStatus === 'ARCHIVED' ? `“${decision.estate.name}” will be removed from active estate access. Its accounts and records will be retained, and the workspace can be restored later.` : decision.nextStatus === 'SUSPENDED' ? `Members of “${decision.estate.name}” will lose access while it is suspended. Existing records remain available to the platform.` : `Members of “${decision.estate.name}” will regain access to the workspace.`}</p>{actionError && <p className="field-error mt-3" role="alert">{actionError}</p>}<div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button className="secondary-button" onClick={() => setDecision(null)} disabled={saving}>Cancel</button><button className="primary-button" onClick={confirm} disabled={saving}>{saving ? 'Saving…' : decision.nextStatus === 'ARCHIVED' ? 'Archive workspace' : decision.nextStatus === 'SUSPENDED' ? 'Suspend access' : 'Restore access'}</button></div></DialogFrame>}
  </section>
}

function billingLabel(status) {
  return ({ UNCONFIGURED: 'Payment not configured', CURRENT: 'Payment current', PAST_DUE: 'Payment past due', UNDER_REVIEW: 'Payment review' })[status] || 'Payment not configured'
}

function Detail({ label, children }) { return <div><p className="section-kicker">{label}</p><p className="mt-1 text-sm font-semibold">{children}</p></div> }
