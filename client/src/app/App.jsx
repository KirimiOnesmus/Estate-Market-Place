import { useEffect, useMemo, useState } from 'react'
import { FiHome, FiPlus } from 'react-icons/fi'
import { navigationByRole, headingFor } from './navigation.js'
import { initialCampaigns, initialEstateLocations, initialListings, initialNotices, initialReports, initialResidents, initialResidentDirectory } from '../data/previewData.js'
import { AppShell } from '../shared/components/AppShell.jsx'
import { PageHeader } from '../shared/components/PageHeader.jsx'
import { Toast } from '../shared/components/Toast.jsx'
import { CreateEntityPage } from '../shared/pages/CreateEntityPage.jsx'
import { ResidentOverviewPage } from '../features/resident/pages/OverviewPage.jsx'  
import { MarketplacePage } from '../features/resident/pages/MarketplacePage.jsx'
import { FundraisersPage } from '../features/resident/pages/FundraisersPage.jsx'
import { NoticesPage } from '../features/resident/pages/NoticesPage.jsx'
import { IssuesPage } from '../features/resident/pages/IssuesPage.jsx'
import { AdminOverviewPage } from '../features/admin/pages/OverviewPage.jsx'
import { AdminCampaignsPage } from '../features/admin/pages/CampaignsPage.jsx'
import { ResidentApprovalsPage } from '../features/admin/pages/ResidentApprovalsPage.jsx'
import { AdminIssuesPage } from '../features/admin/pages/IssuesPage.jsx'
import { ResidentDirectoryPage } from '../features/admin/pages/ResidentDirectoryPage.jsx'
import { AddResidentPage } from '../features/admin/pages/AddResidentPage.jsx'
import { LocationsPage } from '../features/admin/pages/LocationsPage.jsx'
import { AddLocationPage } from '../features/admin/pages/AddLocationPage.jsx'
import { AdminNoticesPage } from '../features/admin/pages/NoticesPage.jsx'
import { CreateNoticePage } from '../features/admin/pages/CreateNoticePage.jsx'
import { RegistrationLinkPage } from '../features/admin/pages/RegistrationLinkPage.jsx'
import { SelfRegistrationPage } from '../features/resident/pages/SelfRegistrationPage.jsx'
import { LoginPage } from '../features/resident/pages/LoginPage.jsx'
import { CampaignDetailsPage } from '../features/admin/pages/CampaignDetailsPage.jsx'
import { CampaignProgressPage } from '../features/admin/pages/CampaignProgressPage.jsx'
import { CampaignPaymentPage } from '../features/resident/pages/CampaignPaymentPage.jsx'
import { MarketplaceReviewPage } from '../features/admin/pages/MarketplaceReviewPage.jsx'
import { MarketplaceListingDetailsPage } from '../features/admin/pages/MarketplaceListingDetailsPage.jsx'
import { ListingDetailsPage } from '../features/resident/pages/ListingDetailsPage.jsx'
import { MarketplaceCartPage } from '../features/resident/pages/MarketplaceCartPage.jsx'
import { ResidentServicesPage } from '../features/resident/pages/ResidentServicesPage.jsx'
import { CreatePollPage } from '../features/admin/pages/CreatePollPage.jsx'
import { ElectionsPage } from '../features/admin/pages/ElectionsPage.jsx'
import { ResidentElectionsPage } from '../features/resident/pages/ElectionsPage.jsx'
import { CommitteeOverviewPage } from '../features/committee/pages/OverviewPage.jsx'
import { CampaignVotesPage } from '../features/committee/pages/CampaignVotesPage.jsx'
import { DecisionHistoryPage } from '../features/committee/pages/DecisionHistoryPage.jsx'
import { SuperAdminOverviewPage } from '../features/super-admin/pages/OverviewPage.jsx'
import { PlatformEstatesPage } from '../features/super-admin/pages/EstatesPage.jsx'
import { PlatformAccountsPage } from '../features/super-admin/pages/AccountsPage.jsx'
import { PlatformSupportPage } from '../features/super-admin/pages/SupportPage.jsx'
import { PlatformAuditPage } from '../features/super-admin/pages/AuditPage.jsx'
import { PlatformSettingsPage } from '../features/super-admin/pages/SettingsPage.jsx'
import { PlatformAccountFormPage } from '../features/super-admin/pages/AccountFormPage.jsx'
import { PlatformEstateFormPage } from '../features/super-admin/pages/EstateFormPage.jsx'
import { PlatformSupportDetailsPage } from '../features/super-admin/pages/SupportDetailsPage.jsx'
import { initialPlatformData } from '../features/super-admin/data/platformData.js'

