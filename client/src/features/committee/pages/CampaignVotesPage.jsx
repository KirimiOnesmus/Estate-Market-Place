import { useState } from 'react'
import { FiCheck, FiHeart, FiShield, FiTarget, FiX } from 'react-icons/fi'
import { formatMoney } from '../../../data/previewData.js'
import { PageSkeleton } from '../../../shared/components/LoadingSkeleton.jsx'
import { ApproveCampaignDialog } from '../components/ApproveCampaignDialog.jsx'
import { RejectReasonDialog } from '../components/RejectReasonDialog.jsx'

export function CampaignVotesPage({ campaigns, loading = false, error = '', onRetry, onVote }) {
  const [approving, setApproving] = useState(null)
  const [rejecting, setRejecting] = useState(null)
  const [actionError, setActionError] = useState('')
  const submitVote = async (campaignId, decision, reason) => {
    setActionError('')
    try {
      await onVote(campaignId, decision, reason)
      setApproving(null)
      setRejecting(null)
    } catch (requestError) { setActionError(requestError.message) }
  }
  if (loading) return <PageSkeleton label="Loading committee campaigns" />
  if (error) return <section className="surface-card p-5"><p className="text-sm text-red-700">{error}</p><button className="secondary-button mt-3" onClick={onRetry}>Try again</button></section>
  const pending = campaigns.filter((campaign) => campaign.status === 'Pending committee approval')
  return <section className="grid w-full gap-4">{pending.length ? pending.map((campaign) => {
    const ownVote = campaign.ownVote
    const voteCount = campaign.approvals + campaign.rejections
    const voteLocked = Boolean(ownVote || campaign.isOwnBeneficiary)
    return <article key={campaign.id} className="surface-card overflow-hidden"><header className="border-b border-line p-5 dark:border-night-line sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><span className="status-pill status-info">Pending approval</span><span className="text-xs text-muted">Deadline {campaign.deadline}</span></div><h2 className="mt-3 font-display text-xl font-bold">{campaign.title}</h2><p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-muted">{campaign.purpose}</p></header><div className="p-5 sm:p-6"><div className="grid gap-3 rounded-lg bg-soft p-4 dark:bg-night-soft sm:grid-cols-4"><Metric icon={FiTarget} label="Target" value={formatMoney(campaign.target)} /><Metric icon={FiHeart} label="Beneficiary" value={campaign.beneficiary} /><Metric label="Approvals" value={`${campaign.approvals} of 3 required`} /><Metric label="Rejections" value={`${campaign.rejections} of 3 threshold`} /></div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted"><span>{voteCount} committee vote{voteCount === 1 ? '' : 's'} recorded</span><span>Updated as committee members vote</span></div><div className="mt-2 flex h-2 overflow-hidden rounded-full bg-line dark:bg-night-line" aria-label={`${campaign.approvals} approvals and ${campaign.rejections} rejections`}><span className="bg-green-600 transition-[width]" style={{ width: `${voteCount ? campaign.approvals / voteCount * 100 : 0}%` }} /><span className="bg-red-500 transition-[width]" style={{ width: `${voteCount ? campaign.rejections / voteCount * 100 : 0}%` }} /></div>{ownVote && <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-xs text-green-900 dark:border-green-900 dark:bg-green-950/30 dark:text-green-100">Your {ownVote.decision.toLowerCase()} vote is recorded and locked. You can continue viewing the tally.{ownVote.reason ? ` Reason: ${ownVote.reason}` : ''}</p>}{campaign.isOwnBeneficiary && !ownVote && <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">Your household is the beneficiary of this campaign. You may review the proposal and live tally, but cannot vote on it.</p>}<div className="mt-5 flex flex-col gap-2 sm:flex-row"><button disabled={voteLocked} className="primary-button flex-1 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => setApproving(campaign)}><FiCheck size={16} />Approve campaign</button><button disabled={voteLocked} className="secondary-button flex-1 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => setRejecting(campaign)}><FiX size={16} />Reject campaign</button></div><p className="mt-3 text-xs leading-5 text-muted">Your first decision is final. Three approvals publish the campaign; three rejections return it for changes. Rejections need a reason.</p></div></article>
  }) : <article className="surface-card p-5"><h2 className="font-bold">No campaigns awaiting a decision</h2><p className="mt-1 text-sm text-muted">Published estate campaigns will appear here for committee review.</p></article>}{actionError && <p role="alert" className="field-error">{actionError}</p>}<div className="flex items-start gap-2.5 rounded-lg border border-line bg-panel p-4 text-xs leading-5 text-muted dark:border-night-line dark:bg-night-panel"><FiShield className="mt-0.5 shrink-0 text-brand-700 dark:text-brand-300" /><span>Three committee approvals publish a campaign. Three rejections close it for further edits by the estate administrator.</span></div>{approving && <ApproveCampaignDialog campaign={approving} onCancel={() => setApproving(null)} onConfirm={() => submitVote(approving.id, 'APPROVE')} />}{rejecting && <RejectReasonDialog onCancel={() => setRejecting(null)} onReject={(reason) => submitVote(rejecting.id, 'REJECT', reason)} />}</section>
}

function Metric({ icon: Icon, label, value }) { return <div><small className="flex items-center gap-1.5 text-xs text-muted">{Icon && <Icon size={14} />}{label}</small><b className="mt-1 block text-sm">{value}</b></div> }
