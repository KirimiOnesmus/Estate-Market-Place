import { useId, useState } from 'react'
import { FiArrowLeft, FiMapPin } from 'react-icons/fi'

export function AddLocationPage({ onCancel, onCreate }) {
  const id = useId()
  const [type, setType] = useState('Block')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    if (!name.trim()) { setError(`Enter the ${type.toLowerCase()} name.`); return }
    setSaving(true)
    setError('')
    try { await onCreate({ id: crypto.randomUUID(), type, name: name.trim() }) }
    catch (requestError) { setError(requestError.message) }
    finally { setSaving(false) }
  }
  return <section className="w-full">
    <form noValidate onSubmit={submit} className="surface-card w-full p-4 sm:p-6" aria-busy={saving}>
      <div className="mb-5 border-b border-line pb-4 dark:border-night-line"><h2 className="text-base font-bold">Location details</h2><p className="mt-1 text-sm text-muted">Add an address option residents and admins can use for household records.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor={`${id}-type`} className="field-label">Location type</label><select id={`${id}-type`} className="form-control" value={type} onChange={(event) => { setType(event.target.value); setName('') }}><option>Block</option><option>Street</option></select></div>
        <div><label htmlFor={`${id}-name`} className="field-label">{type} name</label><input id={`${id}-name`} className="form-control" value={name} onChange={(event) => { setName(event.target.value); if (error) setError('') }} placeholder={type === 'Block' ? 'e.g. Block E' : 'e.g. Garden Walk'} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} required />{error && <span id={`${id}-error`} className="field-error">{error}</span>}</div>
      </div>
      <p className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200"><FiMapPin className="mt-0.5 shrink-0" size={15} />This location will be available when registering a household.</p>
      <div className="mt-6 flex flex-col-reverse gap-2 border-t border-line pt-4 dark:border-night-line sm:flex-row sm:justify-end"><button type="button" className="secondary-button" onClick={onCancel}><FiArrowLeft size={15} />Cancel</button><button type="submit" className="primary-button" disabled={saving}><FiMapPin size={15} />{saving ? 'Saving…' : `Add ${type.toLowerCase()}`}</button></div>
    </form>
  </section>
}
