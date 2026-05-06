import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Server, Activity, AlertTriangle, ShieldCheck, Globe,
  Shield, Router, Database as DatabaseIcon, Cpu, HardDrive, Zap,
  ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, User,
  Settings, TrendingUp, BarChart3, Layers,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
} from 'recharts';
import { Link } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { assetsApi, driftsApi, infrastructureApi, auditLogsApi, type AuditLogRow } from '../lib/api';
import { useClient } from '@/components/ClientProvider';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

/* ── Theme constants ─────────────────────────────────────────────────────── */
const ACC     = '#C8622E';
const ACC_BG  = '#FAE8DC';
const TEXT    = '#19160F';
const TEXT2   = '#3D3830';
const TEXT3   = '#6B6458';
const DIM     = '#A09688';
const BDR     = '#E8E1D8';
const SURF    = '#ffffff';
const FONT_D  = "'Lora', Georgia, serif";
const FONT_M  = "'JetBrains Mono', monospace";

/* ── Static stub data ────────────────────────────────────────────────────── */
const complianceData = [
  { name: 'CIS',   score: 92, color: '#3D9970' },
  { name: 'SOX',   score: 85, color: '#C8622E' },
  { name: 'HIPAA', score: 98, color: '#276749' },
];

const networkPerformanceData = [
  { time: '00:00', throughput: 45, latency: 12 },
  { time: '04:00', throughput: 32, latency: 15 },
  { time: '08:00', throughput: 78, latency: 22 },
  { time: '12:00', throughput: 95, latency: 25 },
  { time: '16:00', throughput: 82, latency: 18 },
  { time: '20:00', throughput: 55, latency: 14 },
];

const computeUtilizationData = [
  { time: '00:00', cpu: 25, mem: 45 },
  { time: '04:00', cpu: 18, mem: 42 },
  { time: '08:00', cpu: 65, mem: 78 },
  { time: '12:00', cpu: 88, mem: 92 },
  { time: '16:00', cpu: 72, mem: 85 },
  { time: '20:00', cpu: 45, mem: 60 },
];

const VENDOR_COLORS: Record<string, string> = {
  Cisco: '#1D4ED8', Aruba: '#EA580C', Arista: '#0284C7', HP: '#059669',
  Dell: '#2563EB', Huawei: '#DC2626', Fortinet: '#D97706',
  Canonical: '#7C3AED', Microsoft: '#0369A1', 'Red Hat': '#B91C1C',
};

const TYPE_COLORS: Record<string, string> = {
  Firewalls: '#DC2626', Routers: '#2563EB', 'Servers & VMs': '#16A34A',
  Switches: '#7C3AED', Storage: '#D97706', Power: '#0891B2', Other: '#DB2777',
};

