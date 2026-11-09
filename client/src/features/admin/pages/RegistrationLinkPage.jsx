import { useState } from 'react'
import { FiArrowLeft, FiCopy, FiExternalLink, FiInfo, FiLink } from 'react-icons/fi'
import { api } from '../../../api.js'

export function RegistrationLinkPage({ estateId, onCancel, onPreview }) {
  const [invitation, setInvitation] = useState(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const createInvitation = async () => {
    setLoading(true)
    setError('')
    setCopied(false)
    try {
      setInvitation(await api.createRegistrationInvitation(7))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    if (!invitation?.url) return
    try { await navigator.clipboard.writeText(invitation.url); setCopied(true) }
    catch { setError('Copy was blocked by the browser. Select and copy the link manually.') }
  }

  const expires = invitation?.expiresAt ? new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(invitation.expiresAt)) : ''

  return <section className="w-full">
    <div className="surface-card w-full p-4 sm:p-6">
      <div className="mb-5 border-b border-line pb-4 dark:border-night-line"><h2 className="text-base font-bold">Household self-registration</h2><p className="mt-1 text-sm text-muted">Create a secure, single-use invitation link for one household representative.</p></div>
      {!invitation ? <><p className="text-sm leading-6 text-muted">The link expires after seven days and can be used once. Registration details are sent to this estate for review.</p>
        {error && <p role="alert" className="field-error mt-4">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-line pt-4 dark:border-night-line sm:flex-row sm:justify-between"><button type="button" className="secondary-button" onClick={onCancel}><FiArrowLeft size={15} />Back</button><button className="primary-button" onClick={createInvitation} disabled={loading || !estateId}>{loading ? 'Creating link…' : <><FiLink size={15} />Create invitation link</>}</button></div>
      </> : <><label htmlFor="registration-link" className="field-label">Single-use invitation link</label><div className="flex flex-col gap-2 sm:flex-row"><input id="registration-link" className="form-control min-w-0 flex-1" readOnly value={invitation.url} onFocus={(event) => event.target.select()} /><button className="secondary-button" onClick={copy}><FiCopy size={15} />{copied ? 'Copied' : 'Copy link'}</button></div>
        <p className="mt-2 text-xs text-muted">Expires {expires}</p>
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200"><FiInfo className="mt-0.5 shrink-0" size={15} />The invitation token is shown only once. Keep this link for the household representative.</p>
        {error && <p role="alert" className="field-error mt-3">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-line pt-4 dark:border-night-line sm:flex-row sm:justify-between"><button type="button" className="secondary-button" onClick={onCancel}><FiArrowLeft size={15} />Back to residents</button><button className="primary-button" onClick={() => onPreview(invitation.url)}><FiExternalLink size={15} />Preview registration form</button></div>
      </>}
    </div>
  </section>
}
