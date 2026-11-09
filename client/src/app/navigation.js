import { FiActivity, FiBell, FiCreditCard, FiHeart, FiHome, FiMessageSquare, FiSettings, FiShoppingBag, FiTool, FiUsers, FiUserCheck, FiGrid } from 'react-icons/fi'

export const roleLabels = {
  resident: 'Resident',
  admin: 'Estate admin',
  committee: 'Committee member',
  'super-admin': 'Super Admin',
}

export const navigationByRole = {
  resident: [
    { id: 'home', label: 'Overview', icon: FiHome },
    { id: 'marketplace', label: 'Marketplace', icon: FiShoppingBag },
    { id: 'fundraisers', label: 'Giving', icon: FiCreditCard },
    { id: 'elections', label: 'Committee', icon: FiUserCheck },
    { id: 'notices', label: 'Notices', icon: FiBell },
    { id: 'issues', label: 'Issue reports', icon: FiTool },
  ],
  admin: [
    { id: 'home', label: 'Overview', icon: FiHome },
    { id: 'campaigns', label: 'Campaigns', icon: FiHeart },
    { id: 'committee', label: 'Committee', icon: FiUserCheck },
    { id: 'marketplace-review', label: 'Market review', icon: FiShoppingBag },
    { id: 'residents', label: 'Residents', icon: FiUsers },
    { id: 'notices', label: 'Notices', icon: FiBell },
    { id: 'issues', label: 'Issue reports', icon: FiTool },
  ],
  committee: [
    { id: 'home', label: 'Overview', icon: FiHome },
    { id: 'votes', label: 'Campaign votes', icon: FiHeart },
    { id: 'history', label: 'Decision history', icon: FiActivity },
    { id: 'elections', label: 'Committee', icon: FiUserCheck },
    { id: 'resident-space', label: 'Resident space', icon: FiHome },
    { id: 'notices', label: 'Notices', icon: FiBell },
  ],
  'super-admin': [
    { id: 'home', label: 'Overview', icon: FiHome },
    { id: 'platform-estates', label: 'Estates', icon: FiGrid },
    { id: 'platform-accounts', label: 'Accounts', icon: FiUsers },
    { id: 'platform-support', label: 'Support', icon: FiMessageSquare },
    { id: 'platform-audit', label: 'Audit log', icon: FiActivity },
    { id: 'platform-settings', label: 'Settings', icon: FiSettings },
  ],
}