/* ── Dark warm chart tooltip ─────────────────────────────────────────────── */
const WarmTooltip = {
  contentStyle: {
    backgroundColor: '#1E1B13',
    border: `1px solid rgba(200,98,46,0.35)`,
    borderRadius: '10px',
    fontSize: 12,
    color: '#F7F3ED',
    boxShadow: '0 8px 28px rgba(0,0,0,0.25)',
    fontFamily: FONT_M,
  },
  labelStyle:  { color: DIM, marginBottom: 4 },
  itemStyle:   { color: '#E07850' },
  cursor: { fill: 'rgba(200,98,46,0.06)' },
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function typeIcon(t: string) {
  if (t === 'User')   return <User className="w-3.5 h-3.5 text-blue-500" />;
  if (t === 'Config') return <Settings className="w-3.5 h-3.5" style={{ color: ACC }} />;
  return <Activity className="w-3.5 h-3.5 text-emerald-500" />;
}

function severityColor(s: string) {
  if (s === 'Critical') return '#DC2626';
  if (s === 'Warning')  return '#D97706';
  return '#16A34A';
}

/* ── Section header ──────────────────────────────────────────────────────── */
function SectionHeader({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        <h2 className="text-[15px] font-semibold leading-none" style={{ fontFamily: FONT_D, color: TEXT }}>
          {title}
        </h2>
        {desc && <p className="mt-1 text-[12px]" style={{ color: TEXT3 }}>{desc}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── Stat card ───────────────────────────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accentColor: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
}

function StatCard({ label, value, icon: Icon, accentColor, trend, trendLabel }: StatCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-5 transition-shadow"
      style={{
        background: SURF,
        border: `1px solid ${BDR}`,
        boxShadow: '0 1px 4px rgba(41,37,36,0.07), 0 4px 16px -8px rgba(41,37,36,0.05)',
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      {/* Background watermark */}
      <Icon
        className="pointer-events-none absolute -right-2 -bottom-2 h-20 w-20"
        style={{ color: accentColor, opacity: 0.04 }}
      />

      <div className="flex items-start justify-between mb-3">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.13em]" style={{ color: TEXT3 }}>
          {label}
        </p>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${accentColor}18` }}
        >
          <Icon className="h-4 w-4" style={{ color: accentColor }} strokeWidth={1.75} />
        </div>
      </div>

      <p
        className="text-[2.15rem] font-semibold leading-none tracking-tight"
        style={{ fontFamily: FONT_D, color: TEXT }}
      >
        {value}
      </p>

      {(trend || trendLabel) && (
        <div className="flex items-center gap-1.5 mt-2.5">
          {trend === 'up'   && <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
          {trend === 'down' && <ArrowDownRight className="h-3.5 w-3.5 text-red-500 shrink-0" />}
          <span
            className="text-[11px] font-medium"
            style={{ color: trend === 'up' ? '#16A34A' : trend === 'down' ? '#DC2626' : TEXT3 }}
          >
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Kicker label (IntelliRAG style) ─────────────────────────────────────── */
function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="h-[1.5px] w-4 rounded-full" style={{ background: ACC }} />
      <span className="text-[10.5px] font-bold uppercase tracking-[0.1em]" style={{ color: ACC }}>
        {children}
      </span>
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────────────────────────────── */
export function Dashboard() {
  const [drifts,      setDrifts]      = useState<any[]>([]);
  const [assetsCount, setAssetsCount] = useState(0);
  const [devices,     setDevices]     = useState<any[]>([]);
  const [auditLogs,   setAuditLogs]   = useState<AuditLogRow[]>([]);
  const [tab,         setTab]         = useState('overview');
  const { selectedClientId } = useClient();

  useEffect(() => {
    const params = selectedClientId ? { clientId: selectedClientId } : {};
    assetsApi.list(params).then(rows => setAssetsCount(rows.length)).catch(console.error);
    driftsApi.list({ status: 'Open' }).then(setDrifts).catch(console.error);
    infrastructureApi.list(params).then(setDevices).catch(console.error);
    auditLogsApi.list({ limit: 6 }).then(setAuditLogs).catch(console.error);
  }, [selectedClientId]);

  const typeCounts = devices.reduce((acc: Record<string, number>, d) => {
    acc[d.type] = (acc[d.type] || 0) + 1; return acc;
  }, {});
  const vendorCounts = devices.reduce((acc: Record<string, number>, d) => {
    const v = d.vendor || 'Unknown'; acc[v] = (acc[v] || 0) + 1; return acc;
  }, {});

  const assetTypeData = [
    { name: 'Firewalls',    count: typeCounts['Firewall'] || 0 },
    { name: 'Routers',      count: typeCounts['Router']   || 0 },
    { name: 'Servers & VMs',count: (typeCounts['Server'] || 0) + (typeCounts['VM'] || 0) },
    { name: 'Switches',     count: typeCounts['Switch']   || 0 },
    { name: 'Storage',      count: typeCounts['Storage']  || 0 },
    { name: 'Power',        count: typeCounts['Power']    || 0 },
    { name: 'Other',        count: typeCounts['Device']   || 0 },
  ].filter(d => d.count > 0);

  const liveVendorData = Object.entries(vendorCounts)
    .filter(([v]) => v && v !== 'Unknown')
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 7)
    .map(([name, count]) => ({ name, count: count as number, fill: VENDOR_COLORS[name] || '#64748b' }));

  const totalHardware = assetsCount + devices.length;
  const activeVendors = Object.keys(vendorCounts).filter(v => v && v !== 'Unknown').length;

  return (
    <div className="space-y-7">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] mb-1.5" style={{ color: ACC }}>
            FinSpot · LinkedEye
          </p>
          <h1
            className="text-[1.65rem] font-semibold leading-tight tracking-tight"
            style={{ fontFamily: FONT_D, color: TEXT }}
          >
            Executive Dashboard
          </h1>
          <p className="text-[13px] mt-1" style={{ color: TEXT3 }}>
            Real-time visibility across hardware, network, and compliance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold"
            style={{ background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            All Systems Healthy
          </div>
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
            style={{ background: ACC_BG, color: ACC, border: `1px solid ${ACC}33` }}
          >
            <Clock className="h-3 w-3" />
            Live
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <Tabs className="w-full">
        <TabsList
          className="h-auto gap-0 p-0 w-auto rounded-none"
          style={{ background: 'transparent', borderBottom: `1px solid ${BDR}` }}
        >
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'network',  label: 'Network' },
            { key: 'compute',  label: 'Compute' },
          ].map(t => (
            <TabsTrigger
              key={t.key}
              active={tab === t.key}
              onClick={() => setTab(t.key)}
              className="h-9 px-5 rounded-none text-[13px] font-medium border-b-2 transition-all"
              style={{
                borderBottomColor: tab === t.key ? ACC : 'transparent',
                color: tab === t.key ? ACC : TEXT3,
                background: 'transparent',
              }}
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════
            OVERVIEW TAB
        ═══════════════════════════════════════════════════════════ */}
        <TabsContent className={tab === 'overview' ? 'block space-y-7 mt-6' : 'hidden'}>

          {/* KPI stat cards */}
          <div>
            <Kicker>Key Metrics</Kicker>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Hardware"
                value={totalHardware}
                icon={Server}
                accentColor="#2563EB"
                trend="up"
                trendLabel={`${devices.length} infra · ${assetsCount} CIs`}
              />
              <StatCard
                label="Open Drifts"
                value={drifts.length}
                icon={AlertTriangle}
                accentColor={drifts.length > 0 ? '#D97706' : '#16A34A'}
                trend={drifts.length > 0 ? 'down' : 'neutral'}
                trendLabel={drifts.length > 0 ? 'Needs attention' : 'All clear'}
              />
              <StatCard
                label="Compliance"
                value="94%"
                icon={ShieldCheck}
                accentColor="#16A34A"
                trend="up"
                trendLabel="CIS · SOX · HIPAA"
              />
              <StatCard
                label="Active Vendors"
                value={activeVendors}
                icon={BarChart3}
                accentColor={ACC}
                trendLabel={`${devices.length} total devices`}
              />
            </div>
          </div>

          {/* Drift alert banner */}
          {drifts.length > 0 && (
            <div
              className="flex items-center justify-between gap-4 rounded-xl px-5 py-3.5"
              style={{
                background: '#FFFBEB',
                border: `1px solid #FDE68A`,
                borderLeft: `3px solid #D97706`,
              }}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-sm font-medium" style={{ color: '#92400E' }}>
                  {drifts.length} configuration {drifts.length === 1 ? 'drift' : 'drifts'} require attention
                </p>
                <div className="flex flex-wrap gap-1.5 ml-2">
                  {drifts.slice(0, 4).map(d => (
                    <span
                      key={d.id}
                      className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px]"
                      style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', fontFamily: FONT_M }}
                    >
                      {d.device_id}
                    </span>
                  ))}
                  {drifts.length > 4 && <span className="text-[11px] text-amber-700">+{drifts.length - 4} more</span>}
                </div>
              </div>
              <Link
                to="/configs"
                className="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors"
                style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E' }}
              >
                Review <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {/* Asset type + vendor distribution */}
          <div>
            <Kicker>Asset Distribution</Kicker>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Donut chart */}
              <div
                className="lg:col-span-3 rounded-xl p-5"
                style={{ background: SURF, border: `1px solid ${BDR}`, boxShadow: '0 1px 4px rgba(41,37,36,0.07)' }}
              >
                <p className="text-[13px] font-semibold mb-0.5" style={{ fontFamily: FONT_D, color: TEXT }}>
                  Asset Type Distribution
                </p>
                <p className="text-[11.5px] mb-4" style={{ color: TEXT3 }}>Breakdown by infrastructure category.</p>
                {assetTypeData.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="h-52 flex-1 min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={assetTypeData} cx="50%" cy="50%" innerRadius={58} outerRadius={82} paddingAngle={2} dataKey="count">
                            {assetTypeData.map(entry => (
                              <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || '#64748b'} />
                            ))}
                          </Pie>
                          <Tooltip {...WarmTooltip} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="shrink-0 space-y-2">
                      {assetTypeData.map(item => (
                        <div key={item.name} className="flex items-center gap-2.5">
                          <span className="h-2.5 w-2.5 rounded shrink-0" style={{ background: TYPE_COLORS[item.name] || '#64748b' }} />
                          <span className="text-[12px] whitespace-nowrap" style={{ color: TEXT3 }}>{item.name}</span>
                          <span className="text-[12px] font-bold ml-auto pl-4" style={{ color: TEXT, fontFamily: FONT_M }}>{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-52 flex items-center justify-center text-sm" style={{ color: DIM }}>
                    No devices loaded — start the server and run migrations.
                  </div>
                )}
              </div>

              {/* Vendor bar */}
              <div
                className="lg:col-span-2 rounded-xl p-5"
                style={{ background: SURF, border: `1px solid ${BDR}`, boxShadow: '0 1px 4px rgba(41,37,36,0.07)' }}
              >
                <p className="text-[13px] font-semibold mb-0.5" style={{ fontFamily: FONT_D, color: TEXT }}>
                  Vendor Distribution
                </p>
                <p className="text-[11.5px] mb-4" style={{ color: TEXT3 }}>Devices by manufacturer.</p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={liveVendorData} layout="vertical" margin={{ top: 0, right: 8, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={BDR} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={11} tick={{ fill: TEXT3 }} />
                      <Tooltip {...WarmTooltip} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={12}>
                        {liveVendorData.map(entry => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Manufacturer intelligence */}
          {liveVendorData.length > 0 && (
            <div>
              <Kicker>Manufacturer Intelligence</Kicker>
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: `1px solid ${BDR}`, boxShadow: '0 1px 4px rgba(41,37,36,0.07)' }}
              >
                {/* Header row */}
                <div
                  className="flex items-center justify-between px-5 py-3.5"
                  style={{ background: '#FDFAF7', borderBottom: `1px solid ${BDR}` }}
                >
                  <p className="text-[13px] font-semibold" style={{ fontFamily: FONT_D, color: TEXT }}>
                    Top devices per manufacturer
                  </p>
                  <span
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                    style={{ background: ACC_BG, color: ACC }}
                  >
                    {liveVendorData.length} vendors · {devices.length} devices
                  </span>
                </div>
                {/* Vendor cells */}
                <div
                  className="grid gap-px"
                  style={{
                    background: BDR,
                    gridTemplateColumns: `repeat(${Math.min(liveVendorData.length, 6)}, 1fr)`,
                  }}
                >
                  {liveVendorData.map(vendor => (
                    <div
                      key={vendor.name}
                      className="p-4 transition-colors"
                      style={{ background: SURF, borderLeft: `3px solid ${vendor.fill}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FDFAF7')}
                      onMouseLeave={e => (e.currentTarget.style.background = SURF)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9.5px] font-bold uppercase tracking-wide" style={{ color: TEXT3 }}>
                          {vendor.name}
                        </span>
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: vendor.fill }} />
                      </div>
                      <p
                        className="text-[1.85rem] font-semibold leading-none mb-2"
                        style={{ fontFamily: FONT_D, color: TEXT }}
                      >
                        {vendor.count}
                      </p>
                      <div className="space-y-0.5">
                        {devices.filter(d => d.vendor === vendor.name).slice(0, 3).map((d, i) => (
                          <p key={i} className="text-[10px] truncate" style={{ color: DIM }}>
                            {d.model || d.name || d.type}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Compliance + infrastructure quick stats */}
          <div>
            <Kicker>Compliance &amp; Infrastructure</Kicker>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Compliance */}
              <div
                className="rounded-xl p-5"
                style={{ background: SURF, border: `1px solid ${BDR}`, boxShadow: '0 1px 4px rgba(41,37,36,0.07)' }}
              >
                <p className="text-[13px] font-semibold mb-0.5" style={{ fontFamily: FONT_D, color: TEXT }}>
                  Regulatory Compliance
                </p>
                <p className="text-[11.5px] mb-5" style={{ color: TEXT3 }}>
                  Continuous auditing against major frameworks.
                </p>
                <div className="space-y-5">
                  {complianceData.map(item => (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: item.color }} />
                          <span className="text-[13px] font-medium" style={{ color: TEXT2 }}>{item.name} Benchmark</span>
                        </div>
                        <span
                          className="text-[13px] font-bold"
                          style={{ fontFamily: FONT_M, color: item.score > 90 ? '#16A34A' : '#D97706' }}
                        >
                          {item.score}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F0EAE0' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${item.score}%`, background: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Device type quick stats */}
              <div
                className="rounded-xl p-5"
                style={{ background: SURF, border: `1px solid ${BDR}`, boxShadow: '0 1px 4px rgba(41,37,36,0.07)' }}
              >
                <p className="text-[13px] font-semibold mb-0.5" style={{ fontFamily: FONT_D, color: TEXT }}>
                  Infrastructure Quick Stats
                </p>
                <p className="text-[11.5px] mb-4" style={{ color: TEXT3 }}>Live device counts by type.</p>
                <div className="space-y-2">
                  {[
                    { label: 'Firewalls', count: typeCounts['Firewall'] || 0, icon: Shield,      color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
                    { label: 'Routers',   count: typeCounts['Router']   || 0, icon: Router,      color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
                    { label: 'Switches',  count: typeCounts['Switch']   || 0, icon: Zap,         color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
                    { label: 'Servers',   count: (typeCounts['Server'] || 0) + (typeCounts['VM'] || 0), icon: DatabaseIcon, color: '#16A34A', bg: 'rgba(22,163,74,0.08)' },
                    { label: 'Storage',   count: typeCounts['Storage']  || 0, icon: HardDrive,   color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
                  ].map(row => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between p-3 rounded-lg transition-colors"
                      style={{ background: '#FDFAF7', border: `1px solid ${BDR}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = ACC_BG)}
                      onMouseLeave={e => (e.currentTarget.style.background = '#FDFAF7')}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg" style={{ background: row.bg }}>
                          <row.icon className="h-3.5 w-3.5" style={{ color: row.color }} strokeWidth={1.75} />
                        </div>
                        <span className="text-[13px] font-medium" style={{ color: TEXT2 }}>{row.label}</span>
                      </div>
                      <span className="text-[14px] font-bold" style={{ fontFamily: FONT_M, color: TEXT }}>
                        {row.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent audit activity */}
          <div>
            <Kicker>Audit Activity</Kicker>
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: SURF, border: `1px solid ${BDR}`, boxShadow: '0 1px 4px rgba(41,37,36,0.07)' }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-3.5"
                style={{ background: '#FDFAF7', borderBottom: `1px solid ${BDR}` }}
              >
                <p className="text-[13px] font-semibold" style={{ fontFamily: FONT_D, color: TEXT }}>
                  Recent Activity
                </p>
                <Link
                  to="/audit-log"
                  className="flex items-center gap-1 text-[12px] font-semibold transition-colors"
                  style={{ color: ACC }}
                >
                  View all <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {/* Rows */}
              {auditLogs.length > 0 ? (
                <div>
                  {auditLogs.map((log, i) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between px-5 py-3 gap-3 transition-colors"
                      style={{ borderTop: i > 0 ? `1px solid ${BDR}` : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FDFAF7')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg"
                          style={{ background: '#F0EAE0' }}
                        >
                          {typeIcon(log.type)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium truncate" style={{ color: TEXT2 }}>
                            {log.action}
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: DIM }}>
                            {log.user_email || 'System'} · {format(new Date(log.created_at), 'dd MMM, HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: `${severityColor(log.severity)}18`,
                            color: severityColor(log.severity),
                          }}
                        >
                          {log.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10" style={{ color: DIM }}>
                  <CheckCircle2 className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════
            NETWORK TAB
        ═══════════════════════════════════════════════════════════ */}
        <TabsContent className={tab === 'network' ? 'block space-y-7 mt-6' : 'hidden'}>
          <div>
            <Kicker>Network Devices</Kicker>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="Firewalls" value={typeCounts['Firewall'] || 0} icon={Shield}  accentColor="#DC2626" trendLabel="Security perimeter" />
              <StatCard label="Routers"   value={typeCounts['Router']   || 0} icon={Router}  accentColor="#2563EB" trendLabel="Core routing" />
              <StatCard label="Switches"  value={typeCounts['Switch']   || 0} icon={Zap}     accentColor="#7C3AED" trendLabel="Network fabric" />
            </div>
          </div>

          <div>
            <Kicker>Performance &amp; Alerts</Kicker>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Network throughput chart */}
              <div className="rounded-xl p-5" style={{ background: SURF, border: `1px solid ${BDR}`, boxShadow: '0 1px 4px rgba(41,37,36,0.07)' }}>
                <p className="text-[13px] font-semibold mb-0.5" style={{ fontFamily: FONT_D, color: TEXT }}>
                  Network Throughput (Gbps)
                </p>
                <p className="text-[11.5px] mb-4" style={{ color: TEXT3 }}>24-hour traffic trend across core infrastructure.</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={networkPerformanceData}>
                      <defs>
                        <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={ACC} stopOpacity={0.18} />
                          <stop offset="95%" stopColor={ACC} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={BDR} />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} fontSize={11} tick={{ fill: DIM }} />
                      <YAxis axisLine={false} tickLine={false} fontSize={11} tick={{ fill: DIM }} />
                      <Tooltip {...WarmTooltip} />
                      <Area type="monotone" dataKey="throughput" stroke={ACC} strokeWidth={2} fill="url(#gradNet)" name="Throughput (Gbps)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Alerts */}
              <div className="rounded-xl p-5" style={{ background: SURF, border: `1px solid ${BDR}`, boxShadow: '0 1px 4px rgba(41,37,36,0.07)' }}>
                <p className="text-[13px] font-semibold mb-0.5" style={{ fontFamily: FONT_D, color: TEXT }}>
                  Active Network Alerts
                </p>
                <p className="text-[11.5px] mb-4" style={{ color: TEXT3 }}>Issues requiring attention.</p>
                <div className="space-y-3">
                  {[
                    {
                      severity: 'Critical', color: '#DC2626', bg: 'rgba(220,38,38,0.06)', border: 'rgba(220,38,38,0.2)',
                      icon: AlertTriangle, title: 'BGP Session Down', detail: 'Edge-Router-01 · Peer: 172.16.0.1',
                    },
                    {
                      severity: 'Warning',  color: '#D97706', bg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.2)',
                      icon: Activity,       title: 'High CPU Usage',   detail: 'Core-Switch-02 · 85% load',
                    },
                    {
                      severity: 'OK',       color: '#16A34A', bg: 'rgba(22,163,74,0.06)', border: 'rgba(22,163,74,0.2)',
                      icon: CheckCircle2,   title: 'All other links nominal', detail: 'Last checked: moments ago',
                    },
                  ].map(alert => {
                    const Icon = alert.icon;
                    return (
                      <div
                        key={alert.severity}
                        className="flex items-start justify-between gap-3 rounded-lg px-4 py-3"
                        style={{ background: alert.bg, border: `1px solid ${alert.border}` }}
                      >
                        <div className="flex items-start gap-2.5">
                          <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: alert.color }} strokeWidth={1.75} />
                          <div>
                            <p className="text-[13px] font-medium" style={{ color: TEXT2 }}>{alert.title}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: DIM }}>{alert.detail}</p>
                          </div>
                        </div>
                        <span
                          className="text-[10.5px] font-bold px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: `${alert.color}22`, color: alert.color }}
                        >
                          {alert.severity}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════
            COMPUTE TAB
        ═══════════════════════════════════════════════════════════ */}
        <TabsContent className={tab === 'compute' ? 'block space-y-7 mt-6' : 'hidden'}>
          <div>
            <Kicker>Compute Resources</Kicker>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                label="Servers &amp; VMs"
                value={(typeCounts['Server'] || 0) + (typeCounts['VM'] || 0)}
                icon={DatabaseIcon}
                accentColor="#16A34A"
                trendLabel={`${typeCounts['Server'] || 0} physical · ${typeCounts['VM'] || 0} VMs`}
              />
              <StatCard
                label="Storage Arrays"
                value={typeCounts['Storage'] || 0}
                icon={HardDrive}
                accentColor="#D97706"
                trend="up"
                trendLabel="100% operational"
              />
            </div>
          </div>

          <div>
            <Kicker>Utilization &amp; Load</Kicker>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Compute chart */}
              <div className="rounded-xl p-5" style={{ background: SURF, border: `1px solid ${BDR}`, boxShadow: '0 1px 4px rgba(41,37,36,0.07)' }}>
                <p className="text-[13px] font-semibold mb-0.5" style={{ fontFamily: FONT_D, color: TEXT }}>
                  Compute Utilization (%)
                </p>
                <p className="text-[11.5px] mb-4" style={{ color: TEXT3 }}>CPU and Memory trends across the server fleet.</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={computeUtilizationData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={BDR} />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} fontSize={11} tick={{ fill: DIM }} />
                      <YAxis axisLine={false} tickLine={false} fontSize={11} tick={{ fill: DIM }} />
                      <Tooltip {...WarmTooltip} />
                      <Line type="monotone" dataKey="cpu" stroke="#16A34A" strokeWidth={2} name="CPU" dot={false} />
                      <Line type="monotone" dataKey="mem" stroke="#2563EB" strokeWidth={2} name="Memory" dot={false} strokeDasharray="4 2" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-[#16A34A] inline-block" /><span className="text-[11px]" style={{ color: DIM }}>CPU</span></div>
                  <div className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-[#2563EB] inline-block" /><span className="text-[11px]" style={{ color: DIM }}>Memory</span></div>
                </div>
              </div>

              {/* Top servers */}
              <div className="rounded-xl p-5" style={{ background: SURF, border: `1px solid ${BDR}`, boxShadow: '0 1px 4px rgba(41,37,36,0.07)' }}>
                <p className="text-[13px] font-semibold mb-0.5" style={{ fontFamily: FONT_D, color: TEXT }}>
                  Top Servers by Load
                </p>
                <p className="text-[11.5px] mb-4" style={{ color: TEXT3 }}>Potential performance bottlenecks.</p>
                <div className="space-y-5">
                  {[
                    { name: 'PROD-DB-01', cpu: 92, mem: 88 },
                    { name: 'WEB-FE-04',  cpu: 78, mem: 65 },
                    { name: 'APP-SRV-02', cpu: 65, mem: 72 },
                  ].map(srv => {
                    const cpuColor = srv.cpu > 85 ? '#DC2626' : srv.cpu > 70 ? '#D97706' : '#16A34A';
                    const memColor = srv.mem > 85 ? '#DC2626' : '#2563EB';
                    return (
                      <div key={srv.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[12.5px] font-semibold" style={{ fontFamily: FONT_M, color: TEXT2 }}>
                            {srv.name}
                          </span>
                          <span className="text-[11px]" style={{ color: DIM }}>
                            CPU {srv.cpu}% · MEM {srv.mem}%
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F0EAE0' }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${srv.cpu}%`, background: cpuColor }} />
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F0EAE0' }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${srv.mem}%`, background: memColor }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10.5px] mt-4" style={{ color: DIM }}>
                  Top bar = CPU · Bottom bar = Memory. Red = critical (&gt;85%), amber = warning (&gt;70%).
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
