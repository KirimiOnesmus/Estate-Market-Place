import { FiDroplet, FiShield, FiUsers } from 'react-icons/fi'

export const listingCategories = ['All listings', 'Furniture', 'Kids & family', 'Services', 'Home & living']

export const initialListings = [
  { id: 1, title: 'Solid wood dining table', category: 'Furniture', price: 8500, owner: 'Miriam K.', unit: 'Block C · 04', initials: 'MK', status: 'Approved' },
  { id: 2, title: 'Kids bicycle, 16 inch', category: 'Kids & family', price: 3200, owner: 'Brian O.', unit: 'Block A · 12', initials: 'BO', status: 'Approved' },
  { id: 3, title: 'Weekend cake orders', category: 'Services', price: 1500, owner: 'Njeri W.', unit: 'Block B · 09', initials: 'NW', status: 'Approved' },
  { id: 4, title: 'Two bedside lamps', category: 'Home & living', price: 2400, owner: 'Peter M.', unit: 'Block D · 02', initials: 'PM', status: 'Approved' },
]

export const initialNotices = [
  { id: 1, category: 'Facilities', title: 'Water supply maintenance', text: 'Water will be off briefly while the team repairs the main tank valve.', date: 'Friday, 6 November', time: '9:00–11:00 am', icon: FiDroplet, unread: true },
  { id: 2, category: 'Community', title: 'Residents’ meeting next week', text: 'Join the committee to discuss courtyard improvements and year-end plans.', date: 'Sunday, 8 November', time: '10:30 am · Community room', icon: FiUsers, unread: true },
  { id: 3, category: 'Security', title: 'Gate access reminder', text: 'Please keep your resident access card handy when entering the estate.', date: 'Tuesday, 3 November', time: 'Estate-wide notice', icon: FiShield, unread: false },
]

export const initialReports = [
  { id: 'PC-028', title: 'Light out near Block C entrance', category: 'Shared spaces', status: 'In progress', updated: 'Updated 2 hours ago', location: 'Block C entrance walkway', update: 'The maintenance team has scheduled a replacement for this afternoon.' },
  { id: 'PC-026', title: 'Leaking tap in ground-floor washroom', category: 'Plumbing', status: 'Received', updated: 'Updated yesterday', location: 'Block A, ground-floor washroom', update: 'The estate admin has received the report and is arranging a plumber.' },
  { id: 'PC-021', title: 'Garden waste collection', category: 'Cleaning & waste', status: 'Resolved', updated: 'Closed 30 Oct', location: 'Courtyard garden', update: 'Garden waste was collected by the estate team.' },
]