export const pageHeadings = {
  home: {
    resident: ['YOUR COMMUNITY', 'Welcome', 'Here’s what’s happening around your estate.'],
    admin: ['ESTATE OPERATIONS', 'Estate overview', 'Review household registrations and estate directory activity.'],
    committee: ['COMMUNITY OVERSIGHT', 'Committee overview', 'Review campaign decisions and community activity.'],
    'super-admin': ['PLATFORM OPERATIONS', 'Platform overview', 'Monitor estate workspaces, platform accounts, registrations, and activity.'],
  },
  marketplace: ['BUY, SELL & SHARE', 'Marketplace', 'Find items and services shared by your neighbours.'],
  'marketplace-review': ['MARKETPLACE MODERATION', 'Marketplace review', 'Review resident listings before they appear in the marketplace.'],
  'resident-space': ['RESIDENT SERVICES', 'Resident space', 'Open the marketplace, giving, issue reports, and resident support tools.'],
  elections: ['YOUR ESTATE COMMUNITY', 'Committee', 'Meet your committee representatives, explore their household details, and participate in elections.'],
  committee: ['COMMITTEE MANAGEMENT', 'Committee', 'Manage committee members and elections for this estate.'],
  'resident-detail': ['RESIDENT DIRECTORY', 'Resident details', 'Manage household information and account access.'],
  'poll-new': ['COMMITTEE ELECTION', 'Create an election', 'Add committee candidates and associate each candidate with a household.'],
  'marketplace-detail': ['MARKETPLACE MODERATION', 'Listing details', 'Review the complete item submission before deciding.'],
  fundraisers: ['COMMUNITY GIVING', 'Giving', 'Estate assessments and community fundraising in one place.'],
  'campaign-payment': ['COMMUNITY GIVING', 'Campaign payment', 'Review your balance and request a payment prompt.'],
  notices: ['ESTATE UPDATES', 'Notices', 'Useful updates for life around your estate.'],
  'notice-detail': ['ESTATE UPDATES', 'Notice details', 'Read the full estate update.'],
  issues: ['ESTATE SUPPORT', 'Issue reports', 'Report a concern and follow its progress with the estate team.'],
  campaigns: ['CAMPAIGN MANAGEMENT', 'Fundraising campaigns', 'Prepare community appeals and follow committee review.'],
  residents: ['RESIDENT DIRECTORY', 'Residents', 'Manage verified households in this estate.'],
  'resident-approvals': ['RESIDENT VERIFICATION', 'Resident approvals', 'Review household registration requests for this estate.'],
  'resident-new': ['RESIDENT DIRECTORY', 'Add resident', 'Add a verified household to the estate directory.'],
  locations: ['ESTATE ADDRESSES', 'Blocks and streets', 'Manage the address options used by each household.'],
  'location-new': ['ESTATE ADDRESSES', 'Add a block or street', 'Add an address option to the estate directory.'],
  'notice-new': ['ESTATE COMMUNICATION', 'Create a notice', 'Write an update for estate residents.'],
  'notice-edit': ['ESTATE COMMUNICATION', 'Edit notice', 'Update the notice shown to residents.'],
  'campaign-detail': ['CAMPAIGN MANAGEMENT', 'Campaign details', 'Review the campaign plan and committee activity.'],
  'campaign-progress': ['CAMPAIGN MANAGEMENT', 'Campaign progress', 'Review fundraising progress for an approved campaign.'],
  'campaign-edit': ['CAMPAIGN MANAGEMENT', 'Edit campaign', 'Update the campaign details and beneficiary.'],
  'registration-link': ['RESIDENT ONBOARDING', 'Share registration link', 'Invite one household representative to register online.'],
  'self-register': ['RESIDENT ONBOARDING', 'Household registration', 'Submit household details for estate admin review.'],
  login: ['ACCOUNT ACCESS', 'Sign in', 'Access your estate community portal.'],
  'listing-new': ['RESIDENT MARKETPLACE', 'Create a listing', 'Share an item or service with verified neighbours.'],
  'marketplace-item': ['RESIDENT MARKETPLACE', 'Item details', 'Review the item, make an offer, or complete a purchase.'],
  'marketplace-cart': ['RESIDENT MARKETPLACE', 'Your cart', 'Review selected items and complete your order.'],
  'issue-new': ['ESTATE SUPPORT', 'Report an issue', 'Tell the estate team what needs attention and where to find it.'],
  'campaign-new': ['COMMUNITY GIVING', 'Create a campaign', 'Prepare a campaign for committee review.'],
  votes: ['COMMITTEE REVIEW', 'Campaign votes', 'Review campaign requests and record your decision.'],
  history: ['COMMUNITY OVERSIGHT', 'Decision history', 'A clear record of committee decisions and campaign activity.'],
  'platform-estates': ['PLATFORM OPERATIONS', 'Estate directory', 'View estates provisioned on the platform.'],
  'platform-accounts': ['PLATFORM OPERATIONS', 'Platform accounts', 'Review account access across platform workspaces.'],
  'platform-support': ['TECHNICAL SUPPORT', 'Support queue', 'Triage platform and access support requests.'],
  'platform-audit': ['PLATFORM OVERSIGHT', 'Platform audit log', 'Review platform-level activity and access events.'],
  'platform-settings': ['PLATFORM CONFIGURATION', 'System settings', 'Manage platform-wide contact and availability settings.'],
  'platform-estate-new': ['PLATFORM OPERATIONS', 'Add estate', 'Create a platform workspace for a new estate.'],
  'platform-estate-edit': ['PLATFORM OPERATIONS', 'Edit estate', 'Update estate workspace and payment access details.'],
  'platform-account-new': ['PLATFORM ACCOUNTS', 'Add user', 'Create an account and assign its platform role.'],
  'platform-account-edit': ['PLATFORM ACCOUNTS', 'Edit user', 'Update account details and workspace role.'],
  'platform-support-detail': ['TECHNICAL SUPPORT', 'Support case details', 'Review the request and follow up with comments.'],
  'support-new': ['SUPPORT', 'Contact platform support', 'Send a request to the platform support team.'],
}

export function headingFor(role, page) {
  const heading = pageHeadings[page]
  return Array.isArray(heading) ? heading : heading?.[role] || pageHeadings.home[role]
}

export function mobileNavigationLabel(label) {
  return ({ Overview: 'Home', Marketplace: 'Market', Giving: 'Giving', Contributions: 'Giving', 'Market review': 'Review', Fundraisers: 'Giving', 'Issue reports': 'Issues', 'Campaign votes': 'Votes', 'Decision history': 'History' })[label] || label
}
