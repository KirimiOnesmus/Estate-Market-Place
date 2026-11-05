import { useState } from 'react'
import { DialogFrame } from '../../../shared/components/DialogFrame.jsx'

export function RejectReasonDialog({ onCancel, onReject }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const submit = (event) => { event.preventDefault(); if (!reason.trim()) { setError('Add a reason so the committee can understand.'); return } onReject(reason.trim()) }
  return <DialogFrame titleId="reject-title" onClose={onCancel} className="p-5 sm:max-w-lg sm:p-6"><p className="section-kicker">COMMITTEE DECISION</p><h2 id="reject-title" className="mt-1 font-display text-lg font-bold">Why are you rejecting this campaign?</h2><p className="mt-2 text-sm leading-6 text-muted">Your reason is visible to committee members and the publishing admin.</p><form noValidate onSubmit={submit} className="mt-4"><label htmlFor="rejection-reason" className="field-label">Rejection reason</label><textarea autoFocus id="rejection-reason" className="form-control min-h-28 resize-none" value={reason} onChange={(event) => { setReason(event.target.value); if (error && event.target.value.trim()) setError('') }} aria-invalid={Boolean(error)} aria-describedby={error ? 'rejection-error' : undefined} />{error && <span id="rejection-error" className="field-error">{error}</span>}<div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" className="secondary-button" onClick={onCancel}>Go back</button><button type="submit" className="primary-button">Record rejection</button></div></form></DialogFrame>
}
