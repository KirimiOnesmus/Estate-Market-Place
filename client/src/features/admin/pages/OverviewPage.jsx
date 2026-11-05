import { FiArrowRight, FiBell, FiCreditCard, FiHeart, FiPlus, FiShoppingBag, FiTool, FiUsers } from 'react-icons/fi'
import { StatCard } from '../../../shared/components/StatCard.jsx'
import { PageSkeleton } from '../../../shared/components/LoadingSkeleton.jsx'
import { ResidentDirectoryList } from '../components/ResidentDirectoryList.jsx'

export function AdminOverviewPage({ reports, notices, residents, residentRequests, campaigns = [], listings = [], loading = false, navigate }) {
  if (loading) return <PageSkeleton label="Loading estate admin overview" />
  const openReports = reports.filter((report) => report.status !== 'Resolved').length
  const pendingCampaigns = campaigns.filter((campaign) => campaign.status === 'Pending committee approval').length
  const liveCampaigns = campaigns.filter((campaign) => campaign.status === 'Live')
  const liveRaised = liveCampaigns.reduce((sum, campaign) => sum + Number(campaign.raised || 0), 0)
  const pendingListings = listings.filter((listing) => listing.status === 'Pending review').length
  const householdMembers = residents.reduce((sum, resident) => sum + Number(resident.householdSize || 1), 0)

  return <section className="grid gap-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={FiUsers} label="Registered households" value={String(residents.length)} detail={`${householdMembers} people in the household directory`} />
      <StatCard icon={FiUsers} label="Pending registrations" value={String(residentRequests.length)} detail="Households awaiting verification" />
      <StatCard icon={FiTool} label="Open issue reports" value={String(openReports)} detail="Require an update or resolution" />
      <StatCard icon={FiHeart} label="Campaigns to review" value={String(pendingCampaigns)} detail="Waiting for committee decisions" />
    </div>
    <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
      <article className="surface-card p-4 sm:p-5">
        <p className="section-kicker">ESTATE HEALTH</p><h2 className="mt-1.5 font-display text-lg font-bold">Activity and funds</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric icon={FiCreditCard} label="Raised across live campaigns" value={formatMoney(liveRaised)} detail={`${liveCampaigns.length} active campaign${liveCampaigns.length === 1 ? '' : 's'}`} />
          <Metric icon={FiShoppingBag} label="Marketplace reviews" value={String(pendingListings)} detail="Listings awaiting moderation" />
          <Metric icon={FiBell} label="Published notices" value={String(notices.length)} detail="Visible to estate residents" />
          <Metric icon={FiUsers} label="Household size" value={String(householdMembers)} detail={`${residents.length} registered household${residents.length === 1 ? '' : 's'}`} />
        </div>
      </article>
      <article className="surface-card p-4 sm:p-5">
        <p className="section-kicker">NEEDS YOUR ATTENTION</p><h2 className="mt-1.5 font-display text-lg font-bold">Work queue</h2>
        <div className="mt-4 grid gap-2">
          <QueueLink title="Resident approvals" detail={`${residentRequests.length} requests are ready for review`} icon={FiUsers} onClick={() => navigate('resident-approvals')} />
          <QueueLink title="Campaign review" detail={`${pendingCampaigns} campaigns are with the committee`} icon={FiHeart} onClick={() => navigate('campaigns')} />
          <QueueLink title="Issue follow-up" detail={`${openReports} reports are still open`} icon={FiTool} onClick={() => navigate('issues')} />
          {pendingListings > 0 && <QueueLink title="Marketplace review" detail={`${pendingListings} listings need moderation`} icon={FiShoppingBag} onClick={() => navigate('marketplace-review')} />}
        </div>
      </article>
    </div>
    <article className="surface-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 dark:border-night-line sm:px-5 sm:py-4">
        <div><p className="section-kicker">ESTATE DIRECTORY</p><h2 className="mt-1 text-base font-bold">Resident directory</h2><p className="mt-1 text-xs text-muted">{residents.length} verified households</p></div>
        <div className="flex flex-wrap gap-2"><button className="secondary-button" onClick={() => navigate('residents')}>View directory<FiArrowRight size={14} /></button><button className="primary-button" onClick={() => navigate('resident-new')}><FiPlus size={15} />Add resident</button></div>
      </div>
      {residents.length ? <ResidentDirectoryList residents={residents.slice(0, 4)} compact /> : <p className="p-5 text-sm text-muted">No verified households yet.</p>}
    </article>
  </section>
}

function formatMoney(amount) { return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount) }

function Metric({ icon: Icon, label, value, detail }) { return <div className="rounded-lg border border-line p-3.5 dark:border-night-line"><div className="flex items-center gap-2 text-muted"><Icon size={15} /><span className="text-xs">{label}</span></div><b className="mt-2 block text-lg tabular-nums">{value}</b><small className="mt-1 block text-xs text-muted">{detail}</small></div> }

function QueueLink({ title, detail, icon: Icon, onClick }) {
  return <button className="flex min-h-14 items-center gap-3 rounded-lg border border-line px-3 text-left hover:bg-soft dark:border-night-line dark:hover:bg-night-soft" onClick={onClick}><span className="grid size-8 place-items-center rounded-md bg-soft text-brand-700 dark:bg-night-panel dark:text-brand-300"><Icon size={16} /></span><span className="min-w-0 flex-1"><b className="block text-sm">{title}</b><small className="text-xs text-muted">{detail}</small></span><FiArrowRight className="text-muted" size={16} /></button>
}
