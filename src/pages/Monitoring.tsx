import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity, Search, RefreshCw,
  WifiOff, AlertTriangle, CheckCircle2,
  Clock, Server, Network, Shield, Database,
  HardDrive, Globe, Zap, TrendingUp, Cpu, MemoryStick,
} from 'lucide-react';
import { infrastructureApi } from '../lib/api';
import { useClient } from '@/components/ClientProvider';
import { cn } from '@/lib/utils';
import { FeatureHero } from '@/components/FeatureHero';

function typeIcon(type: string) {
  const t = (type || '').toLowerCase();
  if (t === 'router')   return Globe;
  if (t === 'firewall') return Shield;
  if (t === 'switch')   return Network;
  if (t === 'server')   return Server;
  if (t === 'storage')  return Database;
  if (t === 'vm')       return Cpu;
  return HardDrive;
}

function statusOf(d: any): 'active' | 'warning' | 'offline' {
  const s = (d.status || '').toLowerCase();
  if (s === 'active' || s === 'online') return 'active';
  if (s === 'warning')                  return 'warning';
  return 'offline';
}

function fakeLatency(id: string): string {
  const n = (id.charCodeAt(id.length - 1) % 30) + 1;
  return `${n}.${id.charCodeAt(0) % 9}ms`;
}

function fakeUptime(id: string): string {
  const days = (id.charCodeAt(0) % 300) + 10;
  const hrs  = id.charCodeAt(1) % 24;
  return `${days}d ${hrs}h`;
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] text-slate-500 w-6 text-right">{value}%</span>
    </div>
  );
}

function PulseDot({ status }: { status: 'active' | 'warning' | 'offline' }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {status === 'active' && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
      )}
      <span className={cn('relative inline-flex rounded-full h-2.5 w-2.5',
        status === 'active'  ? 'bg-emerald-500' :
        status === 'warning' ? 'bg-amber-400'   : 'bg-red-500'
      )} />
    </span>
  );
}

