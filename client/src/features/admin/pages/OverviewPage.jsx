import { useMemo, useState } from 'react'
import { FiArrowRight, FiBell, FiMapPin, FiTool, FiUserCheck, FiUsers } from 'react-icons/fi'
import { StatCard } from '../../../shared/components/StatCard.jsx'
import { PageSkeleton } from '../../../shared/components/LoadingSkeleton.jsx'
import { ResidentDirectoryList } from '../components/ResidentDirectoryList.jsx'

export function AdminOverviewPage({ overview, residents = [], residentRequests = [], notices = [], reports = [], loading = false, error = '', onRetry, navigate, onResidentSelect }) {
  const [householdFilter, setHouseholdFilter] = useState('approved')
  const recentResidents = useMemo(() => [...residents].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)), [residents])
  const recentRequests = useMemo(() => [...residentRequests].sort((a, b) => new Date(b.submitted || 0) - new Date(a.submitted || 0)), [residentRequests])
  const recentNotices = useMemo(() => [...notices].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)), [notices])
  const recentReports = useMemo(() => [...reports].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)), [reports])
  if (loading) return <PageSkeleton label="Loading estate admin overview" />
  if (error) return <section className="surface-card p-5"><p className="text-sm text-red-700">{error}</p><button className="secondary-button mt-3" onClick={onRetry}>Try again</button></section>

  const approved = householdFilter === 'approved'
  const currentHouseholds = approved ? recentResidents : recentRequests
  const displayedHouseholds = currentHouseholds.slice(0, 3)
  const moreHouseholds = Math.max(0, currentHouseholds.length - displayedHouseholds.length)
  return <section className="grid gap-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard icon={FiUsers} label="Registered households" value={String(overview?.verifiedHouseholds ?? residents.length)} detail={`${overview?.householdMembers ?? residents.reduce((sum, resident) => sum + Number(resident.householdSize || 0), 0)} people in the directory`} />
      <StatCard icon={FiUserCheck} label="Pending registrations" value={String(overview?.pendingRegistrations ?? residentRequests.length)} detail="Households awaiting verification" />
      <StatCard icon={FiMapPin} label="Active blocks and streets" value={String(overview?.activeLocations ?? 0)} detail="Available for household registration" />
    </div>

    <article className="surface-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 dark:border-night-line sm:px-5 sm:py-4">
        <div><p className="section-kicker">ESTATE DIRECTORY</p><h2 className="mt-1 text-base font-bold">Resident households</h2><p className="mt-1 text-xs text-muted">Most recent {approved ? 'approved households' : 'requests awaiting approval'}</p></div>
        <div className="flex flex-wrap gap-2"><button className="secondary-button" onClick={() => navigate('residents')}>View directory<FiArrowRight size={14} /></button><button className="primary-button" onClick={() => navigate('resident-new')}>Add resident</button></div>
      </div>
      <div className="flex gap-2 border-b border-line px-4 py-3 dark:border-night-line sm:px-5"><button type="button" aria-pressed={approved} className={approved ? 'primary-button min-h-9 px-3' : 'secondary-button min-h-9 px-3'} onClick={() => setHouseholdFilter('approved')}>Approved <span className="opacity-75">{residents.length}</span></button><button type="button" aria-pressed={!approved} className={!approved ? 'primary-button min-h-9 px-3' : 'secondary-button min-h-9 px-3'} onClick={() => setHouseholdFilter('pending')}>Not approved <span className="opacity-75">{residentRequests.length}</span></button></div>
      {approved
        ? <ResidentDirectoryList residents={displayedHouseholds} compact onSelect={onResidentSelect} />
        : displayedHouseholds.length ? <div className="divide-y divide-line dark:divide-night-line">{displayedHouseholds.map((request) => <article key={request.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"><div><h3 className="text-sm font-semibold">{request.name}</h3><p className="mt-1 text-xs text-muted">{request.unit} · {request.phone}</p></div><span className="status-pill status-warning">Awaiting approval</span></article>)}</div>
          : <p className="p-5 text-sm text-muted">No registration requests are waiting for review.</p>}
      {moreHouseholds > 0 && <p className="border-t border-line px-4 py-3 text-xs text-muted dark:border-night-line sm:px-5">+{moreHouseholds} more {approved ? 'households' : 'requests'}</p>}
      {!approved && residentRequests.length > 0 && <div className="border-t border-line px-4 py-3 dark:border-night-line sm:px-5"><button className="text-link" onClick={() => navigate('resident-approvals')}>Review registration requests<FiArrowRight size={14} /></button></div>}
    </article>

    <div className="grid gap-5 lg:grid-cols-2">
      <RecentItems icon={FiBell} title="Recent notices" items={recentNotices} empty="No notices have been published yet." label="View all notices" onView={() => navigate('notices')} getDescription={(item) => item.category} getDate={(item) => `${item.date}${item.time ? ` · ${item.time}` : ''}`} />
      <RecentItems icon={FiTool} title="Recent issue reports" items={recentReports} empty="No resident reports have been submitted yet." label="View all reports" onView={() => navigate('issues')} getDescription={(item) => `${item.category} · ${item.status}`} getDate={(item) => item.updated} />
    </div>
  </section>
}

function RecentItems({ icon: Icon, title, items, empty, label, onView, getDescription, getDate }) {
  return <article className="surface-card overflow-hidden">
    <header className="flex items-center justify-between gap-3 border-b border-line p-4 dark:border-night-line sm:px-5"><div className="flex items-center gap-2"><Icon className="text-brand-700 dark:text-brand-300" size={17} /><h2 className="text-sm font-bold">{title}</h2></div><button className="text-link" onClick={onView}>{label}<FiArrowRight size={13} /></button></header>
    {items.length ? <div className="divide-y divide-line dark:divide-night-line">{items.slice(0, 3).map((item) => <article key={item.id} className="px-4 py-3 sm:px-5"><h3 className="text-sm font-semibold">{item.title}</h3><p className="mt-1 text-xs text-muted">{getDescription(item)}</p>{getDate(item) && <p className="mt-1 text-[11px] text-muted">{getDate(item)}</p>}</article>)}</div> : <p className="p-5 text-sm text-muted">{empty}</p>}
    {items.length > 3 && <p className="border-t border-line px-4 py-2.5 text-xs text-muted dark:border-night-line sm:px-5">+{items.length - 3} more</p>}
  </article>
}
