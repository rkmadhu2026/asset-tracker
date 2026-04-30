import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Server, FileCode2, ShieldAlert, CheckCircle, Settings, Bell, User, ClipboardList, Building2, Menu, X, Network, Terminal, Layers, Activity, LogOut, Sparkles, Users, FileText, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from './AuthProvider';
import { useClient } from './ClientProvider';
import { Layout as LayoutIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Building2, label: 'Clients', path: '/clients' },
  { icon: Server, label: 'Sites', path: '/sites' },
  { icon: Server, label: 'CMDB / Assets', path: '/assets' },
  { icon: FileText, label: 'Asset Details', path: '/assets/AS-1001' },
  { icon: LayoutIcon, label: 'Rack Management', path: '/racks' },
  { icon: Network, label: 'Infrastructure', path: '/infrastructure' },
  { icon: Sparkles, label: 'Onboarding', path: '/onboarding' },
  { icon: Activity, label: 'Monitoring', path: '/monitoring' },
  { icon: Layers, label: 'Network Topology', path: '/topology' },
  { icon: FileCode2, label: 'Configurations', path: '/configs' },
  { icon: Terminal, label: 'Automation', path: '/automation' },
  { icon: ShieldAlert, label: 'Vulnerabilities', path: '/vulnerabilities' },
  { icon: CheckCircle, label: 'Compliance', path: '/compliance' },
  { icon: ClipboardList, label: 'Audit Log', path: '/audit-log' },
];

export function Layout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, profile, signOut, isAdmin, apiSyncFailed } = useAuth();
  const { rootClients, selectedClientId, setSelectedClientId } = useClient();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
      <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-foreground">
      {/* Sidebar — Desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100 shadow-sm lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-6">
          <Server className="mr-2 h-6 w-6 shrink-0 text-primary" strokeWidth={2} />
          <div className="min-w-0">
            <span className="font-[family-name:var(--font-display)] text-lg font-semibold leading-none tracking-tight text-foreground">
              Argus
            </span>
            <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Asset tracker
            </p>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/12 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              to="/users"
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                location.pathname === '/users'
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Users className="w-5 h-5 mr-3" />
              Users Management
            </Link>
          )}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            <Settings className="w-4 h-4 mr-2" />
            <span>Settings</span>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={toggleMobileMenu}
        >
          <aside
            className="fixed inset-y-0 left-0 flex w-64 flex-col border-r border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-6">
              <div className="flex min-w-0 items-center">
                <Server className="mr-2 h-6 w-6 shrink-0 text-primary" strokeWidth={2} />
                <div className="min-w-0">
                  <span className="font-[family-name:var(--font-display)] text-lg font-semibold leading-none tracking-tight">
                    Argus
                  </span>
                  <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Asset tracker
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={toggleMobileMenu}
                    className={cn(
                      'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/12 text-primary shadow-sm'
                        : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                    )}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  to="/users"
                  onClick={toggleMobileMenu}
                  className={cn(
                    'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    location.pathname === '/users'
                      ? 'bg-primary/12 text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                  )}
                >
                  <Users className="w-5 h-5 mr-3" />
                  Users Management
                </Link>
              )}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden mr-2" 
              onClick={toggleMobileMenu}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden sm:flex items-center text-sm text-muted-foreground mr-4">
              <span className="font-medium text-foreground mr-2">Client:</span>
              <div className="w-44">
                <Select
                  value={selectedClientId || ''}
                  onValueChange={val => setSelectedClientId(val === '' ? null : val)}
                >
                  <SelectValue placeholder="Select Client" />
                  <SelectContent>
                    {rootClients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Link to="/clients" className="hidden md:flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mr-4">
              <Building2 className="w-4 h-4 mr-1.5" />
              Manage Clients
            </Link>
            <Link to="/assets/AS-1001" className="hidden md:flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mr-4">
              <FileText className="w-4 h-4 mr-1.5" />
              Asset Details
            </Link>
            <div className="font-[family-name:var(--font-display)] sm:hidden text-lg font-semibold tracking-tight text-primary">
              Argus
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button className="text-muted-foreground hover:text-foreground relative p-2">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
            </button>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-primary/20" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <div className="hidden md:flex flex-col items-start -space-y-1">
                  <span className="text-sm font-medium">{user?.displayName || 'User'}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">{profile?.role || 'User'}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={signOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {apiSyncFailed && (
          <div className="flex shrink-0 items-start gap-2 border-b border-amber-200/90 bg-amber-50/95 px-4 py-2.5 text-xs text-amber-950 sm:items-center sm:text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 sm:mt-0" aria-hidden />
            <span>
              Backend unreachable — signed in with Firebase only. Run{' '}
              <code className="rounded bg-amber-500/20 px-1 py-0.5 font-mono text-[11px]">npm run server</code>{' '}
              and ensure Postgres is up (<code className="rounded bg-amber-500/20 px-1 py-0.5 font-mono text-[11px]">npm run db:up</code>) to sync your profile and load CMDB data.
            </span>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-gradient-to-b from-[#faf9f5]/90 to-[#f7f5f0] p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
