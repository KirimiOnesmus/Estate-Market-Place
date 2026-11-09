import { useMemo, useState } from 'react'
import { FiBookmark, FiSearch, FiShield, FiShoppingBag, FiX } from 'react-icons/fi'
import { listingCategories } from '../../../data/previewData.js'
import { EmptyState } from '../../../shared/components/EmptyState.jsx'
import { PageSkeleton } from '../../../shared/components/LoadingSkeleton.jsx'
import { ListingCard } from '../components/ListingCard.jsx'

const pageSize = 12

export function MarketplacePage({ listings, savedIds, toggleSaved, onCreate, onView, onCart, cartCount = 0, loading = false, error = '', onRetry }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All listings')
  const [sort, setSort] = useState('Newest first')
  const [savedOnly, setSavedOnly] = useState(false)
  const [page, setPage] = useState(1)
  const categories = useMemo(() => ['All listings', ...new Set([...listingCategories.slice(1), ...listings.map((listing) => listing.category).filter(Boolean)])], [listings])
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    const results = listings.filter((listing) => {
      const searchText = `${listing.title} ${listing.category} ${listing.owner} ${listing.unit} ${listing.description}`.toLowerCase()
      return (!term || searchText.includes(term))
        && (category === 'All listings' || listing.category === category)
        && (!savedOnly || savedIds.includes(listing.id))
    })
    return results.sort((a, b) => {
      if (sort === 'Price: low to high') return Number(a.price) - Number(b.price)
      if (sort === 'Price: high to low') return Number(b.price) - Number(a.price)
      if (sort === 'Name') return a.title.localeCompare(b.title)
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })
  }, [listings, query, category, savedOnly, savedIds, sort])
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageListings = filtered.slice((page - 1) * pageSize, page * pageSize)
  const resetFilters = () => { setQuery(''); setCategory('All listings'); setSavedOnly(false); setPage(1) }

  if (loading) return <PageSkeleton label="Loading marketplace listings" />
  if (error) return <section className="surface-card p-5"><h2 className="text-sm font-bold">Marketplace could not load</h2><p className="mt-1 text-sm text-muted">{error}</p><button className="secondary-button mt-3" onClick={onRetry}>Try again</button></section>

  return <section className="grid w-full content-start gap-5">
    <header className="surface-card flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200"><FiShoppingBag size={19} /></span><div><p className="section-kicker">BUY, SELL & SHARE</p><h2 className="mt-1 text-lg font-bold">Estate marketplace</h2><p className="mt-1 text-sm text-muted">Find items and services offered by verified neighbours.</p></div></div><div className="flex flex-wrap gap-2"><button className="secondary-button" onClick={onCart}>Cart{cartCount > 0 && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-200">{cartCount}</span>}</button><button className="primary-button" onClick={onCreate}>Create a listing</button></div></header>
    <article className="surface-card p-4 sm:p-5"><div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_200px_auto] lg:items-end"><label className="search-field min-w-0"><FiSearch size={16} /><span className="sr-only">Search listings</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search title, category, neighbour or location" />{query && <button type="button" className="grid size-8 place-items-center rounded-md hover:bg-soft dark:hover:bg-night-soft" aria-label="Clear search" onClick={() => { setQuery(''); setPage(1) }}><FiX size={15} /></button>}</label><label><span className="field-label">Sort by</span><select className="form-control" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1) }}><option>Newest first</option><option>Price: low to high</option><option>Price: high to low</option><option>Name</option></select></label><button type="button" className={`secondary-button ${savedOnly ? 'border-brand-700 text-brand-800 dark:border-brand-400 dark:text-brand-200' : ''}`} aria-pressed={savedOnly} onClick={() => { setSavedOnly((value) => !value); setPage(1) }}><FiBookmark size={14} fill={savedOnly ? 'currentColor' : 'none'} />Saved{savedIds.length > 0 && <span className="text-[10px]">{savedIds.length}</span>}</button></div>
      <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 dark:border-night-line sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap gap-2">{categories.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => { setCategory(item); setPage(1) }} className={`min-h-9 rounded-full border px-3 text-xs font-medium transition-colors ${category === item ? 'border-brand-800 bg-brand-800 text-white dark:border-brand-400 dark:bg-brand-400 dark:text-slate-950' : 'border-line text-muted hover:bg-soft dark:border-night-line dark:hover:bg-night-soft'}`}>{item}</button>)}</div><span className="shrink-0 text-xs text-muted">{filtered.length} {filtered.length === 1 ? 'listing' : 'listings'}</span></div>
    </article>
    {pageListings.length ? <div className="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{pageListings.map((listing) => <ListingCard key={listing.id} listing={listing} saved={savedIds.includes(listing.id)} onSave={() => toggleSaved(listing.id)} onView={() => onView(listing)} />)}</div> : <EmptyState icon={FiSearch} title={savedOnly && !savedIds.length ? 'No saved listings yet' : 'No listings found'} text={savedOnly && !savedIds.length ? 'Save an item to keep it handy here.' : 'Try another search or category.'} action="Clear filters" onAction={resetFilters} />}
    {filtered.length > pageSize && <footer className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-panel px-4 py-3 dark:border-night-line dark:bg-night-panel"><span className="text-xs text-muted">Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span><div className="flex items-center gap-2"><button type="button" className="secondary-button min-h-9" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button><span className="text-xs text-muted">Page {page} of {pageCount}</span><button type="button" className="secondary-button min-h-9" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</button></div></footer>}
    <p className="flex items-center gap-2 text-xs text-muted"><FiShield className="text-brand-700 dark:text-brand-300" size={15} />Listings are shared by verified residents in your estate.</p>
  </section>
}
