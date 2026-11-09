import { useState } from 'react'
import { FiArrowRight, FiKey, FiMail, FiPhone, FiUserCheck, FiUserX, FiUsers } from 'react-icons/fi'
import { EmptyState } from '../../../shared/components/EmptyState.jsx'

export function ResidentDirectoryList({ residents, compact = false, onManage, onSelect, onReshareSetupLink, linkBusy = false, onToggleAccess }) {
  const [accessBusyId, setAccessBusyId] = useState('')
  const [accessError, setAccessError] = useState('')
  const toggleAccess = async (resident) => {
    setAccessBusyId(resident.id); setAccessError('')
    try { await onToggleAccess(resident, resident.membershipStatus === 'ACTIVE' ? 'REMOVED' : 'ACTIVE') }
    catch (error) { setAccessError(error.message || `Could not update access for ${resident.name}.`) }
    finally { setAccessBusyId('') }
  }
  if (!residents.length) return <EmptyState icon={FiUsers} title="No residents found" text="Try another name, email address, or household." />
  if (compact) return <div className="divide-y divide-line dark:divide-night-line">{residents.map((resident) => <article key={resident.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"><div className="min-w-0"><b className="block text-sm">{resident.name}</b><span className="mt-1 block truncate text-xs text-muted">{resident.email}</span></div><div className="flex flex-wrap items-center gap-3"><div className="text-right"><b className="block text-xs">{resident.unit}</b><span className="mt-1 block text-[11px] text-muted">{resident.householdSize} household members</span></div>{onSelect && <button type="button" className="secondary-button min-h-9" onClick={() => onSelect(resident)}>View details<FiArrowRight size={13} /></button>}</div></article>)}</div>
  return <div className="@container">
    <div className="hidden grid-cols-[minmax(130px,1.2fr)_minmax(130px,1fr)_minmax(110px,.8fr)_minmax(140px,1fr)_minmax(110px,.8fr)_minmax(220px,1.5fr)] gap-3 border-b border-line bg-soft px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted @4xl:grid dark:border-night-line dark:bg-night-soft"><span>Household holder</span><span>Contact</span><span>Household</span><span>Next of kin</span><span>Account setup</span><span>Actions</span></div>
    <div className="divide-y divide-line dark:divide-night-line">{residents.map((resident) => <article key={resident.id} className="grid min-w-0 gap-3 p-4 @4xl:grid-cols-[minmax(130px,1.2fr)_minmax(130px,1fr)_minmax(110px,.8fr)_minmax(140px,1fr)_minmax(110px,.8fr)_minmax(220px,1.5fr)] @4xl:items-center @4xl:gap-3 sm:p-5">
      <div className="min-w-0"><b className="block truncate text-sm font-semibold">{resident.name}</b><span className="mt-1 block text-xs text-muted">{resident.isHouseholdHolder ? 'Household holder' : 'Resident'}{resident.committeeMember ? ' · Committee member' : ''}</span></div>
      <div className="min-w-0"><span className="flex items-center gap-1.5 truncate text-xs text-muted"><FiMail size={12} />{resident.email}</span><span className="mt-1 flex items-center gap-1.5 text-xs text-muted"><FiPhone size={12} />{resident.phone}</span></div>
      <div className="text-xs"><b className="font-semibold">{resident.unit}</b><span className="mt-1 block text-muted">{resident.householdSize} members · {resident.occupancy}</span></div>
      <div className="min-w-0 text-xs"><b className="block truncate font-semibold">{resident.nextOfKin?.name || 'Not added'}</b><span className="mt-1 block truncate text-muted">{resident.nextOfKin?.email || resident.nextOfKin?.phone || 'No contact details'}</span></div>
      <div className="text-xs"><span className={`status-pill ${resident.mustResetPassword ? 'status-warning' : 'status-info'}`}>{resident.accountStatus || 'Account setup pending'}</span>{resident.mustResetPassword && <span className="mt-1 block text-[10px] text-muted">Password reset on first sign-in</span>}</div>
      {(onManage || onSelect || onToggleAccess || (onReshareSetupLink && resident.mustResetPassword && resident.membershipStatus === 'ACTIVE')) && <div className="flex flex-wrap gap-1.5 @4xl:justify-end">{(onManage || onSelect) && <button type="button" className="secondary-button min-h-10 px-2.5 text-[11px]" onClick={() => onManage ? onManage('details', resident) : onSelect(resident)}>View / edit<FiArrowRight size={13} /></button>}{onToggleAccess && <button type="button" className={`secondary-button min-h-10 px-2.5 text-[11px] ${resident.membershipStatus === 'ACTIVE' ? 'text-red-700 dark:text-red-300' : ''}`} onClick={() => toggleAccess(resident)} disabled={accessBusyId === resident.id}>{resident.membershipStatus === 'ACTIVE' ? <FiUserX size={13} /> : <FiUserCheck size={13} />}{accessBusyId === resident.id ? 'Updating…' : resident.membershipStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'}</button>}{onReshareSetupLink && resident.mustResetPassword && resident.membershipStatus === 'ACTIVE' && <button type="button" className="secondary-button min-h-10 px-2.5 text-[11px]" onClick={() => onReshareSetupLink(resident)} disabled={linkBusy}><FiKey size={13} />{linkBusy ? 'Creating…' : 'Share setup link'}</button>}</div>}
    </article>)}</div>
    {accessError && <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-xs text-red-800 dark:bg-red-950/40 dark:text-red-200">{accessError}</p>}
  </div>
}
