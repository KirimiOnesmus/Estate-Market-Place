import { useEffect, useMemo, useState } from 'react'
import { FiHome, FiPlus } from 'react-icons/fi'
import { navigationByRole, headingFor } from './navigation.js'
import { AppShell } from '../shared/components/AppShell.jsx'
import { PageHeader } from '../shared/components/PageHeader.jsx'
import { Toast } from '../shared/components/Toast.jsx'
import { CreateEntityPage } from '../shared/pages/CreateEntityPage.jsx'
import { ResidentOverviewPage } from '../features/resident/pages/OverviewPage.jsx'  
import { MarketplacePage } from '../features/resident/pages/MarketplacePage.jsx'
import { AddResidentPage } from '../features/admin/pages/AddResidentPage.jsx'
import { FundraisersPage } from '../features/resident/pages/FundraisersPage.jsx'
import { NoticesPage } from '../features/resident/pages/NoticesPage.jsx'
import { IssuesPage } from '../features/resident/pages/IssuesPage.jsx'
import { AdminOverviewPage } from '../features/admin/pages/OverviewPage.jsx'
import { AdminCampaignsPage } from '../features/admin/pages/CampaignsPage.jsx'
import { ResidentApprovalsPage } from '../features/admin/pages/ResidentApprovalsPage.jsx'
import { AdminIssuesPage } from '../features/admin/pages/IssuesPage.jsx'
import { ResidentDirectoryPage } from '../features/admin/pages/ResidentDirectoryPage.jsx'
import { LocationsPage } from '../features/admin/pages/LocationsPage.jsx'
import { AddLocationPage } from '../features/admin/pages/AddLocationPage.jsx'
import { AdminNoticesPage } from '../features/admin/pages/NoticesPage.jsx'
import { CreateNoticePage } from '../features/admin/pages/CreateNoticePage.jsx'
import { RegistrationLinkPage } from '../features/admin/pages/RegistrationLinkPage.jsx'
import { SelfRegistrationPage } from '../features/resident/pages/SelfRegistrationPage.jsx'
import { LoginPage } from '../features/resident/pages/LoginPage.jsx'
import { SetupPasswordPage } from '../features/resident/pages/SetupPasswordPage.jsx'
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
import { CreateSupportCasePage } from '../features/super-admin/pages/CreateSupportCasePage.jsx'
import { api } from '../api.js'

