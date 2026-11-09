import { useId, useState } from 'react'
import { FiArrowLeft, FiPlus, FiTrash2, FiUserCheck } from 'react-icons/fi'

export function CreatePollPage({ residents, onCancel, onCreate }) {
  const id = useId()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [closesAt, setClosesAt] = useState('')
  const [householdId, setHouseholdId] = useState('')
  const [candidates, setCandidates] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const addCandidate = () => {
    const resident = residents.find((item) => item.id === householdId)
    if (!resident) { setError('Choose a registered household.'); return }
    if (candidates.some((candidate) => candidate.householdId === householdId)) { setError('That household is already in this election.'); return }
    setCandidates((items) => [...items, { id: crypto.randomUUID(), name: resident.name, householdId, household: resident.unit }])
    setHouseholdId('')
    setError('')
  }
  const submit = async (event) => {
    event.preventDefault()
    if (!title.trim() || !description.trim() || !closesAt || candidates.length < 2) { setError(candidates.length < 2 ? 'Add at least two household candidates.' : 'Complete all election details.'); return }
    setSaving(true)
    setError('')
    try {
      await onCreate({ title: title.trim(), description: description.trim(), closesAt, candidates })
    } catch (requestError) { setError(requestError.message) } finally { setSaving(false) }
  }
  return <section className="w-full"><form noValidate onSubmit={submit} className="surface-card p-4 sm:p-6" aria-busy={saving}><div className="mb-5 border-b border-line pb-4 dark:border-night-line"><h2 className="text-base font-bold">Election details</h2><p className="mt-1 text-sm text-muted">Each candidate is the verified household representative selected below.</p></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="field-label" htmlFor={`${id}-title`}>Election title</label><input id={`${id}-title`} className="form-control" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. 2026 Committee Election" required /></div><div><label className="field-label" htmlFor={`${id}-closes`}>Voting closes</label><input id={`${id}-closes`} className="form-control" type="date" value={closesAt} onChange={(event) => setClosesAt(event.target.value)} required /></div><div className="sm:col-span-2"><label className="field-label" htmlFor={`${id}-description`}>Poll description</label><textarea id={`${id}-description`} className="form-control min-h-24 resize-y" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Explain the committee positions or term this election will fill." required /></div></div><div className="mt-7 border-b border-line pb-3 dark:border-night-line"><h3 className="text-sm font-bold">Candidates</h3><p className="mt-1 text-xs text-muted">Choose at least two verified households.</p></div><div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"><div><label className="field-label" htmlFor={`${id}-household`}>Household representative</label><select id={`${id}-household`} className="form-control" value={householdId} onChange={(event) => setHouseholdId(event.target.value)}><option value="">Select household</option>{residents.map((resident) => <option key={resident.id} value={resident.id}>{resident.unit} · {resident.name}</option>)}</select></div><button type="button" className="secondary-button" onClick={addCandidate}><FiPlus size={15} />Add candidate</button></div>{candidates.length > 0 && <div className="mt-4 divide-y divide-line rounded-lg border border-line px-3 dark:divide-night-line dark:border-night-line">{candidates.map((candidate) => <div key={candidate.id} className="flex items-center gap-3 py-3"><span className="grid size-8 place-items-center rounded-full bg-soft text-brand-700 dark:bg-night-soft dark:text-brand-300"><FiUserCheck size={15} /></span><span className="min-w-0 flex-1"><b className="block text-sm">{candidate.name}</b><small className="text-xs text-muted">{candidate.household}</small></span><button type="button" className="icon-button" aria-label={`Remove ${candidate.name}`} onClick={() => setCandidates((items) => items.filter((item) => item.id !== candidate.id))}><FiTrash2 size={15} /></button></div>)}</div>}{error && <p role="alert" className="field-error mt-3">{error}</p>}<p className="mt-5 rounded-lg bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200">Each active household account can cast one vote. Closing the election records the winner as a committee member.</p><div className="mt-6 flex flex-col-reverse gap-2 border-t border-line pt-4 dark:border-night-line sm:flex-row sm:justify-end"><button type="button" className="secondary-button" onClick={onCancel}><FiArrowLeft size={15} />Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Creating…' : 'Open poll for residents'}</button></div></form></section>
}
