import { FiCheckCircle } from 'react-icons/fi'
import { DialogFrame } from '../../../shared/components/DialogFrame.jsx'

export function ApproveCampaignDialog({ campaign, onCancel, onConfirm }) {
  return <DialogFrame titleId="approve-campaign-title" onClose={onCancel} className="p-5 sm:max-w-md sm:p-6">
    <span className="grid size-9 place-items-center rounded-lg bg-green-soft text-green-800 dark:bg-green-950 dark:text-green-200"><FiCheckCircle size={18} /></span>
    <h2 id="approve-campaign-title" className="mt-4 font-display text-lg font-bold">Approve this campaign?</h2>
    <p className="mt-2 text-sm leading-6 text-muted">Your vote will be recorded for “{campaign?.title || 'this campaign'}”. It will go live once it reaches three approvals.</p>
    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button className="secondary-button" onClick={onCancel}>Review campaign</button><button className="primary-button" onClick={onConfirm}>Confirm approval</button></div>
  </DialogFrame>
}
