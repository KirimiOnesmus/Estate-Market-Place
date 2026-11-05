import { useId, useState } from 'react'
import { FiArrowLeft, FiCopy, FiExternalLink, FiInfo } from 'react-icons/fi'

export function RegistrationLinkPage({ onCancel, onPreview }) {
  const id = useId()
  const token = id.replace(/[^a-zA-Z0-9]/g, '').slice(-12)
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/register?invite=${token}`
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true) } catch { document.getElementById('registration-link').select(); setCopied(false) } }
  return <section className="w-full"><div className="surface-card w-full p-4 sm:p-6"><div className="mb-5 border-b border-line pb-4 dark:border-night-line"><h2 className="text-base font-bold">Household self-registration</h2><p className="mt-1 text-sm text-muted">Share this invite link with the person responsible for registering their household.</p></div><label htmlFor="registration-link" className="field-label">Registration link</label><div className="flex flex-col gap-2 sm:flex-row"><input id="registration-link" className="form-control min-w-0 flex-1" readOnly value={link} /><button className="secondary-button" onClick={copy}><FiCopy size={15} />{copied ? 'Copied' : 'Copy link'}</button></div><p className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200"><FiInfo className="mt-0.5 shrink-0" size={15} />The form creates a request for admin review. This preview does not send invitations, email, or one-time passwords.</p><div className="mt-6 flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end"><button type="button" className="secondary-button" onClick={onCancel}><FiArrowLeft size={15} />Back to residents</button><button className="primary-button" onClick={() => onPreview(link)}><FiExternalLink size={15} />Preview registration form</button></div></div></section>
}
