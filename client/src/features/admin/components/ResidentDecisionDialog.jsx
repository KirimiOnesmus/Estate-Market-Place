import { FiAlertCircle } from 'react-icons/fi'
import { DialogFrame } from '../../../shared/components/DialogFrame.jsx'

export function ResidentDecisionDialog({ request, onCancel, onConfirm }) {
  const approving = request.action === 'Approve'
  return <DialogFrame titleId="resident-decision-title" onClose={onCancel} className="p-5 sm:max-w-md sm:p-6"><span className="grid size-9 place-items-center rounded-lg bg-soft text-brand-700 dark:bg-night-soft dark:text-brand-300"><FiAlertCircle size={18} /></span><h2 id="resident-decision-title" className="mt-4 font-display text-lg font-bold">{approving ? 'Approve resident access?' : 'Decline this request?'}</h2><p className="mt-2 text-sm leading-6 text-muted">{approving ? `${request.name} will be marked as a verified resident in this preview.` : `${request.name} will be removed from the pending list in this preview.`}</p><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button className="secondary-button" onClick={onCancel}>Go back</button><button className="primary-button" onClick={onConfirm}>{approving ? 'Approve resident' : 'Decline request'}</button></div></DialogFrame>
}
