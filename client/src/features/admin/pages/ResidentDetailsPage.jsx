import { useState } from 'react'
import { FiArrowLeft, FiCopy, FiKey, FiSave, FiShield, FiUserCheck, FiUserX } from 'react-icons/fi'

export function ResidentDetailsPage({ resident, locations, onBack, onSave, onSetAccess, onPasswordLink, onCommitteeChange }) {
  const [values, setValues] = useState(() => toFormValues(resident))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [accessBusy, setAccessBusy] = useState(false)
  const [linkBusy, setLinkBusy] = useState(false)
  const [setupLink, setSetupLink] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [committeeBusy, setCommitteeBusy] = useState(false)

  if (!resident) return <section className="surface-card p-5"><p className="text-sm text-muted">Resident record unavailable.</p><button className="secondary-button mt-3" onClick={onBack}><FiArrowLeft size={14} />Back to residents</button></section>

  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }))
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError('')
    try { await onSave(resident.id, { ...values, householdSize: Number(values.householdSize) }) }
    catch (requestError) { setError(requestError.message || 'Resident details could not be saved.') }
    finally { setSaving(false) }
  }
  const toggleAccess = async () => {
    setAccessBusy(true); setError('')
    try { await onSetAccess(resident, resident.membershipStatus === 'ACTIVE' ? 'REMOVED' : 'ACTIVE') }
    catch (requestError) { setError(requestError.message || 'Account access could not be updated.') }
    finally { setAccessBusy(false) }
  }
  const createPasswordLink = async () => {
    setLinkBusy(true); setError('')
    try { const result = await onPasswordLink(resident); setSetupLink(result.setupUrl); setLinkCopied(false) }
    catch (requestError) { setError(requestError.message || 'Password link could not be created.') }
    finally { setLinkBusy(false) }
  }
  const toggleCommittee = async () => {
    setCommitteeBusy(true); setError('')
    try { await onCommitteeChange(resident, !resident.committeeMember) }
    catch (requestError) { setError(requestError.message || 'Committee role could not be updated.') }
    finally { setCommitteeBusy(false) }
  }
  const set = (key) => (event) => update(key, event.target.value)
  const field = (key, label, type = 'text') => <div><label className="field-label" htmlFor={`resident-${key}`}>{label}</label><input id={`resident-${key}`} className="form-control" type={type} value={values[key]} onChange={set(key)} required /></div>

  return <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
    <form onSubmit={save} className="surface-card p-4 sm:p-6" aria-busy={saving}>
      <div className="mb-5 flex items-start justify-between gap-3 border-b border-line pb-4 dark:border-night-line"><div><p className="section-kicker">RESIDENT DETAILS</p><h2 className="mt-1 text-base font-bold">{resident.name}</h2><p className="mt-1 text-sm text-muted">Update household and contact information for this estate.</p></div><button type="button" className="secondary-button" onClick={onBack}><FiArrowLeft size={14} />Residents</button></div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field('fullName', 'Household representative')}{field('email', 'Email address', 'email')}{field('phone', 'Phone number', 'tel')}
        <div><label className="field-label" htmlFor="resident-location">Block or street</label><select id="resident-location" className="form-control" value={values.locationId} onChange={set('locationId')} required><option value="">Select location</option>{values.locationId && !locations.some((location) => location.id === values.locationId) && <option value={values.locationId}>{resident.location || 'Current location (inactive)'}</option>}{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></div>
        {field('unitCode', 'House or unit number')}
        <div><label className="field-label" htmlFor="resident-occupancy">Occupancy</label><select id="resident-occupancy" className="form-control" value={values.occupancy} onChange={set('occupancy')}><option value="Owner">Owner</option><option value="Tenant">Tenant</option></select></div>
        {field('householdSize', 'People in household', 'number')}{field('nextOfKinName', 'Next of kin name')}{field('nextOfKinPhone', 'Next of kin phone', 'tel')}{field('nextOfKinEmail', 'Next of kin email', 'email')}
      </div>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
      <div className="mt-5 flex justify-end border-t border-line pt-4 dark:border-night-line"><button type="submit" className="primary-button" disabled={saving}><FiSave size={15} />{saving ? 'Saving…' : 'Save resident details'}</button></div>
    </form>
    <aside className="grid h-fit gap-4">
      <article className="surface-card p-4 sm:p-5"><p className="section-kicker">ACCOUNT ACCESS</p><span className={`status-pill mt-2 ${resident.membershipStatus === 'ACTIVE' ? 'status-done' : 'status-warning'}`}>{resident.membershipStatus === 'ACTIVE' ? 'Active' : 'Deactivated'}</span><p className="mt-2 text-xs leading-5 text-muted">Deactivation revokes this resident’s active sessions. Their household record remains available to the estate admin.</p><button type="button" className={`secondary-button mt-4 w-full ${resident.membershipStatus === 'ACTIVE' ? 'text-red-700 dark:text-red-300' : ''}`} onClick={toggleAccess} disabled={accessBusy}><FiUserX size={14} />{accessBusy ? 'Updating…' : resident.membershipStatus === 'ACTIVE' ? 'Deactivate resident' : 'Reactivate resident'}</button></article>
      <article className="surface-card p-4 sm:p-5"><p className="section-kicker">PASSWORD HELP</p><p className="mt-2 text-xs leading-5 text-muted">Create a one-time password setup or reset link at the resident’s request. It expires in 48 hours.</p><button type="button" className="secondary-button mt-3 w-full" onClick={createPasswordLink} disabled={linkBusy || resident.membershipStatus !== 'ACTIVE'}><FiKey size={14} />{linkBusy ? 'Creating link…' : resident.mustResetPassword ? 'Reshare setup link' : 'Create reset link'}</button>{setupLink && <div className="mt-3 grid gap-2"><input className="form-control text-xs" value={setupLink} readOnly aria-label="Password setup or reset link" onFocus={(event) => event.target.select()} /><button type="button" className="secondary-button" onClick={async () => { try { await navigator.clipboard.writeText(setupLink); setLinkCopied(true) } catch { setLinkCopied(false) } }}><FiCopy size={14} />{linkCopied ? 'Copied' : 'Copy link'}</button></div>}</article>
      <article className="surface-card p-4 sm:p-5"><p className="section-kicker">COMMITTEE</p><p className="mt-2 text-xs leading-5 text-muted">{resident.committeeMember ? 'This resident is listed as a committee member.' : 'Assign this active resident to the estate committee.'}</p><button type="button" className="secondary-button mt-3 w-full" onClick={toggleCommittee} disabled={committeeBusy || resident.membershipStatus !== 'ACTIVE'}><FiUserCheck size={14} />{committeeBusy ? 'Updating…' : resident.committeeMember ? 'Remove committee role' : 'Add to committee'}</button><FiShield className="sr-only" /></article>
    </aside>
  </section>
}

function toFormValues(resident) {
  const unitFromAddress = resident?.unit?.split(' · ').at(-1) || ''
  return { fullName: resident?.name || '', email: resident?.email || '', phone: resident?.phone || '', locationId: resident?.locationId || '', unitCode: resident?.unitNumber || unitFromAddress, occupancy: resident?.occupancy === 'Owner occupied' ? 'Owner' : 'Tenant', householdSize: String(resident?.householdSize || 1), nextOfKinName: resident?.nextOfKin?.name || '', nextOfKinPhone: resident?.nextOfKin?.phone || '', nextOfKinEmail: resident?.nextOfKin?.email || '' }
}
