import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Server, FileCode2, Bell, User, ClipboardList,
  Building2, Menu, X, Terminal, Layers, Activity,
  LogOut, Sparkles, Users, AlertTriangle, Database, MapPin,
  ChevronDown, Shield, ChevronRight, Search, Layout as RackIcon,
  FileText, Headphones, BookOpen, Settings,
  BarChart3, ShieldCheck, GitPullRequest,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from './AuthProvider';
import { useClient } from './ClientProvider';

const FONT_DISPLAY = "'Lora', Georgia, serif";
const FONT_MONO    = "'JetBrains Mono', monospace";

const ACC   = '#C8622E';
const ACC_BG = '#FAE8DC';
const WARM_BDR = '#E8E1D8';
const WARM_BG  = '#FDFAF7';
const WARM_HOVER = '#F0EAE0';
const DIM   = '#A09688';
const TEXT  = '#19160F';
const TEXT2 = '#6B6458';
const SIDEBAR_BG = '#18140F';
const SIDEBAR_PANEL = 'rgba(255,255,255,0.07)';
const SIDEBAR_BORDER = 'rgba(255,255,255,0.11)';
const SIDEBAR_TEXT = '#F7F3ED';
const SIDEBAR_DIM = '#BCAEA0';

const navSections = [
  {
    label: 'Inventory',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard',    path: '/' },
      { icon: Building2,       label: 'Clients',      path: '/clients' },
      { icon: MapPin,          label: 'Sites',        path: '/sites' },
      { icon: Database,        label: 'CMDB / Assets',path: '/assets' },
      { icon: RackIcon,        label: 'Racks',        path: '/racks' },
    ],
  },
  {
    label: 'Network',
    items: [
      { icon: Server,   label: 'Infrastructure', path: '/infrastructure' },
      { icon: Layers,   label: 'Topology',       path: '/topology' },
      { icon: Activity, label: 'Monitoring',     path: '/monitoring' },
    ],
  },
  {
    label: 'ITSM',
    items: [
      { icon: Headphones,     label: 'Service Desk',  path: '/?tab=servicedesk' },
      { icon: Sparkles,       label: 'Onboarding',    path: '/onboarding' },
      { icon: ClipboardList,  label: 'Audit Trail',   path: '/audit-log' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { icon: FileCode2,  label: 'Configurations', path: '/configs' },
      { icon: Terminal,   label: 'Automation',     path: '/automation' },
      { icon: FileText,   label: 'Documents',      path: '/documents' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { icon: BarChart3,  label: 'Network',   path: '/?tab=network' },
      { icon: Server,     label: 'Compute',   path: '/?tab=compute' },
    ],
  },
];

function userInitials(displayName?: string | null, email?: string | null) {
  if (displayName) {
    const parts = displayName.trim().split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return (email ?? 'U').slice(0, 2).toUpperCase();
}

/* ── Sidebar nav ────────────────────────────────────────────────────────── */
function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { isAdmin } = useAuth();

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4" style={{ gap: 0 }}>
      {navSections.map((section, si) => (
        <div key={section.label} className={si > 0 ? 'mt-4' : ''}>
          {/* Section label with thin rule */}
          <div className="flex items-center gap-2 px-3 mb-1.5">
            <span className="h-px flex-1" style={{ background: SIDEBAR_BORDER }} />
            <span
              className="text-[9.5px] font-bold uppercase tracking-[0.18em] select-none"
              style={{ color: SIDEBAR_DIM }}
            >
              {section.label}
            </span>
          </div>

          <div className="space-y-0.5">
            {section.items.map((item) => {
              const [itemPath, itemSearch] = item.path.split('?');
              const isActive = location.pathname === itemPath &&
                (!itemSearch || location.search === `?${itemSearch}`);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onNavigate}
                  className="relative group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-150"
                  style={{
                    background: isActive ? 'rgba(200,98,46,0.2)' : 'transparent',
                    color: isActive ? SIDEBAR_TEXT : SIDEBAR_DIM,
                    border: `1px solid ${isActive ? 'rgba(200,98,46,0.45)' : 'transparent'}`,
                    boxShadow: isActive ? '0 12px 26px -18px rgba(200,98,46,0.95)' : 'none',
                  }}
                  onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = SIDEBAR_PANEL; (e.currentTarget as HTMLElement).style.color = SIDEBAR_TEXT; } }}
                  onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = SIDEBAR_DIM; } }}
                >
                  {/* Active left indicator */}
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/4 bottom-1/4 w-[2.5px] rounded-full"
                      style={{ background: ACC }}
                    />
                  )}
                  <item.icon
                    className="h-[14px] w-[14px] shrink-0 transition-colors"
                    style={{ color: isActive ? '#F1C27D' : undefined, opacity: isActive ? 1 : 0.72 }}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {isAdmin && (
        <div className="mt-5">
          <div className="flex items-center gap-2 px-3 mb-1.5">
            <span className="h-px flex-1" style={{ background: SIDEBAR_BORDER }} />
            <span className="text-[9.5px] font-bold uppercase tracking-[0.18em] select-none" style={{ color: SIDEBAR_DIM }}>Admin</span>
          </div>
          <Link
            to="/users"
            onClick={onNavigate}
            className="relative group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-150"
            style={{
              background: location.pathname === '/users' ? 'rgba(200,98,46,0.2)' : 'transparent',
              color: location.pathname === '/users' ? SIDEBAR_TEXT : SIDEBAR_DIM,
              border: `1px solid ${location.pathname === '/users' ? 'rgba(200,98,46,0.45)' : 'transparent'}`,
            }}
            onMouseEnter={e => { if (location.pathname !== '/users') { (e.currentTarget as HTMLElement).style.background = SIDEBAR_PANEL; (e.currentTarget as HTMLElement).style.color = SIDEBAR_TEXT; } }}
            onMouseLeave={e => { if (location.pathname !== '/users') { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = SIDEBAR_DIM; } }}
          >
            {location.pathname === '/users' && (
              <span className="absolute left-0 top-1/4 bottom-1/4 w-[2.5px] rounded-full" style={{ background: ACC }} />
            )}
            <Users className="h-[14px] w-[14px] shrink-0" style={{ color: location.pathname === '/users' ? '#F1C27D' : undefined, opacity: location.pathname === '/users' ? 1 : 0.72 }} />
            <span>Users</span>
          </Link>
        </div>
      )}
    </nav>
  );
}