export default function App() {
  const [role, setRole] = useState(() => window.location.pathname === '/register' ? 'resident' : resolveSignedInRole())
  const [page, setPage] = useState(() => window.location.pathname === '/register' ? 'self-register' : window.location.pathname === '/login' ? 'login' : 'home')
  const [theme, setTheme] = useState(() => window.localStorage.getItem('pavilion-theme') || 'light')
  const [textSize, setTextSize] = useState(() => window.localStorage.getItem('pavilion-text-size') || 'standard')
  const [pageWidth, setPageWidth] = useState(() => window.localStorage.getItem('pavilion-page-width') || 'standard')
  const [listings, setListings] = useState(initialListings)
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [notices, setNotices] = useState(initialNotices)
  const [reports, setReports] = useState(initialReports)
  const [savedIds, setSavedIds] = useState([])
  const [cart, setCart] = useState([])
  const [purchases, setPurchases] = useState([])
  const [toastMessage, setToastMessage] = useState('')
  const [residents, setResidents] = useState(initialResidentDirectory)
  const [residentRequests, setResidentRequests] = useState(initialResidents)
  const [locations, setLocations] = useState(initialEstateLocations)
  const [selectedCampaignId, setSelectedCampaignId] = useState(null)
  const [selectedListingId, setSelectedListingId] = useState(null)
  const [elections, setElections] = useState([])
  const [supportCases, setSupportCases] = useState(initialPlatformData.supportCases)
  const [platformAuditEvents, setPlatformAuditEvents] = useState(initialPlatformData.auditEvents)
  const [platformAccounts, setPlatformAccounts] = useState(initialPlatformData.accounts)
  const [platformEstates, setPlatformEstates] = useState(loadEstatePreviews)
  const [platformSettings, setPlatformSettings] = useState(initialPlatformData.settings)
  const [selectedPlatformAccount, setSelectedPlatformAccount] = useState(null)
  const [selectedPlatformEstate, setSelectedPlatformEstate] = useState(null)
  const [selectedSupportCaseId, setSelectedSupportCaseId] = useState(null)
  const [selectedNotice, setSelectedNotice] = useState(null)

  useEffect(() => {
    window.localStorage.setItem('pavilion-theme', theme)
    window.localStorage.setItem('pavilion-text-size', textSize)
    window.localStorage.setItem('pavilion-page-width', pageWidth)
    document.documentElement.dataset.textSize = textSize
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && media.matches))
    applyTheme()
    media.addEventListener('change', applyTheme)
    return () => media.removeEventListener('change', applyTheme)
  }, [theme, textSize, pageWidth])

  useEffect(() => {
    try { window.localStorage.setItem('pavilion-estate-workspaces', JSON.stringify(platformEstates)) } catch { /* Preview changes stay available in memory when browser storage is full. */ }
  }, [platformEstates])

  useEffect(() => {
    const syncRoleFromPath = () => {
      if (window.location.pathname === '/register') { setRole('resident'); setPage('self-register'); return }
      if (window.location.pathname === '/login') { setRole('resident'); setPage('login'); return }
      const nextRole = roleFromPath(window.location.pathname)
      if (nextRole) {
        setRole(nextRole)
        setPage('home')
      }
    }
    const initialPathRole = roleFromPath(window.location.pathname)
    if (!initialPathRole && !['/register', '/login'].includes(window.location.pathname)) window.history.replaceState({}, '', `/${role}`)
    window.addEventListener('popstate', syncRoleFromPath)
    return () => window.removeEventListener('popstate', syncRoleFromPath)
  }, [role])

  useEffect(() => {
    document.title = `${headingFor(role, page)[1]} — Pavilion Court`
  }, [role, page])

  const notify = (message) => setToastMessage(message)
  const recordPlatformAudit = (action, target, type = 'Platform access') => setPlatformAuditEvents((items) => [{ id: `AUD-${crypto.randomUUID().slice(0, 8)}`, actor: 'Platform operator', action, target, time: 'Just now', type }, ...items])
  const updateSupportCase = (id, updates) => setSupportCases((items) => items.map((item) => item.id === id ? { ...item, ...(typeof updates === 'string' ? { status: updates } : updates), updated: 'Updated just now' } : item))
  const addSupportComment = (id, message) => { setSupportCases((items) => items.map((item) => item.id === id ? { ...item, comments: [...(item.comments || []), { author: 'Platform operator', message, time: 'Just now' }], updated: 'Updated just now' } : item)); recordPlatformAudit('Added a support comment', id, 'Support') }
  const savePlatformAccount = (account) => { const existed = account.source === 'resident' || platformAccounts.some((item) => item.id === account.id); if (account.source === 'resident') { setResidents((items) => items.map((item) => item.id === account.id ? { ...item, name: account.name, email: account.email, phone: account.phone, estateId: account.estateId, platformRole: account.role } : item)) } else { setPlatformAccounts((items) => existed ? items.map((item) => item.id === account.id ? account : item) : [account, ...items]) } setSelectedPlatformAccount(null); navigate('platform-accounts'); recordPlatformAudit(existed ? 'Updated a platform account' : 'Created a platform account', account.email); notify('Platform account saved in this preview.') }
  const togglePlatformAccountAccess = (account) => { const accessStatus = account.accessStatus === 'Active' ? 'Revoked' : 'Active'; if (account.source === 'resident') setResidents((items) => items.map((item) => item.id === account.id ? { ...item, accessStatus } : item)); else setPlatformAccounts((items) => items.map((item) => item.id === account.id ? { ...item, accessStatus } : item)); recordPlatformAudit(`${accessStatus} account access`, account.email); notify(`${account.name} access ${accessStatus === 'Active' ? 'restored' : 'revoked'} in this preview.`) }
  const deletePlatformAccount = (account) => { if (account.source === 'resident') setResidents((items) => items.map((item) => item.id === account.id ? { ...item, accountRemoved: true, accessStatus: 'Removed' } : item)); else setPlatformAccounts((items) => items.filter((item) => item.id !== account.id)); recordPlatformAudit('Deleted a platform account', account.email); notify(`${account.name} account deleted in this preview.`) }
  const savePlatformEstate = (estate) => { const existed = platformEstates.some((item) => item.id === estate.id); setPlatformEstates((items) => existed ? items.map((item) => item.id === estate.id ? estate : item) : [estate, ...items]); setSelectedPlatformEstate(null); navigate('platform-estates'); recordPlatformAudit(existed ? 'Updated an estate workspace' : 'Created an estate workspace', estate.name, 'Estate access'); notify(`${estate.name} saved in this preview.`) }
  const togglePlatformEstateAccess = (estate) => { const accessStatus = estate.accessStatus === 'Suspended' ? 'Active' : 'Suspended'; setPlatformEstates((items) => items.map((item) => item.id === estate.id ? { ...item, accessStatus } : item)); recordPlatformAudit(`${accessStatus === 'Active' ? 'Restored' : 'Suspended'} estate access`, estate.name, 'Estate access'); notify(`${estate.name} access ${accessStatus === 'Active' ? 'restored' : 'suspended'} in this preview.`) }
  const deletePlatformEstate = (estate) => { setPlatformEstates((items) => items.filter((item) => item.id !== estate.id)); setPlatformAccounts((items) => items.map((item) => item.estateId === estate.id ? { ...item, accessStatus: 'Revoked' } : item)); setResidents((items) => items.map((item) => (item.estateId || 'EST-001') === estate.id ? { ...item, accessStatus: 'Revoked' } : item)); recordPlatformAudit('Deleted an estate workspace and revoked linked access', estate.name, 'Estate access'); notify(`${estate.name} removed and related preview access revoked.`) }
  const navigate = (nextPage) => {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }
  const changeRole = (nextRole) => {
    if (!navigationByRole[nextRole] || nextRole === role) return
    window.history.pushState({}, '', `/${nextRole}`)
    setRole(nextRole)
    setPage('home')
    window.scrollTo({ top: 0, behavior: 'auto' })
  }
  const navItems = role === 'super-admin' || role === 'resident' ? navigationByRole[role] : navigationByRole[role].some((item) => item.id === 'resident-space') ? navigationByRole[role] : [...navigationByRole[role], { id: 'resident-space', label: 'Resident space', icon: FiHome }]
  const unreadCount = notices.filter((notice) => notice.unread).length
  const filteredListings = useMemo(() => listings, [listings])
  const selectedCampaign = campaigns.find((campaign) => campaign.id === selectedCampaignId)
  const selectedListing = listings.find((listing) => listing.id === selectedListingId)
  const completePurchase = (listing, quantity, paymentMethod) => {
    const available = listing.quantity ?? 1
    if (quantity > available) { notify('The available quantity changed. Please update your order.'); return }
    const order = { id: `ORD-${crypto.randomUUID().slice(0, 8)}`, listingId: listing.id, title: listing.title, quantity, amount: listing.price * quantity, paymentMethod, status: 'Paid (preview)', date: new Date().toLocaleString() }
    const remaining = available - quantity
    setPurchases((items) => [order, ...items])
    setListings((items) => items.map((item) => item.id === listing.id ? { ...item, quantity: remaining, status: remaining === 0 ? 'Sold' : item.status } : item))
    setCart((items) => items.filter((item) => item.listingId !== listing.id))
    notify(`Order ${order.id} recorded. ${remaining === 0 ? 'The listing has been removed because it is sold out.' : `${remaining} item${remaining === 1 ? '' : 's'} remain.`}`)
  }
  const addToCart = (listing, quantity) => { setCart((items) => { const found = items.find((item) => item.listingId === listing.id); const nextQuantity = (found?.quantity || 0) + quantity; if (nextQuantity > (listing.quantity ?? 1)) { notify('There is not enough stock for that cart quantity.'); return items } return found ? items.map((item) => item.listingId === listing.id ? { ...item, quantity: nextQuantity } : item) : [...items, { listingId: listing.id, quantity }] }); notify(`${listing.title} added to your cart.`) }
  const removeResident = (resident) => { setResidents((items) => items.filter((item) => item.id !== resident.id)); notify(`${resident.name} was removed from the directory in this preview.`) }
  const resetResidentPassword = (resident) => { setResidents((items) => items.map((item) => item.id === resident.id ? { ...item, accountStatus: 'OTP reset pending', mustResetPassword: true } : item)); notify(`Password reset recorded for ${resident.email}. No OTP was sent in this preview.`) }
  const promoteNextOfKin = (resident) => { const kin = resident.nextOfKin; setResidents((items) => items.map((item) => item.id === resident.id ? { ...item, name: kin.name, email: kin.email, phone: kin.phone, nextOfKin: { name: resident.name, email: resident.email, phone: resident.phone }, accountStatus: 'OTP setup pending', mustResetPassword: true } : item)); notify(`${kin.name} was promoted as household representative in this preview.`) }
  const addResidentAssessments = (resident) => setCampaigns((items) => items.map((campaign) => campaign.status === 'Live' && campaign.beneficiaryType === 'estate' && campaign.householdContribution > 0 ? { ...campaign, contributions: [...(campaign.contributions || []), { residentId: resident.id, resident: resident.name, unit: resident.unit, assessed: campaign.householdContribution, payments: [] }] } : campaign))
  const addContributionPrompt = (campaignId, residentId, amount, phone) => { setCampaigns((items) => items.map((campaign) => { if (campaign.id !== campaignId) return campaign; const payment = { id: `PAY-${crypto.randomUUID().slice(0, 8)}`, residentId, amount, phone, date: 'Prompt sent just now', status: 'Prompt sent' }; if (campaign.beneficiaryType === 'estate') return { ...campaign, contributions: campaign.contributions.map((account) => account.residentId !== residentId ? account : { ...account, payments: [...account.payments, payment] }) }; return { ...campaign, donations: [...(campaign.donations || []), { ...payment, resident: 'Amara Kimani' }] } })); notify('Payment prompt recorded in this preview. No mobile money prompt was sent.') }
  const confirmContributionPayment = (campaignId, residentId, paymentId) => { setCampaigns((items) => items.map((campaign) => { if (campaign.id !== campaignId) return campaign; let paymentAmount = 0; let nextCampaign; if (campaign.beneficiaryType === 'estate') { const contributions = campaign.contributions.map((account) => account.residentId !== residentId ? account : { ...account, payments: account.payments.map((payment) => { if (payment.id !== paymentId || payment.status !== 'Prompt sent') return payment; paymentAmount = payment.amount; return { ...payment, status: 'Paid', date: 'Paid just now' } }) }); nextCampaign = { ...campaign, contributions } } else { const donations = (campaign.donations || []).map((payment) => { if (payment.id !== paymentId || payment.residentId !== residentId || payment.status !== 'Prompt sent') return payment; paymentAmount = payment.amount; return { ...payment, status: 'Paid', date: 'Paid just now' } }); nextCampaign = { ...campaign, donations } } if (!paymentAmount) return campaign; const raised = campaign.raised + paymentAmount; return { ...nextCampaign, raised, updated: 'Payment recorded just now', progressUpdates: [...(campaign.progressUpdates || []), { label: 'Resident payment recorded', date: 'Today', raised }] } })); notify('Payment recorded in this preview. Connect a payment provider to verify real transactions.') }
  const submitElectionVote = (pollId, candidateId) => { setElections((items) => items.map((poll) => { if (poll.id !== pollId || poll.status !== 'Open' || poll.voterIds.includes('R-124')) return poll; return { ...poll, candidates: poll.candidates.map((candidate) => candidate.id === candidateId ? { ...candidate, votes: candidate.votes + 1 } : candidate), voterIds: [...poll.voterIds, 'R-124'], votesByResident: { ...poll.votesByResident, 'R-124': candidateId } } })); notify('Your vote was recorded in this preview.') }
  const closeElection = (poll, resolvedWinnerId) => { const highest = Math.max(...poll.candidates.map((candidate) => candidate.votes)); const winners = poll.candidates.filter((candidate) => candidate.votes === highest); if (!resolvedWinnerId && (highest === 0 || winners.length !== 1)) { setElections((items) => items.map((item) => item.id === poll.id ? { ...item, status: 'Tie - review' } : item)); notify('Election closed without a single winner; admin review is needed.'); return } const winner = poll.candidates.find((candidate) => candidate.id === resolvedWinnerId) || winners[0]; if (!winner) return; setElections((items) => items.map((item) => item.id === poll.id ? { ...item, status: 'Closed', winnerId: winner.id } : item)); setResidents((items) => items.map((resident) => resident.id === winner.residentId ? { ...resident, role: 'committee', committeeMember: true } : resident)); notify(`${winner.name} is elected and marked for committee dashboard access in this preview.`) }

  const resolvePage = () => {
    if (page === 'home' && role === 'resident') return <ResidentOverviewPage listings={listings} notices={notices} reports={reports} savedIds={savedIds} toggleSaved={(id) => setSavedIds((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])} navigate={navigate} notify={notify} />
    if (page === 'home' && role === 'admin') return <AdminOverviewPage reports={reports} notices={notices} residents={residents} residentRequests={residentRequests} campaigns={campaigns} listings={listings} navigate={navigate} />
    if (page === 'home' && role === 'committee') return <CommitteeOverviewPage navigate={navigate} />
    if (page === 'home' && role === 'super-admin') return <SuperAdminOverviewPage residents={residents} requests={residentRequests} listings={listings} campaigns={campaigns} supportCases={supportCases} estates={platformEstates} accounts={platformAccounts} navigate={navigate} />
    if (page === 'platform-estates' && role === 'super-admin') return <PlatformEstatesPage estates={platformEstates} administrators={Object.fromEntries(platformEstates.map((estate) => { const accountAdmin = platformAccounts.find((account) => account.estateId === estate.id && account.role === 'Estate Admin' && account.accessStatus !== 'Revoked'); const residentAdmin = residents.find((resident) => (resident.estateId || 'EST-001') === estate.id && resident.platformRole === 'Estate Admin' && resident.accessStatus !== 'Revoked'); return [estate.id, accountAdmin || residentAdmin] }))} accountCounts={Object.fromEntries(platformEstates.map((estate) => [estate.id, new Set([...platformAccounts.filter((account) => account.estateId === estate.id).map((account) => account.email), ...residents.filter((resident) => !resident.accountRemoved && (resident.estateId || 'EST-001') === estate.id).map((resident) => resident.email)].filter(Boolean)).size]))} onAdd={() => { setSelectedPlatformEstate(null); navigate('platform-estate-new') }} onEdit={(estate) => { setSelectedPlatformEstate(estate); navigate('platform-estate-edit') }} onDelete={deletePlatformEstate} onToggleAccess={togglePlatformEstateAccess} />
    if (page === 'platform-estate-new' && role === 'super-admin') return <PlatformEstateFormPage onCancel={() => navigate('platform-estates')} onSave={savePlatformEstate} />
    if (page === 'platform-estate-edit' && role === 'super-admin') return <PlatformEstateFormPage estate={selectedPlatformEstate} onCancel={() => navigate('platform-estates')} onSave={savePlatformEstate} />
    if (page === 'platform-accounts' && role === 'super-admin') return <PlatformAccountsPage residents={residents} accounts={platformAccounts} estates={platformEstates} onAdd={() => { setSelectedPlatformAccount(null); navigate('platform-account-new') }} onEdit={(account) => { setSelectedPlatformAccount(account); navigate('platform-account-edit') }} onToggleAccess={togglePlatformAccountAccess} onDelete={deletePlatformAccount} />
    if (page === 'platform-account-new' && role === 'super-admin') return <PlatformAccountFormPage estates={platformEstates} onCancel={() => navigate('platform-accounts')} onSave={savePlatformAccount} />
    if (page === 'platform-account-edit' && role === 'super-admin') return <PlatformAccountFormPage account={selectedPlatformAccount} estates={platformEstates} onCancel={() => navigate('platform-accounts')} onSave={savePlatformAccount} />
    if (page === 'platform-support' && role === 'super-admin') return <PlatformSupportPage cases={supportCases} onUpdate={(id, status) => { updateSupportCase(id, status); recordPlatformAudit('Updated support case status', id, 'Support'); notify('Support case status updated in this preview.') }} onView={(item) => { setSelectedSupportCaseId(item.id); navigate('platform-support-detail') }} />
    if (page === 'platform-support-detail' && role === 'super-admin') return <PlatformSupportDetailsPage supportCase={supportCases.find((item) => item.id === selectedSupportCaseId)} onBack={() => navigate('platform-support')} onUpdate={(id, updates) => { updateSupportCase(id, updates); recordPlatformAudit('Updated support case', id, 'Support'); notify('Support case updated in this preview.') }} onComment={(id, message) => { addSupportComment(id, message); notify('Comment added to the support case.') }} />
    if (page === 'platform-audit' && role === 'super-admin') return <PlatformAuditPage events={platformAuditEvents} />
    if (page === 'platform-settings' && role === 'super-admin') return <PlatformSettingsPage settings={platformSettings} onSave={(settings) => { setPlatformSettings(settings); notify('Platform settings saved in this preview.') }} />
    if (page === 'resident-space' && role !== 'resident') return <ResidentServicesPage navigate={navigate} />
    if (page === 'marketplace-review' && role === 'admin') return <MarketplaceReviewPage listings={listings} onView={(listing) => { setSelectedListingId(listing.id); navigate('marketplace-detail') }} onApprove={(listing) => { setListings((items) => items.map((item) => item.id === listing.id ? { ...item, status: 'Approved' } : item)); notify('Listing approved for the marketplace in this preview.') }} onRemove={(listing) => { setListings((items) => items.map((item) => item.id === listing.id ? { ...item, status: 'Removed' } : item)); notify('Listing removed from resident marketplace in this preview.') }} />
    if (page === 'marketplace-detail' && role === 'admin') return <MarketplaceListingDetailsPage listing={selectedListing} navigate={navigate} onApprove={(listing) => { setListings((items) => items.map((item) => item.id === listing.id ? { ...item, status: 'Approved' } : item)); notify('Listing approved for the marketplace in this preview.') }} onRemove={(listing) => { setListings((items) => items.map((item) => item.id === listing.id ? { ...item, status: 'Removed' } : item)); navigate('marketplace-review'); notify('Listing removed from resident marketplace in this preview.') }} />
    if (page === 'marketplace') { const visibleListings = filteredListings.filter((listing) => listing.status !== 'Pending review' && listing.status !== 'Removed' && listing.status !== 'Sold' && (listing.quantity ?? 1) > 0); return <MarketplacePage listings={visibleListings} savedIds={savedIds} toggleSaved={(id) => setSavedIds((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])} onCreate={() => navigate('listing-new')} notify={notify} onView={(listing) => { setSelectedListingId(listing.id); navigate('marketplace-item') }} onCart={() => navigate('marketplace-cart')} cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} /> }
    if (page === 'marketplace-item') return <ListingDetailsPage listing={selectedListing} navigate={navigate} onPurchase={completePurchase} onAddToCart={addToCart} onBid={(listing, amount) => { setListings((items) => items.map((item) => item.id === listing.id ? { ...item, bids: [...(item.bids || []), { amount, resident: 'Amara Kimani', date: new Date().toLocaleString(), status: 'Pending seller response' }] } : item)); notify('Your bid was recorded in this preview.') }} />
    if (page === 'marketplace-cart') return <MarketplaceCartPage cart={cart} listings={listings} purchases={purchases} navigate={navigate} onRemove={(listingId) => setCart((items) => items.filter((item) => item.listingId !== listingId))} onCheckout={(items) => { items.forEach((item) => completePurchase(item.listing, item.quantity, item.paymentMethod)); setCart([]) }} />
    if (page === 'fundraisers') return <FundraisersPage campaigns={campaigns} onContribute={(campaign) => { setSelectedCampaignId(campaign.id); navigate('campaign-payment') }} />
    if (page === 'campaign-payment') return <CampaignPaymentPage campaign={selectedCampaign} navigate={navigate} onPrompt={addContributionPrompt} onConfirm={confirmContributionPayment} />
    if (page === 'notices' && role === 'admin') return <AdminNoticesPage notices={notices} navigate={navigate} onEdit={(notice) => { setSelectedNotice(notice); navigate('notice-edit') }} onDelete={(notice) => { setNotices((items) => items.filter((item) => item.id !== notice.id)); notify('Notice deleted from resident views in this preview.') }} />
    if (page === 'notices') return <NoticesPage notices={notices} />
    if (page === 'issues' && role === 'admin') return <AdminIssuesPage reports={reports} onUpdate={(id, status, message) => { setReports((items) => items.map((item) => item.id === id ? { ...item, status, updated: 'Updated just now', update: message, updates: [...(item.updates || []), { status, message, when: 'Updated just now' }] } : item)); notify('Issue status and resident report updated in this preview.') }} />
    if (page === 'issues') return <IssuesPage reports={reports} />
    if (page === 'campaigns') return <AdminCampaignsPage campaigns={campaigns} setCampaigns={setCampaigns} notify={notify} onView={(campaign, destination) => { setSelectedCampaignId(campaign.id); navigate(destination) }} />
    if (page === 'campaign-detail') return <CampaignDetailsPage campaign={selectedCampaign} navigate={navigate} />
    if (page === 'campaign-progress') return <CampaignProgressPage campaign={selectedCampaign} navigate={navigate} />
    if (page === 'elections' && role === 'admin') return <ElectionsPage polls={elections} navigate={navigate} onClosePoll={closeElection} />
    if (page === 'elections') return <ResidentElectionsPage polls={elections} onVote={submitElectionVote} />
    if (page === 'poll-new' && role === 'admin') return <CreatePollPage residents={residents} onCancel={() => navigate('elections')} onCreate={(poll) => { setElections((items) => [poll, ...items]); navigate('elections'); notify('Committee election is open for resident votes.') }} />
    if (page === 'campaign-edit' && selectedCampaign) return <CreateEntityPage type="campaign" initialEntity={selectedCampaign} residents={residents} onCancel={() => navigate('campaign-detail')} onCreate={(campaign) => { const prepared = campaign.beneficiaryType === 'estate' ? { ...campaign, contributions: syncContributionLedger(campaign, residents) } : campaign; setCampaigns((items) => items.map((item) => item.id === campaign.id ? prepared : item)); navigate('campaign-detail'); notify('Campaign details updated in this preview.') }} />
    if (page === 'residents' && role === 'admin') return <ResidentDirectoryPage residents={residents} requestCount={residentRequests.length} navigate={navigate} onRemoveResident={removeResident} onResetPassword={resetResidentPassword} onPromoteNextOfKin={promoteNextOfKin} />
    if (page === 'locations' && role === 'admin') return <LocationsPage locations={locations} navigate={navigate} />
    if (page === 'location-new' && role === 'admin') return <AddLocationPage onCancel={() => navigate('locations')} onCreate={(location) => { setLocations((items) => [...items, location]); navigate('locations'); notify(`${location.type} added in this preview.`) }} />
    if (page === 'registration-link' && role === 'admin') return <RegistrationLinkPage onCancel={() => navigate('residents')} onPreview={(link) => { window.history.pushState({}, '', `${link.replace(window.location.origin, '')}`); setPage('self-register') }} />
    if (page === 'self-register') return <SelfRegistrationPage estate={activeEstate} locations={locations} existingHouseholds={[...residents, ...residentRequests]} onSubmit={(request) => { setResidentRequests((items) => [request, ...items]); window.history.replaceState({}, '', '/resident'); setRole('resident'); setPage('home'); notify('Household registration request submitted in this preview.') }} />
    if (page === 'login') return <LoginPage estate={activeEstate} />
    if (page === 'resident-approvals' && role === 'admin') return <ResidentApprovalsPage requests={residentRequests} setRequests={setResidentRequests} notify={notify} onApprove={(request) => { const resident = { ...request, isHouseholdHolder: true, accountStatus: 'OTP setup pending', mustResetPassword: true, status: 'Verified' }; setResidents((items) => [resident, ...items]); addResidentAssessments(resident) }} />
    if (page === 'resident-new' && role === 'admin') return <AddResidentPage locations={locations} existingHouseholds={[...residents, ...residentRequests]} onCancel={() => navigate('residents')} onCreate={(resident) => { setResidents((items) => [resident, ...items]); addResidentAssessments(resident); navigate('residents'); notify('Household added. OTP setup will be available when email and authentication are connected.') }} />
    if (page === 'listing-new') return <CreateEntityPage type="listing" onCancel={() => navigate('marketplace')} onCreate={(listing) => { setListings((items) => [listing, ...items]); navigate('marketplace'); notify('Listing submitted for admin review in this preview.') }} />
    if (page === 'issue-new') return <CreateEntityPage type="issue" onCancel={() => navigate('issues')} onCreate={(report) => { setReports((items) => [report, ...items]); navigate('issues'); notify('Issue report added in this preview.') }} />
    if (page === 'campaign-new' && role === 'admin') return <CreateEntityPage type="campaign" residents={residents} onCancel={() => navigate('campaigns')} onCreate={(campaign) => { const prepared = campaign.beneficiaryType === 'estate' ? { ...campaign, contributions: buildContributionLedger(residents, campaign.householdContribution) } : campaign; setCampaigns((items) => [prepared, ...items]); setSelectedCampaignId(prepared.id); navigate('campaign-detail'); notify('Campaign draft saved in this preview.') }} />
    if (page === 'notice-new' && role === 'admin') return <CreateNoticePage onCancel={() => navigate('notices')} onSave={(notice) => { setNotices((items) => [notice, ...items]); navigate('notices'); notify('Notice published to resident views in this preview.') }} />
    if (page === 'notice-edit' && role === 'admin') return <CreateNoticePage initialNotice={selectedNotice} onCancel={() => navigate('notices')} onSave={(notice) => { setNotices((items) => items.map((item) => item.id === notice.id ? notice : item)); setSelectedNotice(null); navigate('notices'); notify('Notice updated in resident views in this preview.') }} />
    if (page === 'votes') return <CampaignVotesPage notify={notify} campaigns={campaigns} setCampaigns={setCampaigns} />
    if (page === 'history') return <DecisionHistoryPage />
    return null
  }

  const pageAction = role === 'admin' && page === 'campaigns'
    ? { label: 'Create campaign', icon: FiPlus, onClick: () => navigate('campaign-new') }
      : role === 'admin' && page === 'issues'
        ? { label: 'Report an issue', icon: FiPlus, onClick: () => navigate('issue-new') }
      : role === 'admin' && page === 'notices'
        ? { label: 'Create notice', icon: FiPlus, onClick: () => navigate('notice-new') }
      : role === 'resident' && page === 'issues'
      ? { label: 'Report an issue', icon: FiPlus, onClick: () => navigate('issue-new') }
      : role === 'super-admin' && page === 'platform-estates'
        ? { label: 'Add estate', icon: FiPlus, onClick: () => { setSelectedPlatformEstate(null); navigate('platform-estate-new') } }
      : undefined
  const currentHeading = headingFor(role, page)
  const activeEstate = platformEstates.find((item) => item.id === 'EST-001') || platformEstates[0] || initialPlatformData.estates[0]

  if (page === 'self-register') return <><SelfRegistrationPage estate={activeEstate} locations={locations} existingHouseholds={[...residents, ...residentRequests]} onSubmit={(request) => { setResidentRequests((items) => [request, ...items]); window.history.replaceState({}, '', '/resident'); setRole('resident'); setPage('home'); notify('Household registration request submitted in this preview.') }} /><Toast message={toastMessage} onDismiss={() => setToastMessage('')} /></>
  if (page === 'login') return <LoginPage estate={activeEstate} />
  return <AppShell estate={activeEstate} role={role} page={page} pageLabel={currentHeading[1]} navItems={navItems} unreadCount={unreadCount} onNavigate={navigate} onRoleChange={changeRole} theme={theme} onThemeChange={setTheme} textSize={textSize} onTextSizeChange={setTextSize} pageWidth={pageWidth} onPageWidthChange={setPageWidth} onOpenNotices={() => { setNotices((items) => items.map((notice) => ({ ...notice, unread: false }))); navigate('notices') }}>
    <div className={`${pageWidth === 'standard' ? 'mx-auto max-w-[1440px]' : 'w-full'} px-4 pb-24 pt-7 sm:px-7 sm:pt-9 xl:px-10 xl:pb-10`}>
      <PageHeader heading={currentHeading} action={pageAction} />
      <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs leading-5 text-slate-700 dark:border-night-line dark:bg-night-soft dark:text-slate-200 sm:mb-7"><span className="font-semibold">Preview workspace.</span><span>Content and actions use sample data and stay in this browser.</span></div>
      {resolvePage()}
    </div>
    <Toast message={toastMessage} onDismiss={() => setToastMessage('')} />
  </AppShell>
}

