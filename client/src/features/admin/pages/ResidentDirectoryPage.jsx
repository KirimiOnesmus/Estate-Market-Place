import { useMemo, useState } from 'react'
import { FiCopy, FiExternalLink, FiMapPin, FiSearch, FiShield, FiUserCheck, FiUserPlus } from 'react-icons/fi'
import { ResidentDirectoryList } from '../components/ResidentDirectoryList.jsx'
import { PageSkeleton } from '../../../shared/components/LoadingSkeleton.jsx'
import { PaginationControls, PAGE_SIZE } from '../../../shared/components/PaginationControls.jsx'

export function ResidentDirectoryPage({ residents, requestCount, navigate, onSelect, onPasswordLink, onToggleAccess, loading = false, error = '', onRetry }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [setupLink, setSetupLink] = useState(null)
  const [linkBusy, setLinkBusy] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [copied, setCopied] = useState(false)
  const filtered = useMemo(() => residents.filter((resident) => `${resident.name} ${resident.phone} ${resident.unit} ${resident.occupancy}`.toLowerCase().includes(query.trim().toLowerCase())), [residents, query])
  const visibleResidents = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const reshareSetupLink = async (resident) => {
    setLinkBusy(true); setLinkError('')
    try { const result = await onPasswordLink(resident); setSetupLink({ name: resident.name, url: result.setupUrl }); setCopied(false) }
    catch (requestError) { setLinkError(requestError.message || 'A password setup link could not be generated.') }
    finally { setLinkBusy(false) }
  }
  if (loading) return <PageSkeleton label="Loading resident directory" />
  if (error) return <section className="surface-card p-5"><p className="text-sm text-red-700">{error}</p><button className="secondary-button mt-3" onClick={onRetry}>Try again</button></section>
  return <section className="grid gap-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="search-field max-w-xl"><FiSearch size={17} /><label htmlFor="resident-search" className="sr-only">Search resident directory</label><input id="resident-search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search name, phone, or unit" /></div>
      <div className="flex flex-wrap gap-2"><button className="primary-button" onClick={() => navigate('resident-new')}><FiUserPlus size={15} />Add resident</button><button className="secondary-button" onClick={() => navigate('locations')}><FiMapPin size={15} />Blocks & streets</button><button className="secondary-button" onClick={() => navigate('registration-link')}><FiUserPlus size={15} />Share registration link</button><button className="secondary-button" onClick={() => navigate('resident-approvals')}><FiUserCheck size={15} />Review requests{requestCount > 0 && <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] text-brand-800 dark:bg-brand-900 dark:text-brand-200">{requestCount}</span>}</button></div>
    </div>
    <div className="surface-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3 dark:border-night-line sm:px-5"><div><h2 className="text-sm font-bold">Verified residents</h2><p className="mt-1 text-xs text-muted">{filtered.length} of {residents.length} residents</p></div><FiShield className="text-brand-700 dark:text-brand-300" size={19} /></div>
      <ResidentDirectoryList residents={visibleResidents} onSelect={onSelect} onReshareSetupLink={reshareSetupLink} linkBusy={linkBusy} onToggleAccess={onToggleAccess} />
      <PaginationControls page={page} total={filtered.length} onPageChange={setPage} />
    </div>
    {linkError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{linkError}</p>}
    {setupLink && <article className="surface-card grid gap-3 p-4 sm:p-5"><div><p className="section-kicker">PASSWORD SETUP</p><h2 className="mt-1 text-sm font-bold">Share a fresh setup link with {setupLink.name}</h2><p className="mt-1 text-xs leading-5 text-muted">You can return to Residents and generate a new link any time before the resident completes setup. Each new link replaces the previous one and expires in 48 hours.</p></div><input className="form-control text-xs" aria-label="Password setup link" value={setupLink.url} readOnly onFocus={(event) => event.target.select()} /><div className="flex flex-wrap gap-2"><button type="button" className="secondary-button" onClick={async () => { try { await navigator.clipboard.writeText(setupLink.url); setCopied(true) } catch { setCopied(false) } }}><FiCopy size={14} />{copied ? 'Copied' : 'Copy link'}</button><a className="secondary-button" href={setupLink.url} target="_blank" rel="noreferrer"><FiExternalLink size={14} />Open link</a></div></article>}
    <p className="text-xs leading-5 text-muted">Resident contact and unit details are visible to estate administrators for membership management.</p>
  </section>
}