/* ── Client selector ────────────────────────────────────────────────────── */
function ClientSelector() {
  const { rootClients, selectedClientId, setSelectedClientId } = useClient();
  const selected = rootClients.find(c => c.id === selectedClientId);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative px-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-2xl px-3 py-2.5 transition-all duration-150 text-[12px] font-medium"
        style={{
          background: open ? 'rgba(200,98,46,0.2)' : SIDEBAR_PANEL,
          border: `1px solid ${open ? 'rgba(200,98,46,0.45)' : SIDEBAR_BORDER}`,
          color: SIDEBAR_TEXT,
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-5 w-5 shrink-0 rounded-lg flex items-center justify-center" style={{ background: 'rgba(241,194,125,0.16)' }}>
            <Shield className="h-3 w-3" style={{ color: '#F1C27D' }} />
          </div>
          <span className="truncate">{selected?.name ?? 'All Clients'}</span>
        </div>
        <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform duration-200', open && 'rotate-180')} style={{ color: SIDEBAR_DIM }} />
      </button>

      {open && (
        <div
          className="absolute left-2 right-2 top-full mt-1.5 z-50 rounded-xl overflow-hidden"
          style={{ border: `1px solid ${WARM_BDR}`, background: '#fff', boxShadow: '0 8px 32px -8px rgba(41,37,36,0.18)' }}
        >
          <div className="p-1 space-y-0.5">
            <button
              onClick={() => { setSelectedClientId(null); setOpen(false); }}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-colors"
              style={{
                background: !selectedClientId ? ACC_BG : 'transparent',
                color: !selectedClientId ? ACC : TEXT2,
                fontWeight: !selectedClientId ? 600 : 400,
              }}
            >
              {!selectedClientId && <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: ACC }} />}
              All Clients
            </button>
            {rootClients.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedClientId(c.id); setOpen(false); }}
                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-colors"
                style={{
                  background: selectedClientId === c.id ? ACC_BG : 'transparent',
                  color: selectedClientId === c.id ? ACC : TEXT2,
                  fontWeight: selectedClientId === c.id ? 600 : 400,
                }}
              >
                {selectedClientId === c.id && <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: ACC }} />}
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sidebar shell ──────────────────────────────────────────────────────── */
function SidebarShell({ children, className, style, ...props }: React.HTMLAttributes<HTMLElement> & { children: React.ReactNode; className?: string }) {
  return (
    <aside
      className={cn('flex flex-col', className)}
      style={{
        background: `radial-gradient(circle at top left, rgba(200,98,46,0.22), transparent 32%), ${SIDEBAR_BG}`,
        borderRight: `1px solid ${SIDEBAR_BORDER}`,
        ...style,
      }}
      {...props}
    >
      {children}
    </aside>
  );
}