export default function App() {
  const [role, setRole] = useState(() => ['/register', '/login', '/setup-password'].includes(window.location.pathname) ? 'resident' : resolveSignedInRole())
  const [page, setPage] = useState(() => window.location.pathname === '/register' ? 'self-register' : window.location.pathname === '/login' ? 'login' : window.location.pathname === '/setup-password' ? 'setup-password' : 'home')
  const [authenticatedSession, setAuthenticatedSession] = useState(null)
  const [theme, setTheme] = useState(() => window.localStorage.getItem('pavilion-theme') || 'light')
  const [textSize, setTextSize] = useState(() => window.localStorage.getItem('pavilion-text-size') || 'standard')
  const [pageWidth, setPageWidth] = useState(() => window.localStorage.getItem('pavilion-page-width') || 'standard')
  const [listings, setListings] = useState([])
  const [listingStatus, setListingStatus] = useState('loading')
  const [listingError, setListingError] = useState('')
  const [listingRefresh, setListingRefresh] = useState(0)
  const [campaigns, setCampaigns] = useState([])
  const [campaignStatus, setCampaignStatus] = useState('loading')
  const [campaignError, setCampaignError] = useState('')
  const [campaignRefresh, setCampaignRefresh] = useState(0)
  const [notices, setNotices] = useState([])
  const [noticeStatus, setNoticeStatus] = useState('loading')
  const [noticeError, setNoticeError] = useState('')
  const [noticeRefresh, setNoticeRefresh] = useState(0)
  const [reports, setReports] = useState([])
  const [reportStatus, setReportStatus] = useState('loading')
  const [reportError, setReportError] = useState('')
  const [reportRefresh, setReportRefresh] = useState(0)
  const [savedIds, setSavedIds] = useState([])
  const [cart, setCart] = useState([])
  const [purchases, setPurchases] = useState([])
  const [toastMessage, setToastMessage] = useState('')
  const [residents, setResidents] = useState([])
  const [residentRequests, setResidentRequests] = useState([])
  const [locations, setLocations] = useState([])
  const [estateAdminOverview, setEstateAdminOverview] = useState(null)
  const [estateAdminStatus, setEstateAdminStatus] = useState('loading')
  const [estateAdminError, setEstateAdminError] = useState('')
  const [estateAdminRefresh, setEstateAdminRefresh] = useState(0)
  const [selectedCampaignId, setSelectedCampaignId] = useState(null)
  const [selectedListingId, setSelectedListingId] = useState(null)
  const [elections, setElections] = useState([])
  const [electionStatus, setElectionStatus] = useState('loading')
  const [electionError, setElectionError] = useState('')
  const [electionRefresh, setElectionRefresh] = useState(0)
  const [supportCases, setSupportCases] = useState([])
  const [supportStatus, setSupportStatus] = useState('loading')
  const [supportError, setSupportError] = useState('')
  const [supportRefresh, setSupportRefresh] = useState(0)
  const [platformAuditEvents, setPlatformAuditEvents] = useState([])
  const [auditStatus, setAuditStatus] = useState('loading')
  const [auditError, setAuditError] = useState('')
  const [auditRefresh, setAuditRefresh] = useState(0)
  const [platformAccounts, setPlatformAccounts] = useState([])
  const [platformAccountsError, setPlatformAccountsError] = useState('')
  const [platformAccountsStatus, setPlatformAccountsStatus] = useState('loading')
  const [platformAccountsRefresh, setPlatformAccountsRefresh] = useState(0)
  const [platformEstates, setPlatformEstates] = useState([])
  const [platformEstatesError, setPlatformEstatesError] = useState('')
  const [platformEstatesStatus, setPlatformEstatesStatus] = useState('loading')
  const [platformEstatesRefresh, setPlatformEstatesRefresh] = useState(0)
  const [platformOverview, setPlatformOverview] = useState(null)
  const [platformOverviewError, setPlatformOverviewError] = useState('')
  const [platformOverviewStatus, setPlatformOverviewStatus] = useState('loading')
  const [platformOverviewRefresh, setPlatformOverviewRefresh] = useState(0)
  const [platformSettings, setPlatformSettings] = useState(null)
  const [platformSettingsStatus, setPlatformSettingsStatus] = useState('loading')
  const [platformSettingsError, setPlatformSettingsError] = useState('')
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
    if (authenticatedSession?.role !== 'SUPER_ADMIN') return undefined
    let current = true
    api.getPlatformSettings().then((settings) => {
      if (current) { setPlatformSettings(settings); setPlatformSettingsStatus('ready'); setPlatformSettingsError('') }
    }).catch((requestError) => {
      if (current) { setPlatformSettingsError(requestError.message); setPlatformSettingsStatus('error') }
    })
    return () => { current = false }
  }, [authenticatedSession?.role])

  useEffect(() => {
    if (authenticatedSession?.role !== 'SUPER_ADMIN') return undefined
    let current = true
    api.listPlatformSupportCases().then((items) => {
      if (current) { setSupportCases(items.map(toSupportCase)); setSupportStatus('ready'); setSupportError('') }
    }).catch((requestError) => {
      if (current) { setSupportError(requestError.message); setSupportStatus('error') }
    })
    return () => { current = false }
  }, [authenticatedSession?.role, supportRefresh])

  useEffect(() => {
    if (authenticatedSession?.role !== 'SUPER_ADMIN') return undefined
    let current = true
    api.listPlatformAuditEvents().then((items) => {
      if (current) { setPlatformAuditEvents(items.map(toAuditEvent)); setAuditStatus('ready'); setAuditError('') }
    }).catch((requestError) => {
      if (current) { setAuditError(requestError.message); setAuditStatus('error') }
    })
    return () => { current = false }
  }, [authenticatedSession?.role, auditRefresh])

  useEffect(() => {
    if (authenticatedSession?.role !== 'SUPER_ADMIN') return undefined
    let current = true
    api.listPlatformEstates().then((items) => {
      if (current) { setPlatformEstates(items.map(toPlatformEstate)); setPlatformEstatesStatus('ready'); setPlatformEstatesError('') }
    }).catch((requestError) => {
      if (current) { setPlatformEstatesError(requestError.message); setPlatformEstatesStatus('error') }
    })
    return () => { current = false }
  }, [authenticatedSession?.role, platformEstatesRefresh])

  useEffect(() => {
    if (authenticatedSession?.role !== 'SUPER_ADMIN') return undefined
    let current = true
    api.getPlatformOverview().then((data) => {
      if (current) { setPlatformOverview(data); setPlatformOverviewStatus('ready'); setPlatformOverviewError('') }
    }).catch((requestError) => {
      if (current) { setPlatformOverviewError(requestError.message); setPlatformOverviewStatus('error') }
    })
    return () => { current = false }
  }, [authenticatedSession?.role, platformOverviewRefresh])

  useEffect(() => {
    if (authenticatedSession?.role !== 'SUPER_ADMIN') return undefined
    let current = true
    api.listPlatformAccounts().then((items) => {
      if (current) { setPlatformAccounts(items); setPlatformAccountsStatus('ready'); setPlatformAccountsError('') }
    }).catch((requestError) => {
      if (current) { setPlatformAccountsError(requestError.message); setPlatformAccountsStatus('error') }
    })
    return () => { current = false }
  }, [authenticatedSession?.role, platformAccountsRefresh])

  useEffect(() => {
    if (!isEstateAdminSession(authenticatedSession)) return undefined
    let current = true
    Promise.all([api.getEstateAdminOverview(), api.listEstateHouseholds(), api.listRegistrationRequests(), api.listLocations()]).then(([overview, households, requests, estateLocations]) => {
      if (!current) return
      setEstateAdminOverview(overview)
      setResidents(households)
      setResidentRequests(requests.map((item) => ({ ...item, submitted: new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.submitted)) })))
      setLocations(estateLocations.map((item) => ({ id: item.id, name: item.name, type: item.type })))
      setEstateAdminStatus('ready')
      setEstateAdminError('')
    }).catch((requestError) => {
      if (current) { setEstateAdminError(requestError.message); setEstateAdminStatus('error') }
    })
    return () => { current = false }
  }, [authenticatedSession, estateAdminRefresh])

  useEffect(() => {
    if (!authenticatedSession?.estate?.id) return undefined
    let current = true
    const fetchCampaigns = authenticatedSession.role === 'COMMITTEE_MEMBER' ? api.listCommitteeCampaigns() : api.listCampaigns()
    fetchCampaigns.then((items) => {
      if (current) { setCampaigns(items.map(toCampaign)); setCampaignStatus('ready'); setCampaignError('') }
    }).catch((requestError) => {
      if (current) { setCampaignError(requestError.message); setCampaignStatus('error') }
    })
    return () => { current = false }
  }, [authenticatedSession, campaignRefresh])

  useEffect(() => {
    if (!authenticatedSession?.estate?.id) return undefined
    let current = true
    api.listMarketplaceListings(['SUPER_ADMIN', 'ESTATE_ADMIN'].includes(authenticatedSession.role)).then((items) => {
      if (current) { setListings(items); setListingStatus('ready'); setListingError('') }
    }).catch((requestError) => {
      if (current) { setListingError(requestError.message); setListingStatus('error') }
    })
    return () => { current = false }
  }, [authenticatedSession, listingRefresh])

  useEffect(() => {
    if (!authenticatedSession?.estate?.id) return undefined
    let current = true
    const admin = ['SUPER_ADMIN', 'ESTATE_ADMIN'].includes(authenticatedSession.role)
    api.listNotices(admin).then((items) => {
      if (current) { setNotices(items); setNoticeStatus('ready'); setNoticeError('') }
    }).catch((requestError) => {
      if (current) { setNoticeStatus('error'); setNoticeError(requestError.message) }
    })
    return () => { current = false }
  }, [authenticatedSession, noticeRefresh])

  useEffect(() => {
    if (!authenticatedSession?.estate?.id) return undefined
    let current = true
    api.listIssueReports().then((items) => {
      if (current) { setReports(items); setReportStatus('ready'); setReportError('') }
    }).catch((requestError) => {
      if (current) { setReportStatus('error'); setReportError(requestError.message) }
    })
    return () => { current = false }
  }, [authenticatedSession, reportRefresh])

  useEffect(() => {
    if (!authenticatedSession?.estate?.id) return undefined
    let current = true
    const isAdmin = ['SUPER_ADMIN', 'ESTATE_ADMIN'].includes(authenticatedSession.role)
    api.listElections(isAdmin).then((items) => {
      if (current) { setElections(items.map(toElection)); setElectionStatus('ready'); setElectionError('') }
    }).catch((requestError) => {
      if (current) { setElectionError(requestError.message); setElectionStatus('error') }
    })
    return () => { current = false }
  }, [authenticatedSession, electionRefresh])

  useEffect(() => {
    const syncRoleFromPath = () => {
      if (window.location.pathname === '/register') { setRole('resident'); setPage('self-register'); return }
      if (window.location.pathname === '/login') { setRole('resident'); setPage('login'); return }
      if (window.location.pathname === '/setup-password') { setRole('resident'); setPage('setup-password'); return }
      const nextRole = roleFromPath(window.location.pathname)
      if (nextRole) {
        setRole(nextRole)
        setPage('home')
      }
    }
    const initialPathRole = roleFromPath(window.location.pathname)
    if (!initialPathRole && !['/register', '/login', '/setup-password'].includes(window.location.pathname)) window.history.replaceState({}, '', `/${role}`)
    window.addEventListener('popstate', syncRoleFromPath)
    return () => window.removeEventListener('popstate', syncRoleFromPath)
  }, [role])

  useEffect(() => {
    let current = true
    api.currentSession().then((session) => {
      if (!current) return
      setAuthenticatedSession(session)
      if (!['/login', '/register', '/setup-password'].includes(window.location.pathname)) {
        const nextRole = uiRoleForSession(session)
        setRole(nextRole)
        setPage('home')
        if (window.location.pathname !== `/${nextRole}`) window.history.replaceState({}, '', `/${nextRole}`)
      }
    }).catch(() => {})
    return () => { current = false }
  }, [])

  useEffect(() => {
    document.title = `${headingFor(role, page)[1]} — ${platformSettings?.platformName || 'Estate Market Place'}`
  }, [role, page, platformSettings?.platformName])

  const notify = (message) => setToastMessage(message)
  const saveCampaign = async (campaign) => {
    const payload = {
      title: campaign.title,
      description: campaign.purpose,
      target: campaign.target,
      beneficiaryType: campaign.beneficiaryType,
      beneficiaryId: campaign.beneficiaryType === 'resident' ? campaign.beneficiaryId : null,
      beneficiary: campaign.beneficiary,
      householdContribution: campaign.beneficiaryType === 'estate' ? campaign.householdContribution : null,
      deadline: campaign.deadline,
    }
    const saved = campaign.id && campaigns.some((item) => item.id === campaign.id)
      ? await api.updateCampaign(campaign.id, payload)
      : await api.createCampaign(payload)
    const mapped = toCampaign(saved)
    setCampaigns((items) => [mapped, ...items.filter((item) => item.id !== mapped.id)])
    setSelectedCampaignId(mapped.id)
    navigate('campaign-detail')
    notify(campaign.id ? 'Campaign draft updated.' : 'Campaign draft saved.')
  }
  const addEstateResident = async (resident) => {
    const created = await api.createEstateHousehold(resident)
    setResidents((items) => [created, ...items])
    setEstateAdminOverview((current) => current ? { ...current, verifiedHouseholds: current.verifiedHouseholds + 1, householdMembers: current.householdMembers + created.householdSize } : current)
    setEstateAdminRefresh((value) => value + 1)
    return created
  }
  const createMarketplaceListing = async (listing) => {
    const created = await api.createMarketplaceListing(listing)
    setListings((items) => [created, ...items])
    navigate('marketplace')
    notify('Listing submitted for estate admin review.')
  }
  const reviewMarketplaceListing = async (listing, status) => {
    try {
      const updated = await api.reviewMarketplaceListing(listing.id, status)
      setListings((items) => items.map((item) => item.id === updated.id ? updated : item))
      setAuditRefresh((value) => value + 1)
      notify(status === 'APPROVED' ? 'Listing approved for the marketplace.' : 'Listing removed from the marketplace.')
    } catch (requestError) { notify(requestError.message) }
  }
  const saveNotice = async (notice) => {
    const payload = { title: notice.title, text: notice.text, category: notice.category, date: notice.date, time: notice.time }
    const saved = notice.id && notices.some((item) => item.id === notice.id)
      ? await api.updateNotice(notice.id, payload)
      : await api.createNotice(payload)
    setNotices((items) => [saved, ...items.filter((item) => item.id !== saved.id)])
    setAuditRefresh((value) => value + 1)
    setSelectedNotice(null)
    navigate('notices')
    notify(notice.id ? 'Notice updated.' : 'Notice published to residents.')
  }
  const deleteNotice = async (notice) => {
    try {
      await api.deleteNotice(notice.id)
      setNotices((items) => items.filter((item) => item.id !== notice.id))
      setAuditRefresh((value) => value + 1)
      notify('Notice deleted.')
    } catch (requestError) { notify(requestError.message) }
  }
  const updateIssueReport = async (id, status, message) => {
    try {
      const updated = await api.updateIssueReport(id, issueStatusValue(status), message)
      setReports((items) => items.map((item) => item.id === id ? updated : item))
      setAuditRefresh((value) => value + 1)
      notify('Issue report updated for residents.')
      return true
    } catch (requestError) { notify(requestError.message); return false }
  }
  const createIssueReport = async (report) => {
    const created = await api.createIssueReport({ title: report.title, description: report.description, category: report.category, location: report.location })
    setReports((items) => [created, ...items])
    navigate('issues')
    notify('Issue report sent to the estate team.')
  }
  const publishCampaign = async (id) => {
    try {
      const updated = toCampaign(await api.publishCampaign(id))
      setCampaigns((items) => items.map((item) => item.id === updated.id ? updated : item))
      setAuditRefresh((value) => value + 1)
      notify('Campaign sent to the committee for review.')
      return true
    } catch (requestError) { notify(requestError.message); return false }
  }
  const castCampaignVote = async (id, decision, reason) => {
    const updated = toCampaign(await api.voteOnCampaign(id, decision, reason))
    setCampaigns((items) => items.map((item) => item.id === updated.id ? updated : item))
    setAuditRefresh((value) => value + 1)
    notify(decision === 'APPROVE' ? 'Committee approval recorded.' : 'Committee rejection recorded.')
  }
  const createElection = async (poll) => {
    const created = await api.createElection({
      title: poll.title,
      description: poll.description,
      closesAt: poll.closesAt,
      candidates: poll.candidates.map((candidate) => ({ householdId: candidate.householdId })),
    })
    setElections((items) => [toElection(created), ...items])
    setAuditRefresh((value) => value + 1)
    navigate('elections')
    notify('Committee election opened for resident voting.')
  }
  const closeCommitteeElection = async (poll, candidateId) => {
    try {
      if (poll.status === 'Tie - review') await api.resolveElection(poll.id, candidateId)
      else await api.closeElection(poll.id)
      setElectionRefresh((value) => value + 1)
      setAuditRefresh((value) => value + 1)
      notify(poll.status === 'Tie - review' ? 'Election tie resolved.' : 'Election closed.')
    } catch (requestError) { notify(requestError.message) }
  }
  const castElectionVote = async (electionId, candidateId) => {
    try {
      await api.voteInElection(electionId, candidateId)
      setElectionRefresh((value) => value + 1)
      notify('Your election vote has been recorded.')
    } catch (requestError) { notify(requestError.message) }
  }
  const recordPlatformAudit = (action, target, type = 'Platform access') => setPlatformAuditEvents((items) => [{ id: `AUD-${crypto.randomUUID().slice(0, 8)}`, actor: 'Platform operator', action, target, time: 'Just now', type }, ...items])
  const updateSupportCase = async (id, updates) => {
    const values = typeof updates === 'string' ? { status: updates } : updates
    const saved = await api.updatePlatformSupportCase(id, { status: supportStatusValue(values.status), priority: supportPriorityValue(values.priority) })
    setSupportCases((items) => items.map((item) => item.id === id ? toSupportCase(saved) : item))
    setAuditRefresh((value) => value + 1)
    setPlatformOverviewRefresh((value) => value + 1)
    return saved
  }
  const addSupportComment = async (id, message) => {
    await api.addPlatformSupportComment(id, message)
    const refreshed = (await api.listPlatformSupportCases()).map(toSupportCase)
    setSupportCases(refreshed)
    setAuditRefresh((value) => value + 1)
    setPlatformOverviewRefresh((value) => value + 1)
    return undefined
  }
  const savePlatformAccount = async (account) => {
    if (account.membershipId) {
      const updated = await api.updatePlatformAccount(account.membershipId, {
        fullName: account.fullName,
        email: account.email,
        phone: account.phone,
        role: account.role,
      })
      setPlatformAccounts((items) => items.map((item) => item.userId !== updated.userId ? item : item.membershipId === updated.membershipId ? updated : { ...item, name: updated.name, email: updated.email, phone: updated.phone }))
      setSelectedPlatformAccount(null)
      navigate('platform-accounts')
      notify(`${updated.name} account updated.`)
      return null
    }
    const created = await api.createPlatformAccount({
      fullName: account.fullName,
      email: account.email,
      phone: account.phone,
      estateId: account.estateId,
    })
    setPlatformAccounts((items) => [created.account, ...items])
    setPlatformAccountsStatus('ready')
    setPlatformOverviewRefresh((value) => value + 1)
    notify(`${created.account.name} added as an Estate Admin.`)
    return created
  }
  const togglePlatformAccountAccess = async (account, status) => {
    const updated = await api.updatePlatformAccountAccess(account.membershipId, status)
    setPlatformAccounts((items) => items.map((item) => item.membershipId === account.membershipId ? { ...item, membershipStatus: updated.status, accessStatus: updated.accessStatus } : item))
    setPlatformOverviewRefresh((value) => value + 1)
    notify(`${account.name} access ${status === 'ACTIVE' ? 'restored' : 'removed'} for ${account.estate}.`)
  }
  const createPlatformAccountSetupLink = (account) => api.createPlatformAccountSetupLink(account.membershipId)
  const savePlatformEstate = async (estate) => {
    if (authenticatedSession?.role === 'SUPER_ADMIN') {
      const values = { name: estate.name, location: estate.location, logo: estate.logo || null, billingStatus: estate.billingStatus }
      if (selectedPlatformEstate) {
        const updated = await api.updatePlatformEstate(selectedPlatformEstate.id, values)
        setPlatformEstates((items) => items.map((item) => item.id === updated.id ? toPlatformEstate({ ...updated, accountCount: selectedPlatformEstate.accountCount, administrator: selectedPlatformEstate.administrator }) : item))
        notify(`${updated.name} updated.`)
      } else {
        const created = await api.createPlatformEstate(values)
        const normalized = toPlatformEstate(created)
        setPlatformEstates((items) => [normalized, ...items])
        setPlatformEstatesStatus('ready')
        notify(`${created.name} created.`)
      }
      setPlatformOverviewRefresh((value) => value + 1)
      setSelectedPlatformEstate(null)
      navigate('platform-estates')
      return
    }
    const existed = platformEstates.some((item) => item.id === estate.id)
    setPlatformEstates((items) => existed ? items.map((item) => item.id === estate.id ? estate : item) : [estate, ...items])
    setSelectedPlatformEstate(null)
    navigate('platform-estates')
    recordPlatformAudit(existed ? 'Updated an estate workspace' : 'Created an estate workspace', estate.name, 'Estate access')
    notify(`${estate.name} saved in this preview.`)
  }
  const setPlatformEstateAccess = async (estate, accessStatus) => {
    const updated = await api.updatePlatformEstateAccess(estate.id, accessStatus)
    setPlatformEstates((items) => items.map((item) => item.id === updated.id ? toPlatformEstate({ ...updated, accountCount: estate.accountCount, administrator: estate.administrator }) : item))
    setPlatformOverviewRefresh((value) => value + 1)
    notify(`${estate.name} ${accessStatus === 'ACTIVE' ? 'access restored' : accessStatus === 'ARCHIVED' ? 'archived' : 'access suspended'}.`)
  }
  const navigate = (nextPage) => {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }
  const completeLogin = (session) => {
    setAuthenticatedSession(session)
    const nextRole = uiRoleForSession(session)
    setRole(nextRole)
    setPage('home')
    window.history.replaceState({}, '', `/${nextRole}`)
  }
  const signOut = async () => {
    try {
      await api.logout()
      setAuthenticatedSession(null)
      setRole('resident')
      setPage('login')
      setPlatformOverview(null)
      setPlatformOverviewStatus('loading')
      setPlatformEstates([])
      setPlatformEstatesStatus('loading')
      window.history.replaceState({}, '', '/login')
    } catch (requestError) {
      notify(requestError.message)
    }
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
  const addContributionPrompt = (campaignId, residentId, amount, phone) => { setCampaigns((items) => items.map((campaign) => { if (campaign.id !== campaignId) return campaign; const payment = { id: `PAY-${crypto.randomUUID().slice(0, 8)}`, residentId, amount, phone, date: 'Prompt sent just now', status: 'Prompt sent' }; if (campaign.beneficiaryType === 'estate') return { ...campaign, contributions: campaign.contributions.map((account) => account.residentId !== residentId ? account : { ...account, payments: [...account.payments, payment] }) }; return { ...campaign, donations: [...(campaign.donations || []), { ...payment, resident: 'Amara Kimani' }] } })); notify('Payment prompt recorded in this preview. No mobile money prompt was sent.') }
  const confirmContributionPayment = (campaignId, residentId, paymentId) => { setCampaigns((items) => items.map((campaign) => { if (campaign.id !== campaignId) return campaign; let paymentAmount = 0; let nextCampaign; if (campaign.beneficiaryType === 'estate') { const contributions = campaign.contributions.map((account) => account.residentId !== residentId ? account : { ...account, payments: account.payments.map((payment) => { if (payment.id !== paymentId || payment.status !== 'Prompt sent') return payment; paymentAmount = payment.amount; return { ...payment, status: 'Paid', date: 'Paid just now' } }) }); nextCampaign = { ...campaign, contributions } } else { const donations = (campaign.donations || []).map((payment) => { if (payment.id !== paymentId || payment.residentId !== residentId || payment.status !== 'Prompt sent') return payment; paymentAmount = payment.amount; return { ...payment, status: 'Paid', date: 'Paid just now' } }); nextCampaign = { ...campaign, donations } } if (!paymentAmount) return campaign; const raised = campaign.raised + paymentAmount; return { ...nextCampaign, raised, updated: 'Payment recorded just now', progressUpdates: [...(campaign.progressUpdates || []), { label: 'Resident payment recorded', date: 'Today', raised }] } })); notify('Payment recorded in this preview. Connect a payment provider to verify real transactions.') }
  const retryEstateAdminData = () => { setEstateAdminStatus('loading'); setEstateAdminError(''); setEstateAdminRefresh((value) => value + 1) }

  const resolvePage = () => {
    if (page === 'home' && role === 'resident') return <ResidentOverviewPage listings={listings} notices={notices} reports={reports} savedIds={savedIds} toggleSaved={(id) => setSavedIds((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])} navigate={navigate} notify={notify} />
    if (page === 'home' && role === 'admin') return <AdminOverviewPage overview={estateAdminOverview} residents={residents} residentRequests={residentRequests} loading={estateAdminStatus === 'loading'} error={estateAdminError} onRetry={retryEstateAdminData} navigate={navigate} />
    if (page === 'home' && role === 'committee') return <CommitteeOverviewPage campaigns={campaigns} navigate={navigate} />
    if (page === 'home' && role === 'super-admin') return <SuperAdminOverviewPage overview={platformOverview} estates={platformEstates} loading={platformOverviewStatus === 'loading'} error={platformOverviewError} onRetry={() => { setPlatformOverviewStatus('loading'); setPlatformOverviewError(''); setPlatformOverviewRefresh((value) => value + 1) }} navigate={navigate} />
    if (page === 'platform-estates' && role === 'super-admin') return <PlatformEstatesPage estates={platformEstates} loading={platformEstatesStatus === 'loading'} loadError={platformEstatesError} onRetry={() => { setPlatformEstatesStatus('loading'); setPlatformEstatesError(''); setPlatformEstatesRefresh((value) => value + 1) }} onAdd={() => { setSelectedPlatformEstate(null); navigate('platform-estate-new') }} onEdit={(estate) => { setSelectedPlatformEstate(estate); navigate('platform-estate-edit') }} onSetAccess={setPlatformEstateAccess} onSelectEstate={async (estate) => { try { completeLogin(await api.selectEstate(estate.id)); notify(`Opened ${estate.name}.`) } catch (requestError) { notify(requestError.message) } }} />
    if (page === 'platform-estate-new' && role === 'super-admin') return <PlatformEstateFormPage onCancel={() => navigate('platform-estates')} onSave={savePlatformEstate} />
    if (page === 'platform-estate-edit' && role === 'super-admin') return <PlatformEstateFormPage estate={selectedPlatformEstate} onCancel={() => navigate('platform-estates')} onSave={savePlatformEstate} />
    if (page === 'platform-accounts' && role === 'super-admin') return <PlatformAccountsPage accounts={platformAccounts} hasActiveEstate={platformEstates.some((estate) => estate.accessStatus === 'Active')} loading={platformAccountsStatus === 'loading'} loadError={platformAccountsError} onRetry={() => { setPlatformAccountsStatus('loading'); setPlatformAccountsError(''); setPlatformAccountsRefresh((value) => value + 1) }} onAdd={() => { setSelectedPlatformAccount(null); navigate('platform-account-new') }} onEdit={(account) => { setSelectedPlatformAccount(account); navigate('platform-account-edit') }} onToggleAccess={togglePlatformAccountAccess} onSetupLink={createPlatformAccountSetupLink} />
    if (page === 'platform-account-new' && role === 'super-admin') return <PlatformAccountFormPage estates={platformEstates} onCancel={() => navigate('platform-accounts')} onSave={savePlatformAccount} />
    if (page === 'platform-account-edit' && role === 'super-admin') return <PlatformAccountFormPage account={selectedPlatformAccount} estates={platformEstates} onCancel={() => navigate('platform-accounts')} onSave={savePlatformAccount} />
    if (page === 'support-new') return <CreateSupportCasePage onCancel={() => navigate('home')} />
    if (page === 'platform-support' && role === 'super-admin') return <PlatformSupportPage cases={supportCases} status={supportStatus} error={supportError} onRetry={() => setSupportRefresh((value) => value + 1)} onUpdate={(id, status) => updateSupportCase(id, { status }).catch((error) => notify(error.message))} onView={(item) => { setSelectedSupportCaseId(item.id); navigate('platform-support-detail') }} />
    if (page === 'platform-support-detail' && role === 'super-admin') return <PlatformSupportDetailsPage supportCase={supportCases.find((item) => item.id === selectedSupportCaseId)} onBack={() => navigate('platform-support')} onUpdate={updateSupportCase} onComment={addSupportComment} />
    if (page === 'platform-audit' && role === 'super-admin') return <PlatformAuditPage events={platformAuditEvents} status={auditStatus} error={auditError} onRetry={() => setAuditRefresh((value) => value + 1)} />
    if (page === 'platform-settings' && role === 'super-admin') return <PlatformSettingsPage settings={platformSettings} status={platformSettingsStatus} error={platformSettingsError} onSave={async (settings) => { const saved = await api.updatePlatformSettings(settings); setPlatformSettings(saved); setAuditRefresh((value) => value + 1); notify('Platform settings saved.') }} />
    if (page === 'resident-space' && role !== 'resident') return <ResidentServicesPage navigate={navigate} />
    if (page === 'marketplace-review' && role === 'admin') return <MarketplaceReviewPage listings={listings} status={listingStatus} error={listingError} onRetry={() => setListingRefresh((value) => value + 1)} onView={(listing) => { setSelectedListingId(listing.id); navigate('marketplace-detail') }} onApprove={(listing) => reviewMarketplaceListing(listing, 'APPROVED')} onRemove={(listing) => reviewMarketplaceListing(listing, 'REMOVED')} />
    if (page === 'marketplace-detail' && role === 'admin') return <MarketplaceListingDetailsPage listing={selectedListing} navigate={navigate} onApprove={(listing) => reviewMarketplaceListing(listing, 'APPROVED')} onRemove={(listing) => { reviewMarketplaceListing(listing, 'REMOVED'); navigate('marketplace-review') }} />
    if (page === 'marketplace') { const visibleListings = filteredListings.filter((listing) => listing.status !== 'Pending review' && listing.status !== 'Removed' && listing.status !== 'Sold' && (listing.quantity ?? 1) > 0); return <MarketplacePage listings={visibleListings} savedIds={savedIds} toggleSaved={(id) => setSavedIds((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])} onCreate={() => navigate('listing-new')} notify={notify} onView={(listing) => { setSelectedListingId(listing.id); navigate('marketplace-item') }} onCart={() => navigate('marketplace-cart')} cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} /> }
    if (page === 'marketplace-item') return <ListingDetailsPage listing={selectedListing} navigate={navigate} onPurchase={completePurchase} onAddToCart={addToCart} onBid={(listing, amount) => { setListings((items) => items.map((item) => item.id === listing.id ? { ...item, bids: [...(item.bids || []), { amount, resident: 'Amara Kimani', date: new Date().toLocaleString(), status: 'Pending seller response' }] } : item)); notify('Your bid was recorded in this preview.') }} />
    if (page === 'marketplace-cart') return <MarketplaceCartPage cart={cart} listings={listings} purchases={purchases} navigate={navigate} onRemove={(listingId) => setCart((items) => items.filter((item) => item.listingId !== listingId))} onCheckout={(items) => { items.forEach((item) => completePurchase(item.listing, item.quantity, item.paymentMethod)); setCart([]) }} />
    if (page === 'fundraisers') return <FundraisersPage campaigns={campaigns} loading={campaignStatus === 'loading'} error={campaignError} onRetry={() => setCampaignRefresh((value) => value + 1)} onContribute={(campaign) => { setSelectedCampaignId(campaign.id); navigate('campaign-payment') }} />
    if (page === 'campaign-payment') return <CampaignPaymentPage campaign={selectedCampaign} navigate={navigate} onPrompt={addContributionPrompt} onConfirm={confirmContributionPayment} />
    if (page === 'notices' && role === 'admin') return <AdminNoticesPage notices={notices} status={noticeStatus} error={noticeError} onRetry={() => setNoticeRefresh((value) => value + 1)} navigate={navigate} onEdit={(notice) => { setSelectedNotice(notice); navigate('notice-edit') }} onDelete={deleteNotice} />
    if (page === 'notices') return <NoticesPage notices={notices} loading={noticeStatus === 'loading'} error={noticeError} onRetry={() => setNoticeRefresh((value) => value + 1)} />
    if (page === 'issues' && role === 'admin') return <AdminIssuesPage reports={reports} status={reportStatus} error={reportError} onRetry={() => setReportRefresh((value) => value + 1)} onUpdate={updateIssueReport} />
    if (page === 'issues') return <IssuesPage reports={reports} loading={reportStatus === 'loading'} error={reportError} onRetry={() => setReportRefresh((value) => value + 1)} />
    if (page === 'campaigns' && role === 'admin') return <AdminCampaignsPage campaigns={campaigns} status={campaignStatus} error={campaignError} onRetry={() => setCampaignRefresh((value) => value + 1)} onPublish={publishCampaign} onView={(campaign, destination) => { setSelectedCampaignId(campaign.id); navigate(destination) }} />
    if (page === 'campaigns') return <FundraisersPage campaigns={campaigns} loading={campaignStatus === 'loading'} error={campaignError} onRetry={() => setCampaignRefresh((value) => value + 1)} onContribute={(campaign) => { setSelectedCampaignId(campaign.id); navigate('campaign-payment') }} />
    if (page === 'campaign-detail') return <CampaignDetailsPage campaign={selectedCampaign} navigate={navigate} />
    if (page === 'campaign-progress') return <CampaignProgressPage campaign={selectedCampaign} navigate={navigate} />
    if (page === 'elections' && role === 'admin') return <ElectionsPage polls={elections} status={electionStatus} error={electionError} onRetry={() => setElectionRefresh((value) => value + 1)} navigate={navigate} onClosePoll={closeCommitteeElection} />
    if (page === 'elections') return <ResidentElectionsPage polls={elections} loading={electionStatus === 'loading'} error={electionError} onRetry={() => setElectionRefresh((value) => value + 1)} onVote={castElectionVote} />
    if (page === 'poll-new' && role === 'admin') return <CreatePollPage residents={residents} onCancel={() => navigate('elections')} onCreate={createElection} />
    if (page === 'campaign-edit' && selectedCampaign) return <CreateEntityPage type="campaign" initialEntity={selectedCampaign} residents={residents} onCancel={() => navigate('campaign-detail')} onCreate={saveCampaign} />
    if (page === 'residents' && role === 'admin') return <ResidentDirectoryPage residents={residents} requestCount={residentRequests.length} navigate={navigate} loading={estateAdminStatus === 'loading'} error={estateAdminError} onRetry={retryEstateAdminData} />
    if (page === 'resident-new' && role === 'admin') return <AddResidentPage locations={locations} existingHouseholds={residents} onCancel={() => navigate('residents')} onCreate={addEstateResident} />
    if (page === 'locations' && role === 'admin') return <LocationsPage locations={locations} navigate={navigate} loading={estateAdminStatus === 'loading'} error={estateAdminError} onRetry={retryEstateAdminData} />
    if (page === 'location-new' && role === 'admin') return <AddLocationPage onCancel={() => navigate('locations')} onCreate={async (location) => {
      if (isEstateAdminSession(authenticatedSession)) {
        const created = await api.createLocation(location)
        setLocations((items) => [...items, { id: created.id, name: created.name, type: created.type }])
        setEstateAdminOverview((current) => current ? { ...current, activeLocations: current.activeLocations + 1 } : current)
        navigate('locations')
        notify(`${created.type.toLowerCase()} added.`)
        return
      }
      setLocations((items) => [...items, location])
      navigate('locations')
      notify(`${location.type} added in this preview.`)
    }} />
    if (page === 'registration-link' && role === 'admin') return <RegistrationLinkPage estateId={authenticatedSession?.estate?.id} onCancel={() => navigate('residents')} onPreview={(link) => { window.history.pushState({}, '', `${link.replace(window.location.origin, '')}`); setPage('self-register') }} />
    if (page === 'self-register') return <SelfRegistrationPage />
    if (page === 'login') return <LoginPage onSuccess={completeLogin} />
    if (page === 'setup-password') return <SetupPasswordPage />
    if (page === 'resident-approvals' && role === 'admin') return <ResidentApprovalsPage requests={residentRequests} setRequests={setResidentRequests} notify={notify} loading={estateAdminStatus === 'loading'} error={estateAdminError} onRetry={retryEstateAdminData} onApprove={async (request) => {
      if (isEstateAdminSession(authenticatedSession)) {
        const result = await api.approveRegistration(request.id)
        setEstateAdminRefresh((value) => value + 1)
        return result
      }
    }} onDecline={async (request) => {
      if (isEstateAdminSession(authenticatedSession)) {
        await api.declineRegistration(request.id, request.note)
        setEstateAdminRefresh((value) => value + 1)
      }
    }} />
    if (page === 'listing-new') return <CreateEntityPage type="listing" onCancel={() => navigate('marketplace')} onCreate={createMarketplaceListing} />
    if (page === 'issue-new') return <CreateEntityPage type="issue" onCancel={() => navigate('issues')} onCreate={createIssueReport} />
    if (page === 'campaign-new' && role === 'admin') return <CreateEntityPage type="campaign" residents={residents} onCancel={() => navigate('campaigns')} onCreate={saveCampaign} />
    if (page === 'notice-new' && role === 'admin') return <CreateNoticePage onCancel={() => navigate('notices')} onSave={saveNotice} />
    if (page === 'notice-edit' && role === 'admin') return <CreateNoticePage initialNotice={selectedNotice} onCancel={() => navigate('notices')} onSave={saveNotice} />
    if (page === 'votes') return <CampaignVotesPage campaigns={campaigns} loading={campaignStatus === 'loading'} error={campaignError} onRetry={() => setCampaignRefresh((value) => value + 1)} onVote={castCampaignVote} />
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
  const activeEstate = role === 'super-admin' ? null : authenticatedSession?.estate || null

  if (page === 'self-register') return <SelfRegistrationPage />
  if (page === 'login') return <LoginPage onSuccess={completeLogin} />
  if (page === 'setup-password') return <SetupPasswordPage />
  return <AppShell estate={activeEstate} role={role} platformName={platformSettings?.platformName} platformUser={authenticatedSession?.user} page={page} pageLabel={currentHeading[1]} navItems={navItems} unreadCount={unreadCount} onNavigate={navigate} onLogout={signOut} theme={theme} onThemeChange={setTheme} textSize={textSize} onTextSizeChange={setTextSize} pageWidth={pageWidth} onPageWidthChange={setPageWidth} onOpenNotices={() => { setNotices((items) => items.map((notice) => ({ ...notice, unread: false }))); navigate('notices') }}>
    <div className={`${pageWidth === 'standard' ? 'mx-auto max-w-[1440px]' : 'w-full'} px-4 pb-24 pt-7 sm:px-7 sm:pt-9 xl:px-10 xl:pb-10`}>
      <PageHeader heading={currentHeading} action={pageAction} />
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

function uiRoleForSession(session) {
  if (session.role === 'SUPER_ADMIN') return session.estate ? 'admin' : 'super-admin'
  if (session.role === 'ESTATE_ADMIN' || session.role === 'ACCOUNT_HOLDER') return 'admin'
  if (session.role === 'COMMITTEE_MEMBER') return 'committee'
  return 'resident'
}

function isEstateAdminSession(session) {
  return Boolean(session?.estate?.id) && (session.role === 'SUPER_ADMIN' || session.role === 'ESTATE_ADMIN')
}

function toPlatformEstate(estate) {
  return {
    ...estate,
    accessStatus: estate.accessStatus === 'ACTIVE' ? 'Active' : estate.accessStatus === 'SUSPENDED' ? 'Suspended' : 'Archived',
    created: new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium' }).format(new Date(estate.createdAt)),
  }
}

function toCampaign(campaign) {
  return {
    ...campaign,
    updated: new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(campaign.updatedAt)),
    ownVote: campaign.ownVote ? { decision: campaign.ownVote.decision, reason: campaign.ownVote.reason || '' } : null,
  }
}

function toElection(election) {
  return election
}

function formatSupportDate(value) {
  return new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function toSupportCase(item) {
  return { ...item, updated: formatSupportDate(item.updatedAt), comments: (item.comments || []).map((comment) => ({ ...comment, time: formatSupportDate(comment.createdAt) })) }
}

function toAuditEvent(item) {
  return { ...item, time: formatSupportDate(item.createdAt) }
}

function supportStatusValue(status) { return ({ Open: 'OPEN', 'In progress': 'IN_PROGRESS', Resolved: 'RESOLVED' })[status] }
function supportPriorityValue(priority) { return ({ Low: 'LOW', Normal: 'NORMAL', High: 'HIGH' })[priority] }
function issueStatusValue(status) { return ({ Received: 'RECEIVED', 'In progress': 'IN_PROGRESS', Resolved: 'RESOLVED' })[status] }

function roleFromPath(pathname) {
  const pathRole = pathname.split('/').filter(Boolean)[0]?.toLowerCase().replaceAll('_', '-')
  return navigationByRole[pathRole] ? pathRole : null
}

