import { FiArrowRight, FiMapPin, FiUserCheck, FiUsers } from 'react-icons/fi'
import { StatCard } from '../../../shared/components/StatCard.jsx'
import { PageSkeleton } from '../../../shared/components/LoadingSkeleton.jsx'
import { ResidentDirectoryList } from '../components/ResidentDirectoryList.jsx'

export function AdminOverviewPage({ overview, residents = [], residentRequests = [], loading = false, error = '', onRetry, navigate }) {
  if (loading) return <PageSkeleton label="Loading estate admin overview" />
  if (error) return <section className="surface-card p-5"><p className="text-sm text-red-700">{error}</p><button className="secondary-button mt-3" onClick={onRetry}>Try again</button></section>

  return <section className="grid gap-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard icon={FiUsers} label="Registered households" value={String(overview?.verifiedHouseholds ?? residents.length)} detail={`${overview?.householdMembers ?? residents.reduce((sum, resident) => sum + Number(resident.householdSize || 0), 0)} people in the directory`} />
      <StatCard icon={FiUserCheck} label="Pending registrations" value={String(overview?.pendingRegistrations ?? residentRequests.length)} detail="Households awaiting verification" />
      <StatCard icon={FiMapPin} label="Active blocks and streets" value={String(overview?.activeLocations ?? 0)} detail="Available for household registration" />
    </div>
    <article className="surface-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 dark:border-night-line sm:px-5 sm:py-4">
        <div><p className="section-kicker">ESTATE DIRECTORY</p><h2 className="mt-1 text-base font-bold">Resident households</h2><p className="mt-1 text-xs text-muted">{residents.length} verified households</p></div>
        <div className="flex flex-wrap gap-2"><button className="secondary-button" onClick={() => navigate('residents')}>View directory<FiArrowRight size={14} /></button><button className="primary-button" onClick={() => navigate('registration-link')}>Invite a household</button></div>
      </div>
      {residents.length ? <ResidentDirectoryList residents={residents.slice(0, 5)} compact /> : <p className="p-5 text-sm text-muted">No verified households yet.</p>}
    </article>
    <article className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><p className="section-kicker">REGISTRATION REVIEW</p><h2 className="mt-1 font-bold">{residentRequests.length} request{residentRequests.length === 1 ? '' : 's'} awaiting review</h2><p className="mt-1 text-sm text-muted">Verify a household’s details before granting estate access.</p></div><button className="secondary-button" onClick={() => navigate('resident-approvals')}>Review registrations<FiArrowRight size={14} /></button></article>
  </section>
}
