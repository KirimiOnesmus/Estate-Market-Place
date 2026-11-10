import { useState } from 'react'
import { FiBookmark, FiChevronLeft, FiChevronRight, FiTag } from 'react-icons/fi'
import { formatMoney } from '../../../data/previewData.js'

export function ListingCard({ listing, saved, onSave, onView }) {
  const [imageIndex, setImageIndex] = useState(0)
  const images = listing.images || []
  const initials = listing.initials || (listing.owner || 'Resident').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  const move = (direction) => setImageIndex((index) => (index + direction + images.length) % images.length)
  return <article className="surface-card min-w-0 overflow-hidden transition-shadow hover:shadow-lift">
    <div className="relative bg-soft dark:bg-night-soft">
      {images.length ? <img src={images[imageIndex]} alt={`${listing.title}, photo ${imageIndex + 1} of ${images.length}`} className="aspect-[4/3] w-full object-cover" /> : <div className="grid aspect-[4/3] place-items-center text-muted"><FiTag size={28} /></div>}
      {images.length > 1 && <><button type="button" className="absolute left-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow" aria-label="Previous photo" onClick={() => move(-1)}><FiChevronLeft size={18} /></button><button type="button" className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow" aria-label="Next photo" onClick={() => move(1)}><FiChevronRight size={18} /></button><span className="absolute bottom-2 right-2 rounded-md bg-ink/75 px-2 py-1 text-[10px] font-semibold text-white">{imageIndex + 1} / {images.length}</span></>}
    </div>
    <div className="p-4"><div className="flex items-center justify-between gap-2"><p className="section-kicker">{listing.category}</p>{listing.isMine && <span className="status-pill status-info">Your listing</span>}</div><button type="button" className="mt-1 block w-full text-left text-sm font-bold hover:text-brand-700 dark:hover:text-brand-300" onClick={onView}>{listing.title}</button><div className="mt-3 flex items-center justify-between gap-2"><b className="text-sm text-brand-800 dark:text-brand-300">{formatMoney(listing.price)}</b><span className="text-[11px] text-muted">{listing.quantity ?? 1} available</span></div><div className="mt-3 flex items-center gap-2 border-t border-line pt-3 dark:border-night-line"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-100">{initials || 'R'}</span><span className="min-w-0 flex-1"><b className="block truncate text-xs">{listing.owner}</b><small className="block truncate text-[11px] text-muted">{listing.unit || 'Estate resident'}</small></span><button type="button" className="icon-button size-9" aria-label={saved ? `Remove ${listing.title} from saved items` : `Save ${listing.title}`} aria-pressed={saved} onClick={onSave}><FiBookmark size={16} fill={saved ? 'currentColor' : 'none'} /></button></div><button type="button" className="secondary-button mt-3 w-full" onClick={onView}>View item details</button></div>
  </article>
}
