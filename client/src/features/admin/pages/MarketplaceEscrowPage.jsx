import { useState } from 'react'
import { FiCheckCircle, FiRefreshCw, FiShield } from 'react-icons/fi'
import { formatMoney } from '../../../data/previewData.js'

export function MarketplaceEscrowPage({ orders, b2cAvailable, loading, error, onRetry, onRelease }) {
  const [references, setReferences] = useState({})
  const [savingId, setSavingId] = useState('')
  const [actionError, setActionError] = useState('')
  const release = async (order) => { setSavingId(order.id); setActionError(''); try { await onRelease(order.id, references[order.id] || '') } catch (requestError) { setActionError(requestError.message) } finally { setSavingId('') } }
  if (loading) return <section className="surface-card p-5 text-sm text-muted">Loading marketplace payments…</section>
  return <section className="grid gap-4">
    <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm leading-6 text-brand-950 dark:border-brand-900 dark:bg-brand-950/30 dark:text-brand-100"><FiShield className="mt-1 shrink-0" size={17} /><p>Buyer payments are collected by M-Pesa STK. When Safaricom confirms payment, B2C sends the sale amount to the seller phone saved on the listing. {b2cAvailable ? 'Failed transfers can be retried or reconciled here.' : 'Configure the Safaricom B2C payout credentials to enable automatic seller payments.'}</p></div>
    {error && <div className="surface-card flex items-center justify-between gap-3 p-4 text-sm"><span>{error}</span><button className="secondary-button" onClick={onRetry}><FiRefreshCw size={14} />Retry</button></div>}
    {actionError && <p className="field-error" role="alert">{actionError}</p>}
    {orders.length ? orders.map((order) => {
      const actionable = ['ESCROW_HELD', 'RELEASE_REQUESTED', 'PAYOUT_FAILED', 'PAYOUT_REVIEW_REQUIRED'].includes(order.status)
      const awaiting = ['PAYOUT_PENDING', 'PAYOUT_INITIATING'].includes(order.status)
      return <article key={order.id} className="surface-card grid gap-4 p-4 sm:p-5">
        <header className="flex flex-wrap items-start justify-between gap-2"><div><p className="section-kicker">{order.reference}</p><h2 className="mt-1 font-bold">{order.title}</h2><p className="mt-1 text-xs text-muted">{order.quantity} item{order.quantity === 1 ? '' : 's'} · {formatMoney(order.amount)} · {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</p></div><span className={`status-pill ${['ESCROW_HELD', 'RELEASE_REQUESTED', 'RELEASED'].includes(order.status) ? 'status-done' : ['REVIEW_REQUIRED', 'PAYOUT_REVIEW_REQUIRED', 'PAYOUT_FAILED'].includes(order.status) ? 'status-warning' : 'status-info'}`}>{order.status.replaceAll('_', ' ')}</span></header>
        <div className="grid gap-3 border-t border-line pt-3 text-sm dark:border-night-line sm:grid-cols-2"><Info label="Buyer">{order.buyer}</Info><Info label="Seller">{order.seller} · {order.sellerPhone || 'No phone recorded'}</Info><Info label="M-Pesa receipt">{order.receiptNumber || 'Awaiting payment confirmation'}</Info><Info label="Seller M-Pesa receipt">{order.payoutReference || (awaiting ? 'Awaiting Safaricom confirmation' : 'Not paid yet')}</Info>{order.message && <Info label="Payment update">{order.message}</Info>}</div>
        {actionable && <div className="flex flex-col gap-2 border-t border-line pt-3 dark:border-night-line sm:flex-row">{(!b2cAvailable || order.status === 'PAYOUT_REVIEW_REQUIRED') && <input className="form-control" placeholder="Safaricom payout receipt" value={references[order.id] || ''} onChange={(event) => setReferences((current) => ({ ...current, [order.id]: event.target.value }))} />}<button className="primary-button shrink-0" disabled={savingId === order.id || ((!b2cAvailable || order.status === 'PAYOUT_REVIEW_REQUIRED') && (references[order.id] || '').trim().length < 3)} onClick={() => release(order)}><FiCheckCircle size={15} />{savingId === order.id ? 'Working…' : b2cAvailable && order.status !== 'PAYOUT_REVIEW_REQUIRED' ? 'Retry seller M-Pesa payout' : 'Record reconciled payout'}</button></div>}
      </article>
    }) : <article className="surface-card p-7 text-center"><h2 className="font-bold">No marketplace orders yet</h2><p className="mt-1 text-sm text-muted">Orders and payment status will appear here.</p></article>}
  </section>
}

function Info({ label, children }) { return <div><p className="section-kicker">{label}</p><p className="mt-1 font-medium">{children}</p></div> }
