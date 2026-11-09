import { FiShield } from 'react-icons/fi'
import { CampaignSummary } from '../../../shared/components/CampaignSummary.jsx'
import { PageSkeleton } from '../../../shared/components/LoadingSkeleton.jsx'

export function FundraisersPage({ campaigns, onContribute, loading = false, error = '', onRetry }) {
  if (loading) return <PageSkeleton label="Loading community campaigns" />
  if (error) return <section className="surface-card p-5"><p className="text-sm text-red-700">{error}</p><button className="secondary-button mt-3" onClick={onRetry}>Try again</button></section>
  const active = campaigns.filter((campaign) => campaign.status === 'Live')
  const estate = active.filter((campaign) => campaign.beneficiaryType === 'estate')
  const resident = active.filter((campaign) => campaign.beneficiaryType !== 'estate')
  const campaignCard = (campaign) => <CampaignSummary key={campaign.id} campaign={campaign} actionLabel={campaign.beneficiaryType === 'estate' ? 'Pay household contribution' : 'Contribute'} onAction={() => onContribute(campaign)} />
  return <section className="grid w-full content-start gap-6"><p className="text-sm leading-6 text-muted">Approved estate contributions and resident fundraisers appear here. Payments are not yet connected to a provider.</p>{estate.length > 0 && <div className="grid w-full gap-3"><div className="border-b border-line pb-3 dark:border-night-line"><p className="section-kicker">ESTATE CONTRIBUTIONS</p><h2 className="mt-1 text-base font-bold">Household assessments</h2></div><div className="grid gap-3">{estate.map(campaignCard)}</div></div>}{resident.length > 0 && <div className="grid w-full gap-3"><div className="border-b border-line pb-3 dark:border-night-line"><p className="section-kicker">COMMUNITY CAMPAIGNS</p><h2 className="mt-1 text-base font-bold">Fundraisers</h2></div><div className="grid gap-3">{resident.map(campaignCard)}</div></div>}{active.length === 0 && <article className="surface-card w-full p-5"><h2 className="text-sm font-bold">No active giving campaigns</h2><p className="mt-1 text-sm text-muted">Approved estate assessments and resident fundraisers will appear here.</p></article>}<p className="flex items-center gap-2 text-xs text-muted"><FiShield className="text-brand-700 dark:text-brand-300" size={15} />Payment prompts are preview interactions; payment processing is not connected.</p></section>
}
