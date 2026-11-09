import { useState } from 'react'
import { FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi'
import { DialogFrame } from '../../../shared/components/DialogFrame.jsx'

export function ResidentDecisionDialog({ request, onCancel, onConfirm, saving = false, error = '' }) {
  const approving = request.action === 'Approve'
  const [note, setNote] = useState('')
  return <DialogFrame titleId="resident-decision-title" onClose={onCancel} className="p-5 sm:max-w-lg sm:p-6">
    <form onSubmit={(event) => { event.preventDefault(); onConfirm(note.trim()) }} aria-busy={saving}>
      <span className={`grid size-9 place-items-center rounded-lg ${approving ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200' : 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200'}`}>{approving ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}</span>
      <h2 id="resident-decision-title" className="mt-4 font-display text-lg font-bold">{approving ? 'Approve resident access?' : 'Decline this registration?'}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{approving ? 'Confirm that the details below match the household. Approval verifies the household and activates the resident account.' : 'The household request will be declined and the applicant will not receive estate access.'}</p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-soft p-3 dark:bg-night-soft">
        <Detail label="Applicant" value={request.name} />
        <Detail label="Email" value={request.email} />
        <Detail label="Phone" value={request.phone} />
        <Detail label="Household" value={request.unit} />
        <Detail label="Occupancy" value={request.occupancy} />
        <Detail label="Household size" value={request.householdSize ? `${request.householdSize} people` : 'Not provided'} />
      </dl>
      {!approving && <div className="mt-4"><label className="field-label" htmlFor="resident-decline-note">Reason or note <span className="font-normal text-muted">(optional)</span></label><textarea id="resident-decline-note" maxLength={500} className="form-control mt-1 min-h-20 resize-y" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a note for the applicant or estate record." /></div>}
      {approving && <p className="mt-3 text-xs leading-5 text-muted">A one-time password setup link will be generated after approval. You can share it with the applicant from the next screen.</p>}
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
      <div className="mt-5 flex flex-col-reverse gap-2 border-t border-line pt-4 dark:border-night-line sm:flex-row sm:justify-end"><button type="button" className="secondary-button" onClick={onCancel} disabled={saving}><FiX size={15} />Go back</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving decision…' : approving ? 'Approve resident' : 'Decline request'}</button></div>
    </form>
  </DialogFrame>
}

function Detail({ label, value }) {
  return <div className="min-w-0"><dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</dt><dd className="mt-0.5 break-words text-xs font-medium">{value || 'Not provided'}</dd></div>
}
