import { useState } from 'react'
import { formatMoney } from '../../../data/previewData.js'
import { PaginationControls, PAGE_SIZE } from '../../../shared/components/PaginationControls.jsx'

export function HouseholdContributionsTable({ households, fixedAmount }) {
  const [page, setPage] = useState(1)
  const currentRows = households.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  return <div className="surface-card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-4 dark:border-night-line sm:px-5"><div><p className="section-kicker">HOUSEHOLD CONTRIBUTIONS</p><h2 className="mt-1 text-base font-bold">Assessment and balances</h2></div><span className="text-xs text-muted">Fixed per household: {formatMoney(fixedAmount || 0)}</span></div>{households.length ? <><div className="overflow-x-auto"><table className="min-w-full divide-y divide-line text-left dark:divide-night-line"><thead className="bg-soft dark:bg-night-soft"><tr><Th>Household holder</Th><Th>Unit</Th><Th>Assigned</Th><Th>Paid</Th><Th>Balance</Th></tr></thead><tbody className="divide-y divide-line dark:divide-night-line">{currentRows.map((account) => { const paid = account.payments.filter((payment) => payment.status === 'Paid').reduce((sum, payment) => sum + payment.amount, 0); return <tr key={account.residentId}><Td strong>{account.resident}</Td><Td>{account.unit}</Td><Td>{formatMoney(account.assessed)}</Td><Td>{formatMoney(paid)}</Td><Td><span className={account.assessed > paid ? 'font-semibold text-amber-800 dark:text-amber-200' : 'font-semibold text-green-800 dark:text-green-200'}>{formatMoney(Math.max(0, account.assessed - paid))}</span></Td></tr>})}</tbody></table></div><PaginationControls page={page} total={households.length} onPageChange={setPage} /></> : <p className="p-5 text-sm text-muted">No household assessments are recorded for this campaign.</p>}</div>
}

function Th({ children }) { return <th scope="col" className="whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted sm:px-5">{children}</th> }
function Td({ children, strong = false }) { return <td className={`whitespace-nowrap px-4 py-3.5 text-xs sm:px-5 ${strong ? 'font-semibold text-ink dark:text-night-ink' : 'text-muted'}`}>{children}</td> }