export const initialCampaigns = [
  { id: 'C-014', title: 'Courtyard garden', purpose: 'Plant shade trees and create a shared herb garden for residents.', target: 75000, raised: 42600, beneficiary: 'Pavilion Court', beneficiaryType: 'estate', householdContribution: 10000, contributions: [{ residentId: 'R-124', resident: 'Amara Kimani', unit: 'Block C · 08', assessed: 10000, payments: [{ id: 'PAY-21', amount: 10000, phone: '+254 712 345 678', date: '3 Nov 2026', status: 'Paid' }] }, { residentId: 'R-123', resident: 'Miriam Kariuki', unit: 'Block C · 04', assessed: 10000, payments: [{ id: 'PAY-22', amount: 10000, phone: '+254 722 130 450', date: '3 Nov 2026', status: 'Paid' }] }, { residentId: 'R-122', resident: 'Brian Otieno', unit: 'Block A · 12', assessed: 10000, payments: [{ id: 'PAY-23', amount: 7600, phone: '+254 711 223 440', date: '4 Nov 2026', status: 'Paid' }] }, { residentId: 'R-121', resident: 'Njeri Wambui', unit: 'Block B · 09', assessed: 10000, payments: [{ id: 'PAY-24', amount: 5000, phone: '+254 701 781 325', date: '4 Nov 2026', status: 'Paid' }] }, { residentId: 'R-120', resident: 'Peter Mwangi', unit: 'Block D · 02', assessed: 10000, payments: [{ id: 'PAY-25', amount: 5000, phone: '+254 733 090 214', date: '4 Nov 2026', status: 'Paid' }] }, { residentId: 'R-119', resident: 'Amina Kilonzo', unit: 'Block A · 07', assessed: 10000, payments: [{ id: 'PAY-26', amount: 5000, phone: '+254 720 613 928', date: '4 Nov 2026', status: 'Paid' }] }], deadline: '18 Nov 2026', status: 'Pending committee approval', updated: 'Published 2 Nov', approvals: 2, rejections: 1 },
  { id: 'C-011', title: 'A safer walk home', purpose: 'Add pathway lighting along the east entrance.', target: 60000, raised: 58200, beneficiary: 'Pavilion Court', beneficiaryType: 'estate', householdContribution: 15000, deadline: '20 Oct 2026', status: 'Live', updated: 'Published 14 Oct', approvals: 3, rejections: 0, contributions: [{ residentId: 'R-124', resident: 'Amara Kimani', unit: 'Block C · 08', assessed: 15000, payments: [{ id: 'PAY-11', amount: 10000, phone: '+254 712 345 678', date: '18 Oct 2026', status: 'Paid' }] }, { residentId: 'R-123', resident: 'Miriam Kariuki', unit: 'Block C · 04', assessed: 15000, payments: [{ id: 'PAY-13', amount: 10000, phone: '+254 722 130 450', date: '21 Oct 2026', status: 'Paid' }] }, { residentId: 'R-122', resident: 'Brian Otieno', unit: 'Block A · 12', assessed: 15000, payments: [{ id: 'PAY-14', amount: 15000, phone: '+254 711 223 440', date: '23 Oct 2026', status: 'Paid' }] }, { residentId: 'R-121', resident: 'Njeri Wambui', unit: 'Block B · 09', assessed: 15000, payments: [{ id: 'PAY-15', amount: 5000, phone: '+254 701 781 325', date: '27 Oct 2026', status: 'Paid' }] }, { residentId: 'R-120', resident: 'Peter Mwangi', unit: 'Block D · 02', assessed: 15000, payments: [{ id: 'PAY-16', amount: 8200, phone: '+254 733 090 214', date: '29 Oct 2026', status: 'Paid' }] }, { residentId: 'R-119', resident: 'Amina Kilonzo', unit: 'Block A · 07', assessed: 15000, payments: [{ id: 'PAY-17', amount: 10000, phone: '+254 720 613 928', date: '1 Nov 2026', status: 'Paid' }] }], progressUpdates: [{ label: 'Fundraising opened', date: '14 Oct 2026', raised: 0 }, { label: 'Community contribution update', date: '24 Oct 2026', raised: 32100 }, { label: 'Latest reported total', date: '5 Nov 2026', raised: 58200 }] },
  { id: 'C-015', title: 'Support for a neighbour', purpose: 'A voluntary fundraiser to help a Pavilion Court household with urgent recovery costs.', target: 30000, raised: 5000, beneficiary: 'A Pavilion Court household', beneficiaryType: 'resident', deadline: '30 Nov 2026', status: 'Live', updated: 'Published 4 Nov', approvals: 3, rejections: 0, donations: [], progressUpdates: [{ label: 'Fundraising opened', date: '4 Nov 2026', raised: 0 }, { label: 'First contribution recorded', date: '5 Nov 2026', raised: 5000 }] },
  { id: 'C-013', title: 'Winter food hamper', purpose: 'Organize food hampers for neighbours who need support.', target: 90000, raised: 0, beneficiary: 'Pavilion Court residents in need', beneficiaryType: 'resident', deadline: '30 Nov 2026', status: 'Needs revision', updated: 'Returned 31 Oct', approvals: 1, rejections: 3 },
]

export const initialResidents = [
  { id: 'R-128', name: 'Judy Wanjiku', email: 'judy@example.invalid', phone: '+254 712 080 128', locationId: 'block-b', unitNumber: '12', unit: 'Block B · 12', occupancy: 'Tenant', householdSize: 3, nextOfKin: { name: 'Kevin Wanjiku', phone: '+254 712 080 129', email: 'kevin@example.invalid' }, submitted: 'Today, 9:12 am' },
  { id: 'R-127', name: 'David Maina', email: 'david@example.invalid', phone: '+254 712 080 127', locationId: 'block-a', unitNumber: '03', unit: 'Block A · 03', occupancy: 'Owner', householdSize: 2, nextOfKin: { name: 'Faith Maina', phone: '+254 712 080 126', email: 'faith@example.invalid' }, submitted: 'Yesterday, 4:40 pm' },
  { id: 'R-125', name: 'Winnie Otieno', email: 'winnie@example.invalid', phone: '+254 712 080 125', locationId: 'block-d', unitNumber: '08', unit: 'Block D · 08', occupancy: 'Tenant', householdSize: 4, nextOfKin: { name: 'Brian Otieno', phone: '+254 712 080 124', email: 'brian@example.invalid' }, submitted: '30 Oct, 11:25 am' },
]

