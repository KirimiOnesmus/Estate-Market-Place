import { FiHeart } from 'react-icons/fi'
import { DialogFrame } from '../../../shared/components/DialogFrame.jsx'

export function CampaignPublishDialog({ campaign, onCancel, onPublish }) {
  return <DialogFrame titleId="publish-title" onClose={onCancel} className="p-5 sm:max-w-md sm:p-6"><span className="grid size-9 place-items-center rounded-lg bg-soft text-brand-700 dark:bg-night-soft dark:text-brand-300"><FiHeart size={18} /></span><h2 id="publish-title" className="mt-4 font-display text-lg font-bold">Send “{campaign.title}” for review?</h2><p className="mt-2 text-sm leading-6 text-muted">Committee members will be able to review and vote. It won’t go live until it has enough approvals.</p><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button className="secondary-button" onClick={onCancel}>Keep as draft</button><button className="primary-button" onClick={onPublish}>Publish for review</button></div></DialogFrame>
}
