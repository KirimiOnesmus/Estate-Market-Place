import { useState } from 'react'
import { FiBell, FiChevronDown, FiChevronRight, FiMonitor, FiMoon, FiSettings, FiSun, FiUsers } from 'react-icons/fi'
import { mobileNavigationLabel, roleLabels } from '../../app/navigation.js'
import { EstateLogo } from './EstateLogo.jsx'

export function AppShell({ role, page, pageLabel, navItems, unreadCount, onNavigate, onRoleChange, theme, onThemeChange, textSize, onTextSizeChange, pageWidth, onPageWidthChange, onOpenNotices, estate, children }) {
  const changePage = (id) => onNavigate(id)
  const pageAlias = ({ 'resident-approvals': 'residents', 'resident-new': 'residents', 'locations': 'residents', 'location-new': 'residents', 'registration-link': 'residents', 'poll-new': 'elections', 'campaign-new': 'campaigns', 'campaign-detail': 'campaigns', 'campaign-progress': 'campaigns', 'campaign-edit': 'campaigns', 'marketplace-detail': 'marketplace-review', 'marketplace-item': 'marketplace', 'marketplace-cart': 'marketplace', 'campaign-payment': 'fundraisers', 'notice-new': 'notices', 'notice-edit': 'notices', 'listing-new': 'resident-space', 'issue-new': 'resident-space', 'platform-estate-new': 'platform-estates', 'platform-estate-edit': 'platform-estates', 'platform-account-new': 'platform-accounts', 'platform-account-edit': 'platform-accounts', 'platform-support-detail': 'platform-support' })[page] || page
  const navigationPage = role !== 'resident' && pageAlias === 'fundraisers' ? 'resident-space' : pageAlias
  return <div className="min-h-screen bg-canvas text-ink dark:bg-night dark:text-night-ink">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-line bg-panel px-4 py-5 dark:border-night-line dark:bg-night-panel lg:flex">
      <Brand estate={estate} onClick={() => changePage('home')} />
      <NavList items={navItems} page={navigationPage} onNavigate={changePage} unreadCount={unreadCount} />
      <SupportLink />
      <ResidentProfile role={role} />
    </aside>
    <div className="min-w-0 lg:ml-[248px]">
      <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-line bg-panel/95 px-4 backdrop-blur-sm dark:border-night-line dark:bg-night-panel/95 sm:px-7 xl:px-10">
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-xs text-muted sm:flex"><span>{roleLabels[role]}</span><FiChevronRight size={13} /><b className="font-semibold text-ink dark:text-night-ink">{pageLabel || navItems.find((item) => item.id === page)?.label}</b></div>
          <div className="sm:hidden"><Brand estate={estate} compact onClick={() => changePage('home')} /></div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <WorkspaceSwitcher role={role} onRoleChange={onRoleChange} />
          <span className="hidden items-center rounded-full bg-green-soft px-2.5 py-1.5 text-[11px] font-semibold text-green-800 dark:bg-green-950 dark:text-green-200 sm:inline-flex">{role === 'super-admin' ? 'Platform access' : 'Verified resident'}</span>
          <button className="icon-button relative" aria-label={`Open notices, ${unreadCount} unread`} onClick={onOpenNotices}><FiBell size={19} />{unreadCount > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-panel bg-coral-600 dark:border-night-panel" />}</button>
          <AppearanceSettings theme={theme} onThemeChange={onThemeChange} textSize={textSize} onTextSizeChange={onTextSizeChange} pageWidth={pageWidth} onPageWidthChange={onPageWidthChange} />
          <span className="hidden h-8 w-px bg-line sm:block dark:bg-night-line" />
          <div className="hidden sm:block"><ResidentProfile compact role={role} /></div>
        </div>
      </header>
      <main>{children}</main>
    </div>
    <nav style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }} className="fixed inset-x-0 bottom-0 z-30 grid border-t border-line bg-panel px-1 pb-[max(6px,env(safe-area-inset-bottom))] pt-1.5 dark:border-night-line dark:bg-night-panel lg:hidden" aria-label="Main navigation">
      {navItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => changePage(id)} aria-current={navigationPage === id ? 'page' : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-medium ${navigationPage === id ? 'text-brand-800 dark:text-brand-300' : 'text-muted hover:bg-soft dark:hover:bg-night-soft'}`}><Icon size={19} /><span>{mobileNavigationLabel(label)}</span></button>)}
    </nav>
    <footer className="hidden border-t border-line px-7 py-4 text-center text-[11px] text-muted dark:border-night-line lg:block">Pavilion Court · Membley Estate <span className="px-1.5">·</span> Made for neighbours, by neighbours</footer>
  </div>
}

function WorkspaceSwitcher({ role, onRoleChange }) {
  const [open, setOpen] = useState(false)
  return <div className="relative">
    <button type="button" className="inline-flex h-10 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-muted hover:bg-soft hover:text-ink dark:hover:bg-night-soft dark:hover:text-night-ink sm:px-2.5" aria-label={`Switch workspace. Current workspace: ${roleLabels[role]}`} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)} onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false) }}>
      <FiUsers size={17} /><span className="hidden sm:inline">{roleLabels[role]}</span><FiChevronDown size={13} />
    </button>
    {open && <div role="menu" aria-label="Switch workspace" className="absolute right-0 top-full z-40 mt-2 w-52 rounded-xl border border-line bg-panel p-1.5 shadow-lift dark:border-night-line dark:bg-night-panel">
      {Object.entries(roleLabels).map(([value, label]) => <button key={value} type="button" role="menuitemradio" aria-checked={role === value} className={`flex min-h-10 w-full items-center rounded-lg px-3 text-left text-xs ${role === value ? 'bg-brand-50 font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-300' : 'text-ink hover:bg-soft dark:text-night-ink dark:hover:bg-night-soft'}`} onClick={() => { onRoleChange(value); setOpen(false) }}>{label}</button>)}
    </div>}
  </div>
}

function Brand({ estate, compact = false, onClick }) {
  return <button onClick={onClick} className={`flex min-h-10 items-center gap-2.5 text-left ${compact ? '' : 'mb-6 px-1'}`} aria-label={`${estate?.name || 'Estate'} home`}><EstateLogo estate={estate} size="size-9" /><span><b className="block whitespace-nowrap font-display text-sm font-bold">{estate?.name || 'Pavilion Court'}</b><small className={`${compact ? 'hidden sm:block' : 'block'} max-w-40 truncate whitespace-nowrap text-[9px] font-semibold tracking-[.14em] text-muted`}>{estate?.location || 'MEMBLEY ESTATE'}</small></span></button>
}

function NavList({ items, page, unreadCount, onNavigate }) {
  return <nav className="mt-6 grid gap-1" aria-label="Community navigation">{items.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => onNavigate(id)} aria-current={page === id ? 'page' : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-[13px] transition-colors ${page === id ? 'bg-brand-50 font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-300' : 'text-muted hover:bg-soft hover:text-ink dark:hover:bg-night-soft dark:hover:text-night-ink'}`}><Icon size={17} /><span className="flex-1">{label}</span>{id === 'notices' && unreadCount > 0 && <span className="min-w-5 rounded-full bg-brand-100 px-1.5 py-0.5 text-center text-[10px] font-bold text-brand-800 dark:bg-brand-900 dark:text-brand-200">{unreadCount}</span>}</button>)}</nav>
}

function SupportLink() {
  return <div className="mt-auto mb-3 rounded-lg bg-soft px-3 py-3 dark:bg-night-soft"><b className="block text-xs">Need a hand?</b><span className="mt-1 block text-[11px] text-muted">Contact the estate admin</span></div>
}

export function ResidentProfile({ compact = false, role = 'resident' }) {
  const roleText = roleLabels[role] || 'Resident'
  const platformOwner = role === 'super-admin'
  return <div className={`flex items-center gap-2.5 ${compact ? '' : 'border-t border-line px-1 pt-3 dark:border-night-line'}`}><span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-100">{platformOwner ? 'PO' : 'AK'}</span><span className={`${compact ? 'hidden sm:block' : 'min-w-0 flex-1'}`}><b className="block whitespace-nowrap text-xs">{platformOwner ? 'Platform operator' : 'Amara Kimani'}</b><small className="block whitespace-nowrap text-[11px] text-muted">{platformOwner ? 'Platform owner' : <>{roleText}<span className="px-1">·</span>Block C, 08</>}</small></span></div>
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
