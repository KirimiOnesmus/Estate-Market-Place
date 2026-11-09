import { useMemo, useState } from 'react'
import { FiMapPin, FiSearch, FiShield, FiUserCheck, FiUserPlus } from 'react-icons/fi'
import { ResidentDirectoryList } from '../components/ResidentDirectoryList.jsx'
import { PageSkeleton } from '../../../shared/components/LoadingSkeleton.jsx'
import { PaginationControls, PAGE_SIZE } from '../../../shared/components/PaginationControls.jsx'

export function ResidentDirectoryPage({ residents, requestCount, navigate, loading = false, error = '', onRetry }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const filtered = useMemo(() => residents.filter((resident) => `${resident.name} ${resident.phone} ${resident.unit} ${resident.occupancy}`.toLowerCase().includes(query.trim().toLowerCase())), [residents, query])
  const visibleResidents = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  if (loading) return <PageSkeleton label="Loading resident directory" />
  if (error) return <section className="surface-card p-5"><p className="text-sm text-red-700">{error}</p><button className="secondary-button mt-3" onClick={onRetry}>Try again</button></section>
  return <section className="grid gap-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="search-field max-w-xl"><FiSearch size={17} /><label htmlFor="resident-search" className="sr-only">Search resident directory</label><input id="resident-search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search name, phone, or unit" /></div>
      <div className="flex flex-wrap gap-2"><button className="primary-button" onClick={() => navigate('resident-new')}><FiUserPlus size={15} />Add resident</button><button className="secondary-button" onClick={() => navigate('locations')}><FiMapPin size={15} />Blocks & streets</button><button className="secondary-button" onClick={() => navigate('registration-link')}><FiUserPlus size={15} />Share registration link</button><button className="secondary-button" onClick={() => navigate('resident-approvals')}><FiUserCheck size={15} />Review requests{requestCount > 0 && <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] text-brand-800 dark:bg-brand-900 dark:text-brand-200">{requestCount}</span>}</button></div>
    </div>
    <div className="surface-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3 dark:border-night-line sm:px-5"><div><h2 className="text-sm font-bold">Verified residents</h2><p className="mt-1 text-xs text-muted">{filtered.length} of {residents.length} residents</p></div><FiShield className="text-brand-700 dark:text-brand-300" size={19} /></div>
      <ResidentDirectoryList residents={visibleResidents} />
      <PaginationControls page={page} total={filtered.length} onPageChange={setPage} />
    </div>
    <p className="text-xs leading-5 text-muted">Resident contact and unit details are visible to estate administrators for membership management.</p>
  </section>
}
