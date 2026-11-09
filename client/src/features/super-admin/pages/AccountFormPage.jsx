import { useState } from 'react'
import { FiArrowLeft, FiCheck, FiCopy, FiSave } from 'react-icons/fi'

export function PlatformAccountFormPage({ account, estates, onCancel, onSave }) {
  const [values, setValues] = useState(() => ({
    fullName: account?.name || '',
    email: account?.email || '',
    phone: account?.phone || '',
    role: account?.roleValue || 'ESTATE_ADMIN',
    estateId: account?.estateId || estates.find((estate) => estate.accessStatus === 'Active')?.id || '',
  }))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [setupUrl, setSetupUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    if (!account && !values.estateId) { setError('Choose an active estate workspace.'); return }
    setSaving(true)
    setError('')
    try {
      const result = await onSave({
        ...account,
        ...values,
        role: values.role,
        phone: values.phone.trim() || null,
      })
      if (result?.setupUrl) setSetupUrl(result.setupUrl)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const copySetupLink = async () => {
    try {
      await navigator.clipboard.writeText(setupUrl)
      setCopied(true)
    } catch {
      setError('Copy was blocked. Select the link and copy it manually.')
    }
  }

  return <section className="grid w-full gap-5"><form className="surface-card p-5 sm:p-7" onSubmit={submit} aria-busy={saving}>
    <header className="mb-5 border-b border-line pb-4 dark:border-night-line"><p className="section-kicker">PLATFORM ACCOUNT</p><h2 className="mt-1 font-bold">{account ? 'Edit account' : 'Add estate administrator'}</h2><p className="mt-1 text-sm text-muted">{account ? `Update ${account.estate} membership details.` : 'Create an estate admin account and prepare a password setup link.'}</p></header>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id="account-name" label="Full name" value={values.fullName} onChange={(value) => update('fullName', value)} required disabled={Boolean(setupUrl)} />
      <Field id="account-email" label="Email address" type="email" value={values.email} onChange={(value) => update('email', value)} required disabled={Boolean(setupUrl)} />
      <Field id="account-phone" label="Phone number" type="tel" value={values.phone || ''} onChange={(value) => update('phone', value)} disabled={Boolean(setupUrl)} />
      {account ? <div><label className="field-label" htmlFor="account-role">Estate role</label>{account.roleValue === 'COMMITTEE_MEMBER' ? <><input id="account-role" className="form-control" value="Committee member" readOnly /><p className="mt-1 text-xs text-muted">This appointment remains controlled by estate elections.</p></> : <select id="account-role" className="form-control" value={values.role} onChange={(event) => update('role', event.target.value)}><option value="ESTATE_ADMIN">Estate Admin</option><option value="RESIDENT">Resident</option><option value="ACCOUNT_HOLDER">Account holder</option></select>}</div>
        : <div><label className="field-label" htmlFor="account-estate">Estate workspace</label><select id="account-estate" className="form-control" value={values.estateId} onChange={(event) => update('estateId', event.target.value)} required disabled={Boolean(setupUrl)}><option value="">Select an active estate</option>{estates.filter((estate) => estate.accessStatus === 'Active').map((estate) => <option key={estate.id} value={estate.id}>{estate.name}</option>)}</select></div>}
      {account && <div><label className="field-label">Estate workspace</label><div className="form-control flex items-center">{account.estate}</div></div>}
    </div>

    {setupUrl && <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-950/30"><div className="flex items-center gap-2 text-sm font-semibold text-green-900 dark:text-green-200"><FiCheck size={16} />Account created</div><p className="mt-2 text-xs leading-5 text-green-900 dark:text-green-200">Share this one-time password setup link with {values.fullName}. It expires in 48 hours. The system does not send email yet.</p><label className="field-label mt-3" htmlFor="account-setup-link">Password setup link</label><div className="flex flex-col gap-2 sm:flex-row"><input id="account-setup-link" className="form-control min-w-0 flex-1" value={setupUrl} readOnly onFocus={(event) => event.target.select()} /><button type="button" className="secondary-button" onClick={copySetupLink}><FiCopy size={14} />{copied ? 'Copied' : 'Copy link'}</button></div></div>}

    {error && <p role="alert" className="field-error mt-4">{error}</p>}
    <div className="mt-6 flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-between"><button type="button" className="secondary-button" onClick={onCancel}><FiArrowLeft size={15} />Back to accounts</button>{!setupUrl && <button type="submit" className="primary-button" disabled={saving}><FiSave size={15} />{saving ? 'Saving…' : account ? 'Save changes' : 'Create account'}</button>}</div>
  </form></section>
}

function Field({ id, label, value, onChange, type = 'text', required = false, disabled = false }) { return <div><label className="field-label" htmlFor={id}>{label}</label><input id={id} className="form-control" type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} required={required} disabled={disabled} /></div> }
