import { useMemo, useState } from 'react'
import { FiSearch, FiShield, FiX } from 'react-icons/fi'
import { listingCategories } from '../../../data/previewData.js'
import { EmptyState } from '../../../shared/components/EmptyState.jsx'
import { ListingCard } from '../components/ListingCard.jsx'

export function MarketplacePage({ listings, savedIds, toggleSaved, onCreate, notify, onView, onCart, cartCount = 0 }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All listings')
  const filtered = useMemo(() => listings.filter((listing) => `${listing.title} ${listing.category} ${listing.owner}`.toLowerCase().includes(query.toLowerCase()) && (category === 'All listings' || listing.category === category)), [listings, query, category])
  return <section>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="search-field"><FiSearch size={17} /><label htmlFor="market-search" className="sr-only">Search listings</label><input id="market-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search items and services" />{query && <button className="grid size-9 place-items-center rounded-lg hover:bg-soft dark:hover:bg-night-soft" aria-label="Clear search" onClick={() => setQuery('')}><FiX size={16} /></button>}</div><div className="flex flex-wrap gap-2"><button className="secondary-button flex-1 sm:flex-none" onClick={onCart}>Cart{cartCount > 0 && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] text-brand-800">{cartCount}</span>}</button><button className="primary-button flex-1 sm:flex-none" onClick={onCreate}>Create a listing</button></div></div>
    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="hidden flex-wrap gap-2 sm:flex">{listingCategories.map((item) => <button key={item} aria-pressed={category === item} onClick={() => setCategory(item)} className={`min-h-10 rounded-lg border px-3.5 text-xs font-medium ${category === item ? 'border-brand-800 bg-brand-800 text-white' : 'border-line bg-panel text-muted hover:bg-soft dark:border-night-line dark:bg-night-panel dark:hover:bg-night-soft'}`}>{item}</button>)}</div><label className="sm:hidden"><span className="sr-only">Filter listings by category</span><select className="select-field w-full" value={category} onChange={(event) => setCategory(event.target.value)}>{listingCategories.map((item) => <option key={item}>{item}</option>)}</select></label><span className="text-xs text-muted">{filtered.length} listings</span></div>
    {filtered.length ? <div className="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{filtered.map((listing) => <ListingCard key={listing.id} listing={listing} saved={savedIds.includes(listing.id)} onSave={() => toggleSaved(listing.id)} onContact={() => notify('Seller contact is not connected in this preview.')} onView={() => onView(listing)} />)}</div> : <EmptyState icon={FiSearch} title="No listings found" text="Try another search or category." action="Clear filters" onAction={() => { setQuery(''); setCategory('All listings') }} />}
    <p className="mt-5 flex items-center gap-2 text-xs text-muted"><FiShield className="text-brand-700 dark:text-brand-300" size={15} />Listings are shared by verified Pavilion Court residents.</p>
  </section>
}
