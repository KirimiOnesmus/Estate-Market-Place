import { useEffect, useState } from 'react'
import { FiArrowLeft, FiCheckCircle, FiClock, FiShield } from 'react-icons/fi'
import { api } from '../../../api.js'
import { formatMoney } from '../../../data/previewData.js'

const labels = {
  PAYMENT_PENDING: 'M-Pesa payment pending',
  ESCROW_HELD: 'Payment received · sending to seller',
  RELEASE_REQUESTED: 'Delivery confirmed · payout pending',
  PAYOUT_INITIATING: 'Sending payment to seller',
  PAYOUT_PENDING: 'Seller payment processing',
  PAYOUT_FAILED: 'Seller payment needs review',
  PAYOUT_REVIEW_REQUIRED: 'Seller payment needs review',
  RELEASED: 'Payment sent to seller',
  PAYMENT_FAILED: 'M-Pesa payment not completed',
  REVIEW_REQUIRED: 'Payment needs review',
}

export function MarketplaceCheckoutPage({ orderId, onBack }) {
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    const refresh = () => api.getMarketplaceOrder(orderId).then((value) => { if (active) setOrder(value) }).catch((requestError) => { if (active) setError(requestError.message) })
    refresh()
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') refresh() }, 4000)
    return () => { active = false; window.clearInterval(timer) }
  }, [orderId])
  if (error && !order) return <section className="surface-card p-5"><p className="text-sm text-red-700" role="alert">{error}</p><button className="secondary-button mt-4" onClick={onBack}><FiArrowLeft size={15} />Back to marketplace</button></section>
  if (!order) return <section className="surface-card p-6 text-sm text-muted" role="status">Loading your order…</section>
  const completed = order.status === 'RELEASED'
  const paymentCleared = ['ESCROW_HELD', 'RELEASE_REQUESTED', 'PAYOUT_INITIATING', 'PAYOUT_PENDING', 'RELEASED'].includes(order.status)
  return <section className="mx-auto grid w-full max-w-3xl gap-4"><article className="surface-card p-5 sm:p-7">
    <div className="flex items-start gap-3"><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${completed ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200' : 'bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200'}`}>{completed ? <FiCheckCircle size={20} /> : <FiClock size={20} />}</span><div><p className="section-kicker">MARKETPLACE ORDER · {order.reference}</p><h2 className="mt-1 text-xl font-bold">{labels[order.status] || order.status}</h2><p className="mt-1 text-sm text-muted">{order.title} · {order.quantity} item{order.quantity === 1 ? '' : 's'}</p></div></div>
    <div className="mt-6 grid gap-3 border-t border-line pt-4 text-sm dark:border-night-line sm:grid-cols-2"><Detail label="Amount">{formatMoney(order.amount)}</Detail><Detail label="Your M-Pesa number">{order.phone}</Detail><Detail label="Your payment receipt">{order.receiptNumber || 'Waiting for Safaricom confirmation'}</Detail><Detail label="Seller payment receipt">{order.payoutReference || (completed ? 'Receipt not returned' : 'Pending')}</Detail></div>
    {order.status === 'PAYMENT_PENDING' && <div className="mt-5 rounded-xl bg-soft p-4 text-sm leading-6 dark:bg-night-soft"><b>Approve the M-Pesa prompt on your phone.</b><p className="mt-1 text-muted">After Safaricom confirms your payment, the system sends the sale amount to the M-Pesa number the seller provided. This page checks both payment updates automatically.</p>{order.message && <p className="mt-2 text-xs text-muted">{order.message}</p>}</div>}
    {order.status === 'ESCROW_HELD' && <p className="mt-5 rounded-xl bg-soft p-4 text-sm leading-6 dark:bg-night-soft">Your payment cleared. The seller’s M-Pesa transfer is starting.</p>}
    {['PAYOUT_PENDING', 'PAYOUT_INITIATING'].includes(order.status) && <p className="mt-5 rounded-xl bg-soft p-4 text-sm leading-6 dark:bg-night-soft">Safaricom is processing the transfer to the seller’s saved M-Pesa number. This page updates automatically.</p>}
    {order.status === 'RELEASE_REQUESTED' && <p className="mt-5 rounded-xl bg-soft p-4 text-sm leading-6 dark:bg-night-soft">This older order is awaiting its seller payment.</p>}
    {['PAYOUT_FAILED', 'PAYOUT_REVIEW_REQUIRED', 'REVIEW_REQUIRED'].includes(order.status) && <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">{order.message || 'The payment needs administrator review. Your receipt remains available here.'}</p>}
    {order.status === 'RELEASED' && <p className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-900 dark:bg-green-950/30 dark:text-green-100">Safaricom confirmed the seller payment. Your purchase is complete.</p>}
    {order.status === 'PAYMENT_FAILED' && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-900 dark:bg-red-950/30 dark:text-red-100">{order.message || 'Safaricom did not complete the payment.'}</p>}
    <button className="secondary-button mt-5" onClick={onBack}><FiArrowLeft size={15} />Back to marketplace</button>
  </article><p className="flex items-start gap-2 text-xs leading-5 text-muted"><FiShield className="mt-0.5 shrink-0" size={15} />M-Pesa STK collects the buyer’s payment. After confirmation, Safaricom B2C sends the sale amount to the seller’s saved phone number. B2C must be enabled for the estate payment account.</p>{paymentCleared && !completed && <p className="text-xs text-muted">Payment is confirmed; the seller transfer is still processing.</p>}</section>
}

function Detail({ label, children }) { return <div><p className="section-kicker">{label}</p><p className="mt-1 font-semibold">{children}</p></div> }
