import { useEffect, useState } from 'react'
import { FiArrowLeft, FiExternalLink } from 'react-icons/fi'
import { api } from '../../../api.js'

export function NotificationDetailsPage({ notificationId, onBack, onOpenDestination }) {
  const [item, setItem] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    api.getEstateNotification(notificationId).then((value) => { if (active) setItem(value) }).catch((requestError) => { if (active) setError(requestError.message) })
    return () => { active = false }
  }, [notificationId])
  if (error) return <article className="surface-card p-6"><p className="text-sm text-red-700" role="alert">{error}</p><button className="secondary-button mt-4" onClick={onBack}><FiArrowLeft size={15} />Back</button></article>
  if (!item) return <article className="surface-card p-6 text-sm text-muted" role="status">Loading notification…</article>
  return <article className="surface-card mx-auto max-w-3xl p-5 sm:p-8"><p className="section-kicker">ESTATE NOTIFICATION</p><h2 className="mt-2 text-xl font-bold">{item.title}</h2><p className="mt-2 text-xs text-muted">{new Intl.DateTimeFormat('en-KE', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(item.createdAt))}</p><p className="mt-6 whitespace-pre-wrap text-sm leading-7">{item.message}</p><div className="mt-7 flex flex-wrap gap-2"><button className="secondary-button" onClick={onBack}><FiArrowLeft size={15} />Back</button><button className="primary-button" onClick={() => onOpenDestination(item.linkPath)}><FiExternalLink size={15} />Open related page</button></div></article>
}
