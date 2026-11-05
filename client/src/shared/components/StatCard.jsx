export function StatCard({ icon: Icon, label, value, detail }) {
  return <article className="surface-card flex items-start gap-3 p-4"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-soft text-brand-700 dark:bg-night-soft dark:text-brand-300"><Icon size={17} /></span><div className="min-w-0"><p className="text-xs font-medium text-muted">{label}</p><b className="mt-1 block font-display text-lg font-bold tracking-tight">{value}</b><small className="mt-1 block text-[11px] leading-4 text-muted">{detail}</small></div></article>
}
