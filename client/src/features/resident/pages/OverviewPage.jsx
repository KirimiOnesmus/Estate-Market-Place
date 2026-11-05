import { FiActivity, FiArrowRight, FiHeart, FiTool, FiUsers } from 'react-icons/fi'
import { CampaignSummary } from '../../../shared/components/CampaignSummary.jsx'
import { SectionHeading } from '../../../shared/components/SectionHeading.jsx'
import { StatCard } from '../../../shared/components/StatCard.jsx'
import { ListingCard } from '../components/ListingCard.jsx'

export function ResidentOverviewPage({ listings, notices, reports, savedIds, toggleSaved, navigate, notify }) {
  const campaign = { id: 'C-014', title: 'Courtyard garden', purpose: 'Plant shade trees and create a shared herb garden for residents.', target: 75000, raised: 42600, beneficiary: 'Pavilion Court residents', deadline: 'Ends 18 Nov', status: 'Live', approvals: 3 }
  const latestNotice = notices.find((notice) => notice.unread) || notices[0]
  const openReports = reports.filter((report) => report.status !== 'Resolved').length
  return <>
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,.8fr)]">
      <div><div className="mb-3 flex items-center justify-between gap-3"><div><p className="section-kicker">COMMUNITY CAMPAIGN</p><h2 className="mt-1 font-display text-lg font-bold">Neighbours are making a difference</h2></div><FiHeart className="text-brand-700 dark:text-brand-300" size={20} /></div><CampaignSummary campaign={campaign} actionLabel="See campaign" onAction={() => navigate('fundraisers')} /></div>
      <article className="surface-card p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><div><p className="section-kicker">LATEST NOTICE</p><h2 className="mt-1 font-display text-base font-bold">{latestNotice?.category || 'Estate updates'}</h2></div><span className="size-2 rounded-full bg-brand-600" /></div>{latestNotice ? <><h3 className="text-sm font-semibold">{latestNotice.title}</h3><p className="mt-1.5 text-sm leading-6 text-muted">{latestNotice.text}</p><p className="mt-3 text-xs font-medium text-muted">{latestNotice.date}<span className="px-1">·</span>{latestNotice.time}</p></> : <p className="text-sm text-muted">There are no published notices at the moment.</p>}<button className="secondary-button mt-3" onClick={() => navigate('notices')}>All notices<FiArrowRight size={15} /></button></article>
    </section>
    <section className="mt-6 grid gap-3 sm:grid-cols-3"><StatCard icon={FiUsers} label="Neighbours here" value="128 households" detail="Pavilion Court resident community" /><StatCard icon={FiActivity} label="Community raised" value="KSh 42,600" detail="Courtyard garden campaign" /><StatCard icon={FiTool} label="Open reports" value={String(openReports).padStart(2, '0')} detail="Being followed up by the team" /></section>
    <section className="mt-8"><SectionHeading kicker="FROM YOUR NEIGHBOURS" title="Recently shared" action="Explore marketplace" onAction={() => navigate('marketplace')} /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{listings.slice(0, 4).map((listing) => <ListingCard key={listing.id} listing={listing} saved={savedIds.includes(listing.id)} onSave={() => toggleSaved(listing.id)} onContact={() => notify('Seller contact is not connected in this preview.')} />)}</div></section>
    <section className="mt-7 grid gap-3 sm:grid-cols-2"><QuickLink title="Have an item or service to share?" text="Add it to the resident marketplace." action="Browse marketplace" onClick={() => navigate('marketplace')} /><QuickLink title="Something needs attention?" text="Let the estate team know about a repair or concern." action="View issue reports" onClick={() => navigate('issues')} /></section>
  </>
}

function QuickLink({ title, text, action, onClick }) {
  return <article className="surface-card flex flex-wrap items-center gap-3 p-4"><span className="grid size-9 place-items-center rounded-lg bg-soft text-brand-700 dark:bg-night-soft dark:text-brand-300"><FiArrowRight size={16} /></span><div className="min-w-0 flex-1"><b className="block text-sm">{title}</b><p className="mt-1 text-xs leading-5 text-muted">{text}</p></div><button className="secondary-button w-full sm:w-auto" onClick={onClick}>{action}<FiArrowRight size={15} /></button></article>
}
