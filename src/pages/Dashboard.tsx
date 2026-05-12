import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Server, Activity, AlertTriangle, ShieldCheck, Globe,
  Shield, Router, Database as DatabaseIcon, Cpu, HardDrive, Zap,
  ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, User,
  Settings, TrendingUp, BarChart3, Layers,
  Headphones, FileText, Package, Calendar, DollarSign, Award,
  Wrench, Inbox, TimerReset, AlertCircle, BookOpen, Smile,
  GitPullRequest, AlertOctagon, Truck, Star, CalendarClock, Search,
  Monitor as MonitorIcon, Laptop, Smartphone, Printer,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
} from 'recharts';
import { Link, useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { assetsApi, driftsApi, infrastructureApi, auditLogsApi, configTasksApi, type AuditLogRow, type ConfigTask } from '../lib/api';
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
  if (t === 'User')   return <User className="w-3.5 h-3.5" style={{ color: '#C8622E' }} />;
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
    <div className="flex items-end justify-between gap-4 mb-3">
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
      className="relative overflow-hidden rounded-xl p-4 transition-shadow"
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
        className="text-[1.75rem] font-semibold leading-none tracking-tight"
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
    <div className="flex items-center gap-2 mb-2">
      <span className="h-[1.5px] w-4 rounded-full" style={{ background: ACC }} />
      <span className="text-[10.5px] font-bold uppercase tracking-[0.1em]" style={{ color: ACC }}>
        {children}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SERVICE DESK TAB  (GLPI-style helpdesk + lifecycle + finance)
══════════════════════════════════════════════════════════════════════════ */

const PRIORITY_COLORS: Record<string, string> = {
  High:   '#DC2626',
  Medium: '#D97706',
  Low:    '#16A34A',
};

const TICKET_STATUS_COLORS: Record<string, string> = {
  Pending:    '#D97706',
  InProgress: '#C8622E',
  Resolved:   '#16A34A',
};

// Demo data — replace once corresponding tables exist in DB.
const TICKET_CATEGORIES = [
  { name: 'Incident',     value: 47, fill: '#DC2626', icon: AlertOctagon },
  { name: 'Request',      value: 84, fill: '#C8622E', icon: Inbox },
  { name: 'Problem',      value: 12, fill: '#D97706', icon: AlertCircle },
  { name: 'Change',       value: 23, fill: '#7C3AED', icon: GitPullRequest },
];

const OS_DISTRIBUTION = [
  { name: 'Windows Server 2022', value: 142, fill: '#0369A1' },
  { name: 'Ubuntu 22.04 LTS',    value: 98,  fill: '#EA580C' },
  { name: 'RHEL 9',              value: 56,  fill: '#B91C1C' },
  { name: 'Debian 12',           value: 34,  fill: '#A30A55' },
  { name: 'VMware ESXi 8',       value: 28,  fill: '#16A34A' },
  { name: 'Other',               value: 17,  fill: '#6B6458' },
];

const SUPPLIERS_DEMO = [
  { name: 'Cisco Systems',  spend: 248000, contracts: 8, color: '#1D4ED8' },
  { name: 'Dell EMC',       spend: 195000, contracts: 5, color: '#2563EB' },
  { name: 'Fortinet',       spend: 142000, contracts: 4, color: '#D97706' },
  { name: 'HPE',            spend: 118000, contracts: 6, color: '#16A34A' },
  { name: 'Aruba Networks', spend:  87500, contracts: 3, color: '#EA580C' },
];

const KB_ARTICLES = [
  { title: 'Resetting BGP neighbor sessions on Cisco IOS',          views: 1247, category: 'Networking' },
  { title: 'How to escalate a P1 incident',                          views:  982, category: 'Process'    },
  { title: 'Troubleshooting Fortinet IPSec tunnel drops',            views:  834, category: 'Security'   },
  { title: 'Standard onboarding checklist — new financial site',     views:  611, category: 'Operations' },
  { title: 'Backup verification procedure (Veeam)',                  views:  478, category: 'Backup'     },
];

const SATISFACTION = {
  score: 4.6, max: 5,
  responses: 248,
  breakdown: [
    { stars: 5, count: 168, color: '#16A34A' },
    { stars: 4, count: 52,  color: '#65A30D' },
    { stars: 3, count: 18,  color: '#D97706' },
    { stars: 2, count: 7,   color: '#EA580C' },
    { stars: 1, count: 3,   color: '#DC2626' },
  ],
};

const MAINTENANCE_CALENDAR = [
  { date: '2026-05-09', time: '02:00', title: 'Core router IOS upgrade — HQ',           type: 'Change',  duration: '2h', tech: 'A. Sharma'  },
  { date: '2026-05-12', time: '23:00', title: 'Fortinet HA failover test',                type: 'Change',  duration: '1h', tech: 'P. Iyer'    },
  { date: '2026-05-14', time: '04:00', title: 'PostgreSQL minor version patch',           type: 'Change',  duration: '30m', tech: 'R. Mehta'  },
  { date: '2026-05-18', time: '01:00', title: 'Datacenter UPS battery replacement',       type: 'Maint.',  duration: '4h', tech: 'External'   },
  { date: '2026-05-22', time: '22:00', title: 'Aruba switch firmware upgrade — Branch 4', type: 'Change',  duration: '90m', tech: 'A. Sharma' },
];

const CONTRACT_DEMO = [
  { vendor: 'Cisco Systems',  type: 'Maintenance', expires: '2026-06-12', value: 48000, days: 36 },
  { vendor: 'Fortinet',       type: 'License',     expires: '2026-07-01', value: 22000, days: 55 },
  { vendor: 'Dell EMC',       type: 'Hardware',    expires: '2026-08-15', value: 95000, days: 100 },
  { vendor: 'HPE iLO',        type: 'Support',     expires: '2026-05-20', value: 12500, days: 13 },
  { vendor: 'Aruba Networks', type: 'Subscription',expires: '2026-09-30', value: 31200, days: 146 },
];

const LICENSE_DEMO = [
  { name: 'Microsoft Windows Server', used: 142, total: 200, color: '#0369A1' },
  { name: 'VMware vSphere',           used: 88,  total: 100, color: '#2563EB' },
  { name: 'Red Hat Enterprise Linux', used: 47,  total: 50,  color: '#B91C1C' },
  { name: 'Cisco Anyconnect',         used: 312, total: 500, color: '#1D4ED8' },
  { name: 'Veeam Backup',             used: 24,  total: 30,  color: '#16A34A' },
];

const SLA_DEMO = [
  { metric: 'Critical incidents resolved < 1h', target: 95, actual: 97 },
  { metric: 'Standard tickets resolved < 4h',   target: 85, actual: 91 },
  { metric: 'First response < 15m',             target: 90, actual: 88 },
];

function pct(num: number, den: number) {
  return den === 0 ? 0 : Math.round((num / den) * 100);
}

function ServiceDeskTab({
  tasks, drifts, assets, devices,
}: { tasks: ConfigTask[]; drifts: any[]; assets: any[]; devices: any[] }) {
  // Treat config-tasks as tickets
  const tickets = tasks;
  const open    = tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Done');
  const pending = tickets.filter(t => t.status === 'Pending');
  const inProg  = tickets.filter(t => t.status === 'In Progress' || t.status === 'InProgress');
  const resolved = tickets.filter(t => t.status === 'Resolved' || t.status === 'Done');

  const byPriority = ['High','Medium','Low'].map(p => ({
    name:  p,
    value: tickets.filter(t => t.priority === p).length,
    fill:  PRIORITY_COLORS[p],
  })).filter(d => d.value > 0);

  // Asset lifecycle from real `assets` table — bucket by status
  const lifecycleBuckets: Record<string, number> = {
    Production: 0, Stock: 0, Maintenance: 0, Retired: 0,
  };
  for (const a of assets) {
    const s = (a.status || '').toLowerCase();
    if (s.includes('active') || s.includes('production') || s.includes('online')) lifecycleBuckets.Production++;
    else if (s.includes('stock') || s.includes('reserved')) lifecycleBuckets.Stock++;
    else if (s.includes('maint') || s.includes('repair') || s.includes('warning')) lifecycleBuckets.Maintenance++;
    else if (s.includes('retired') || s.includes('decom') || s.includes('offline')) lifecycleBuckets.Retired++;
    else lifecycleBuckets.Production++;
  }
  const lifecycleData = [
    { name: 'Production',  value: lifecycleBuckets.Production,  fill: '#16A34A' },
    { name: 'In Stock',    value: lifecycleBuckets.Stock,       fill: '#C8622E' },
    { name: 'Maintenance', value: lifecycleBuckets.Maintenance, fill: '#D97706' },
    { name: 'Retired',     value: lifecycleBuckets.Retired,     fill: '#6B6458' },
  ].filter(d => d.value > 0);
  const totalAssets = assets.length || 1;

  const totalContractValue = CONTRACT_DEMO.reduce((s, c) => s + c.value, 0);
  const expiringSoon = CONTRACT_DEMO.filter(c => c.days <= 30);

  const slaAvg = Math.round(SLA_DEMO.reduce((s, m) => s + m.actual, 0) / SLA_DEMO.length);

  // Technician workload — group open tickets by assigned_to
  const workloadMap: Record<string, number> = {};
  for (const t of open) {
    const who = (t.assigned_to || 'Unassigned').trim() || 'Unassigned';
    workloadMap[who] = (workloadMap[who] || 0) + 1;
  }
  const workload = Object.entries(workloadMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({
      name,
      count,
      initials: name === 'Unassigned' ? '—' : name.split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase(),
    }));
  const workloadMax = workload.reduce((m, w) => Math.max(m, w.count), 1);

  // Ticket Evolution — synthesize a realistic 14-day trend (demo).
  // Anchors the most recent day to the real open/resolved counts so the chart
  // always lands at today's numbers.
  const ticketEvolution = (() => {
    const days = 14;
    const todayOpened   = open.length;
    const todayResolved = resolved.length;
    const out: { day: string; opened: number; resolved: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const t = (days - 1 - i) / (days - 1); // 0 → 1 across the window
      // Slight wave + linear tend toward "today" values
      const wave = Math.sin(i * 0.9) * 0.6;
      out.push({
        day: format(d, 'MMM d'),
        opened:   Math.max(0, Math.round((todayOpened   + 4) * (0.6 + 0.4 * t) + wave + 2)),
        resolved: Math.max(0, Math.round((todayResolved + 3) * (0.5 + 0.5 * t) + wave + 1)),
      });
    }
    return out;
  })();

  return (
    <div className="space-y-5">
      {/* ── Top stat row ─────────────────────────────────────────────── */}
      <div>
        <Kicker>Helpdesk · Tickets</Kicker>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Open Tickets"  value={open.length}     icon={Inbox}      accentColor="#C8622E"
            trend={open.length > 0 ? 'up' : 'neutral'} trendLabel={`${pending.length} pending`} />
          <StatCard label="In Progress"   value={inProg.length}   icon={TimerReset} accentColor="#D97706" trendLabel="Being worked on" />
          <StatCard label="Resolved"      value={resolved.length} icon={CheckCircle2} accentColor="#16A34A" trend="up" trendLabel="This period" />
          <StatCard label="SLA Compliance" value={`${slaAvg}%`}    icon={Award}      accentColor="#7C3AED" trend={slaAvg >= 90 ? 'up' : 'down'} trendLabel="Target: 90%" />
        </div>
      </div>

      {/* ── Tickets + Lifecycle (two columns) ────────────────────────── */}
      <div>
        <Kicker>Queue Detail &amp; Asset Lifecycle</Kicker>
        <div className="grid lg:grid-cols-2 gap-5">
        {/* Tickets by priority + status mix */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="h-4 w-4" style={{ color: ACC }} />
                  Service Desk Queue
                </CardTitle>
                <CardDescription>Live config tasks treated as tickets.</CardDescription>
              </div>
              <Link to="/configurations" className="text-[11px] font-semibold" style={{ color: ACC }}>View all →</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-5">
              {/* Priority donut */}
              <div className="relative">
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={byPriority.length ? byPriority : [{ name: 'No tickets', value: 1, fill: '#E8E1D8' }]}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      {(byPriority.length ? byPriority : [{ fill: '#E8E1D8' }]).map((d, i) => (
                        <Cell key={i} fill={d.fill} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip {...WarmTooltip} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[1.7rem] font-semibold leading-none" style={{ fontFamily: FONT_D, color: TEXT }}>
                    {tickets.length}
                  </span>
                  <span className="text-[10px] mt-1 uppercase tracking-wider" style={{ color: DIM }}>Total</span>
                </div>
              </div>
              {/* Priority legend + counts */}
              <div className="flex flex-col justify-center gap-3">
                {['High','Medium','Low'].map(p => {
                  const count = tickets.filter(t => t.priority === p).length;
                  return (
                    <div key={p} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: PRIORITY_COLORS[p] }} />
                        <span className="text-[12.5px] font-medium" style={{ color: TEXT2 }}>{p} priority</span>
                      </div>
                      <span className="text-[13px] font-semibold tabular-nums" style={{ fontFamily: FONT_M, color: TEXT }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
                <div className="mt-2 pt-3" style={{ borderTop: `1px solid ${BDR}` }}>
                  <div className="flex items-center justify-between text-[11px]" style={{ color: TEXT3 }}>
                    <span>Avg resolution</span>
                    <span className="font-semibold" style={{ color: TEXT }}>2.4 h</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] mt-1" style={{ color: TEXT3 }}>
                    <span>First response</span>
                    <span className="font-semibold" style={{ color: TEXT }}>11 m</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent tickets list */}
            <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${BDR}` }}>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] mb-3" style={{ color: DIM }}>
                Recent tickets
              </p>
              <div className="space-y-2">
                {tickets.slice(0, 4).map(t => (
                  <div key={t.id} className="flex items-center gap-3 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: PRIORITY_COLORS[t.priority || 'Medium'] || DIM }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-medium truncate" style={{ color: TEXT }}>{t.title}</p>
                      <p className="text-[10.5px]" style={{ color: DIM }}>
                        {t.assigned_to || 'Unassigned'} · {t.priority || '—'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{t.status}</Badge>
                  </div>
                ))}
                {tickets.length === 0 && (
                  <p className="text-[12px] text-center py-4" style={{ color: DIM }}>No tickets in the queue.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Asset lifecycle */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" style={{ color: ACC }} />
              Asset Lifecycle
            </CardTitle>
            <CardDescription>Distribution of {assets.length} CIs by lifecycle state.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-5 items-center">
              <div className="relative">
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie data={lifecycleData.length ? lifecycleData : [{ name: 'No data', value: 1, fill: '#E8E1D8' }]}
                      cx="50%" cy="50%" innerRadius={56} outerRadius={86} paddingAngle={2} dataKey="value">
                      {(lifecycleData.length ? lifecycleData : [{ fill: '#E8E1D8' }]).map((d, i) => (
                        <Cell key={i} fill={d.fill} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip {...WarmTooltip} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[1.65rem] font-semibold leading-none" style={{ fontFamily: FONT_D, color: TEXT }}>
                    {assets.length}
                  </span>
                  <span className="text-[10px] mt-1 uppercase tracking-wider" style={{ color: DIM }}>Assets</span>
                </div>
              </div>
              <div className="space-y-2.5">
                {lifecycleData.map(d => (
                  <div key={d.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
                        <span className="text-[12px] font-medium" style={{ color: TEXT2 }}>{d.name}</span>
                      </div>
                      <span className="text-[12px] font-semibold tabular-nums" style={{ fontFamily: FONT_M, color: TEXT }}>
                        {d.value}
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: '#F0EAE0' }}>
                      <div className="h-full rounded-full" style={{ background: d.fill, width: `${pct(d.value, totalAssets)}%` }} />
                    </div>
                  </div>
                ))}
                {lifecycleData.length === 0 && (
                  <p className="text-[12px]" style={{ color: DIM }}>No asset data — import CMDB to see lifecycle.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* ── Problems & Changes mini strip ─────────────────────────────── */}
      <div>
        <Kicker>ITIL · Problems &amp; Changes</Kicker>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Incidents Today"   value={TICKET_CATEGORIES[0].value} icon={AlertOctagon}    accentColor="#DC2626" trendLabel="3 escalated" />
          <StatCard label="Active Problems"   value={TICKET_CATEGORIES[2].value} icon={AlertCircle}     accentColor="#D97706" trendLabel="Root-cause analysis" />
          <StatCard label="Pending Changes"   value={TICKET_CATEGORIES[3].value} icon={GitPullRequest}  accentColor="#7C3AED" trendLabel="CAB approval queue" />
          <StatCard label="Maintenance Windows" value={MAINTENANCE_CALENDAR.length} icon={CalendarClock} accentColor="#0891B2" trendLabel="Next 30 days" />
        </div>
      </div>

      {/* ── Ticket Evolution + Technician Workload ───────────────────── */}
      <div>
        <Kicker>Ticket Trends &amp; Workload</Kicker>
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
        {/* Ticket Evolution — 14-day trend */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" style={{ color: ACC }} />
                  Ticket Evolution
                </CardTitle>
                <CardDescription>Inbound vs resolved tickets over the last 14 days.</CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px]">14d</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={ticketEvolution} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="te-open" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={ACC}     stopOpacity={0.3} />
                    <stop offset="100%" stopColor={ACC}     stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="te-res" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#16A34A" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#16A34A" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#F0EAE0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false}
                  tick={{ fontSize: 10, fill: DIM, fontFamily: FONT_M }} />
                <YAxis tickLine={false} axisLine={false}
                  tick={{ fontSize: 10, fill: DIM, fontFamily: FONT_M }} />
                <Tooltip {...WarmTooltip} />
                <Area type="monotone" dataKey="opened"   stroke={ACC}      strokeWidth={2} fill="url(#te-open)" />
                <Area type="monotone" dataKey="resolved" stroke="#16A34A"  strokeWidth={2} fill="url(#te-res)"  />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-5 mt-2 px-1 text-[11px]" style={{ color: TEXT3 }}>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: ACC }} />Opened</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Resolved</span>
              <span className="ml-auto text-[10px]" style={{ color: DIM }}>Demo trend</span>
            </div>
          </CardContent>
        </Card>

        {/* Technician Workload */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" style={{ color: ACC }} />
              Technician Workload
            </CardTitle>
            <CardDescription>Open tickets per assignee.</CardDescription>
          </CardHeader>
          <CardContent>
            {workload.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <User className="h-8 w-8 mb-2" style={{ color: DIM, opacity: 0.4 }} />
                <p className="text-[12px]" style={{ color: DIM }}>No assigned tickets yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workload.map(w => {
                  const width = pct(w.count, workloadMax);
                  return (
                    <div key={w.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ background: `linear-gradient(135deg, ${ACC} 0%, #A84E24 100%)` }}>
                            {w.initials}
                          </div>
                          <span className="text-[12px] font-medium truncate max-w-[160px]" style={{ color: TEXT2 }}>{w.name}</span>
                        </div>
                        <span className="text-[12px] font-semibold tabular-nums" style={{ fontFamily: FONT_M, color: TEXT }}>
                          {w.count}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F0EAE0' }}>
                        <div className="h-full rounded-full" style={{ background: ACC, width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* ── Tickets by Category ──────────────────────────────────────── */}
      <div>
        <Kicker>ITIL Category &amp; Drift Pipeline</Kicker>
        <div className="grid lg:grid-cols-2 gap-5">
        {/* Tickets by Category */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" style={{ color: ACC }} />
                Tickets by Category
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">ITIL</Badge>
            </div>
            <CardDescription>Incident, problem, change and service request distribution.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="relative">
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={TICKET_CATEGORIES} cx="50%" cy="50%" innerRadius={48} outerRadius={75}
                      paddingAngle={3} dataKey="value">
                      {TICKET_CATEGORIES.map((d, i) => <Cell key={i} fill={d.fill} stroke="none" />)}
                    </Pie>
                    <Tooltip {...WarmTooltip} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[1.5rem] font-semibold leading-none" style={{ fontFamily: FONT_D, color: TEXT }}>
                    {TICKET_CATEGORIES.reduce((s, c) => s + c.value, 0)}
                  </span>
                  <span className="text-[9.5px] mt-0.5 uppercase tracking-wider" style={{ color: DIM }}>Total</span>
                </div>
              </div>
              <div className="space-y-2.5">
                {TICKET_CATEGORIES.map(c => {
                  const Icon = c.icon;
                  const total = TICKET_CATEGORIES.reduce((s, x) => s + x.value, 0) || 1;
                  return (
                    <div key={c.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5" style={{ color: c.fill }} />
                          <span className="text-[12px]" style={{ color: TEXT2 }}>{c.name}</span>
                        </div>
                        <span className="text-[12px] font-semibold tabular-nums" style={{ fontFamily: FONT_M, color: TEXT }}>{c.value}</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: '#F0EAE0' }}>
                        <div className="h-full rounded-full" style={{ background: c.fill, width: `${pct(c.value, total)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Drift → Change pipeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <GitPullRequest className="h-4 w-4" style={{ color: ACC }} />
              Drift → Change Pipeline
            </CardTitle>
            <CardDescription>Open drifts awaiting remediation via change request.</CardDescription>
          </CardHeader>
          <CardContent>
            {drifts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <CheckCircle2 className="h-8 w-8 mb-2" style={{ color: '#16A34A', opacity: 0.6 }} />
                <p className="text-[12px]" style={{ color: DIM }}>No open drifts — estate is compliant.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {drifts.slice(0, 6).map((dr: any) => (
                  <div key={dr.id} className="flex items-center gap-3 py-2 px-3 rounded-lg"
                    style={{ background: '#FDFAF7', border: `1px solid ${BDR}` }}>
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: dr.severity === 'High' ? '#DC2626' : dr.severity === 'Medium' ? '#D97706' : '#6B6458' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-medium truncate" style={{ color: TEXT }}>{dr.title || dr.device_id}</p>
                      <p className="text-[10.5px]" style={{ color: DIM }}>{dr.device_id} · {dr.severity || 'Low'}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{dr.status || 'Open'}</Badge>
                  </div>
                ))}
                {drifts.length > 6 && (
                  <p className="text-[11px] text-center pt-1" style={{ color: DIM }}>
                    +{drifts.length - 6} more — <Link to="/infrastructure" className="font-semibold" style={{ color: ACC }}>Review all →</Link>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* ── SLA Performance ──────────────────────────────────────────── */}
      <div>
        <SectionHeader title="SLA Performance" desc="Helpdesk targets vs actuals (demo metrics)." />
        <Card>
          <CardContent className="pt-5">
            <div className="grid sm:grid-cols-3 gap-5">
              {SLA_DEMO.map(m => {
                const pass = m.actual >= m.target;
                const color = pass ? '#16A34A' : '#DC2626';
                return (
                  <div key={m.metric} className="rounded-xl p-4" style={{ background: '#FDFAF7', border: `1px solid ${BDR}` }}>
                    <p className="text-[11px] mb-3" style={{ color: TEXT3 }}>{m.metric}</p>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-[1.7rem] font-semibold leading-none" style={{ fontFamily: FONT_D, color }}>
                        {m.actual}%
                      </span>
                      <span className="text-[11px]" style={{ color: DIM }}>Target {m.target}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F0EAE0' }}>
                      <div className="h-full rounded-full" style={{ background: color, width: `${m.actual}%` }} />
                    </div>
                    <div className="flex items-center gap-1.5 mt-2.5 text-[11px] font-medium" style={{ color }}>
                      {pass ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      {pass ? 'Meeting target' : 'Below target'}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Maintenance Calendar (full-width) ──────────────────────────── */}
      <div>
        <Kicker>Change &amp; Contract Management</Kicker>
        <div className="grid lg:grid-cols-2 gap-5">
        {/* Maintenance Calendar */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" style={{ color: ACC }} />
                Maintenance Calendar
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">Next 30d</Badge>
            </div>
            <CardDescription>Upcoming change windows &amp; planned outages.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MAINTENANCE_CALENDAR.map(m => {
                const d = new Date(m.date);
                const day  = d.getDate();
                const mon  = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                return (
                  <div key={m.title} className="flex items-start gap-3">
                    <div className="flex flex-col items-center justify-center shrink-0 rounded-lg px-2 py-1 text-center"
                      style={{ background: '#FAE8DC', border: `1px solid #E8C4AA`, minWidth: 44 }}>
                      <span className="text-[8.5px] font-bold leading-none" style={{ color: ACC, letterSpacing: '0.05em' }}>{mon}</span>
                      <span className="text-[15px] font-semibold leading-none mt-0.5" style={{ fontFamily: FONT_D, color: TEXT }}>{day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium leading-snug" style={{ color: TEXT }}>{m.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px]" style={{ color: DIM }}>
                        <span style={{ fontFamily: FONT_M }}>{m.time}</span>
                        <span>·</span>
                        <span>{m.duration}</span>
                        <span>·</span>
                        <span className="truncate">{m.tech}</span>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[9.5px] shrink-0"
                      style={{
                        background: m.type === 'Change' ? '#EDE4F6' : '#FAE8DC',
                        color:      m.type === 'Change' ? '#7C3AED' : ACC,
                      }}
                    >
                      {m.type}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Contracts expiring */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" style={{ color: ACC }} />
                  Contracts &amp; Warranties
                </CardTitle>
                <CardDescription>
                  Total value <span style={{ color: TEXT, fontWeight: 600 }}>${(totalContractValue/1000).toFixed(0)}k</span>
                  &nbsp;· {expiringSoon.length} expiring in 30 days
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px]">Demo</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {CONTRACT_DEMO.map(c => {
                const urgent = c.days <= 30;
                const dot = urgent ? '#DC2626' : c.days <= 90 ? '#D97706' : '#16A34A';
                return (
                  <div key={c.vendor} className="flex items-center gap-3 py-2 px-3 rounded-lg"
                    style={{ background: urgent ? 'rgba(220,38,38,0.04)' : '#FDFAF7', border: `1px solid ${urgent ? 'rgba(220,38,38,0.18)' : BDR}` }}>
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: dot }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold truncate" style={{ color: TEXT }}>{c.vendor}</p>
                      <p className="text-[10.5px]" style={{ color: DIM }}>{c.type} · expires {c.expires}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] font-semibold tabular-nums" style={{ fontFamily: FONT_M, color: TEXT }}>
                        ${(c.value/1000).toFixed(1)}k
                      </p>
                      <p className="text-[10px] font-medium" style={{ color: dot }}>{c.days}d</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* ── Financial summary strip ──────────────────────────────────── */}
      <div>
        <SectionHeader title="Financial Overview" desc="Aggregated CMDB value and operational spend (demo)." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Asset Value',     value: '$2.4M', icon: DollarSign, accentColor: '#16A34A', trend: 'up'   as const, trendLabel: '+8% YoY' },
            { label: 'Active Contracts',      value: CONTRACT_DEMO.length, icon: FileText, accentColor: '#C8622E', trendLabel: `$${(totalContractValue/1000).toFixed(0)}k committed` },
            { label: 'Devices Under Support', value: devices.length, icon: Wrench,    accentColor: '#7C3AED', trendLabel: `${drifts.length} need attention` },
            { label: 'Expiring < 30 days',    value: expiringSoon.length, icon: Calendar, accentColor: '#DC2626', trend: expiringSoon.length > 0 ? 'down' as const : 'neutral' as const, trendLabel: 'Action required' },
          ].map(s => <StatCard key={s.label} {...s} />)}
        </div>
      </div>
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────────────────────────────── */
export function Dashboard() {
  const [drifts,      setDrifts]      = useState<any[]>([]);
  const [assetsCount, setAssetsCount] = useState(0);
  const [assets,      setAssets]      = useState<any[]>([]);
  const [devices,     setDevices]     = useState<any[]>([]);
  const [auditLogs,   setAuditLogs]   = useState<AuditLogRow[]>([]);
  const [tasks,       setTasks]       = useState<ConfigTask[]>([]);
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(() => {
    const t = searchParams.get('tab');
    return ['overview','network','compute','servicedesk'].includes(t ?? '') ? t! : 'overview';
  });
  const { selectedClientId } = useClient();

  useEffect(() => {
    const params = selectedClientId ? { clientId: selectedClientId } : {};
    assetsApi.list(params).then(rows => { setAssetsCount(rows.length); setAssets(rows); }).catch(console.error);
    driftsApi.list({ status: 'Open' }).then(setDrifts).catch(console.error);
    infrastructureApi.list(params).then(setDevices).catch(console.error);
    auditLogsApi.list({ limit: 6 }).then(setAuditLogs).catch(console.error);
    configTasksApi.list().then(setTasks).catch(console.error);
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
  const openTaskCount = tasks.filter(t => t.status !== 'Resolved' && t.status !== 'Done').length;
  const serverCount = (typeCounts['Server'] || 0) + (typeCounts['VM'] || 0);
  const networkCount = devices.filter(d => ['Switch', 'Router', 'Firewall'].includes(d.type)).length;
  const healthColor = drifts.length > 0 || openTaskCount > 0 ? '#D97706' : '#16A34A';
  const healthLabel = drifts.length > 0 || openTaskCount > 0 ? 'Action Required' : 'Healthy';
  const dashboardTabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3, metric: totalHardware, caption: 'Hardware estate' },
    { key: 'network', label: 'Network', icon: Router, metric: networkCount, caption: 'Edge and fabric' },
    { key: 'compute', label: 'Compute', icon: DatabaseIcon, metric: serverCount, caption: 'Servers and VMs' },
    { key: 'servicedesk', label: 'Service Desk', icon: Headphones, metric: openTaskCount, caption: 'Open work queue' },
  ];

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#2d261c] bg-[#18140f] p-5 text-white shadow-[0_24px_80px_-36px_rgba(24,20,15,0.8)] sm:p-6">
        <div className="absolute inset-0 opacity-75">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#c8622e]/35 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-[#f1c27d]/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] [background-size:22px_22px]" />
        </div>
        <div className="relative grid gap-5 xl:grid-cols-[1.35fr_1fr] xl:items-end">
          <div>
            <Badge className="mb-3 border-white/15 bg-white/10 text-white hover:bg-white/10">
              FinSpot · LinkedEye · Executive cockpit
            </Badge>
            <h1
              className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl"
              style={{ fontFamily: FONT_D }}
            >
              Executive Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#d9cdbf] sm:text-base">
              A single command surface for hardware inventory, network posture, compute capacity, drift risk, and service operations.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#eadfd2]">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                <Package className="h-3.5 w-3.5 text-[#f1c27d]" />
                {totalHardware} total hardware records
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-[#f1c27d]" />
                {drifts.length} open drifts
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#f1c27d]" />
                {activeVendors} active vendors
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#bcae9f]">Control status</p>
                  <p className="mt-2 text-3xl font-semibold">{healthLabel}</p>
                  <p className="text-sm text-[#d9cdbf]">{openTaskCount} open tasks · {drifts.length} drifts</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: healthColor }}>
                  <Activity className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.22em] text-[#bcae9f]">Live pulse</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-2xl font-semibold">Online</span>
              </div>
              <p className="mt-1 text-sm text-[#d9cdbf]">API, inventory, and audit feeds loaded.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <Tabs className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-4 rounded-none bg-transparent p-0 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardTabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
            <TabsTrigger
              key={t.key}
              active={active}
              onClick={() => setTab(t.key)}
              className="group h-auto justify-start rounded-2xl border p-4 text-left transition-all duration-200"
              style={{
                borderColor: active ? `${ACC}55` : '#eadfce',
                background: active ? '#fff5ec' : '#fffaf3',
                boxShadow: active ? '0 18px 45px -30px rgba(200,98,46,0.75)' : 'none',
              }}
            >
              <div className="flex w-full items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: active ? ACC : '#f2dfcb', color: active ? '#fff' : ACC }}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold" style={{ color: active ? TEXT : TEXT2 }}>{t.label}</div>
                  <div className="mt-1 text-xs" style={{ color: TEXT3 }}>{t.metric} · {t.caption}</div>
                </div>
              </div>
            </TabsTrigger>
            );
          })}
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════
            OVERVIEW TAB
        ═══════════════════════════════════════════════════════════ */}
        <TabsContent className={tab === 'overview' ? 'block space-y-5 mt-4' : 'hidden'}>

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

          {/* GLPI-style Central inventory tile grid */}
          <div>
            <SectionHeader
              title="Inventory · At a glance"
              desc="Quick counters across every asset category in the CMDB."
              action={<Badge variant="outline" className="text-[10px]">Live + demo blend</Badge>}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Computers',     value: assetsCount,                                                icon: Laptop,        color: '#2563EB', to: '/assets'         },
                { label: 'Monitors',      value: 142,                                                        icon: MonitorIcon,   color: '#0369A1', to: '/assets'         },
                { label: 'Software',      value: 386,                                                        icon: FileText,      color: '#7C3AED', to: '/assets'         },
                { label: 'Network Eqp.',  value: devices.filter(d => ['Switch','Router','Firewall'].includes(d.type)).length, icon: Router, color: '#16A34A', to: '/infrastructure' },
                { label: 'Servers',       value: devices.filter(d => d.type === 'Server' || d.type === 'VM').length, icon: Server, color: '#DC2626', to: '/infrastructure' },
                { label: 'Storage',       value: devices.filter(d => d.type === 'Storage').length || 18,    icon: HardDrive,     color: '#D97706', to: '/infrastructure' },
                { label: 'Phones',        value: 64,                                                         icon: Smartphone,    color: '#0891B2', to: '/assets'         },
                { label: 'Printers',      value: 22,                                                         icon: Printer,       color: '#A30A55', to: '/assets'         },
                { label: 'Racks',         value: 28,                                                         icon: Layers,        color: ACC,       to: '/racks'          },
                { label: 'Sites',         value: 24,                                                         icon: Globe,         color: '#16A34A', to: '/sites'          },
                { label: 'Contracts',     value: CONTRACT_DEMO.length,                                       icon: FileText,      color: '#7C3AED', to: '#'               },
                { label: 'Suppliers',     value: SUPPLIERS_DEMO.length,                                      icon: Truck,         color: '#EA580C', to: '#'               },
              ].map(t => {
                const Icon = t.icon;
                const node = (
                  <div
                    key={t.label}
                    className="rounded-xl p-3.5 transition-all cursor-pointer group"
                    style={{
                      background: SURF,
                      border: `1px solid ${BDR}`,
                      boxShadow: '0 1px 3px rgba(41,37,36,0.04)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = t.color;
                      e.currentTarget.style.boxShadow   = `0 6px 20px -8px ${t.color}40`;
                      e.currentTarget.style.transform   = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = BDR;
                      e.currentTarget.style.boxShadow   = '0 1px 3px rgba(41,37,36,0.04)';
                      e.currentTarget.style.transform   = 'translateY(0)';
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{ background: `${t.color}14` }}
                      >
                        <Icon className="h-3.5 w-3.5" style={{ color: t.color }} strokeWidth={1.75} />
                      </div>
                      <ArrowUpRight
                        className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: t.color }}
                      />
                    </div>
                    <p className="text-[1.4rem] font-semibold leading-none tabular-nums"
                      style={{ fontFamily: FONT_D, color: TEXT }}>
                      {t.value}
                    </p>
                    <p className="text-[10.5px] mt-1.5 font-medium" style={{ color: TEXT3 }}>{t.label}</p>
                  </div>
                );
                return t.to.startsWith('/')
                  ? <Link key={t.label} to={t.to} className="contents">{node}</Link>
                  : node;
              })}
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
                    <div className="h-44 flex-1 min-w-0">
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
                <div className="h-44">
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
                <div className="space-y-2.5">
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
        <TabsContent className={tab === 'network' ? 'block space-y-5 mt-4' : 'hidden'}>
          {/* ── Stat strip ── */}
          <div>
            <Kicker>Network Devices</Kicker>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Firewalls"      value={typeCounts['Firewall'] || 0} icon={Shield}    accentColor="#DC2626" trendLabel="Security perimeter" />
              <StatCard label="Routers"        value={typeCounts['Router']   || 0} icon={Router}    accentColor="#2563EB" trendLabel="Core routing" />
              <StatCard label="Switches"       value={typeCounts['Switch']   || 0} icon={Zap}       accentColor="#7C3AED" trendLabel="Network fabric" />
              <StatCard label="Total Network"  value={(typeCounts['Firewall']||0)+(typeCounts['Router']||0)+(typeCounts['Switch']||0)} icon={Globe} accentColor="#0891B2" trendLabel="All device classes" />
            </div>
          </div>

          {/* ── Throughput + Vendor mix ── */}
          <div>
            <Kicker>Performance &amp; Vendor Mix</Kicker>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Throughput chart */}
              <div className="rounded-xl p-4" style={{ background: SURF, border: `1px solid ${BDR}`, boxShadow: '0 1px 4px rgba(41,37,36,0.07)' }}>
                <p className="text-[13px] font-semibold mb-0.5" style={{ fontFamily: FONT_D, color: TEXT }}>Network Throughput (Gbps)</p>
                <p className="text-[11.5px] mb-3" style={{ color: TEXT3 }}>24-hour traffic trend across core infrastructure.</p>
                <div className="h-44">
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

              {/* Vendor breakdown — real data from devices */}
              <div className="rounded-xl p-4" style={{ background: SURF, border: `1px solid ${BDR}`, boxShadow: '0 1px 4px rgba(41,37,36,0.07)' }}>
                <p className="text-[13px] font-semibold mb-0.5" style={{ fontFamily: FONT_D, color: TEXT }}>Vendor Distribution</p>
                <p className="text-[11.5px] mb-3" style={{ color: TEXT3 }}>Network devices by manufacturer.</p>
                {(() => {
                  const netDevs = devices.filter(d => ['Firewall','Router','Switch'].includes(d.type));
                  const vmap: Record<string,number> = {};
                  for (const d of netDevs) { const v = d.vendor || 'Unknown'; vmap[v] = (vmap[v]||0)+1; }
                  const vendors = Object.entries(vmap).sort((a,b)=>b[1]-a[1]).slice(0,6);
                  const total = netDevs.length || 1;
                  const VCOLS: Record<string,string> = { Cisco:'#1D4ED8', Fortinet:'#D97706', Aruba:'#EA580C', Arista:'#0284C7', Huawei:'#DC2626', HP:'#059669', Dell:'#2563EB', Unknown:'#A09688' };
                  return vendors.length === 0
                    ? <p className="text-[12px] text-center py-8" style={{ color: DIM }}>No network devices yet.</p>
                    : <div className="space-y-2.5">
                        {vendors.map(([name, count]) => {
                          const p = Math.round((count/total)*100);
                          const col = VCOLS[name] || '#6B6458';
                          return (
                            <div key={name}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: col }} />
                                  <span className="text-[12px] font-medium" style={{ color: TEXT2 }}>{name}</span>
                                </div>
                                <span className="text-[12px] font-semibold tabular-nums" style={{ fontFamily: FONT_M, color: TEXT }}>{count} <span style={{ color: DIM, fontWeight: 400 }}>· {p}%</span></span>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F0EAE0' }}>
                                <div className="h-full rounded-full transition-all" style={{ background: col, width: `${p}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>;
                })()}
              </div>
            </div>
          </div>

          {/* ── Device list + Alerts ── */}
          <div>
            <Kicker>Inventory &amp; Alerts</Kicker>
            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
              {/* Network device table */}
              <div className="rounded-xl overflow-hidden" style={{ background: SURF, border: `1px solid ${BDR}`, boxShadow: '0 1px 4px rgba(41,37,36,0.07)' }}>
                <div className="px-4 py-3" style={{ borderBottom: `1px solid ${BDR}` }}>
                  <p className="text-[13px] font-semibold" style={{ fontFamily: FONT_D, color: TEXT }}>Network Device Inventory</p>
                  <p className="text-[11px] mt-0.5" style={{ color: DIM }}>Firewalls, routers and switches for selected client.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr style={{ background: '#F8F4EF', borderBottom: `1px solid ${BDR}` }}>
                        <th className="text-left px-4 py-2.5 font-semibold" style={{ color: DIM }}>Device</th>
                        <th className="text-left px-4 py-2.5 font-semibold" style={{ color: DIM }}>Type</th>
                        <th className="text-left px-4 py-2.5 font-semibold" style={{ color: DIM }}>IP</th>
                        <th className="text-left px-4 py-2.5 font-semibold" style={{ color: DIM }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devices.filter(d => ['Firewall','Router','Switch'].includes(d.type)).slice(0, 8).map(d => {
                        const isActive = (d.status||'').toLowerCase() === 'active';
                        return (
                          <tr key={d.id} style={{ borderBottom: `1px solid ${BDR}` }}
                            className="hover:bg-[#FAF7F3] transition-colors">
                            <td className="px-4 py-2.5">
                              <p className="font-medium truncate max-w-[160px]" style={{ color: TEXT }}>{d.name}</p>
                              <p className="text-[10px]" style={{ color: DIM }}>{d.vendor}</p>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
                                style={{
                                  background: d.type==='Firewall' ? 'rgba(220,38,38,0.08)' : d.type==='Router' ? 'rgba(37,99,235,0.08)' : 'rgba(124,58,237,0.08)',
                                  color:      d.type==='Firewall' ? '#DC2626'              : d.type==='Router' ? '#2563EB'              : '#7C3AED',
                                }}>
                                {d.type}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-[11px]" style={{ color: TEXT3 }}>{d.ip || '—'}</td>
                            <td className="px-4 py-2.5">
                              <span className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full" style={{ background: isActive ? '#16A34A' : '#DC2626' }} />
                                <span style={{ color: isActive ? '#16A34A' : '#DC2626', fontWeight: 500 }}>{isActive ? 'Active' : 'Offline'}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {devices.filter(d => ['Firewall','Router','Switch'].includes(d.type)).length === 0 && (
                        <tr><td colSpan={4} className="text-center py-8" style={{ color: DIM }}>No network devices for this client.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {devices.filter(d => ['Firewall','Router','Switch'].includes(d.type)).length > 8 && (
                  <div className="px-4 py-2 text-[11px]" style={{ borderTop: `1px solid ${BDR}`, color: DIM }}>
                    Showing 8 of {devices.filter(d => ['Firewall','Router','Switch'].includes(d.type)).length} — <Link to="/infrastructure" className="font-semibold" style={{ color: ACC }}>View all →</Link>
                  </div>
                )}
              </div>

              {/* Alerts */}
              <div className="rounded-xl p-4" style={{ background: SURF, border: `1px solid ${BDR}`, boxShadow: '0 1px 4px rgba(41,37,36,0.07)' }}>
                <p className="text-[13px] font-semibold mb-0.5" style={{ fontFamily: FONT_D, color: TEXT }}>Active Alerts</p>
                <p className="text-[11.5px] mb-3" style={{ color: TEXT3 }}>Issues requiring attention.</p>
                <div className="space-y-2.5">
                  {(() => {
                    const offlineNet = devices.filter(d => ['Firewall','Router','Switch'].includes(d.type) && (d.status||'').toLowerCase() !== 'active');
                    if (offlineNet.length > 0) return offlineNet.slice(0,3).map(d => (
                      <div key={d.id} className="flex items-start justify-between gap-3 rounded-lg px-3 py-2.5"
                        style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.18)' }}>
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: '#DC2626' }} />
                          <div>
                            <p className="text-[12.5px] font-medium" style={{ color: TEXT2 }}>{d.name}</p>
                            <p className="text-[10.5px]" style={{ color: DIM }}>{d.type} · {d.ip || 'no IP'}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: '#DC262622', color: '#DC2626' }}>Offline</span>
                      </div>
                    ));
                    return [
                      { color: '#D97706', bg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.2)', icon: Activity,     label: 'Warning', title: 'High CPU on core switch',  detail: 'Core-Switch-02 · 85% load' },
                      { color: '#16A34A', bg: 'rgba(22,163,74,0.06)', border: 'rgba(22,163,74,0.2)', icon: CheckCircle2, label: 'OK',      title: 'All links nominal',         detail: 'Last checked: just now' },
                    ].map(a => {
                      const Icon = a.icon;
                      return (
                        <div key={a.label} className="flex items-start justify-between gap-3 rounded-lg px-3 py-2.5"
                          style={{ background: a.bg, border: `1px solid ${a.border}` }}>
                          <div className="flex items-start gap-2">
                            <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: a.color }} />
                            <div>
                              <p className="text-[12.5px] font-medium" style={{ color: TEXT2 }}>{a.title}</p>
                              <p className="text-[10.5px]" style={{ color: DIM }}>{a.detail}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                            style={{ background: `${a.color}22`, color: a.color }}>{a.label}</span>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Device type health bars */}
                <div className="mt-4 pt-3 space-y-2" style={{ borderTop: `1px solid ${BDR}` }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: DIM }}>Device Health</p>
                  {[
                    { label: 'Firewalls', count: typeCounts['Firewall']||0, color: '#DC2626' },
                    { label: 'Routers',   count: typeCounts['Router']  ||0, color: '#2563EB' },
                    { label: 'Switches',  count: typeCounts['Switch']  ||0, color: '#7C3AED' },
                  ].map(row => {
                    const total = (typeCounts['Firewall']||0)+(typeCounts['Router']||0)+(typeCounts['Switch']||0)||1;
                    return (
                      <div key={row.label} className="flex items-center gap-2.5">
                        <span className="text-[11px] w-16 shrink-0" style={{ color: TEXT3 }}>{row.label}</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#F0EAE0' }}>
                          <div className="h-full rounded-full" style={{ background: row.color, width: `${Math.round((row.count/total)*100)}%` }} />
                        </div>
                        <span className="text-[11px] tabular-nums w-6 text-right font-semibold" style={{ color: TEXT }}>{row.count}</span>
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
        <TabsContent className={tab === 'compute' ? 'block space-y-5 mt-4' : 'hidden'}>
          <div>
            <Kicker>Compute Resources</Kicker>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Physical Servers"
                value={typeCounts['Server'] || 0}
                icon={Server}
                accentColor="#16A34A"
                trendLabel="Bare-metal nodes"
              />
              <StatCard
                label="Virtual Machines"
                value={typeCounts['VM'] || 0}
                icon={Cpu}
                accentColor="#0891B2"
                trendLabel="Hypervisor guests"
              />
              <StatCard
                label="Storage Arrays"
                value={typeCounts['Storage'] || 0}
                icon={HardDrive}
                accentColor="#D97706"
                trend="up"
                trendLabel="100% operational"
              />
              <StatCard
                label="Total Compute"
                value={(typeCounts['Server'] || 0) + (typeCounts['VM'] || 0) + (typeCounts['Storage'] || 0)}
                icon={DatabaseIcon}
                accentColor="#7C3AED"
                trendLabel="Servers + VMs + storage"
              />
            </div>
          </div>

          <div>
            <Kicker>Utilization &amp; Load</Kicker>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Compute chart */}
              <div className="rounded-xl p-4" style={{ background: SURF, border: `1px solid ${BDR}`, boxShadow: '0 1px 4px rgba(41,37,36,0.07)' }}>
                <p className="text-[13px] font-semibold mb-0.5" style={{ fontFamily: FONT_D, color: TEXT }}>
                  Compute Utilization (%)
                </p>
                <p className="text-[11.5px] mb-4" style={{ color: TEXT3 }}>CPU and Memory trends across the server fleet.</p>
                <div className="h-44">
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
              <div className="rounded-xl p-4" style={{ background: SURF, border: `1px solid ${BDR}`, boxShadow: '0 1px 4px rgba(41,37,36,0.07)' }}>
                <p className="text-[13px] font-semibold mb-0.5" style={{ fontFamily: FONT_D, color: TEXT }}>
                  Top Servers by Load
                </p>
                <p className="text-[11.5px] mb-3" style={{ color: TEXT3 }}>Potential performance bottlenecks.</p>
                <div className="space-y-2.5">
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

        {/* ── SERVICE DESK TAB (GLPI-style) ─────────────────────────────── */}
        <TabsContent className={tab === 'servicedesk' ? 'block space-y-5 mt-4' : 'hidden'}>
          <ServiceDeskTab tasks={tasks} drifts={drifts} assets={assets} devices={devices} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
