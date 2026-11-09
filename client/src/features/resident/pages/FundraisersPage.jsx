import { useEffect, useState } from 'react'
import { FiShield } from 'react-icons/fi'
import { api } from '../../../api.js'
import { CampaignSummary } from '../../../shared/components/CampaignSummary.jsx'
import { PageSkeleton } from '../../../shared/components/LoadingSkeleton.jsx'

export function FundraisersPage({ campaigns, onContribute, loading = false, error = '', onRetry }) {
  const [paymentReady, setPaymentReady] = useState(null)
  useEffect(() => {
    let current = true
    api.getGivingStatus().then((status) => { if (current) setPaymentReady(Boolean(status.mpesaStkPushAvailable)) }).catch(() => { if (current) setPaymentReady(false) })
    return () => { current = false }
  }, [])

  if (loading) return <PageSkeleton label="Loading community campaigns" />
  if (error) return <section className="surface-card p-5"><p className="text-sm text-red-700">{error}</p><button className="secondary-button mt-3" onClick={onRetry}>Try again</button></section>
  const active = campaigns.filter((campaign) => campaign.status === 'Live')
  const underReview = campaigns.filter((campaign) => campaign.status === 'Pending committee approval')
  const estate = active.filter((campaign) => campaign.beneficiaryType === 'estate')
  const resident = active.filter((campaign) => campaign.beneficiaryType !== 'estate')
  const campaignCard = (campaign) => <CampaignSummary key={campaign.id} campaign={campaign} actionLabel={campaign.beneficiaryType === 'estate' ? 'Pay household contribution' : 'Contribute'} actionDisabled={paymentReady !== true} onAction={() => onContribute(campaign)} />
  return <section className="grid w-full content-start gap-6"><p className="text-sm leading-6 text-muted">Follow campaign decisions and contribute to approved estate assessments and resident fundraisers.</p>{underReview.length > 0 && <div className="grid w-full gap-3"><div className="border-b border-line pb-3 dark:border-night-line"><p className="section-kicker">COMMITTEE REVIEW</p><h2 className="mt-1 text-base font-bold">Campaigns under review</h2><p className="mt-1 text-xs text-muted">Committee vote totals refresh automatically while this page is open.</p></div><div className="grid gap-3">{underReview.map((campaign) => <CampaignSummary key={campaign.id} campaign={campaign} />)}</div></div>}{paymentReady === false && active.length > 0 && <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">M-Pesa STK Push is not configured for this estate yet. Contributions will be available after the administrator configures the Daraja connection.</p>}{estate.length > 0 && <div className="grid w-full gap-3"><div className="border-b border-line pb-3 dark:border-night-line"><p className="section-kicker">ESTATE CONTRIBUTIONS</p><h2 className="mt-1 text-base font-bold">Household assessments</h2></div><div className="grid gap-3">{estate.map(campaignCard)}</div></div>}{resident.length > 0 && <div className="grid w-full gap-3"><div className="border-b border-line pb-3 dark:border-night-line"><p className="section-kicker">COMMUNITY CAMPAIGNS</p><h2 className="mt-1 text-base font-bold">Fundraisers</h2></div><div className="grid gap-3">{resident.map(campaignCard)}</div></div>}{active.length === 0 && underReview.length === 0 && <article className="surface-card w-full p-5"><h2 className="text-sm font-bold">No active giving campaigns</h2><p className="mt-1 text-sm text-muted">Approved estate assessments and resident fundraisers will appear here.</p></article>}{active.length > 0 && <p className="flex items-center gap-2 text-xs text-muted"><FiShield className="text-brand-700 dark:text-brand-300" size={15} />Payments are recorded only after Safaricom confirms the transaction.</p>}</section>
}
