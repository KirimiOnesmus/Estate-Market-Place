export function PaymentInstructions({ method, details }) {
  if (!details) return <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">The seller has not added payment details for this method.</p>
  const rows = method === 'Bank transfer'
    ? [['Bank', details.bankName], ['Account name', details.accountName], ['Account number', details.accountNumber], ['Branch', details.branch]]
    : [['Pay to', details.accountName], [details.method === 'paybill' ? 'Paybill number' : details.method === 'till' ? 'Till number' : 'M-Pesa number', details.method === 'paybill' ? details.paybill : details.method === 'till' ? details.till : details.phone], ...(details.method === 'paybill' ? [['Account reference', details.accountReference]] : [])]
  return <dl className="mt-3 grid gap-2 rounded-lg bg-soft p-3 dark:bg-night-soft">{rows.filter(([, value]) => value).map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs"><dt className="text-muted">{label}</dt><dd className="font-semibold text-right">{value}</dd></div>)}</dl>
}
