export const initialPlatformData = {
  estates: [
    { id: 'EST-001', name: 'Pavilion Court', location: 'Membley Estate, Kiambu', accessStatus: 'Active', billingStatus: 'Current', created: '1 Oct 2026' },
  ],
  accounts: [
    { id: 'SYS-001', name: 'Platform operator', email: 'platform@pavilioncourt.example', role: 'Super Admin', estateId: '', accessStatus: 'Active', source: 'platform', locked: true },
  ],
  supportCases: [
    { id: 'SUP-1042', subject: 'Resident invitation email not received', estate: 'Pavilion Court', requester: 'Estate Admin', requesterEmail: 'amara@example.invalid', priority: 'Normal', status: 'Open', updated: 'Today, 9:20 am', description: 'New residents are not receiving their account invitation email after the estate admin creates their account. Please check delivery status and advise on next steps.', comments: [{ author: 'Estate Admin', message: 'This has affected two new household registrations.', time: 'Today, 9:20 am' }] },
    { id: 'SUP-1038', subject: 'Committee member cannot access workspace', estate: 'Pavilion Court', requester: 'Estate Admin', requesterEmail: 'amara@example.invalid', priority: 'High', status: 'In progress', updated: 'Yesterday, 3:45 pm', description: 'A newly elected committee member is unable to open the committee workspace after signing in.', comments: [{ author: 'Estate Admin', message: 'The election was closed yesterday and the member can still access Resident space.', time: 'Yesterday, 2:10 pm' }, { author: 'Platform operator', message: 'Checking the role assignment sync.', time: 'Yesterday, 3:45 pm' }] },
    { id: 'SUP-1029', subject: 'Marketplace photo upload guidance', estate: 'Pavilion Court', requester: 'Resident', requesterEmail: 'miriam@example.invalid', priority: 'Low', status: 'Resolved', updated: '3 Nov 2026', description: 'Resident asked for help adding multiple photos to a marketplace listing.', comments: [{ author: 'Platform operator', message: 'Shared the listing photo requirements and upload steps.', time: '3 Nov 2026' }] },
  ],
  auditEvents: [
    { id: 'AUD-0081', actor: 'Platform operator', action: 'Reviewed estate workspace access', target: 'Pavilion Court', time: 'Today, 9:14 am', type: 'Access' },
    { id: 'AUD-0080', actor: 'Estate Admin', action: 'Published a resident notice', target: 'Pavilion Court', time: 'Today, 8:42 am', type: 'Estate activity' },
    { id: 'AUD-0079', actor: 'Platform operator', action: 'Updated support case status', target: 'SUP-1038', time: 'Yesterday, 3:45 pm', type: 'Support' },
    { id: 'AUD-0078', actor: 'Committee member', action: 'Recorded campaign approval', target: 'A safer walk home', time: '5 Nov 2026, 11:02 am', type: 'Estate activity' },
    { id: 'AUD-0077', actor: 'Estate Admin', action: 'Approved a resident account', target: 'Pavilion Court', time: '4 Nov 2026, 4:30 pm', type: 'Estate activity' },
    { id: 'AUD-0076', actor: 'Platform operator', action: 'Signed in to the platform', target: 'Platform', time: '4 Nov 2026, 8:05 am', type: 'Access' },
  ],
  settings: { platformName: 'Pavilion Court Community', supportEmail: 'support@pavilioncourt.example', maintenanceMode: false },
}
