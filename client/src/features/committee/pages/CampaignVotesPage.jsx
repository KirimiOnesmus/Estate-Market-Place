import { useState } from 'react'
import { FiCheck, FiShield, FiX } from 'react-icons/fi'
import { formatMoney } from '../../../data/previewData.js'
import { RejectReasonDialog } from '../components/RejectReasonDialog.jsx'
import { ApproveCampaignDialog } from '../components/ApproveCampaignDialog.jsx'

export function CampaignVotesPage({ notify, campaigns, setCampaigns }) {
  const activeCampaign = campaigns.find((campaign) => campaign.status === 'Pending committee approval' || campaign.status === 'Pending approval') || campaigns[0]
  const [vote, setVote] = useState(() => ({ approvals: activeCampaign?.approvals || 0, rejections: activeCampaign?.rejections || 0, ownVote: null, reason: '', status: activeCampaign?.status === 'Pending committee approval' ? 'Pending approval' : activeCampaign?.status || 'Pending approval' }))
  const [rejectOpen, setRejectOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const closed = vote.status === 'Live' || vote.status === 'Rejected'
  const castVote = (nextVote, reason = '') => {
    const approvals = vote.approvals - (vote.ownVote === 'approve' ? 1 : 0) + (nextVote === 'approve' ? 1 : 0)
    const rejections = vote.rejections - (vote.ownVote === 'reject' ? 1 : 0) + (nextVote === 'reject' ? 1 : 0)
    const status = approvals >= 3 ? 'Live' : rejections >= 3 ? 'Rejected' : 'Pending approval'
    setVote({ approvals, rejections, ownVote: nextVote, reason: nextVote === 'reject' ? reason : '', status })
    if (activeCampaign) setCampaigns((items) => items.map((campaign) => campaign.id === activeCampaign.id ? { ...campaign, approvals, rejections, status, updated: status === 'Live' ? 'Approved just now' : status === 'Rejected' ? 'Rejected just now' : 'Vote recorded just now' } : campaign))
    setRejectOpen(false)
    notify(nextVote === 'approve' ? 'Approval recorded in this preview.' : 'Rejection recorded in this preview.')
  }
  return <section className="w-full"><article className="surface-card overflow-hidden"><div className="border-b border-line p-5 dark:border-night-line sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><span className={`status-pill ${vote.status === 'Pending approval' || vote.status === 'Pending committee approval' ? 'status-info' : vote.status === 'Live' ? 'status-done' : 'status-warning'}`}>{vote.status}</span><span className="text-xs text-muted">Closes 7 Nov</span></div><h2 className="mt-3 font-display text-xl font-bold">{activeCampaign?.title || 'Campaign review'}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{activeCampaign?.purpose}</p></div><div className="p-5 sm:p-6"><div className="grid gap-3 rounded-lg bg-soft p-4 dark:bg-night-soft sm:grid-cols-4"><Metric label="Target" value={formatMoney(activeCampaign?.target)} /><Metric label="Beneficiary" value={activeCampaign?.beneficiary || '—'} /><Metric label="Approvals" value={`${vote.approvals} of 3 needed`} /><Metric label="Rejections" value={`${vote.rejections} of 3 threshold`} /></div><div className="mt-5 flex flex-col gap-2 sm:flex-row"><button disabled={closed} className="primary-button flex-1" onClick={() => setApproveOpen(true)}><FiCheck size={16} />{vote.ownVote === 'approve' ? 'Change approval' : 'Approve campaign'}</button><button disabled={closed} className="secondary-button flex-1" onClick={() => setRejectOpen(true)}><FiX size={16} />{vote.ownVote === 'reject' ? 'Change rejection' : 'Reject campaign'}</button></div><p className="mt-3 text-xs leading-5 text-muted">Votes may change before a decision. Every rejection needs a reason.</p>{vote.reason && <p className="mt-3 rounded-lg border border-line px-3 py-2 text-xs leading-5 text-muted dark:border-night-line"><b className="text-ink dark:text-night-ink">Your rejection reason:</b> {vote.reason}</p>}</div></article><div className="mt-4 flex items-start gap-2.5 rounded-lg border border-line bg-panel p-4 text-xs leading-5 text-muted dark:border-night-line dark:bg-night-panel"><FiShield className="mt-0.5 shrink-0 text-brand-700 dark:text-brand-300" /><span>This sample committee has 5 members. Three approvals make a campaign live; the rejection threshold is 3.</span></div>{approveOpen && <ApproveCampaignDialog onCancel={() => setApproveOpen(false)} onConfirm={() => { setApproveOpen(false); castVote('approve') }} />}{rejectOpen && <RejectReasonDialog onCancel={() => setRejectOpen(false)} onReject={(reason) => castVote('reject', reason)} />}</section>
}

function Metric({ label, value }) { return <div><small className="block text-xs text-muted">{label}</small><b className="mt-1 block text-sm">{value}</b></div> }