/* ── Logo ───────────────────────────────────────────────────────────────── */
function SidebarLogo() {
  return (
    <div className="flex h-[72px] shrink-0 items-center gap-3 px-4" style={{ borderBottom: `1px solid ${SIDEBAR_BORDER}` }}>
      <div
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, #C8622E 0%, #A84E24 100%)',
          boxShadow: '0 18px 40px -22px rgba(200,98,46,0.95)',
        }}
      >
        <Shield className="h-5 w-5 text-white" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p
          className="text-[17px] font-semibold leading-none tracking-tight"
          style={{ fontFamily: FONT_DISPLAY, color: SIDEBAR_TEXT }}
        >
          Argus
        </p>
        <div className="flex items-center gap-1.5 mt-[5px]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <p className="text-[9.5px] font-medium uppercase tracking-wider leading-none" style={{ color: SIDEBAR_DIM }}>
            LinkedEye · Asset Intelligence
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Main layout ────────────────────────────────────────────────────────── */
export function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut, apiSyncFailed } = useAuth();
  const location = useLocation();

  const initials = userInitials(user?.displayName, user?.email);

  const pageTitle = (() => {
    const flat = navSections.flatMap(s => s.items);
    const fullMatch = flat.find(i => i.path === location.pathname + location.search);
    if (fullMatch) return fullMatch.label;
    return flat.find(i => i.path.split('?')[0] === location.pathname)?.label ?? 'Argus';
  })();

  const breadcrumb = (() => {
    const flat = navSections.flatMap(s => s.items.map(i => ({ ...i, section: s.label })));
    const fullMatch = flat.find(i => i.path === location.pathname + location.search);
    const match = fullMatch ?? flat.find(i => i.path.split('?')[0] === location.pathname);
    return match ? match.section : null;
  })();

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: '#F7F3ED', color: TEXT }}>

      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <SidebarShell className="hidden lg:flex w-[230px] shrink-0">
        <SidebarLogo />

        {/* Client context */}
        <div className="px-2 pt-3 pb-3" style={{ borderBottom: `1px solid ${SIDEBAR_BORDER}` }}>
          <p className="px-3 mb-2 text-[9.5px] font-bold uppercase tracking-[0.16em] select-none" style={{ color: SIDEBAR_DIM }}>
            Context
          </p>
          <ClientSelector />
        </div>

        <SidebarNav />

        {/* User footer */}
        <div className="shrink-0 p-3" style={{ borderTop: `1px solid ${SIDEBAR_BORDER}` }}>
          <div
            className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 transition-colors group cursor-default"
            style={{ background: SIDEBAR_PANEL, border: `1px solid ${SIDEBAR_BORDER}` }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = SIDEBAR_PANEL)}
          >
            {/* Initials avatar */}
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${ACC} 0%, #A84E24 100%)` }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold truncate leading-none" style={{ color: SIDEBAR_TEXT }}>
                {user?.displayName || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-[9px] uppercase font-bold mt-0.5 leading-none tracking-wide" style={{ color: SIDEBAR_DIM }}>
                {user?.role ?? 'Viewer'}
              </p>
            </div>
            <button
              onClick={signOut}
              title="Sign out"
              className="p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100"
              style={{ color: SIDEBAR_DIM }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={e => (e.currentTarget.style.color = SIDEBAR_DIM)}
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </SidebarShell>

      {/* ── Mobile Sidebar ──────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-[#19160F]/50 backdrop-blur-sm" />
          <SidebarShell
            className="absolute inset-y-0 left-0 flex w-64 shadow-2xl"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="flex h-[72px] items-center justify-between px-4" style={{ borderBottom: `1px solid ${SIDEBAR_BORDER}` }}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl shrink-0"
                  style={{ background: 'linear-gradient(135deg, #C8622E 0%, #A84E24 100%)' }}
                >
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <p className="text-[15px] font-semibold" style={{ fontFamily: FONT_DISPLAY, color: SIDEBAR_TEXT }}>Argus</p>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded-md" style={{ color: SIDEBAR_DIM }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-2 pt-3 pb-3" style={{ borderBottom: `1px solid ${SIDEBAR_BORDER}` }}>
              <ClientSelector />
            </div>
            <SidebarNav onNavigate={() => setIsMobileMenuOpen(false)} />
          </SidebarShell>
        </div>
      )}

      {/* ── Main area ───────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header
          className="flex h-[54px] shrink-0 items-center justify-between px-4 sm:px-5"
          style={{
            background: 'rgba(253,250,247,0.92)',
            borderBottom: `1px solid ${WARM_BDR}`,
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded-lg transition-colors"
              style={{ color: TEXT2 }}
              onMouseEnter={e => (e.currentTarget.style.background = WARM_HOVER)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-[18px] w-[18px]" />
            </button>
            <div className="flex items-center gap-2 text-[13px]">
              {breadcrumb && (
                <>
                  <span className="hidden sm:inline text-[12px]" style={{ color: DIM }}>{breadcrumb}</span>
                  <ChevronRight className="h-3 w-3 hidden sm:inline" style={{ color: DIM }} />
                </>
              )}
              <span
                className="font-semibold text-[15px]"
                style={{ fontFamily: FONT_DISPLAY, color: TEXT }}
              >
                {pageTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Search */}
            <button
              className="p-2 rounded-lg transition-colors"
              style={{ color: TEXT2 }}
              onMouseEnter={e => (e.currentTarget.style.background = WARM_HOVER)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Search className="h-[16px] w-[16px]" />
            </button>

            {/* Notifications */}
            <button
              className="relative p-2 rounded-lg transition-colors"
              style={{ color: TEXT2 }}
              onMouseEnter={e => (e.currentTarget.style.background = WARM_HOVER)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Bell className="h-[16px] w-[16px]" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-1 ring-[#FDFAF7]" />
            </button>

            {/* Divider + user */}
            <div className="hidden md:flex items-center gap-2.5 pl-3 ml-1 border-l" style={{ borderColor: WARM_BDR }}>
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${ACC} 0%, #A84E24 100%)` }}
              >
                {initials}
              </div>
              <div className="leading-none">
                <p className="text-[12px] font-semibold" style={{ color: TEXT }}>
                  {user?.displayName || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-[9px] uppercase font-bold tracking-wide mt-0.5" style={{ color: DIM }}>
                  {user?.role ?? 'Viewer'}
                </p>
              </div>
            </div>

            <button
              className="ml-1 p-2 rounded-lg transition-colors"
              style={{ color: DIM }}
              onMouseEnter={e => { (e.currentTarget.style.color = '#ef4444'); (e.currentTarget.style.background = 'rgba(239,68,68,0.06)'); }}
              onMouseLeave={e => { (e.currentTarget.style.color = DIM); (e.currentTarget.style.background = 'transparent'); }}
              onClick={signOut}
              title="Sign out"
            >
              <LogOut className="h-[15px] w-[15px]" />
            </button>
          </div>
        </header>

        {/* API sync warning */}
        {apiSyncFailed && (
          <div className="flex shrink-0 items-center gap-2 px-5 py-2.5 text-xs"
            style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A', color: '#92400E' }}>
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span>
              Backend unreachable — run{' '}
              <code className="rounded px-1.5 py-0.5" style={{ fontFamily: FONT_MONO, background: '#FEF3C7', color: '#92400E' }}>
                npm run server
              </code>{' '}
              and{' '}
              <code className="rounded px-1.5 py-0.5" style={{ fontFamily: FONT_MONO, background: '#FEF3C7', color: '#92400E' }}>
                npm run db:up
              </code>{' '}
              to load CMDB data.
            </span>
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 overflow-auto p-2 sm:p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
