import { useEffect, useState } from 'react'
import { FiAlertCircle, FiCheck, FiClock } from 'react-icons/fi'
import { api } from '../../../api.js'

export function DecisionHistoryPage() {
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let current = true
    api.listCommitteeHistory().then((items) => {
      if (current) { setEvents(items); setStatus('ready'); setError('') }
    }).catch((requestError) => {
      if (current) { setError(requestError.message); setStatus('error') }
    })
    return () => { current = false }
  }, [refresh])

  return <section className="w-full"><div className="surface-card p-4 sm:p-6"><p className="section-kicker">AUDIT TRAIL</p><h2 className="mt-1.5 font-display text-lg font-bold">Committee decisions</h2>{status === 'loading' && <p className="mt-4 text-sm text-muted">Loading decision history…</p>}{status === 'error' && <div className="mt-4"><p className="text-sm text-red-700">{error}</p><button className="secondary-button mt-3" onClick={() => { setStatus('loading'); setRefresh((value) => value + 1) }}>Try again</button></div>}{status === 'ready' && <div className="mt-3 divide-y divide-line dark:divide-night-line">{events.length ? events.map((entry) => { const rejection = entry.action.includes('REJECTED'); const label = entry.action.replaceAll('_', ' ').toLowerCase(); const when = new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.createdAt)); return <article key={entry.id} className="flex gap-3 py-4 first:pt-2 last:pb-1"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-100">{entry.actor.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><div className="min-w-0 flex-1"><p className="text-sm"><b>{entry.actor}</b> <span className="text-muted">{label}</span> <b>{entry.target}</b></p>{entry.reason && <p className="mt-2 rounded-lg bg-soft px-3 py-2 text-xs text-muted dark:bg-night-soft">Reason: {entry.reason}</p>}<span className="mt-1.5 flex items-center gap-1.5 text-xs text-muted"><FiClock size={13} />{when}</span></div><span className="grid size-7 shrink-0 place-items-center rounded-full bg-soft text-brand-700 dark:bg-night-soft dark:text-brand-300">{rejection ? <FiAlertCircle size={14} /> : <FiCheck size={14} />}</span></article> }) : <p className="py-5 text-sm text-muted">No campaign or election decisions have been recorded yet.</p>}</div>}</div></section>
}
