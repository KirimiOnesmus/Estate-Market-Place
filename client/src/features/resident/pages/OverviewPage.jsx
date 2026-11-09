import { FiArrowRight, FiBell, FiHeart, FiTool } from 'react-icons/fi'
import { SectionHeading } from '../../../shared/components/SectionHeading.jsx'
import { StatCard } from '../../../shared/components/StatCard.jsx'
import { ListingCard } from '../components/ListingCard.jsx'
import { CampaignSummary } from '../../../shared/components/CampaignSummary.jsx'

export function ResidentOverviewPage({ listings = [], campaigns = [], notices = [], reports = [], savedIds = [], toggleSaved, navigate, estateName = 'your estate' }) {
  const campaign = campaigns.find((item) => item.status === 'Live')
  const campaignsUnderReview = campaigns.filter((item) => item.status === 'Pending committee approval')
  const latestNotice = notices[0]
  const openReports = reports.filter((report) => report.status !== 'Resolved').length
  return <>
    <section className="mb-6 grid gap-3 sm:grid-cols-3"><StatCard icon={FiHeart} label="Active campaigns" value={String(campaigns.filter((item) => item.status === 'Live').length)} detail="Open to resident contributions" /><StatCard icon={FiBell} label="Estate notices" value={String(notices.length)} detail="Published community updates" /><StatCard icon={FiTool} label="Your open reports" value={String(openReports)} detail="Being followed up by the estate team" /></section>
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,.8fr)]">
      <div><div className="mb-3 flex items-center justify-between gap-3"><div><p className="section-kicker">COMMUNITY CAMPAIGN</p><h2 className="mt-1 font-display text-lg font-bold">Neighbours are making a difference</h2></div><FiHeart className="text-brand-700 dark:text-brand-300" size={20} /></div>{campaign ? <article className="surface-card p-4 sm:p-5"><div className="flex flex-wrap items-center gap-2"><span className="status-pill status-live">Live</span><span className="text-xs text-muted">Due {campaign.deadline}</span></div><h3 className="mt-3 font-display text-base font-bold">{campaign.title}</h3><p className="mt-1 text-sm leading-6 text-muted">{campaign.purpose}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted"><span>Beneficiary: {campaign.beneficiary}</span><span>Target: {formatMoney(campaign.target)}</span></div><button className="primary-button mt-4" onClick={() => navigate('fundraisers')}>See campaign<FiArrowRight size={15} /></button></article> : <article className="surface-card p-5"><h3 className="text-sm font-semibold">No active campaigns</h3><p className="mt-1 text-sm leading-6 text-muted">Approved campaigns for {estateName} will appear here.</p><button className="secondary-button mt-3" onClick={() => navigate('fundraisers')}>View giving<FiArrowRight size={15} /></button></article>}</div>
      <article className="surface-card p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><div><p className="section-kicker">LATEST NOTICE</p><h2 className="mt-1 font-display text-base font-bold">{latestNotice?.category || 'Estate updates'}</h2></div><span className="size-2 rounded-full bg-brand-600" /></div>{latestNotice ? <><h3 className="text-sm font-semibold">{latestNotice.title}</h3><p className="mt-1.5 text-sm leading-6 text-muted">{latestNotice.text}</p><p className="mt-3 text-xs font-medium text-muted">{latestNotice.date}<span className="px-1">·</span>{latestNotice.time}</p></> : <p className="text-sm text-muted">There are no published notices at the moment.</p>}<button className="secondary-button mt-3" onClick={() => navigate('notices')}>All notices<FiArrowRight size={15} /></button></article>
    </section>
    {campaignsUnderReview.length > 0 && <section className="mt-6"><SectionHeading kicker="COMMITTEE REVIEW" title="Campaigns under review" action="View vote progress" onAction={() => navigate('fundraisers')} /><div className="grid gap-3 lg:grid-cols-2">{campaignsUnderReview.slice(0, 2).map((item) => <CampaignSummary key={item.id} campaign={item} />)}</div></section>}
    <section className="mt-8"><SectionHeading kicker="FROM YOUR NEIGHBOURS" title="Recently shared" action="Explore marketplace" onAction={() => navigate('marketplace')} /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{listings.slice(0, 4).map((listing) => <ListingCard key={listing.id} listing={listing} saved={savedIds.includes(listing.id)} onSave={() => toggleSaved(listing.id)} />)}</div></section>
    <section className="mt-7 grid gap-3 sm:grid-cols-2"><QuickLink title="Have an item or service to share?" text="Add it to the resident marketplace." action="Browse marketplace" onClick={() => navigate('marketplace')} /><QuickLink title="Something needs attention?" text="Let the estate team know about a repair or concern." action="View issue reports" onClick={() => navigate('issues')} /></section>
  </>
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(Number(value) || 0)
}

function QuickLink({ title, text, action, onClick }) {
  return <article className="surface-card flex flex-wrap items-center gap-3 p-4"><span className="grid size-9 place-items-center rounded-lg bg-soft text-brand-700 dark:bg-night-soft dark:text-brand-300"><FiArrowRight size={16} /></span><div className="min-w-0 flex-1"><b className="block text-sm">{title}</b><p className="mt-1 text-xs leading-5 text-muted">{text}</p></div><button className="secondary-button w-full sm:w-auto" onClick={onClick}>{action}<FiArrowRight size={15} /></button></article>
}
