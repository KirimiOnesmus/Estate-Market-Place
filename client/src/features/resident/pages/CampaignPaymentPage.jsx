import { useEffect, useState } from 'react'
import { FiArrowLeft, FiCheckCircle, FiClock, FiCreditCard } from 'react-icons/fi'
import { api } from '../../../api.js'
import { formatMoney } from '../../../data/previewData.js'
import { PageSkeleton } from '../../../shared/components/LoadingSkeleton.jsx'

const reservedStatuses = new Set(['INITIATED', 'PENDING', 'COMPLETED', 'REVIEW_REQUIRED'])
const statusLabels = { INITIATED: 'Starting payment', PENDING: 'Awaiting M-Pesa', COMPLETED: 'Paid', FAILED: 'Failed', REVIEW_REQUIRED: 'Needs review' }

export function CampaignPaymentPage({ campaign, resident, navigate, onPaymentConfirmed }) {
  const [phone, setPhone] = useState(resident?.phone || '')
  const [amount, setAmount] = useState('')
  const [payments, setPayments] = useState([])
  const [loadingPayments, setLoadingPayments] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!campaign?.id) return undefined
    let active = true
    api.listMyCampaignPayments(campaign.id)
      .then((items) => { if (active) setPayments(items) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Payment history could not be loaded.') })
      .finally(() => { if (active) setLoadingPayments(false) })
    return () => { active = false }
  }, [campaign?.id])

  const outstanding = campaign?.beneficiaryType === 'estate'
    ? Math.max(0, Number(campaign.householdContribution || 0) - payments.filter((payment) => reservedStatuses.has(payment.status)).reduce((sum, payment) => sum + payment.amount, 0))
    : null
  const trackedPaymentId = payments.find((payment) => ['INITIATED', 'PENDING'].includes(payment.status))?.id

  useEffect(() => {
    if (!campaign?.id || !trackedPaymentId) return undefined
    let active = true
    const poll = async () => {
      try {
        const refreshed = await api.getMyCampaignPayment(campaign.id, trackedPaymentId)
        if (!active) return
        setPayments((items) => items.map((item) => item.id === refreshed.id ? refreshed : item))
        if (refreshed.status === 'COMPLETED') { setNotice('M-Pesa payment confirmed. Your campaign contribution has been recorded.'); onPaymentConfirmed?.() }
        if (refreshed.status === 'FAILED') setNotice('M-Pesa did not complete this payment. You can try again.')
      } catch { /* Keep the last known payment status while the API is temporarily unavailable. */ }
    }
    const timer = window.setInterval(poll, 5000)
    return () => { active = false; window.clearInterval(timer) }
  }, [campaign?.id, trackedPaymentId, onPaymentConfirmed])

  if (!campaign) return <section className="surface-card p-5"><h2 className="font-bold">Campaign not found</h2><button className="secondary-button mt-4" onClick={() => navigate('fundraisers')}><FiArrowLeft size={15} />Back to giving</button></section>
  if (loadingPayments) return <PageSkeleton label="Loading contribution history" />

  const submit = async (event) => {
    event.preventDefault(); setError(''); setNotice('')
    const numericAmount = Number(amount)
    if (!Number.isInteger(numericAmount) || numericAmount < 1) { setError('Enter a whole amount in Kenyan shillings.'); return }
    if (outstanding !== null && numericAmount > outstanding) { setError(`Your remaining household balance is ${formatMoney(outstanding)}.`); return }
    setSending(true)
    try {
      const payment = await api.createCampaignPayment(campaign.id, { amount: numericAmount, phone })
      setPayments((items) => [payment, ...items.filter((item) => item.id !== payment.id)])
      setAmount('')
      setNotice(payment.message || 'Payment prompt sent. Check your phone and approve it with your M-Pesa PIN.')
    } catch (requestError) {
      setError(requestError.message || 'The M-Pesa payment request could not be started.')
      try {
        const history = await api.listMyCampaignPayments(campaign.id)
        setPayments(history)
      } catch { /* Keep the previous history if the payment history endpoint is unavailable. */ }
    } finally { setSending(false) }
  }

  const paid = payments.filter((payment) => payment.status === 'COMPLETED').reduce((sum, payment) => sum + payment.amount, 0)
  const hasReviewRequired = payments.some((payment) => payment.status === 'REVIEW_REQUIRED')
  return <section className="grid w-full gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(300px,.8fr)]">
    <article className="surface-card overflow-hidden">
      <header className="border-b border-line p-4 dark:border-night-line sm:p-5"><button className="secondary-button mb-4" onClick={() => navigate('fundraisers')}><FiArrowLeft size={14} />Back to giving</button><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="section-kicker">{campaign.beneficiaryType === 'estate' ? 'HOUSEHOLD ASSESSMENT' : 'COMMUNITY FUNDRAISER'}</p><h2 className="mt-1.5 text-lg font-bold">{campaign.title}</h2><p className="mt-1 text-sm text-muted">Beneficiary: {campaign.beneficiary}</p></div><span className="status-pill status-live">{campaign.status}</span></div></header>
      <div className="p-4 sm:p-5"><p className="text-sm leading-6 text-muted">{campaign.purpose}</p><div className="mt-5 grid grid-cols-2 gap-3">{campaign.beneficiaryType === 'estate' ? <><Metric label="Household contribution" value={formatMoney(campaign.householdContribution)} /><Metric label="Paid by this household" value={formatMoney(paid)} /><Metric label="Balance remaining" value={formatMoney(outstanding)} /><Metric label="Campaign total received" value={formatMoney(campaign.raised)} /></> : <><Metric label="Campaign target" value={formatMoney(campaign.target)} /><Metric label="Confirmed contributions" value={formatMoney(campaign.raised)} /><Metric label="Your contributions" value={formatMoney(paid)} /><Metric label="Contributors" value={String(campaign.contributors || 0)} /></>}</div>
        <h3 className="mt-6 text-sm font-semibold">Your payment history</h3><div className="mt-2 divide-y divide-line dark:divide-night-line">{payments.length ? payments.map((payment) => <article key={payment.id} className="flex flex-wrap items-center gap-3 py-3"><span className={`grid size-8 place-items-center rounded-full ${payment.status === 'COMPLETED' ? 'bg-green-soft text-green-800' : payment.status === 'FAILED' ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200'}`}>{payment.status === 'COMPLETED' ? <FiCheckCircle size={16} /> : <FiClock size={16} />}</span><span className="min-w-0 flex-1"><b className="block text-xs">{statusLabels[payment.status] || payment.status}</b><small className="text-[11px] text-muted">{new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(payment.createdAt))} · {payment.phone}{payment.receiptNumber ? ` · Receipt ${payment.receiptNumber}` : ''}</small>{payment.status === 'REVIEW_REQUIRED' && <small className="mt-1 block text-[11px] text-amber-800">The estate team is checking this payment. Please do not send it again yet.</small>}</span><b className="text-xs">{formatMoney(payment.amount)}</b></article>) : <p className="py-3 text-xs text-muted">No contributions recorded for you yet.</p>}</div>
      </div>
    </article>
    <aside className="surface-card h-fit p-4 sm:p-5"><p className="section-kicker">M-PESA STK PUSH</p><h2 className="mt-1.5 text-base font-bold">{campaign.beneficiaryType === 'estate' ? 'Pay your household contribution' : 'Contribute to this campaign'}</h2><p className="mt-1 text-xs leading-5 text-muted">Enter your M-Pesa number. Safaricom will send a secure payment prompt to your phone. Your contribution is recorded only after Safaricom confirms it.</p>{campaign.beneficiaryType === 'estate' && <p className="mt-3 rounded-lg bg-soft px-3 py-2.5 text-xs dark:bg-night-soft">Balance remaining: <b>{formatMoney(outstanding)}</b></p>}
      {hasReviewRequired && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">A previous request needs reconciliation. It is reserved against your household balance while the estate team checks it.</p>}
      <form className="mt-4 grid gap-3" onSubmit={submit}><div><label className="field-label" htmlFor="giving-phone">M-Pesa phone number</label><input id="giving-phone" className="form-control" type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0712 345 678" required /></div><div><label className="field-label" htmlFor="giving-amount">Amount (KSh)</label><input id="giving-amount" className="form-control" type="number" min="1" max={outstanding ?? undefined} step="1" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={outstanding !== null ? `Up to ${outstanding}` : 'Enter amount'} required /></div>{error && <p role="alert" className="field-error">{error}</p>}{notice && <p role="status" className="rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">{notice}</p>}<button type="submit" className="primary-button w-full" disabled={sending || (outstanding !== null && outstanding <= 0) || hasReviewRequired}><FiCreditCard size={15} />{sending ? 'Sending prompt…' : 'Send M-Pesa prompt'}</button></form>
      <p className="mt-5 border-t border-line pt-4 text-[11px] leading-5 text-muted dark:border-night-line">Never share your M-Pesa PIN. Do not submit another payment while a previous request is still awaiting confirmation.</p>
    </aside>
  </section>
}

function Metric({ label, value }) { return <div className="rounded-lg bg-soft p-3 dark:bg-night-soft"><span className="block text-[10px] font-medium text-muted">{label}</span><b className="mt-1 block text-sm">{value}</b></div> }
