import { useEffect, useState } from 'react'
import { FiCheck, FiEye, FiEyeOff, FiKey } from 'react-icons/fi'
import { api } from '../../../api.js'

export function SetupPasswordPage() {
  const token = new URLSearchParams(window.location.search).get('token') || ''
  const [account, setAccount] = useState(null)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(Boolean(token))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(() => token ? '' : 'This password setup link is missing its token.')
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    let current = true
    if (!token) return () => { current = false }
    api.validatePasswordSetup(token).then((result) => {
      if (current) setAccount(result)
    }).catch((requestError) => {
      if (current) setError(requestError.message)
    }).finally(() => {
      if (current) setLoading(false)
    })
    return () => { current = false }
  }, [token])

  const submit = async (event) => {
    event.preventDefault()
    if (password.length < 14) { setError('Use at least 14 characters for your password.'); return }
    if (password !== confirmation) { setError('The passwords do not match.'); return }
    setSubmitting(true)
    setError('')
    try {
      await api.completePasswordSetup(token, password)
      setComplete(true)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="grid min-h-screen place-items-center bg-canvas px-4 py-8 text-ink dark:bg-night dark:text-night-ink sm:px-6">
    <section className="surface-card w-full max-w-md p-6 shadow-lift sm:p-8">
      {loading ? <p className="text-sm text-muted" role="status">Checking password setup link…</p>
        : complete ? <><span className="grid size-11 place-items-center rounded-full bg-green-soft text-green-800"><FiCheck size={20} /></span><h1 className="mt-5 font-display text-2xl font-bold">Password set</h1><p className="mt-2 text-sm leading-6 text-muted">You can now sign in to your Estate Market Place account.</p><a className="primary-button mt-6 w-full" href="/login">Go to sign in</a></>
          : account ? <form onSubmit={submit}><span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-300"><FiKey size={19} /></span><p className="mt-5 text-xs font-bold uppercase tracking-[.14em] text-brand-700 dark:text-brand-300">Account setup</p><h1 className="mt-2 font-display text-2xl font-bold">Create your password</h1><p className="mt-2 text-sm leading-6 text-muted">Set a password for <b>{account.email}</b>. Use at least 14 characters.</p><div className="mt-5 grid gap-4"><PasswordField id="new-password" label="Password" value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} /><PasswordField id="confirm-password" label="Confirm password" value={confirmation} onChange={setConfirmation} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} /></div>{error && <p className="field-error mt-4" role="alert">{error}</p>}<button className="primary-button mt-6 w-full" type="submit" disabled={submitting}>{submitting ? 'Saving password…' : 'Set password'}</button></form>
            : <><h1 className="font-display text-xl font-bold">Password setup unavailable</h1><p className="mt-2 text-sm leading-6 text-muted" role="alert">{error}</p><p className="mt-4 text-xs text-muted">Ask your platform administrator for a new setup link.</p></>}
    </section>
  </main>
}

function PasswordField({ id, label, value, onChange, visible, onToggle }) {
  return <div><label className="field-label" htmlFor={id}>{label}</label><div className="relative"><input id={id} type={visible ? 'text' : 'password'} className="form-control pr-12" value={value} onChange={(event) => onChange(event.target.value)} maxLength={200} autoComplete="new-password" required /><button type="button" className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted" onClick={onToggle} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <FiEyeOff size={16} /> : <FiEye size={16} />}</button></div></div>
}
