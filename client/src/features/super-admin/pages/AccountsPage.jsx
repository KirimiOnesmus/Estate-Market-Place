import { useMemo, useState } from 'react'
import { FiCopy, FiEdit2, FiKey, FiPlus, FiSearch, FiShield, FiUserCheck, FiUserX } from 'react-icons/fi'
import { PaginationControls, PAGE_SIZE } from '../../../shared/components/PaginationControls.jsx'
import { DialogFrame } from '../../../shared/components/DialogFrame.jsx'

export function PlatformAccountsPage({ accounts, hasActiveEstate, loading, loadError, onRetry, onAdd, onEdit, onToggleAccess, onSetupLink }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [decision, setDecision] = useState(null)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [setupLink, setSetupLink] = useState(null)
  const [setupBusy, setSetupBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const filtered = useMemo(() => accounts.filter((account) => `${account.name} ${account.email} ${account.phone} ${account.role} ${account.estate} ${account.accessStatus}`.toLowerCase().includes(query.trim().toLowerCase())), [accounts, query])
  const pageAccounts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const confirm = async () => {
    setSaving(true)
    setActionError('')
    try {
      await onToggleAccess(decision.account, decision.nextStatus)
      setDecision(null)
    } catch (requestError) {
      setActionError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const generateSetupLink = async (account) => {
    setSetupBusy(true)
    setActionError('')
    setCopied(false)
    try {
      const result = await onSetupLink(account)
      setSetupLink({ account, url: result.setupUrl, expiresAt: result.expiresAt })
    } catch (requestError) {
      setActionError(requestError.message)
    } finally {
      setSetupBusy(false)
    }
  }

  const copySetupLink = async () => {
    try { await navigator.clipboard.writeText(setupLink.url); setCopied(true) }
    catch { setActionError('Copy was blocked. Select and copy the setup link manually.') }
  }

  return <section className="surface-card w-full overflow-hidden">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 dark:border-night-line sm:p-5"><div><p className="section-kicker">ACCOUNT ACCESS</p><h2 className="mt-1 font-bold">Platform accounts</h2><p className="mt-1 text-xs text-muted">User details and estate memberships from the platform database.</p>{!hasActiveEstate && <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">Create an active estate before adding an estate admin.</p>}</div><div className="flex w-full flex-wrap gap-2 sm:w-auto"><div className="search-field min-w-52 flex-1"><FiSearch size={16} /><label htmlFor="platform-user-search" className="sr-only">Search platform accounts</label><input id="platform-user-search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search name, email, role" /></div><button className="primary-button" onClick={onAdd} disabled={!hasActiveEstate}><FiPlus size={15} />Add estate admin</button></div></header>
    {loadError && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200" role="alert"><span>{loadError}</span><button className="secondary-button min-h-9" onClick={onRetry}>Retry</button></div>}
    <div className="overflow-x-auto"><table className="min-w-full divide-y divide-line text-left dark:divide-night-line"><thead className="bg-soft dark:bg-night-soft"><tr>{['Account', 'Role', 'Workspace', 'Access', 'Actions'].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted sm:px-5">{heading}</th>)}</tr></thead><tbody className="divide-y divide-line dark:divide-night-line">
      {pageAccounts.map((account) => {
        const canToggle = !account.locked && account.userStatus === 'ACTIVE' && ['ACTIVE', 'REMOVED'].includes(account.membershipStatus)
        const isActive = account.membershipStatus === 'ACTIVE'
        return <tr key={account.id}>
          <td className="px-4 py-3.5 sm:px-5"><b className="block text-sm">{account.name}</b><span className="text-xs text-muted">{account.email || 'No email'}{account.phone ? ` · ${account.phone}` : ''}</span>{account.mustResetPassword && <span className="mt-1 block text-[10px] font-medium text-amber-700 dark:text-amber-300">Password setup pending</span>}</td>
          <td className="whitespace-nowrap px-4 py-3.5 text-xs sm:px-5">{account.role}</td>
          <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted sm:px-5">{account.estate}</td>
          <td className="whitespace-nowrap px-4 py-3.5 sm:px-5"><span className={`status-pill ${account.accessStatus === 'Active' ? 'status-done' : account.accessStatus === 'Awaiting estate review' ? 'status-info' : 'status-warning'}`}>{account.accessStatus}</span></td>
          <td className="px-4 py-3.5 sm:px-5"><div className="flex flex-wrap gap-1.5">{!account.locked && <><button className="secondary-button min-h-9 px-2.5 text-[11px]" onClick={() => onEdit(account)}><FiEdit2 size={13} />Edit</button>{account.mustResetPassword && <button className="secondary-button min-h-9 px-2.5 text-[11px]" onClick={() => generateSetupLink(account)} disabled={setupBusy}><FiKey size={13} />Setup link</button>}{canToggle && <button className="secondary-button min-h-9 px-2.5 text-[11px]" onClick={() => { setActionError(''); setDecision({ account, nextStatus: isActive ? 'REMOVED' : 'ACTIVE' }) }}>{isActive ? <FiUserX size={13} /> : <FiUserCheck size={13} />}{isActive ? 'Remove access' : 'Restore access'}</button>}</>}</div></td>
        </tr>
      })}
    </tbody></table></div>
    {loading && accounts.length === 0 ? <p className="p-6 text-center text-sm text-muted" role="status">Loading accounts…</p> : pageAccounts.length ? <PaginationControls page={page} total={filtered.length} onPageChange={setPage} /> : !loadError && <div className="p-7 text-center"><h3 className="text-sm font-semibold">{query ? 'No accounts match this search.' : 'No accounts yet'}</h3><p className="mt-1 text-xs text-muted">Estate administrators and approved household members will appear here.</p></div>}
    <p className="flex items-start gap-2 border-t border-line bg-soft px-4 py-3 text-xs leading-5 text-muted dark:border-night-line dark:bg-night-soft sm:px-5"><FiShield className="mt-0.5 shrink-0" size={14} />Committee appointments remain election-controlled. Removing access only affects the selected estate membership; account history is retained.</p>
    {decision && <DialogFrame titleId="platform-account-decision" onClose={() => !saving && setDecision(null)} className="p-5 sm:max-w-md sm:p-6"><h2 id="platform-account-decision" className="font-bold">{decision.nextStatus === 'REMOVED' ? 'Remove estate access?' : 'Restore estate access?'}</h2><p className="mt-2 text-sm leading-6 text-muted">{decision.nextStatus === 'REMOVED' ? `${decision.account.name} will lose access to ${decision.account.estate}. Their account and other estate memberships will remain.` : `${decision.account.name} will regain access to ${decision.account.estate}.`}</p>{actionError && <p className="field-error mt-3" role="alert">{actionError}</p>}<div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button className="secondary-button" onClick={() => setDecision(null)} disabled={saving}>Cancel</button><button className="primary-button" onClick={confirm} disabled={saving}>{saving ? 'Saving…' : decision.nextStatus === 'REMOVED' ? 'Remove access' : 'Restore access'}</button></div></DialogFrame>}
    {setupLink && <DialogFrame titleId="setup-link-title" onClose={() => { setSetupLink(null); setActionError('') }} className="p-5 sm:max-w-lg sm:p-6"><p className="section-kicker">INITIAL PASSWORD</p><h2 id="setup-link-title" className="mt-1 font-bold">Password setup link</h2><p className="mt-2 text-sm leading-6 text-muted">Share the one-time link with {setupLink.account.name}. It expires {new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(setupLink.expiresAt))}. The system does not send email yet.</p><label className="field-label mt-4" htmlFor="account-setup-url">Setup link</label><div className="flex flex-col gap-2 sm:flex-row"><input id="account-setup-url" className="form-control min-w-0 flex-1" readOnly value={setupLink.url} onFocus={(event) => event.target.select()} /><button className="secondary-button" onClick={copySetupLink}><FiCopy size={14} />{copied ? 'Copied' : 'Copy link'}</button></div>{actionError && <p className="field-error mt-3" role="alert">{actionError}</p>}<p className="mt-3 text-xs text-muted">Generating another link will invalidate the previous setup link.</p></DialogFrame>}
    {actionError && !decision && !setupLink && <p className="sr-only" role="alert">{actionError}</p>}
  </section>
}
