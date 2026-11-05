import { useId, useState } from 'react'
import { FiArrowLeft, FiBell, FiInfo } from 'react-icons/fi'
import { FiDroplet, FiShield, FiUsers } from 'react-icons/fi'

const icons = { Facilities: FiDroplet, Security: FiShield, Community: FiUsers, General: FiBell }

export function CreateNoticePage({ initialNotice, onCancel, onSave }) {
  const id = useId()
  const [values, setValues] = useState(() => ({ title: initialNotice?.title || '', text: initialNotice?.text || '', category: initialNotice?.category || 'General', date: initialNotice?.date || '', time: initialNotice?.time || '' }))
  const [error, setError] = useState('')
  const field = (key, label, props = {}) => <div><label className="field-label" htmlFor={`${id}-${key}`}>{label}</label><input id={`${id}-${key}`} className="form-control" value={values[key]} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} {...props} /></div>
  const submit = (event) => {
    event.preventDefault()
    if (Object.values(values).some((value) => !value.trim())) { setError('Complete each field before saving.'); return }
    onSave({ ...initialNotice, id: initialNotice?.id || `NOTICE-${crypto.randomUUID().slice(0, 8)}`, ...values, icon: icons[values.category], unread: initialNotice?.unread ?? true })
  }
  return <section className="w-full"><form noValidate onSubmit={submit} className="surface-card w-full p-4 sm:p-6"><div className="mb-5 border-b border-line pb-4 dark:border-night-line"><p className="section-kicker">ESTATE COMMUNICATION</p><h2 className="mt-1 text-base font-bold">{initialNotice ? 'Edit notice' : 'Create notice'}</h2><p className="mt-1 text-sm text-muted">Write a clear update for households across Pavilion Court.</p></div><div className="grid gap-4 sm:grid-cols-2">{field('title', 'Notice title', { placeholder: 'e.g. Water supply maintenance', required: true })}<div><label className="field-label" htmlFor={`${id}-category`}>Category</label><select id={`${id}-category`} className="form-control" value={values.category} onChange={(event) => setValues((current) => ({ ...current, category: event.target.value }))}><option>General</option><option>Facilities</option><option>Security</option><option>Community</option></select></div><div className="sm:col-span-2"><label className="field-label" htmlFor={`${id}-text`}>Notice details</label><textarea id={`${id}-text`} className="form-control min-h-36 resize-y" value={values.text} onChange={(event) => setValues((current) => ({ ...current, text: event.target.value }))} placeholder="What do residents need to know?" required /></div>{field('date', 'Display date', { placeholder: 'e.g. Friday, 6 November', required: true })}{field('time', 'Time or location', { placeholder: 'e.g. 9:00–11:00 am', required: true })}</div>{error && <p role="alert" className="field-error mt-3">{error}</p>}<p className="mt-5 flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200"><FiInfo className="mt-0.5 shrink-0" size={15} />{initialNotice ? 'Saving updates the notice shown in resident views.' : 'Publishing makes this notice visible in resident views.'} This is a local preview.</p><div className="mt-6 flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end"><button type="button" className="secondary-button" onClick={onCancel}><FiArrowLeft size={15} />Cancel</button><button type="submit" className="primary-button"><FiBell size={15} />{initialNotice ? 'Save changes' : 'Publish notice'}</button></div></form></section>
}
