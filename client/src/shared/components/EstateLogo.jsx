import { useState } from 'react'
import { FiHome } from 'react-icons/fi'
import { Skeleton } from './LoadingSkeleton.jsx'

export function EstateLogo({ estate, size = 'size-10', className = '' }) {
  const [loaded, setLoaded] = useState(false)
  return <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-800 text-white ${size} ${className}`}>
    {estate?.logo ? <>
      {!loaded && <Skeleton className="absolute inset-0 rounded-none bg-white/20" />}
      <img src={estate.logo} alt={`${estate.name || 'Estate'} logo`} className={`size-full object-contain p-1 ${loaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setLoaded(true)} onError={() => setLoaded(false)} />
    </> : <FiHome aria-hidden="true" size={19} />}
  </span>
}
