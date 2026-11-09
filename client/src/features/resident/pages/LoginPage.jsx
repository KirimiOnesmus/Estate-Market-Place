import { useState } from 'react'
import { FiEye, FiEyeOff, FiLogIn, FiShield } from 'react-icons/fi'
import { api } from '../../../api.js'

export function LoginPage({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      onSuccess(await api.login({ email, password }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f2f5f2] px-4 py-10 text-ink dark:bg-night dark:text-night-ink sm:px-6">
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-br from-brand-950 via-brand-800 to-brand-700" />
    <div aria-hidden="true" className="pointer-events-none absolute -right-28 top-16 size-80 rounded-full border border-white/10" />
    <div aria-hidden="true" className="pointer-events-none absolute -right-12 top-32 size-48 rounded-full border border-white/10" />

    <div className="relative w-full max-w-[440px]">
      <header className="mb-7 text-center text-white">
        <p className="font-display text-lg font-bold tracking-wide">Estate Market Place</p>
        <p className="mt-1 text-xs text-white/70">Community account access</p>
      </header>

      <form noValidate onSubmit={submit} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_70px_-28px_rgba(15,40,28,.38)] dark:border-night-line dark:bg-night-panel sm:p-9" aria-busy={submitting}>
        <div className="mb-7">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-300"><FiLogIn size={18} /></span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[.14em] text-brand-700 dark:text-brand-300">Welcome back</p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Enter the email and password linked to your account.</p>
        </div>

        <div className="grid gap-5">
          <div><label htmlFor="login-email" className="field-label">Email address</label><input id="login-email" type="email" autoComplete="username" className="form-control h-12 rounded-lg" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required /></div>
          <div><div className="mb-1.5 flex items-center justify-between"><label htmlFor="login-password" className="field-label !mb-0">Password</label></div><div className="relative"><input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="form-control h-12 rounded-lg pr-12" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} maxLength={200} required /><button type="button" className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted hover:text-ink dark:hover:text-night-ink" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}</button></div></div>
        </div>

        {error && <p role="alert" className="field-error mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-900/50 dark:bg-red-950/30">{error}</p>}

        <button type="submit" className="primary-button mt-7 h-12 w-full justify-center rounded-lg text-sm" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>

        <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3.5 dark:bg-night-soft">
          <p className="text-center text-xs leading-5 text-muted">Registering a household?</p>
          <p className="mt-1 text-center text-xs leading-5 text-muted">Open the invitation link from your estate to complete registration.</p>
        </div>
      </form>

      <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400"><FiShield size={13} />Secure sign-in for community members and administrators</p>
      <p className="mt-3 text-center text-xs"><a href="/track-report" className="font-semibold text-brand-800 underline-offset-4 hover:underline dark:text-brand-300">Track a report with its reference code</a></p>
    </div>
  </main>
}
