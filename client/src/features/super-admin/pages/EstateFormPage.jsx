import { useState } from 'react'
import { FiArrowLeft, FiImage, FiSave, FiTrash2, FiUpload } from 'react-icons/fi'

export function PlatformEstateFormPage({ estate, onCancel, onSave }) {
  const [values, setValues] = useState(() => ({ name: estate?.name || '', location: estate?.location || '', billingStatus: estate?.billingStatus || 'Current', logo: estate?.logo || '' }))
  const [error, setError] = useState('')
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }))
  const chooseLogo = (file) => {
    setError('')
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setError('Choose a PNG, JPG, or WebP logo.'); return }
    if (file.size > 2 * 1024 * 1024) { setError('The logo must be smaller than 2 MB.'); return }
    const reader = new FileReader()
    reader.onload = () => update('logo', String(reader.result))
    reader.onerror = () => setError('This logo could not be read. Try another image.')
    reader.readAsDataURL(file)
  }
  const submit = (event) => {
    event.preventDefault()
    if (!values.name.trim() || !values.location.trim()) { setError('Add an estate name and location.'); return }
    onSave({ ...estate, ...values, id: estate?.id || `EST-${crypto.randomUUID().slice(0, 6).toUpperCase()}`, accessStatus: estate?.accessStatus || 'Active', created: estate?.created || 'Created just now' })
  }
  return <section className="grid w-full gap-5"><form className="surface-card p-5 sm:p-7" onSubmit={submit}>
    <header className="mb-5 border-b border-line pb-4 dark:border-night-line"><p className="section-kicker">ESTATE WORKSPACE</p><h2 className="mt-1 font-bold">{estate ? 'Edit estate' : 'Add estate'}</h2><p className="mt-1 text-sm text-muted">Set up estate identity and payment standing. Add or assign the estate admin from Platform accounts.</p></header>
    <div className="grid gap-4 sm:grid-cols-2"><Field id="estate-name" label="Estate name" value={values.name} onChange={(value) => update('name', value)} required /><Field id="estate-location" label="Location" value={values.location} onChange={(value) => update('location', value)} required /><div><label className="field-label" htmlFor="estate-billing">Payment status</label><select id="estate-billing" className="form-control" value={values.billingStatus} onChange={(event) => update('billingStatus', event.target.value)}><option>Current</option><option>Past due</option><option>Payment review</option></select></div>
      <div className="sm:col-span-2"><label className="field-label" htmlFor="estate-logo">Estate logo <span className="font-normal text-muted">(optional)</span></label><div className="flex flex-wrap items-center gap-4 rounded-lg border border-line p-3 dark:border-night-line"><div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-soft text-muted dark:bg-night-soft">{values.logo ? <img src={values.logo} alt="Estate logo preview" className="size-full object-contain p-1" /> : <FiImage size={22} />}</div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{values.logo ? 'Logo selected' : 'Add a recognizable estate mark'}</p><p className="mt-1 text-xs text-muted">PNG, JPG, or WebP · up to 2 MB · shown in dashboards and registration.</p><div className="mt-2 flex flex-wrap gap-2"><label htmlFor="estate-logo" className="secondary-button cursor-pointer"><FiUpload size={14} />{values.logo ? 'Replace logo' : 'Choose logo'}</label>{values.logo && <button type="button" className="secondary-button" onClick={() => update('logo', '')}><FiTrash2 size={14} />Remove</button>}</div><input id="estate-logo" className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { chooseLogo(event.target.files?.[0]); event.target.value = '' }} aria-describedby="estate-logo-help" /><span id="estate-logo-help" className="sr-only">Select a PNG, JPG, or WebP image smaller than 2 megabytes.</span></div></div></div>
    </div>
    {error && <p role="alert" className="field-error mt-4">{error}</p>}
    <div className="mt-6 flex flex-col-reverse gap-2 border-t border-line pt-4 dark:border-night-line sm:flex-row sm:justify-between"><button type="button" className="secondary-button" onClick={onCancel}><FiArrowLeft size={15} />Back to estates</button><button type="submit" className="primary-button"><FiSave size={15} />{estate ? 'Save changes' : 'Create estate'}</button></div>
  </form><p className="text-xs leading-5 text-muted">Estate branding and workspace changes are saved in this browser preview. Connect the platform service for shared account access and permanent storage.</p></section>
}

function Field({ id, label, value, onChange, type = 'text', required = false }) { return <div><label className="field-label" htmlFor={id}>{label}</label><input id={id} className="form-control" type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></div> }
