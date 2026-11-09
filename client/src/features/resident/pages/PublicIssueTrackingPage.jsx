import { useState } from 'react'
import { FiArrowLeft, FiSearch, FiShield } from 'react-icons/fi'
import { api } from '../../../api.js'

export function PublicIssueTrackingPage() {
  const [referenceCode, setReferenceCode] = useState(() => new URLSearchParams(window.location.search).get('reference') || '')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    setLoading(true); setError(''); setReport(null)
    const normalized = referenceCode.trim().toUpperCase()
    try {
      const result = await api.trackIssueReport(normalized)
      setReport(result)
      const url = new URL(window.location.href)
      url.searchParams.set('reference', normalized)
      window.history.replaceState({}, '', url)
    } catch (requestError) {
      setError(requestError.response?.status === 429 ? 'Too many lookups. Try again in a little while.' : 'No report matches that reference code.')
    } finally { setLoading(false) }
  }
  const statusClass = report?.status === 'Resolved' ? 'status-done' : report?.status === 'In progress' ? 'status-warning' : 'status-info'
  return <main className="grid min-h-screen place-items-center bg-canvas px-4 py-10 text-ink dark:bg-night dark:text-night-ink">
    <section className="w-full max-w-xl">
      <a href="/login" className="secondary-button mb-4"><FiArrowLeft size={14} />Sign in</a>
      <div className="surface-card overflow-hidden">
        <header className="border-b border-line p-5 dark:border-night-line sm:p-7"><p className="section-kicker">ESTATE MARKET PLACE</p><h1 className="mt-2 font-display text-2xl font-bold">Track an estate report</h1><p className="mt-2 text-sm leading-6 text-muted">Enter the public reference code shared by the resident who submitted the report.</p></header>
        <form onSubmit={submit} className="grid gap-3 p-5 sm:p-7"><label htmlFor="issue-reference" className="field-label">Report reference</label><div className="flex flex-col gap-2 sm:flex-row"><input id="issue-reference" className="form-control min-w-0 flex-1 font-mono uppercase" value={referenceCode} onChange={(event) => setReferenceCode(event.target.value)} placeholder="ER-1234-ABCDEF012345" required maxLength={20} /><button className="primary-button" type="submit" disabled={loading}><FiSearch size={15} />{loading ? 'Looking up…' : 'Check status'}</button></div>{error && <p role="alert" className="field-error">{error}</p>}</form>
        {report && <article className="border-t border-line p-5 dark:border-night-line sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-xs font-bold tracking-wide">{report.referenceCode}</p><h2 className="mt-2 text-base font-bold">{report.title}</h2><p className="mt-1 text-xs text-muted">{report.category}</p></div><span className={`status-pill ${statusClass}`}>{report.status}</span></div><div className="mt-4 flex items-center gap-2 text-xs text-muted"><FiShield size={14} />Only the report status and public progress notes are shown.</div><h3 className="mt-5 border-t border-line pt-4 text-sm font-semibold dark:border-night-line">Progress updates</h3>{report.updates.length ? <ol className="mt-3 grid gap-3">{report.updates.slice().reverse().map((item, index) => <li key={`${item.createdAt}-${index}`} className="rounded-lg bg-soft p-3 dark:bg-night-soft"><p className="text-xs font-semibold">{item.status} · {new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.createdAt))}</p><p className="mt-1 text-sm leading-5 text-muted">{item.message}</p></li>)}</ol> : <p className="mt-2 text-sm text-muted">The estate team has received the report. No progress note has been added yet.</p>}</article>}
      </div>
    </section>
  </main>
}