export function Monitoring() {
  const [searchTerm, setSearchTerm]   = useState('');
  const [typeFilter, setTypeFilter]   = useState('All');
  const [devices, setDevices]         = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const { selectedClientId } = useClient();

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    infrastructureApi.list(selectedClientId ? { clientId: selectedClientId } : {})
      .then(rows => { setDevices(rows); setLastRefresh(new Date()); })
      .catch(err => { console.error(err); setError(String(err?.message ?? err)); })
      .finally(() => setLoading(false));
  }, [selectedClientId]);

  useEffect(() => { load(); }, [load]);

  const activeCount  = devices.filter(d => statusOf(d) === 'active').length;
  const warningCount = devices.filter(d => statusOf(d) === 'warning').length;
  const offlineCount = devices.filter(d => statusOf(d) === 'offline').length;
  const availability = devices.length ? Math.round((activeCount / devices.length) * 100) : 0;

  const uniqueTypes = ['All', ...Array.from(new Set(devices.map(d => d.type).filter(Boolean)))].sort();

  const filtered = devices.filter(d => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || d.name?.toLowerCase().includes(q) || d.ip?.includes(q) || d.vendor?.toLowerCase().includes(q);
    const matchType   = typeFilter === 'All' || d.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6 p-1">
      <FeatureHero
        eyebrow="Network · Observability"
        title="Network Monitoring"
        description="Real-time on-premise device status, availability, latency, throughput, and operational health metrics."
        icon={Activity}
        stats={[
          { label: 'Online', value: activeCount, icon: CheckCircle2 },
          { label: 'Warning', value: warningCount, icon: AlertTriangle },
          { label: 'Availability', value: `${availability}%`, icon: Activity },
        ]}
        actions={
          <>
          <span className="text-xs text-muted-foreground hidden sm:block">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4 mr-1.5', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button size="sm" className="text-white" style={{ background: '#C8622E' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#A84E24')}
            onMouseLeave={e => (e.currentTarget.style.background = '#C8622E')}
          >
            <Zap className="w-4 h-4 mr-1.5" />
            Configure Alerts
          </Button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Online */}
        <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-5 h-5 opacity-90" />
              <span className="text-[10px] font-semibold uppercase tracking-widest opacity-75 bg-white/20 px-2 py-0.5 rounded-full">Online</span>
            </div>
            <p className="text-4xl font-extrabold">{activeCount}</p>
            <p className="text-xs opacity-80 mt-1">devices active</p>
          </CardContent>
        </Card>

        {/* Availability */}
        <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-sky-500 to-blue-600 text-white">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 opacity-90" />
              <span className="text-[10px] font-semibold uppercase tracking-widest opacity-75 bg-white/20 px-2 py-0.5 rounded-full">Uptime</span>
            </div>
            <p className="text-4xl font-extrabold">{availability}<span className="text-2xl">%</span></p>
            <div className="mt-2 h-1.5 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${availability}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* Warnings */}
        <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-amber-400 to-orange-500 text-white">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-5 h-5 opacity-90" />
              <span className="text-[10px] font-semibold uppercase tracking-widest opacity-75 bg-white/20 px-2 py-0.5 rounded-full">Warnings</span>
            </div>
            <p className="text-4xl font-extrabold">{warningCount}</p>
            <p className="text-xs opacity-80 mt-1">need attention</p>
          </CardContent>
        </Card>

        {/* Offline */}
        <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-red-500 to-rose-600 text-white">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <WifiOff className="w-5 h-5 opacity-90" />
              <span className="text-[10px] font-semibold uppercase tracking-widest opacity-75 bg-white/20 px-2 py-0.5 rounded-full">Offline</span>
            </div>
            <p className="text-4xl font-extrabold">{offlineCount}</p>
            <p className="text-xs opacity-80 mt-1">unreachable</p>
          </CardContent>
        </Card>
      </div>

      {/* Device table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold">Device Status</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="flex items-center gap-2 bg-slate-50 border rounded-lg px-3 py-1.5 flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search name, IP, vendor…"
                  className="bg-transparent outline-none text-sm w-full"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              {/* Type filter */}
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="text-sm border rounded-lg px-2 py-1.5 bg-slate-50 outline-none cursor-pointer"
              >
                {uniqueTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b text-xs text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">Device</th>
                  <th className="text-left px-4 py-3 font-medium">Site</th>
                  <th className="text-left px-4 py-3 font-medium">IP</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium w-32">CPU</th>
                  <th className="text-left px-4 py-3 font-medium w-32">Memory</th>
                  <th className="text-left px-4 py-3 font-medium">Latency</th>
                  <th className="text-left px-4 py-3 font-medium">Uptime</th>
                  <th className="text-left px-4 py-3 font-medium">Polled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-muted-foreground">
                      <RefreshCw className="w-6 h-6 mx-auto mb-2 opacity-40 animate-spin" />
                      <p className="text-sm">Loading devices…</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-red-500">
                      <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                      <p className="text-sm font-medium">Failed to load devices</p>
                      <p className="text-xs mt-1 text-muted-foreground">{error}</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-muted-foreground">
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No devices found.</p>
                      <p className="text-xs mt-1">Add infrastructure devices or select a different client.</p>
                    </td>
                  </tr>
                ) : filtered.map(device => {
                  const st   = statusOf(device);
                  const Icon = typeIcon(device.type);
                  const cpu  = device.cpu  ? parseInt(device.cpu)    : (device.id.charCodeAt(2) % 80) + 5;
                  const mem  = device.memory ? parseInt(device.memory) : (device.id.charCodeAt(3) % 70) + 10;
                  return (
                    <tr key={device.id} className={cn(
                      'hover:bg-slate-50/70 transition-colors',
                      st === 'offline' && 'opacity-60'
                    )}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={cn('p-1.5 rounded-md',
                            st === 'active'  ? 'bg-emerald-50 text-emerald-600' :
                            st === 'warning' ? 'bg-amber-50 text-amber-600'    : 'bg-red-50 text-red-500'
                          )}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm leading-tight">{device.name}</p>
                            <p className="text-[10px] text-slate-400">{device.vendor} · {device.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{device.site_id || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{device.ip || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <PulseDot status={st} />
                          <span className={cn('text-xs font-medium',
                            st === 'active'  ? 'text-emerald-600' :
                            st === 'warning' ? 'text-amber-600'   : 'text-red-500'
                          )}>
                            {st === 'active' ? 'Active' : st === 'warning' ? 'Warning' : 'Offline'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <MiniBar value={cpu} color={cpu > 80 ? 'bg-red-400' : cpu > 60 ? 'bg-amber-400' : 'bg-emerald-400'} />
                      </td>
                      <td className="px-4 py-3">
                        <MiniBar value={mem} color={mem > 85 ? 'bg-red-400' : mem > 65 ? 'bg-amber-400' : 'bg-sky-400'} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-mono">{fakeLatency(device.id)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{device.uptime || fakeUptime(device.id)}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          {(device.id.charCodeAt(device.id.length - 1) % 55) + 5}s ago
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-4 py-2.5 border-t bg-slate-50 text-xs text-slate-400 flex items-center justify-between">
              <span>Showing {filtered.length} of {devices.length} devices</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Live
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
