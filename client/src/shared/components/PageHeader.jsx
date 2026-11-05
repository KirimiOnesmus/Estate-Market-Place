export function PageHeader({ heading, action }) {
  const [eyebrow, title, description] = heading
  return <div className="mb-6 flex items-start justify-between gap-3 sm:mb-7"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.13em] text-brand-700 dark:text-brand-300">{eyebrow}</p><h1 className="font-display text-[26px] font-bold leading-tight tracking-[-.035em] text-ink dark:text-night-ink sm:text-[32px]">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p></div>{action && <button aria-label={action.label} className="primary-button mt-1 shrink-0 !px-3 sm:!px-4" onClick={action.onClick}><action.icon size={17} /><span className="hidden sm:inline">{action.label}</span></button>}</div>
}