export const initialResidentDirectory = [
  { id: 'R-124', name: 'Amara Kimani', email: 'amara@example.invalid', phone: '+254 712 345 678', locationId: 'block-c', unitNumber: '08', unit: 'Block C · 08', occupancy: 'Owner', householdSize: 3, nextOfKin: { name: 'Daniel Kimani', phone: '+254 712 345 679', email: 'daniel@example.invalid' }, isHouseholdHolder: true, platformRole: 'Estate Admin', accountStatus: 'OTP setup pending', mustResetPassword: true, status: 'Verified' },
  { id: 'R-123', name: 'Miriam Kariuki', email: 'miriam@example.invalid', phone: '+254 722 130 450', locationId: 'block-c', unitNumber: '04', unit: 'Block C · 04', occupancy: 'Tenant', householdSize: 2, nextOfKin: { name: 'Peter Kariuki', phone: '+254 722 130 451', email: 'peter@example.invalid' }, isHouseholdHolder: true, accountStatus: 'Active', mustResetPassword: false, status: 'Verified' },
  { id: 'R-122', name: 'Brian Otieno', email: 'brian.o@example.invalid', phone: '+254 711 223 440', locationId: 'block-a', unitNumber: '12', unit: 'Block A · 12', occupancy: 'Owner', householdSize: 4, nextOfKin: { name: 'Jane Otieno', phone: '+254 711 223 441', email: 'jane@example.invalid' }, isHouseholdHolder: true, accountStatus: 'Active', mustResetPassword: false, status: 'Verified' },
  { id: 'R-121', name: 'Njeri Wambui', email: 'njeri@example.invalid', phone: '+254 701 781 325', locationId: 'block-b', unitNumber: '09', unit: 'Block B · 09', occupancy: 'Tenant', householdSize: 1, nextOfKin: { name: 'Lucy Wambui', phone: '+254 701 781 326', email: 'lucy@example.invalid' }, isHouseholdHolder: true, accountStatus: 'Active', mustResetPassword: false, status: 'Verified' },
  { id: 'R-120', name: 'Peter Mwangi', email: 'peter.m@example.invalid', phone: '+254 733 090 214', locationId: 'block-d', unitNumber: '02', unit: 'Block D · 02', occupancy: 'Owner', householdSize: 2, nextOfKin: { name: 'Maya Mwangi', phone: '+254 733 090 215', email: 'maya@example.invalid' }, isHouseholdHolder: true, accountStatus: 'Active', mustResetPassword: false, status: 'Verified' },
  { id: 'R-119', name: 'Amina Kilonzo', email: 'amina@example.invalid', phone: '+254 720 613 928', locationId: 'block-a', unitNumber: '07', unit: 'Block A · 07', occupancy: 'Tenant', householdSize: 5, nextOfKin: { name: 'Ali Kilonzo', phone: '+254 720 613 929', email: 'ali@example.invalid' }, isHouseholdHolder: true, accountStatus: 'Active', mustResetPassword: false, status: 'Verified' },
]

export const initialEstateLocations = [
  { id: 'block-a', type: 'Block', name: 'Block A' },
  { id: 'block-b', type: 'Block', name: 'Block B' },
  { id: 'block-c', type: 'Block', name: 'Block C' },
  { id: 'block-d', type: 'Block', name: 'Block D' },
]

export const committeeHistory = [
  { initials: 'JM', name: 'James M.', action: 'approved', campaign: 'Courtyard garden', when: 'Today, 11:24 am' },
  { initials: 'NW', name: 'Njeri W.', action: 'rejected', campaign: 'Courtyard garden', when: 'Today, 10:52 am', reason: 'Clarify the maintenance plan.' },
  { initials: 'BO', name: 'Brian O.', action: 'approved', campaign: 'Courtyard garden', when: 'Yesterday, 4:17 pm' },
  { initials: 'AK', name: 'Amina K.', action: 'approved', campaign: 'A safer walk home', when: '12 Oct, 9:08 am' },
]

export function formatMoney(amount) {
  return `KSh ${new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(Number(amount) || 0)}`
}
