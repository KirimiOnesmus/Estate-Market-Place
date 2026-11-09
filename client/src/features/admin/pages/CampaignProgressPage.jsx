import { useEffect, useState } from 'react'
import { FiArrowLeft, FiCalendar, FiHeart, FiTarget } from 'react-icons/fi'
import { api } from '../../../api.js'
import { formatMoney } from '../../../data/previewData.js'
import { PageSkeleton } from '../../../shared/components/LoadingSkeleton.jsx'

export function CampaignProgressPage({ campaign, navigate }) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!campaign?.id) return undefined
    let active = true
    api.listCampaignPayments(campaign.id)
      .then((items) => { if (active) setPayments(items) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Campaign payments could not be loaded.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [campaign?.id])

  if (!campaign) return <section className="surface-card p-5"><h2 className="font-bold">Campaign not found</h2><button className="secondary-button mt-4" onClick={() => navigate('campaigns')}><FiArrowLeft size={15} />Back to campaigns</button></section>
  if (loading) return <PageSkeleton label="Loading campaign payment history" />
  const percent = campaign.target > 0 ? Math.min(100, Math.round((campaign.raised / campaign.target) * 100)) : 0
  const pending = payments.filter((payment) => ['INITIATED', 'PENDING', 'REVIEW_REQUIRED'].includes(payment.status)).length
  return <section className="grid gap-4">
    <article className="surface-card p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="section-kicker">CAMPAIGN CONTRIBUTIONS</p><h2 className="mt-2 text-xl font-bold">{campaign.title}</h2><p className="mt-1 text-sm text-muted">{campaign.beneficiary}</p></div><span className="status-pill status-live">{campaign.status}</span></div><div className="mt-7 grid gap-4 sm:grid-cols-3"><Metric icon={FiHeart} label="Confirmed total" value={formatMoney(campaign.raised)} /><Metric icon={FiTarget} label="Fundraising target" value={formatMoney(campaign.target)} /><Metric icon={FiCalendar} label="Deadline" value={campaign.deadline} /></div><div className="mt-7 rounded-xl border border-line p-4 dark:border-night-line sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold">Confirmed progress</p><p className="mt-1 text-xs text-muted">{formatMoney(Math.max(0, campaign.target - campaign.raised))} remaining to reach the target</p></div><span className="text-lg font-bold text-brand-800 dark:text-brand-300">{percent}%</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-soft dark:bg-night-soft"><span className="block h-full rounded-full bg-brand-700 transition-[width]" style={{ width: `${percent}%` }} /></div></div><button className="secondary-button mt-6" onClick={() => navigate('campaigns')}><FiArrowLeft size={15} />Back to campaigns</button></article>
    <section className="surface-card overflow-hidden"><header className="border-b border-line p-4 dark:border-night-line sm:px-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="section-kicker">M-PESA STK PUSH</p><h2 className="mt-1 text-base font-bold">Contribution transactions</h2></div>{pending > 0 && <span className="status-pill status-warning">{pending} awaiting confirmation</span>}</div><p className="mt-1 text-xs leading-5 text-muted">Only Safaricom-confirmed payments count toward the raised total. Pending entries remain visible for reconciliation.</p></header>
      {error ? <p className="p-5 text-sm text-red-700">{error}</p> : payments.length ? <div className="overflow-x-auto"><table className="min-w-full divide-y divide-line text-left dark:divide-night-line"><thead className="bg-soft dark:bg-night-soft"><tr>{['Resident', 'Household', 'Phone', 'Date', 'Status', 'M-Pesa receipt', 'Amount'].map((label) => <th key={label} scope="col" className="whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted sm:px-5">{label}</th>)}</tr></thead><tbody className="divide-y divide-line dark:divide-night-line">{payments.map((payment) => <tr key={payment.id}><td className="whitespace-nowrap px-4 py-3 text-xs font-semibold sm:px-5">{payment.resident}</td><td className="whitespace-nowrap px-4 py-3 text-xs text-muted sm:px-5">{payment.unit}</td><td className="whitespace-nowrap px-4 py-3 text-xs text-muted sm:px-5">{payment.phone}</td><td className="whitespace-nowrap px-4 py-3 text-xs text-muted sm:px-5">{new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(payment.createdAt))}</td><td className="whitespace-nowrap px-4 py-3 text-xs sm:px-5"><Status status={payment.status} /></td><td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted sm:px-5">{payment.receiptNumber || '—'}</td><td className="whitespace-nowrap px-4 py-3 text-xs font-semibold sm:px-5">{formatMoney(payment.amount)}</td></tr>)}</tbody></table></div> : <p className="p-5 text-sm text-muted">No contribution requests have been made for this campaign yet.</p>}
    </section>
  </section>
}

function Metric({ icon: Icon, label, value }) { return <div className="rounded-lg bg-soft p-3.5 dark:bg-night-soft"><span className="flex items-center gap-2 text-xs text-muted"><Icon size={14} />{label}</span><b className="mt-2 block text-sm">{value}</b></div> }
function Status({ status }) { const tone = status === 'COMPLETED' ? 'status-done' : status === 'FAILED' ? 'status-info' : status === 'REVIEW_REQUIRED' ? 'status-warning' : 'status-info'; const label = ({ INITIATED: 'Starting', PENDING: 'Awaiting M-Pesa', COMPLETED: 'Confirmed', FAILED: 'Failed', REVIEW_REQUIRED: 'Review required' })[status] || status; return <span className={`status-pill ${tone}`}>{label}</span> }