function resolveSignedInRole() {
  if (window.location.pathname === '/login' || window.location.pathname === '/register') return 'resident'
  const pathRole = roleFromPath(window.location.pathname)
  if (pathRole) return pathRole
  const signedInRole = window.pavilionSession?.user?.role
  const normalizedRole = typeof signedInRole === 'string' ? signedInRole.toLowerCase().replaceAll('_', '-') : ''
  return navigationByRole[normalizedRole] ? normalizedRole : 'resident'
}

function loadEstatePreviews() {
  try {
    const saved = window.localStorage.getItem('pavilion-estate-workspaces')
    if (saved) { const estates = JSON.parse(saved); if (Array.isArray(estates)) return estates }
  } catch { /* Fall back to the sample estate when browser storage is unavailable. */ }
  return initialPlatformData.estates
}
 
function roleFromPath(pathname) {
  const pathRole = pathname.split('/').filter(Boolean)[0]?.toLowerCase().replaceAll('_', '-')
  return navigationByRole[pathRole] ? pathRole : null
}

function buildContributionLedger(residents, assessed) {
  return residents.map((resident) => ({ residentId: resident.id, resident: resident.name, unit: resident.unit, assessed: Number(assessed) || 0, payments: [] }))
}

function syncContributionLedger(campaign, residents) {
  const existing = campaign.contributions || []
  return residents.map((resident) => {
    const previous = existing.find((account) => account.residentId === resident.id)
    return { residentId: resident.id, resident: resident.name, unit: resident.unit, assessed: Number(campaign.householdContribution) || 0, payments: previous?.payments || [] }
  })
}
