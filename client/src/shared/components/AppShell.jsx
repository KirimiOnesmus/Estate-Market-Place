import { useState } from 'react'
import { FiBell, FiChevronRight, FiGrid, FiLogOut, FiMonitor, FiMoon, FiSettings, FiSun } from 'react-icons/fi'
import { mobileNavigationLabel, roleLabels } from '../../app/navigation.js'
import { EstateLogo } from './EstateLogo.jsx'

export function AppShell({ role, page, pageLabel, navItems, unreadCount, onNavigate, onLogout, theme, onThemeChange, textSize, onTextSizeChange, pageWidth, onPageWidthChange, onOpenNotices, estate, platformName, platformUser, children }) {
  const changePage = (id) => onNavigate(id)
  const pageAlias = ({ 'resident-approvals': 'residents', 'resident-new': 'residents', 'resident-detail': 'residents', 'locations': 'residents', 'location-new': 'residents', 'registration-link': 'residents', 'poll-new': 'committee', 'elections': role === 'admin' ? 'committee' : 'elections', 'campaign-new': 'campaigns', 'campaign-detail': 'campaigns', 'campaign-progress': 'campaigns', 'campaign-edit': 'campaigns', 'marketplace-detail': 'marketplace-review', 'marketplace-item': 'marketplace', 'marketplace-cart': 'marketplace', 'campaign-payment': 'fundraisers', 'notice-new': 'notices', 'notice-edit': 'notices', 'notice-detail': 'notices', 'listing-new': 'resident-space', 'issue-new': 'resident-space', 'platform-estate-new': 'platform-estates', 'platform-estate-edit': 'platform-estates', 'platform-account-new': 'platform-accounts', 'platform-account-edit': 'platform-accounts', 'platform-support-detail': 'platform-support', 'support-new': 'home' })[page] || page
  const navigationPage = role !== 'resident' && pageAlias === 'fundraisers' ? 'resident-space' : pageAlias
  return <div className="min-h-screen bg-canvas text-ink dark:bg-night dark:text-night-ink">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-line bg-panel px-4 py-5 dark:border-night-line dark:bg-night-panel lg:flex">
      <Brand estate={estate} role={role} platformName={platformName} onClick={() => changePage('home')} />
      <NavList items={navItems} page={navigationPage} onNavigate={changePage} unreadCount={unreadCount} />
      <SupportLink role={role} onNavigate={changePage} />
      <ResidentProfile role={role} user={platformUser} />
    </aside>
    <div className="min-w-0 lg:ml-[248px]">
      <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-line bg-panel/95 px-4 backdrop-blur-sm dark:border-night-line dark:bg-night-panel/95 sm:px-7 xl:px-10">
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-xs text-muted sm:flex"><span>{roleLabels[role]}</span><FiChevronRight size={13} /><b className="font-semibold text-ink dark:text-night-ink">{pageLabel || navItems.find((item) => item.id === page)?.label}</b></div>
          <div className="sm:hidden"><Brand estate={estate} role={role} platformName={platformName} compact onClick={() => changePage('home')} /></div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {role !== 'super-admin' && estate && <div className="hidden min-w-0 items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 dark:border-night-line xl:flex"><EstateLogo estate={estate} size="size-7" className="rounded-full" /><span className="max-w-44 truncate text-xs font-semibold">{estate.name}</span></div>}
          <span className="hidden items-center rounded-full bg-soft px-2.5 py-1.5 text-[11px] font-semibold text-ink dark:bg-night-soft dark:text-night-ink sm:inline-flex">{roleLabels[role]}</span>
          <button className="icon-button relative" aria-label={`Open notices, ${unreadCount} unread`} onClick={onOpenNotices}><FiBell size={19} />{unreadCount > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-panel bg-coral-600 dark:border-night-panel" />}</button>
          <AppearanceSettings theme={theme} onThemeChange={onThemeChange} textSize={textSize} onTextSizeChange={onTextSizeChange} pageWidth={pageWidth} onPageWidthChange={onPageWidthChange} />
          <button type="button" className="inline-flex h-10 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-muted transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-300 sm:px-2.5" onClick={onLogout} aria-label="Sign out" title="Sign out"><FiLogOut size={17} /><span className="hidden md:inline">Sign out</span></button>
          <span className="hidden h-8 w-px bg-line sm:block dark:bg-night-line" />
          <div className="hidden sm:block"><ResidentProfile compact role={role} user={platformUser} /></div>
        </div>
      </header>
      <main>{children}</main>
    </div>
    <nav style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }} className="fixed inset-x-0 bottom-0 z-30 grid border-t border-line bg-panel px-1 pb-[max(6px,env(safe-area-inset-bottom))] pt-1.5 dark:border-night-line dark:bg-night-panel lg:hidden" aria-label="Main navigation">
      {navItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => changePage(id)} aria-current={navigationPage === id ? 'page' : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-medium ${navigationPage === id ? 'text-brand-800 dark:text-brand-300' : 'text-muted hover:bg-soft dark:hover:bg-night-soft'}`}><Icon size={19} /><span>{mobileNavigationLabel(label)}</span></button>)}
    </nav>
    <footer className="hidden border-t border-line px-7 py-4 text-center text-[11px] text-muted dark:border-night-line lg:block">{role === 'super-admin' ? `${platformName || 'Estate Market Place'} · Platform administration` : [estate?.name, estate?.location].filter(Boolean).join(' · ') || 'Estate workspace'} · Made for neighbours, by neighbours</footer>
  </div>
}

function Brand({ estate, role, platformName, compact = false, onClick }) {
  const platform = role === 'super-admin'
  return <button onClick={onClick} className={`flex min-h-10 items-center gap-2.5 text-left ${compact ? '' : 'mb-6 px-1'}`} aria-label={`${platform ? platformName || 'Estate Market Place' : estate?.name || 'Estate'} home`}>
    {platform ? <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-800 text-white"><FiGrid size={17} /></span> : <EstateLogo estate={estate} size="size-9" />}
    <span><b className="block whitespace-nowrap font-display text-sm font-bold">{platform ? platformName || 'Estate Market Place' : estate?.name || 'Estate workspace'}</b><small className={`${compact ? 'hidden sm:block' : 'block'} max-w-40 truncate whitespace-nowrap text-[9px] font-semibold tracking-[.14em] text-muted`}>{platform ? 'PLATFORM CONSOLE' : estate?.location || 'COMMUNITY WORKSPACE'}</small></span>
  </button>
}

function NavList({ items, page, unreadCount, onNavigate }) {
  return <nav className="mt-6 grid gap-1" aria-label="Community navigation">{items.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => onNavigate(id)} aria-current={page === id ? 'page' : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-[13px] transition-colors ${page === id ? 'bg-brand-50 font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-300' : 'text-muted hover:bg-soft hover:text-ink dark:hover:bg-night-soft dark:hover:text-night-ink'}`}><Icon size={17} /><span className="flex-1">{label}</span>{id === 'notices' && unreadCount > 0 && <span className="min-w-5 rounded-full bg-brand-100 px-1.5 py-0.5 text-center text-[10px] font-bold text-brand-800 dark:bg-brand-900 dark:text-brand-200">{unreadCount}</span>}</button>)}</nav>
}

