import { FiActivity, FiArrowRight, FiCheckCircle, FiClock, FiGrid, FiRefreshCw, FiUsers } from 'react-icons/fi'
import { StatCard } from '../../../shared/components/StatCard.jsx'

const dateTime = new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' })

export function SuperAdminOverviewPage({ overview, estates = [], loading, error, onRetry, navigate }) {
  const metrics = overview?.metrics

  return <section className="grid w-full gap-5">
    <div className="overflow-hidden rounded-2xl bg-brand-950 p-5 text-white shadow-lift sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-brand-200">SUPER ADMIN · PLATFORM OPERATIONS</p><h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Estate Market Place</h2><p className="mt-2 text-sm leading-6 text-white/70">A live view of estate workspaces, platform accounts, and activity across the service.</p></div>
        <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3.5 text-xs font-semibold text-white transition hover:bg-white/15" onClick={() => navigate('platform-estates')}>Manage estates <FiArrowRight size={14} /></button>
      </div>
    </div>

    {error && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200" role="alert"><span>{error}</span><button className="secondary-button min-h-9" onClick={onRetry}><FiRefreshCw size={14} />Retry</button></div>}

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={FiGrid} label="Estate workspaces" value={loading ? '—' : String(metrics?.estateCount ?? 0)} detail={loading ? 'Loading live data' : `${metrics?.activeEstates ?? 0} active · ${metrics?.suspendedEstates ?? 0} suspended`} />
      <StatCard icon={FiUsers} label="Platform accounts" value={loading ? '—' : String(metrics?.accountCount ?? 0)} detail={loading ? 'Loading live data' : `${metrics?.activeAccounts ?? 0} active accounts`} />
      <StatCard icon={FiCheckCircle} label="Active memberships" value={loading ? '—' : String(metrics?.activeMemberships ?? 0)} detail="Across active estate workspaces" />
      <StatCard icon={FiClock} label="Pending registrations" value={loading ? '—' : String(metrics?.pendingRegistrations ?? 0)} detail="Awaiting estate admin review" />
    </div>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
      <section className="surface-card overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 dark:border-night-line sm:px-5"><div><p className="section-kicker">LIVE WORKSPACES</p><h2 className="mt-1 font-display text-lg font-bold">Estates on the platform</h2></div><button className="text-link" onClick={() => navigate('platform-estates')}>View all <FiArrowRight size={14} /></button></header>
        {loading && estates.length === 0 ? <p className="px-5 py-8 text-sm text-muted">Loading estate workspaces…</p>
          : estates.length ? <div className="divide-y divide-line dark:divide-night-line">{estates.slice(0, 5).map((estate) => <article key={estate.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5"><div className="min-w-0"><p className="truncate text-sm font-semibold">{estate.name}</p><p className="mt-1 truncate text-xs text-muted">{estate.location}</p></div><span className={`status-pill ${estate.accessStatus === 'Active' ? 'status-done' : 'status-warning'}`}>{estate.accessStatus}</span></article>)}</div>
            : <div className="px-5 py-8"><p className="text-sm font-semibold">No estate workspaces yet</p><p className="mt-1 text-sm text-muted">Create an estate workspace to begin onboarding its community.</p><button className="primary-button mt-4" onClick={() => navigate('platform-estate-new')}>Add an estate</button></div>}
      </section>

      <section className="surface-card overflow-hidden">
        <header className="border-b border-line px-4 py-4 dark:border-night-line sm:px-5"><p className="section-kicker">PLATFORM AUDIT</p><h2 className="mt-1 font-display text-lg font-bold">Recent activity</h2></header>
        {loading && !overview ? <p className="px-5 py-8 text-sm text-muted">Loading platform activity…</p>
          : overview?.recentActivity?.length ? <ol className="divide-y divide-line dark:divide-night-line">{overview.recentActivity.map((event) => <li key={event.id} className="flex gap-3 px-4 py-4 sm:px-5"><span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-soft text-brand-700 dark:bg-night-soft dark:text-brand-300"><FiActivity size={15} /></span><div className="min-w-0"><p className="text-xs font-semibold leading-5">{formatAction(event.action)}</p><p className="mt-0.5 text-xs text-muted">{event.actor} · {event.entityType}</p><time className="mt-1 block text-[10px] text-muted" dateTime={event.createdAt}>{dateTime.format(new Date(event.createdAt))}</time></div></li>)}</ol>
            : <div className="px-5 py-8"><p className="text-sm font-semibold">No platform activity recorded</p><p className="mt-1 text-sm text-muted">Estate creation and other platform actions will appear here.</p></div>}
        <footer className="border-t border-line p-3 dark:border-night-line"><button className="text-link" onClick={() => navigate('platform-audit')}>Open audit log <FiArrowRight size={14} /></button></footer>
      </section>
    </div>
  </section>
}

function formatAction(action = '') {
  return action.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}
