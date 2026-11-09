import { useState } from 'react'
import { FiArrowLeft, FiCheck, FiSend } from 'react-icons/fi'
import { api } from '../../../api.js'

export function CreateSupportCasePage({ onCancel }) {
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [createdCase, setCreatedCase] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      setCreatedCase(await api.createSupportCase({ subject, description }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  if (createdCase) return <section className="surface-card max-w-full p-6 sm:p-8"><span className="grid size-11 place-items-center rounded-full bg-green-soft text-green-800"><FiCheck size={20} /></span><h2 className="mt-4 font-display text-xl font-bold">Support request sent</h2><p className="mt-2 text-sm leading-6 text-muted">The platform support team can now review your request. Reference: <span className="font-semibold">{createdCase.id}</span></p><button className="primary-button mt-5" onClick={onCancel}><FiArrowLeft size={15} />Back to workspace</button></section>

  return <section className="w-full max-w-full"><form className="surface-card p-5 sm:p-7" onSubmit={submit} aria-busy={saving}><header className="mb-5 border-b border-line pb-4 dark:border-night-line"><p className="section-kicker">PLATFORM SUPPORT</p><h2 className="mt-1 font-bold">Contact platform support</h2><p className="mt-1 text-sm leading-6 text-muted">Use this form for account access and technical issues. Estate decisions and resident requests should go to your estate administrator.</p></header><div className="grid gap-4"><div><label className="field-label" htmlFor="support-subject">Subject</label><input id="support-subject" className="form-control" value={subject} onChange={(event) => setSubject(event.target.value)} minLength={5} maxLength={160} required /></div><div><label className="field-label" htmlFor="support-description">Describe the issue</label><textarea id="support-description" className="form-control min-h-36 resize-y" value={description} onChange={(event) => setDescription(event.target.value)} minLength={10} maxLength={5000} required /></div></div>{error && <p className="field-error mt-4" role="alert">{error}</p>}<footer className="mt-6 flex flex-col-reverse gap-2 border-t border-line pt-4 dark:border-night-line sm:flex-row sm:justify-between"><button type="button" className="secondary-button" onClick={onCancel}><FiArrowLeft size={15} />Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Sending…' : <><FiSend size={14} />Send support request</>}</button></footer></form></section>
}