function SupportLink({ role, onNavigate }) {
  return role === 'super-admin'
    ? <button type="button" onClick={() => onNavigate('platform-support')} className="mt-auto mb-3 rounded-lg bg-soft px-3 py-3 text-left dark:bg-night-soft"><b className="block text-xs">Platform support</b><span className="mt-1 block text-[11px] text-muted">Review support requests</span></button>
    : <button type="button" onClick={() => onNavigate('support-new')} className="mt-auto mb-3 rounded-lg bg-soft px-3 py-3 text-left dark:bg-night-soft"><b className="block text-xs">Need platform help?</b><span className="mt-1 block text-[11px] text-muted">Send a support request</span></button>
}

export function ResidentProfile({ compact = false, role = 'resident', user }) {
  const roleText = roleLabels[role] || 'Resident'
  const platformOwner = role === 'super-admin'
  const name = user?.fullName || (platformOwner ? 'Super Admin' : 'Estate member')
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  return <div className={`flex items-center gap-2.5 ${compact ? '' : 'border-t border-line px-1 pt-3 dark:border-night-line'}`}><span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-100">{initials || 'U'}</span><span className={`${compact ? 'hidden sm:block' : 'min-w-0 flex-1'}`}><b className="block max-w-40 truncate whitespace-nowrap text-xs">{name}</b><small className="block max-w-40 truncate whitespace-nowrap text-[11px] text-muted">{user?.email || roleText}</small></span></div>
}

function AppearanceSettings({ theme, onThemeChange, textSize, onTextSizeChange, pageWidth, onPageWidthChange }) {
  const [open, setOpen] = useState(false)
  return <div className="relative">
    <button type="button" className="icon-button" aria-label="Appearance settings" aria-expanded={open} aria-controls="appearance-settings" onClick={() => setOpen((value) => !value)}><FiSettings size={17} /><span className="sr-only">Appearance</span></button>
    {open && <section id="appearance-settings" aria-label="Appearance" className="absolute right-0 top-full z-40 mt-2 w-[min(21rem,calc(100vw-2rem))] rounded-xl border border-line bg-panel p-4 shadow-lift dark:border-night-line dark:bg-night-panel"><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-bold">Appearance</h2><button type="button" className="text-xs font-semibold text-brand-800 dark:text-brand-300" onClick={() => setOpen(false)}>Done</button></div><Setting label="Text size" options={[["small", "Small"], ["standard", "Standard"], ["large", "Large"]]} value={textSize} onChange={onTextSizeChange} /><Setting label="Page width" options={[["standard", "Standard"], ["wide", "Wide"]]} value={pageWidth} onChange={onPageWidthChange} /><Setting label="Color mode" options={[["system", "Automatic"], ["light", "Light"], ["dark", "Dark"]]} value={theme} onChange={onThemeChange} icons={{ system: FiMonitor, light: FiSun, dark: FiMoon }} /></section>}
  </div>
}

function Setting({ label, options, value, onChange, icons = {} }) {
  return <fieldset className="border-t border-line py-3 first:border-0 dark:border-night-line"><legend className="mb-2 text-xs font-semibold">{label}</legend><div className="flex flex-wrap gap-2">{options.map(([option, text]) => { const Icon = icons[option]; return <button key={option} type="button" aria-pressed={value === option} onClick={() => onChange(option)} className={`inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium ${value === option ? 'border-brand-700 bg-brand-50 text-brand-900 dark:border-brand-500 dark:bg-brand-950 dark:text-brand-200' : 'border-line text-muted hover:bg-soft dark:border-night-line dark:hover:bg-night-soft'}`}>{Icon && <Icon size={13} />}{text}</button> })}</div></fieldset>
}
