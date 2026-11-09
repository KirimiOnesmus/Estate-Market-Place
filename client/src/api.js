import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'
let csrfToken = ''

function csrfCookie() {
  if (typeof document === 'undefined') return ''
  const entry = document.cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith('pavilion_csrf='))
  if (!entry) return ''
  try { return decodeURIComponent(entry.slice('pavilion_csrf='.length)) } catch { return '' }
}

const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

http.interceptors.request.use((config) => {
  const method = (config.method || 'get').toUpperCase()
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const token = csrfToken || csrfCookie()
    if (token) config.headers.set('X-CSRF-Token', token)
  }
  return config
})

http.interceptors.response.use((response) => response, (requestError) => {
  const apiError = requestError.response?.data?.error
  if (apiError?.message) requestError.message = apiError.message
  if (apiError?.code) requestError.code = apiError.code
  if (apiError?.details) requestError.details = apiError.details
  return Promise.reject(requestError)
})

async function request(path, config = {}) {
  const response = await http.request({ url: path, ...config })
  return response.data?.data
}

export const api = {
  getPlatformOverview: () => request('/platform/overview'),
  getPlatformSettings: () => request('/platform/settings'),
  updatePlatformSettings: (values) => request('/platform/settings', { method: 'PUT', data: values }),
  listPlatformAuditEvents: () => request('/platform/audit-events'),
  listPlatformSupportCases: () => request('/platform/support-cases'),
  updatePlatformSupportCase: (id, values) => request(`/platform/support-cases/${encodeURIComponent(id)}`, { method: 'PATCH', data: values }),
  addPlatformSupportComment: (id, message) => request(`/platform/support-cases/${encodeURIComponent(id)}/comments`, { method: 'POST', data: { message } }),
  createSupportCase: (values) => request('/support-cases', { method: 'POST', data: values }),
  listPlatformEstates: () => request('/platform/estates'),
  listPlatformAccounts: () => request('/platform/accounts'),
  createPlatformAccount: (values) => request('/platform/accounts', { method: 'POST', data: values }),
  updatePlatformAccount: (membershipId, values) => request(`/platform/accounts/${encodeURIComponent(membershipId)}`, { method: 'PUT', data: values }),
  updatePlatformAccountAccess: (membershipId, status) => request(`/platform/accounts/${encodeURIComponent(membershipId)}/access`, { method: 'PATCH', data: { status } }),
  createPlatformAccountSetupLink: (membershipId) => request(`/platform/accounts/${encodeURIComponent(membershipId)}/setup-link`, { method: 'POST', data: {} }),
  createPlatformEstate: (values) => request('/platform/estates', { method: 'POST', data: values }),
  updatePlatformEstate: (id, values) => request(`/platform/estates/${encodeURIComponent(id)}`, { method: 'PUT', data: values }),
  updatePlatformEstateAccess: (id, accessStatus) => request(`/platform/estates/${encodeURIComponent(id)}/access`, { method: 'PATCH', data: { accessStatus } }),
  login: async (values) => {
    const data = await request('/auth/login', { method: 'POST', data: values })
    csrfToken = data.csrfToken || ''
    return data
  },
  selectEstate: async (estateId) => {
    const data = await request('/auth/select-estate', { method: 'POST', data: { estateId } })
    csrfToken = data.csrfToken || ''
    return data
  },
  currentSession: () => request('/auth/me'),
  validatePasswordSetup: (token) => request(`/auth/setup-password/${encodeURIComponent(token)}`),
  completePasswordSetup: (token, password) => request(`/auth/setup-password/${encodeURIComponent(token)}`, { method: 'POST', data: { password } }),
  logout: async () => {
    const data = await request('/auth/logout', { method: 'POST', data: {} })
    csrfToken = ''
    return data
  },
  createRegistrationInvitation: (expiresInDays = 7) => request('/admin/registration-invitations', {
    method: 'POST', data: { expiresInDays },
  }),
  getEstateAdminOverview: () => request('/admin/overview'),
  listEstateHouseholds: () => request('/admin/households'),
  createEstateHousehold: (values) => request('/admin/households', { method: 'POST', data: values }),
  listLocations: () => request('/admin/locations'),
  createLocation: ({ name, type }) => request('/admin/locations', {
    method: 'POST', data: { label: name, locationType: type.toUpperCase() },
  }),
  listRegistrationRequests: () => request('/admin/registration-requests?page=1&limit=50'),
  approveRegistration: (id) => request(`/admin/registration-requests/${encodeURIComponent(id)}/approve`, { method: 'POST', data: {} }),
  declineRegistration: (id, note) => request(`/admin/registration-requests/${encodeURIComponent(id)}/decline`, { method: 'POST', data: note?.trim() ? { note: note.trim() } : {} }),
  listCampaigns: () => request('/campaigns'),
  listCommitteeCampaigns: () => request('/committee/campaigns'),
  createCampaign: (values) => request('/admin/campaigns', { method: 'POST', data: values }),
  updateCampaign: (id, values) => request(`/admin/campaigns/${encodeURIComponent(id)}`, { method: 'PUT', data: values }),
  publishCampaign: (id) => request(`/admin/campaigns/${encodeURIComponent(id)}/publish`, { method: 'POST', data: {} }),
  voteOnCampaign: (id, decision, reason) => request(`/committee/campaigns/${encodeURIComponent(id)}/votes`, { method: 'POST', data: { decision, ...(reason ? { reason } : {}) } }),
  listCommitteeHistory: () => request('/committee/history'),
  listElections: (admin = false) => request(admin ? '/admin/elections' : '/elections'),
  listMarketplaceListings: (admin = false) => request(admin ? '/admin/marketplace/listings' : '/marketplace/listings'),
  createMarketplaceListing: (values) => request('/marketplace/listings', { method: 'POST', data: values }),
  reviewMarketplaceListing: (id, status) => request(`/admin/marketplace/listings/${encodeURIComponent(id)}`, { method: 'PATCH', data: { status } }),
  listNotices: (admin = false) => request(admin ? '/admin/notices' : '/notices'),
  createNotice: (values) => request('/admin/notices', { method: 'POST', data: values }),
  updateNotice: (id, values) => request(`/admin/notices/${encodeURIComponent(id)}`, { method: 'PUT', data: values }),
  deleteNotice: (id) => request(`/admin/notices/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  listIssueReports: () => request('/issues'),
  createIssueReport: (values) => request('/issues', { method: 'POST', data: values }),
  updateIssueReport: (id, status, message) => request(`/admin/issues/${encodeURIComponent(id)}`, { method: 'PATCH', data: { status, message } }),
  createElection: (values) => request('/admin/elections', { method: 'POST', data: values }),
  closeElection: (id) => request(`/admin/elections/${encodeURIComponent(id)}/close`, { method: 'POST', data: {} }),
  resolveElection: (id, candidateId) => request(`/admin/elections/${encodeURIComponent(id)}/resolve`, { method: 'POST', data: { candidateId } }),
  voteInElection: (id, candidateId) => request(`/elections/${encodeURIComponent(id)}/vote`, { method: 'POST', data: { candidateId } }),
  validateRegistrationInvitation: (token) => request(`/register/${encodeURIComponent(token)}`),
  submitRegistration: (token, values) => request(`/register/${encodeURIComponent(token)}`, { method: 'POST', data: values }),
}
