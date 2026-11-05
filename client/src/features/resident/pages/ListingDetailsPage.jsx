import { useState } from 'react'
import { FiArrowLeft, FiCreditCard, FiMinus, FiPlus, FiTag } from 'react-icons/fi'
import { formatMoney } from '../../../data/previewData.js'
import { PaymentInstructions } from '../components/PaymentInstructions.jsx'

export function ListingDetailsPage({ listing, navigate, onPurchase, onAddToCart, onBid }) {
  const [quantity, setQuantity] = useState(1)
  const availablePaymentOptions = (listing?.paymentOptions || ['M-Pesa']).filter((option) => ['M-Pesa', 'Bank transfer'].includes(option))
  const [payment, setPayment] = useState(availablePaymentOptions[0] || 'M-Pesa')
  const [bid, setBid] = useState('')
  const [error, setError] = useState('')
  if (!listing) return <section className="surface-card p-5"><p className="font-semibold">This listing is no longer available.</p><button className="secondary-button mt-4" onClick={() => navigate('marketplace')}><FiArrowLeft size={15} />Back to marketplace</button></section>
  const stock = listing.quantity ?? 1
  const photos = listing.images || []
  const paymentDetails = listing.paymentDetails?.[payment]
  const purchase = () => {
    if (!stock || quantity > stock) { setError('That quantity is no longer available.'); return }
    onPurchase(listing, quantity, payment)
  }
  const submitBid = (event) => {
    event.preventDefault()
    const amount = Number(bid)
    if (!amount || amount <= Number(listing.price)) { setError(`Enter a bid higher than ${formatMoney(listing.price)}.`); return }
    onBid(listing, amount)
    setBid('')
    setError('')
  }
  return <section className="grid w-full gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,.7fr)]">
    <article className="surface-card min-w-0 overflow-hidden"><div className="grid gap-1 bg-soft p-1 dark:bg-night-soft sm:grid-cols-2">{photos.length ? photos.map((photo, index) => <img key={`${listing.id}-${index}`} src={photo} alt={`${listing.title}, photo ${index + 1}`} className="aspect-[4/3] w-full rounded-md object-cover" />) : <div className="col-span-full grid aspect-[4/3] place-items-center text-muted"><FiTag size={30} /></div>}</div><div className="p-5 sm:p-7"><div className="flex flex-wrap items-center gap-2"><span className="section-kicker">{listing.category}</span><span className={`status-pill ${stock > 0 ? 'status-done' : 'status-warning'}`}>{stock > 0 ? `${stock} available` : 'Sold out'}</span></div><h2 className="mt-2 text-xl font-bold">{listing.title}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">{listing.description || 'No additional details were provided.'}</p><div className="mt-6 grid gap-4 border-t border-line pt-5 dark:border-night-line sm:grid-cols-2"><Detail label="Price">{formatMoney(listing.price)}{listing.category === 'Services' ? ' · per service' : ' · each'}</Detail><Detail label="Quantity available">{stock}</Detail><Detail label="Condition">{listing.condition || 'Good'}</Detail><Detail label="Payment options">{(listing.paymentOptions || ['M-Pesa']).join(', ')}</Detail><Detail label="Seller">{listing.owner} · {listing.unit}</Detail></div></div></article>
    <aside className="grid content-start gap-4"><section className="surface-card p-5 sm:p-6"><button className="secondary-button mb-4" onClick={() => navigate('marketplace')}><FiArrowLeft size={15} />Back to marketplace</button><p className="section-kicker">BUY THIS ITEM</p><p className="mt-2 text-2xl font-bold">{formatMoney(listing.price)}</p><p className="mt-1 text-xs text-muted">Choose how you will pay. The seller’s transfer details appear below.</p><label className="field-label mt-5 block" htmlFor="buy-quantity">Quantity</label><div className="flex items-center gap-2"><button type="button" className="secondary-button size-11 px-0" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><FiMinus size={15} /></button><input id="buy-quantity" className="form-control text-center" type="number" min="1" max={stock} value={quantity} onChange={(event) => setQuantity(Math.min(stock || 1, Math.max(1, Number(event.target.value))))} /><button type="button" className="secondary-button size-11 px-0" aria-label="Increase quantity" disabled={quantity >= stock} onClick={() => setQuantity((value) => Math.min(stock, value + 1))}><FiPlus size={15} /></button></div><label className="field-label mt-4 block" htmlFor="purchase-payment">Payment method</label><select id="purchase-payment" className="form-control" value={payment} onChange={(event) => setPayment(event.target.value)}>{availablePaymentOptions.map((option) => <option key={option}>{option}</option>)}</select><PaymentInstructions method={payment} details={paymentDetails} /><p className="mt-3 flex justify-between border-t border-line pt-3 text-sm dark:border-night-line"><span>Total</span><b>{formatMoney(listing.price * quantity)}</b></p><button type="button" className="primary-button mt-3 w-full" disabled={!stock} onClick={purchase}><FiCreditCard size={15} />Buy now</button><button type="button" className="secondary-button mt-2 w-full" disabled={!stock} onClick={() => onAddToCart(listing, quantity)}>Add to cart</button><p className="mt-4 text-[11px] leading-5 text-muted">Checkout and payment records are preview-only; no charge is made. Stock updates after a completed preview purchase.</p></section>
      <form className="surface-card p-5 sm:p-6" onSubmit={submitBid}><p className="section-kicker">MAKE AN OFFER</p><h3 className="mt-1 text-base font-bold">Place a bid</h3><p className="mt-1 text-xs text-muted">Current price: {formatMoney(listing.price)}</p><label className="field-label mt-4 block" htmlFor="bid-amount">Your offer (KSh)</label><input id="bid-amount" className="form-control" type="number" min={Number(listing.price) + 1} value={bid} onChange={(event) => setBid(event.target.value)} placeholder="Enter an amount" />{error && <p role="alert" className="field-error">{error}</p>}<button type="submit" className="secondary-button mt-3 w-full">Send bid</button>{listing.bids?.length > 0 && <div className="mt-4 border-t border-line pt-3 dark:border-night-line"><p className="text-xs font-semibold">Your offers</p>{listing.bids.map((offer, index) => <p key={`${offer.date}-${index}`} className="mt-2 flex justify-between gap-2 text-xs text-muted"><span>{offer.date} · {offer.status}</span><b>{formatMoney(offer.amount)}</b></p>)}</div>}</form></aside>
  </section>
}

function Detail({ label, children }) { return <div><p className="section-kicker">{label}</p><p className="mt-1 text-sm font-medium">{children}</p></div> }
