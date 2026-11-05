export function Skeleton({ className = '' }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-700/70 motion-reduce:animate-none ${className}`} />
}

export function PageSkeleton({ variant = 'dashboard', label = 'Loading page' }) {
  return <section aria-label={label} aria-busy="true" className="grid w-full gap-5">
    {variant === 'dashboard' ? <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <article key={index} className="surface-card grid gap-3 p-4 sm:p-5"><Skeleton className="h-3 w-28" /><Skeleton className="h-8 w-20" /><Skeleton className="h-3 w-36" /></article>)}</div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,.6fr)]"><article className="surface-card grid gap-4 p-5"><Skeleton className="h-3 w-32" /><Skeleton className="h-6 w-48" /><Skeleton className="h-28 w-full" /></article><article className="surface-card grid gap-4 p-5"><Skeleton className="h-3 w-28" /><Skeleton className="h-5 w-full" /><Skeleton className="h-16 w-full" /></article></div>
    </> : variant === 'form' ? <article className="surface-card grid gap-5 p-5 sm:p-7"><Skeleton className="h-6 w-48" /><Skeleton className="h-3 w-72 max-w-full" /><div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 6 }, (_, index) => <div key={index} className="grid gap-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-11 w-full" /></div>)}</div><Skeleton className="h-10 w-32 justify-self-end" /></article> : <article className="surface-card grid gap-3 p-4 sm:p-5">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-14 w-full" />)}</article>}
    <span className="sr-only">{label}</span>
  </section>
}
