import { useEffect, useId, useState } from 'react'
import { FiCheck, FiInfo, FiUserPlus } from 'react-icons/fi'
import { EstateLogo } from '../../../shared/components/EstateLogo.jsx'
import { api } from '../../../api.js'

const blankValues = {
  fullName: '', email: '', phone: '', locationId: '', unitCode: '', occupancy: 'Tenant', householdSize: '1',
  nextOfKinName: '', nextOfKinPhone: '', nextOfKinEmail: '',
}

export function SelfRegistrationPage() {
  const id = useId()
  const inviteToken = new URLSearchParams(window.location.search).get('invite') || ''
  const [invitation, setInvitation] = useState(null)
  const [values, setValues] = useState(blankValues)
  const [loading, setLoading] = useState(Boolean(inviteToken))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(() => inviteToken ? '' : 'This registration link is missing its invitation code. Ask the estate administrator for a new link.')
  const [submitted, setSubmitted] = useState(null)
  const set = (key, value) => setValues((current) => ({ ...current, [key]: value }))

  useEffect(() => {
    let current = true
    if (!inviteToken) return () => { current = false }
    api.validateRegistrationInvitation(inviteToken)
      .then((data) => { if (current) setInvitation(data) })
      .catch((requestError) => { if (current) setError(requestError.message) })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [inviteToken])

  const submit = async (event) => {
    event.preventDefault()
    if (!invitation || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const result = await api.submitRegistration(inviteToken, {
        ...values,
        householdSize: Number(values.householdSize),
      })
      setSubmitted(result)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const field = (key, label, type = 'text', options = {}) => <div>
    <label className="field-label" htmlFor={`${id}-${key}`}>{label}</label>
    <input id={`${id}-${key}`} className="form-control" type={type} value={values[key]} onChange={(event) => set(key, event.target.value)} maxLength={options.maxLength || 120} autoComplete={options.autoComplete} required />
  </div>

  return <main className="min-h-screen bg-canvas px-4 py-8 text-ink dark:bg-night dark:text-night-ink sm:px-7">
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-6 flex items-center gap-3"><EstateLogo estate={invitation?.estate} /><div><p className="text-xs font-semibold uppercase tracking-wider text-muted">{invitation?.estate?.name || 'Estate invitation'}</p>{invitation?.estate?.location && <p className="text-xs text-muted">{invitation.estate.location}</p>}<h1 className="text-xl font-bold">Household registration</h1></div></header>
      {loading ? <div className="surface-card p-6 text-sm text-muted" role="status">Checking invitation…</div>
        : submitted ? <div className="surface-card p-6 sm:p-7"><span className="grid size-10 place-items-center rounded-full bg-green-soft text-green-800"><FiCheck size={20} /></span><h2 className="mt-4 text-lg font-bold">Registration request received</h2><p className="mt-2 text-sm leading-6 text-muted">Your request is awaiting review for {invitation.estate.name}. You can close this page.</p><p className="mt-3 text-xs text-muted">Reference: {submitted.id}</p><a className="mt-5 inline-flex font-semibold text-brand-800 underline dark:text-brand-300" href="/login">Go to sign in</a></div>
          : error && !invitation ? <div className="surface-card p-6" role="alert"><h2 className="font-bold">Invitation unavailable</h2><p className="mt-2 text-sm leading-6 text-muted">{error}</p><p className="mt-4 text-xs text-muted">Ask the person who sent the invitation for a current registration link.</p></div>
            : <form noValidate onSubmit={submit} className="surface-card p-4 sm:p-6" aria-busy={submitting}>
              <div className="mb-5"><p className="text-sm leading-6 text-muted">Register one representative for your household. The estate team will review your details before resident access is enabled.</p><p className="mt-2 text-xs text-muted">All fields are required.</p></div>
              <h2 className="mb-3 border-b border-line pb-3 text-sm font-bold dark:border-night-line">Household representative</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {field('fullName', 'Full name', 'text', { autoComplete: 'name' })}
                {field('email', 'Email address', 'email', { autoComplete: 'email' })}
                {field('phone', 'Phone number', 'tel', { autoComplete: 'tel' })}
                <div><label className="field-label" htmlFor={`${id}-locationId`}>Block or street</label><select id={`${id}-locationId`} className="form-control" value={values.locationId} onChange={(event) => set('locationId', event.target.value)} required><option value="">Select location</option>{invitation?.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></div>
                {field('unitCode', 'House or unit number')}
                <div><label className="field-label" htmlFor={`${id}-occupancy`}>Occupancy</label><select id={`${id}-occupancy`} className="form-control" value={values.occupancy} onChange={(event) => set('occupancy', event.target.value)}><option value="Tenant">Tenant</option><option value="Owner">Owner</option></select></div>
                {field('householdSize', 'People in household', 'number', { maxLength: 2 })}
              </div>
              <h2 className="mb-3 mt-7 border-b border-line pb-3 text-sm font-bold dark:border-night-line">Next of kin</h2>
              <div className="grid gap-4 sm:grid-cols-2">{field('nextOfKinName', 'Full name')}{field('nextOfKinPhone', 'Phone number', 'tel')}{field('nextOfKinEmail', 'Email address', 'email')}</div>
              {error && <p role="alert" className="field-error mt-4">{error}</p>}
              {!invitation?.locations.length && <p role="alert" className="field-error mt-4">This estate has no active blocks or streets yet. Contact the person who sent the invitation.</p>}
              <p className="mt-5 flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200"><FiInfo className="mt-0.5 shrink-0" size={15} />Your information is shared with the estate Super Admin to review this household request.</p>
              <button className="primary-button mt-5" type="submit" disabled={submitting || !invitation?.locations.length}>{submitting ? 'Submitting…' : <><FiUserPlus size={15} />Submit registration request</>}</button>
            </form>}
      {!submitted && <p className="mt-4 text-center text-xs text-muted">Already have an account? <a className="font-semibold text-brand-800 underline dark:text-brand-300" href="/login">Sign in</a></p>}
    </div>
  </main>
}
