import { useEffect, useState } from 'react'
import { FiAward, FiCheck, FiClock, FiSearch, FiUsers } from 'react-icons/fi'
import { api } from '../../../api.js'
import { EmptyState } from '../../../shared/components/EmptyState.jsx'
import { PageSkeleton } from '../../../shared/components/LoadingSkeleton.jsx'

export function ResidentElectionsPage({ polls, onVote, loading = false, error = '', onRetry }) {
  const [choices, setChoices] = useState({})
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [membersError, setMembersError] = useState('')
  const [membersRefresh, setMembersRefresh] = useState(0)
  const [memberSearch, setMemberSearch] = useState('')
  const [memberPage, setMemberPage] = useState(1)
  const open = polls.filter((poll) => poll.status === 'Open')
  const closed = polls.filter((poll) => poll.status !== 'Open')
  const matchingMembers = members.filter((member) => `${member.name} ${member.role} ${member.household}`.toLowerCase().includes(memberSearch.trim().toLowerCase()))
  const membersPerPage = 10
  const memberPages = Math.max(1, Math.ceil(matchingMembers.length / membersPerPage))
  const visibleMembers = matchingMembers.slice((memberPage - 1) * membersPerPage, memberPage * membersPerPage)

  useEffect(() => {
    let active = true
    api.listCommitteeMembers()
      .then((items) => { if (active) { setMembers(items); setMembersError('') } })
      .catch((requestError) => { if (active) setMembersError(requestError.message || 'The committee roster could not be loaded.') })
      .finally(() => { if (active) setMembersLoading(false) })
    return () => { active = false }
  }, [membersRefresh])

  if (loading) return <PageSkeleton label="Loading committee" />
  if (error) return <section className="surface-card p-5"><p className="text-sm text-red-700">{error}</p><button className="secondary-button mt-3" onClick={onRetry}>Try again</button></section>

  return <section className="grid w-full content-start gap-5">
    <article className="surface-card overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-4 dark:border-night-line sm:p-5">
        <div><p className="section-kicker">YOUR ESTATE COMMUNITY</p><h2 className="mt-1 text-lg font-bold">Meet your committee</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted">See the residents serving on the committee and the households they represent.</p></div>
        <button className="secondary-button shrink-0" onClick={() => document.getElementById('committee-elections')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><FiAward size={15} />Elections {open.length > 0 && <span className="ml-1 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-800 dark:bg-brand-950 dark:text-brand-200">{open.length} open</span>}</button>
      </header>
      <div className="grid gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-sm font-bold">Committee members</h3><p className="mt-1 text-xs text-muted">Active representatives for verified households.</p></div><span className="text-xs font-semibold text-muted">{members.length} serving</span></div>
        {membersLoading ? <PageSkeleton label="Loading committee members" /> : membersError ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30"><p className="text-sm text-red-800 dark:text-red-200">{membersError}</p><button className="secondary-button mt-3" onClick={() => setMembersRefresh((value) => value + 1)}>Try again</button></div> : members.length ? <>
          <label className="relative block max-w-md"><FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={15} /><input className="form-control pl-9" type="search" value={memberSearch} onChange={(event) => { setMemberSearch(event.target.value); setMemberPage(1) }} placeholder="Search by name or household" aria-label="Search committee members" /></label>
          {visibleMembers.length ? <div className="overflow-hidden rounded-xl border border-line dark:border-night-line"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-line text-left dark:divide-night-line"><thead className="bg-soft dark:bg-night-soft"><tr>{['Committee member', 'Role', 'Household'].map((label) => <th key={label} scope="col" className="whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted sm:px-5">{label}</th>)}</tr></thead><tbody className="divide-y divide-line dark:divide-night-line">{visibleMembers.map((member) => <tr key={member.id} className="hover:bg-soft/60 dark:hover:bg-night-soft/60"><td className="whitespace-nowrap px-4 py-3 text-sm font-semibold sm:px-5">{member.name}</td><td className="whitespace-nowrap px-4 py-3 text-xs text-muted sm:px-5">{member.role}</td><td className="whitespace-nowrap px-4 py-3 text-xs text-muted sm:px-5">{member.household}</td></tr>)}</tbody></table></div><footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 dark:border-night-line sm:px-5"><span className="text-xs text-muted">Showing {((memberPage - 1) * membersPerPage) + 1}–{Math.min(memberPage * membersPerPage, matchingMembers.length)} of {matchingMembers.length}</span><div className="flex items-center gap-2"><button type="button" className="secondary-button min-h-9" disabled={memberPage <= 1} onClick={() => setMemberPage((page) => Math.max(1, page - 1))}>Previous</button><span className="text-xs text-muted">Page {memberPage} of {memberPages}</span><button type="button" className="secondary-button min-h-9" disabled={memberPage >= memberPages} onClick={() => setMemberPage((page) => Math.min(memberPages, page + 1))}>Next</button></div></footer></div> : <p className="rounded-xl border border-dashed border-line p-5 text-sm text-muted dark:border-night-line">No committee members match “{memberSearch}”.</p>}
        </> : <EmptyState icon={FiUsers} title="No committee members listed" text="Committee representatives will appear here when appointed or elected." />}
      </div>
    </article>

    <section id="committee-elections" className="grid scroll-mt-5 gap-4">
      <header className="flex flex-wrap items-end justify-between gap-2"><div><p className="section-kicker">COMMUNITY VOTING</p><h2 className="mt-1 text-base font-bold">Committee elections</h2><p className="mt-1 text-sm text-muted">Vote in an open election and review previous results.</p></div>{open.length > 0 && <span className="status-pill status-info">{open.length} voting open</span>}</header>
      {open.length === 0 && <article className="surface-card p-4"><h3 className="text-sm font-bold">No open elections</h3><p className="mt-1 text-sm text-muted">There are no committee ballots accepting votes right now.</p></article>}
      {open.map((poll) => {
        const voted = Boolean(poll.myVote)
        return <article key={poll.id} className="surface-card overflow-hidden"><header className="border-b border-line p-4 dark:border-night-line sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="status-pill status-info">Voting open</span><span className="inline-flex flex-wrap items-center gap-1.5 text-xs text-muted"><FiClock size={13} />Closes {poll.closesAt}<span className="px-1">·</span>{poll.totalVotes} votes cast</span></div><h3 className="mt-2 text-base font-bold">{poll.title}</h3><p className="mt-1 text-sm leading-6 text-muted">{poll.description}</p><p className="mt-2 text-xs text-muted">Vote totals refresh automatically while this page is open.</p></header><div className="grid gap-2 p-4 sm:p-5">{poll.candidates.map((candidate) => <label key={candidate.id} className={`flex min-h-14 items-center gap-3 rounded-lg border px-3 ${choices[poll.id] === candidate.id ? 'border-brand-700 bg-brand-50 dark:bg-brand-950/40' : 'border-line dark:border-night-line'} ${voted || poll.isCandidate ? 'cursor-default' : 'cursor-pointer'}`}><input type="radio" name={`election-${poll.id}`} checked={voted ? candidate.id === poll.myVote : choices[poll.id] === candidate.id} disabled={voted || poll.isCandidate} onChange={() => setChoices((items) => ({ ...items, [poll.id]: candidate.id }))} /><span className="grid size-8 place-items-center rounded-full bg-soft text-brand-700 dark:bg-night-soft dark:text-brand-300"><FiUsers size={15} /></span><span className="min-w-0 flex-1"><b className="block text-sm">{candidate.name}</b><small className="text-xs text-muted">{candidate.household}</small></span><span className="whitespace-nowrap text-xs font-semibold text-muted">{candidate.votes} vote{candidate.votes === 1 ? '' : 's'}</span></label>)}</div><footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 dark:border-night-line sm:px-5">{voted ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-800 dark:text-green-200"><FiCheck size={14} />Your vote is recorded and locked</span> : poll.isCandidate ? <span className="text-xs text-amber-800 dark:text-amber-200">You are a candidate in this election. You can view the live tally but cannot vote.</span> : <span className="text-xs text-muted">One vote per resident account. Votes cannot be changed.</span>}<button disabled={voted || poll.isCandidate || !choices[poll.id]} className="primary-button disabled:cursor-not-allowed disabled:opacity-50" onClick={() => onVote(poll.id, choices[poll.id])}>{voted ? 'Vote submitted' : poll.isCandidate ? 'Candidate cannot vote' : 'Submit vote'}</button></footer></article>
      })}
      {closed.length > 0 && <div className="grid gap-3 sm:grid-cols-2">{closed.map((poll) => <article key={poll.id} className="surface-card p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><span className={`status-pill ${poll.status === 'Tie - review' ? 'status-warning' : 'status-done'}`}>{poll.status === 'Tie - review' ? 'Tie under review' : 'Election closed'}</span><span className="text-xs text-muted">{poll.totalVotes} votes</span></div><h3 className="mt-2 text-sm font-bold">{poll.title}</h3>{poll.winnerId ? <p className="mt-1 text-sm text-muted">Elected committee member: <b>{poll.candidates.find((candidate) => candidate.id === poll.winnerId)?.name}</b></p> : <p className="mt-1 text-sm text-muted">The result is tied and awaiting an admin decision.</p>}<div className="mt-3 grid gap-1.5 border-t border-line pt-3 dark:border-night-line">{poll.candidates.map((candidate) => <div key={candidate.id} className="flex items-center justify-between gap-2 text-xs"><span className="min-w-0 truncate text-muted">{candidate.name}</span><b>{candidate.votes} vote{candidate.votes === 1 ? '' : 's'}</b></div>)}</div></article>)}</div>}
    </section>
  </section>
}
