import { FiMapPin, FiPlus } from 'react-icons/fi'

export function LocationsPage({ locations, navigate }) {
  return <section className="grid gap-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted">Manage the blocks and streets used for household addresses.</p><button className="primary-button" onClick={() => navigate('location-new')}><FiPlus size={15} />Add block or street</button></div>
    <div className="surface-card divide-y divide-line overflow-hidden dark:divide-night-line">{locations.length ? locations.map((location) => <article key={location.id} className="flex items-center gap-3 p-4 sm:px-5"><span className="grid size-9 place-items-center rounded-lg bg-soft text-brand-700 dark:bg-night-soft dark:text-brand-300"><FiMapPin size={17} /></span><div><h2 className="text-sm font-semibold">{location.name}</h2><p className="mt-1 text-xs text-muted">{location.type}</p></div></article>) : <p className="p-5 text-sm text-muted">No blocks or streets have been added yet.</p>}</div>
  </section>
}
