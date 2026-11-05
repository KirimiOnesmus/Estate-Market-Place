import { FiKey, FiUserCheck, FiUserX } from 'react-icons/fi'
import { DialogFrame } from '../../../shared/components/DialogFrame.jsx'

const actionDetails = {
  remove: { icon: FiUserX, title: 'Remove this household?', description: (resident) => `${resident.name} and the household login for ${resident.unit} will be removed from the resident directory.`, confirm: 'Remove household', tone: 'danger' },
  reset: { icon: FiKey, title: 'Issue a password reset?', description: (resident) => `Issue a new one-time password for ${resident.name} at ${resident.email}. Use this after the resident has requested help. Their next sign-in will require a password reset.`, confirm: 'Issue reset', tone: 'normal' },
  promote: { icon: FiUserCheck, title: 'Promote next of kin to household holder?', description: (resident) => `${resident.nextOfKin?.name} will become the sole account holder for ${resident.unit}. The current holder will be recorded as the former holder.`, confirm: 'Promote next of kin', tone: 'normal' },
}

export function ResidentAdminDecisionDialog({ action, resident, onCancel, onConfirm }) {
  const details = actionDetails[action]
  const Icon = details.icon
  return <DialogFrame titleId="resident-admin-decision-title" onClose={onCancel} className="p-5 sm:max-w-md sm:p-6">
    <span className={`grid size-9 place-items-center rounded-lg ${details.tone === 'danger' ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200' : 'bg-soft text-brand-700 dark:bg-night-soft dark:text-brand-300'}`}><Icon size={18} /></span>
    <h2 id="resident-admin-decision-title" className="mt-4 font-display text-lg font-bold">{details.title}</h2>
    <p className="mt-2 text-sm leading-6 text-muted">{details.description(resident)} This preview does not send an email or change a real account.</p>
    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button className="secondary-button" onClick={onCancel}>Cancel</button><button className={details.tone === 'danger' ? 'inline-flex min-h-11 items-center justify-center rounded-lg bg-red-700 px-4 text-xs font-semibold text-white hover:bg-red-800' : 'primary-button'} onClick={onConfirm}>{details.confirm}</button></div>
  </DialogFrame>
}
