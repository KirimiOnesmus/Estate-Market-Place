import { useState } from 'react'
import { FiHome } from 'react-icons/fi'
import { Skeleton } from './LoadingSkeleton.jsx'

export function EstateLogo({ estate, size = 'size-10', className = '' }) {
  return <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-800 text-white ${size} ${className}`}>
    {estate?.logo ? <EstateImage key={estate.logo} src={estate.logo} name={estate.name} /> : <FiHome aria-hidden="true" size={19} />}
  </span>
}

function EstateImage({ src, name }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  return failed ? <FiHome aria-hidden="true" size={19} /> : <>
      {!loaded && <Skeleton className="absolute inset-0 rounded-none bg-white/20" />}
      <img src={src} alt={`${name || 'Estate'} logo`} className={`size-full object-contain p-1 ${loaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
    </>
}
