import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Server, Activity, AlertTriangle, ShieldCheck, CheckCircle2, XCircle, Globe, Shield, Router, Database as DatabaseIcon, Cpu, HardDrive, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { assetsApi, driftsApi, infrastructureApi } from '../lib/api';
import { useClient } from '@/components/ClientProvider';

const recentLogs = [
  { id: 'LOG-001', time: '2 mins ago', user: 'admin@acme.com', action: 'Config Backup', severity: 'Info' },
  { id: 'LOG-002', time: '15 mins ago', user: 'system', action: 'Vuln Scan', severity: 'Warning' },
  { id: 'LOG-003', time: '45 mins ago', user: 'j.doe@acme.com', action: 'User Login', severity: 'Info' },
];

const riskData = [
  { name: 'Low', count: 120, fill: '#22c55e' },
  { name: 'Medium', count: 45, fill: '#eab308' },
  { name: 'High', count: 12, fill: '#f97316' },
  { name: 'Critical', count: 3, fill: '#ef4444' },
];

const complianceData = [
  { name: 'CIS', score: 92 },
  { name: 'SOX', score: 85 },
  { name: 'HIPAA', score: 98 },
];

const vendorData = [
  { name: 'Cisco', count: 450, fill: '#0043ce', models: ['C9300X 24HX', 'Nexus 9000', 'ISR 4321', 'FTD 2130'] },
  { name: 'Aruba', count: 280, fill: '#ff8300', models: ['2930F 24G', '6300M', '7210'] },
  { name: 'Arista', count: 180, fill: '#00a3e0', models: ['7050X3', '7124sx', '7280R3'] },
  { name: 'HP', count: 150, fill: '#00b388', models: ['ProLiant DL380', 'SN3600B FC', 'DL360'] },
  { name: 'Dell', count: 120, fill: '#007db8', models: ['PowerEdge R740', 's5248F', 'R640'] },
  { name: 'Huawei', count: 68, fill: '#ed1c24', models: ['S6720S', 'S5735 L24T', 'OceanStor'] },
  { name: 'Fortinet', count: 95, fill: '#ee3124', models: ['FG 100F', 'FG 60F', 'FG 200F'] },
];

export function Dashboard() {
  const [drifts, setDrifts] = useState<any[]>([]);
  const [assetsCount, setAssetsCount] = useState(0);
  const [devices, setDevices] = useState<any[]>([]);
  const [activeDashboardTab, setActiveDashboardTab] = useState('overview');
  const { selectedClientId } = useClient();

  useEffect(() => {
    assetsApi.list(selectedClientId ? { clientId: selectedClientId } : {})
      .then(rows => setAssetsCount(rows.length))
      .catch(console.error);
    driftsApi.list({ status: 'Open' })
      .then(setDrifts)
      .catch(console.error);
    infrastructureApi.list(selectedClientId ? { clientId: selectedClientId } : {})
      .then(setDevices)
      .catch(console.error);
  }, [selectedClientId]);

  const cloudData = [
    { name: 'AWS', instances: 45, cost: 12500, fill: '#ff9900' },
    { name: 'Azure', instances: 32, cost: 8900, fill: '#0089d6' },
    { name: 'GCP', instances: 18, cost: 4200, fill: '#4285f4' },
  ];

  const softwareData = [
    { name: 'Microsoft 365', licenses: 1200, used: 1150, compliance: 96 },
    { name: 'Adobe Creative Cloud', licenses: 150, used: 148, compliance: 98 },
    { name: 'ServiceNow', licenses: 500, used: 480, compliance: 96 },
    { name: 'Slack', licenses: 1200, used: 1180, compliance: 98 },
  ];

  const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899'];

  // Real computed stats from loaded devices
  const typeCounts = devices.reduce((acc: Record<string, number>, d) => {
    acc[d.type] = (acc[d.type] || 0) + 1; return acc;
  }, {});
  const vendorCounts = devices.reduce((acc: Record<string, number>, d) => {
    const v = d.vendor || 'Unknown';
    acc[v] = (acc[v] || 0) + 1; return acc;
  }, {});

  const assetTypeData = [
    { name: 'Firewalls', count: typeCounts['Firewall'] || 0, fill: '#ef4444' },
    { name: 'Routers',   count: typeCounts['Router']   || 0, fill: '#3b82f6' },
    { name: 'Servers',   count: (typeCounts['Server']  || 0) + (typeCounts['VM'] || 0), fill: '#22c55e' },
    { name: 'Switches',  count: typeCounts['Switch']   || 0, fill: '#8b5cf6' },
    { name: 'Storage',   count: typeCounts['Storage']  || 0, fill: '#f59e0b' },
    { name: 'Power',     count: typeCounts['Power']    || 0, fill: '#06b6d4' },
    { name: 'Other',     count: typeCounts['Device']   || 0, fill: '#ec4899' },
  ].filter(d => d.count > 0);

  const VENDOR_COLORS: Record<string, string> = {
    Cisco: '#0043ce', Aruba: '#ff8300', Arista: '#00a3e0', HP: '#00b388',
    Dell: '#007db8', Huawei: '#ed1c24', Fortinet: '#ee3124', Canonical: '#e95420',
    Microsoft: '#0078d4', 'Red Hat': '#cc0000',
  };
  const liveVendorData = Object.entries(vendorCounts)
    .filter(([v]) => v !== 'Unknown' && v !== '')
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 7)
    .map(([name, count]) => ({ name, count: count as number, fill: VENDOR_COLORS[name] || '#64748b' }));

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Management Executive Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive visibility across hardware, software, and cloud.</p>
        </div>
        <div className="flex space-x-2">
          <Badge variant="outline" className="px-3 py-1">Last Sync: 2 mins ago</Badge>
          <Badge variant="success" className="px-3 py-1">System Healthy</Badge>
        </div>
      </div>

      <Tabs className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger active={activeDashboardTab === 'overview'} onClick={() => setActiveDashboardTab('overview')}>Overview</TabsTrigger>
          <TabsTrigger active={activeDashboardTab === 'network'} onClick={() => setActiveDashboardTab('network')}>Network</TabsTrigger>
          <TabsTrigger active={activeDashboardTab === 'compute'} onClick={() => setActiveDashboardTab('compute')}>Compute</TabsTrigger>
        </TabsList>

        <TabsContent className={activeDashboardTab === 'overview' ? 'block space-y-6' : 'hidden'}>
          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Hardware Assets</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assetsCount + devices.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{devices.length} infra · {assetsCount} CIs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Software Licenses</CardTitle>
            <ClipboardList className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,050</div>
            <p className="text-xs text-muted-foreground mt-1">98% Utilization</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cloud Spend (MTD)</CardTitle>
            <Globe className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">$25,600</div>
            <p className="text-xs text-muted-foreground mt-1">On track with budget</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Compliance</CardTitle>
            <ShieldCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">94%</div>
            <p className="text-xs text-muted-foreground mt-1">Across all technology</p>
          </CardContent>
        </Card>
      </div>

      {/* Asset-Wise Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Firewalls</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{typeCounts['Firewall'] || 0}</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">Security devices</span>
              <Badge variant="success" className="text-[10px]">Active</Badge>
            </div>
            <Progress value={100} className="h-1 mt-2" indicatorClassName="bg-red-500" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Routers</CardTitle>
            <Router className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{typeCounts['Router'] || 0}</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">Network routing</span>
              <Badge variant="success" className="text-[10px]">Active</Badge>
            </div>
            <Progress value={100} className="h-1 mt-2" indicatorClassName="bg-blue-500" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Servers & VMs</CardTitle>
            <DatabaseIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(typeCounts['Server'] || 0) + (typeCounts['VM'] || 0)}</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">{typeCounts['Server'] || 0} physical · {typeCounts['VM'] || 0} VMs</span>
              <Badge variant="success" className="text-[10px]">Active</Badge>
            </div>
            <Progress value={100} className="h-1 mt-2" indicatorClassName="bg-green-500" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Asset Type Distribution</CardTitle>
            <CardDescription>Breakdown of infrastructure assets by primary category.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {assetTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 ml-4">
              {assetTypeData.map((item, index) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-xs font-medium">{item.name} ({item.count})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Critical Asset Status</CardTitle>
            <CardDescription>Real-time health of core infrastructure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Edge Firewalls</p>
                  <p className="text-xs text-muted-foreground">2 Clusters</p>
                </div>
              </div>
              <Badge variant="success">Online</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <Router className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Core Routers</p>
                  <p className="text-xs text-muted-foreground">4 Nodes</p>
                </div>
              </div>
              <Badge variant="success">Online</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <DatabaseIcon className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Primary DB Cluster</p>
                  <p className="text-xs text-muted-foreground">3 Nodes</p>
                </div>
              </div>
              <Badge variant="warning">Degraded</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cloud & Software Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cloud Technology Overview</CardTitle>
            <CardDescription>Multi-cloud instance distribution and monthly spend.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cloudData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Bar dataKey="instances" name="Instances" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" name="Monthly Cost ($)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Software Asset Compliance</CardTitle>
            <CardDescription>License utilization and compliance across key applications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {softwareData.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground">{item.used} / {item.licenses} licenses</span>
                </div>
                <Progress value={item.compliance} className="h-2" indicatorClassName="bg-blue-500" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Drift Alerts */}
      {drifts.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Active Configuration Drifts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {drifts.map(drift => (
                <div key={drift.id} className="flex justify-between items-center p-2 bg-white rounded border border-yellow-200">
                  <span className="font-semibold">{drift.device_id}</span>
                  <span className="text-xs text-muted-foreground">{new Date(drift.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Innovative Model Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-4 overflow-hidden border-slate-800">
          <CardHeader className="bg-slate-900 text-white border-b border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center">
                  <Cpu className="w-5 h-5 mr-2 text-blue-400" />
                  Manufacturer & Model Intelligence
                </CardTitle>
                <CardDescription className="text-slate-400">Standardization metrics and model distribution across infrastructure.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-slate-950 border-slate-700 text-slate-300">Total Manufacturers: {Object.keys(vendorCounts).filter(v => v !== 'Unknown' && v !== '').length}</Badge>
                <Badge variant="outline" className="bg-slate-950 border-slate-700 text-green-400">Total Devices: {devices.length}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-slate-800 border-b border-slate-800 bg-slate-950">
              {liveVendorData.map((vendor) => (
                <div key={vendor.name} className="p-6 hover:bg-slate-900/50 transition-colors group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{vendor.name}</span>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: vendor.fill }}></div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{vendor.count as number}</div>
                  <div className="space-y-2">
                    {devices.filter(d => d.vendor === vendor.name).slice(0, 4)
                      .map((d, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 truncate mr-2">{d.model || d.name}</span>
                          <span className="text-slate-400 font-mono">{d.type}</span>
                        </div>
                      ))
                    }
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="w-full text-[10px] h-7 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
                      Deep Dive
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendor Distribution */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Vendor Distribution</CardTitle>
            <CardDescription>Infrastructure breakdown by manufacturer.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={liveVendorData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Asset Risk Distribution</CardTitle>
            <CardDescription>Dynamic risk score based on status, warranty, load, and age.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Audit Logs */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Audit Logs</CardTitle>
              <ClipboardList className="w-4 h-4 text-muted-foreground" />
            </div>
            <CardDescription>Latest system and user activities.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{log.action}</p>
                  <p className="text-xs text-muted-foreground">{log.user} • {log.time}</p>
                </div>
                <Badge variant={log.severity === 'Warning' ? 'warning' : 'secondary'} className="text-[10px]">
                  {log.severity}
                </Badge>
              </div>
            ))}
            <Link 
              to="/audit-log" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-full mt-2"
            >
              View All Logs
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Compliance Status */}
        <Card>
          <CardHeader>
            <CardTitle>Regulatory Compliance</CardTitle>
            <CardDescription>Continuous auditing against major frameworks.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {complianceData.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.name} Benchmark</span>
                  <span className={item.score > 90 ? "text-green-500" : "text-yellow-500"}>{item.score}%</span>
                </div>
                <Progress 
                  value={item.score} 
                  className="h-2" 
                  indicatorClassName={item.score > 90 ? "bg-green-500" : "bg-yellow-500"}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        <TabsContent className={activeDashboardTab === 'network' ? 'block space-y-6' : 'hidden'}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Firewalls</CardTitle>
                <Shield className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{typeCounts['Firewall'] || 0}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">Security perimeter</span>
                  <Badge variant="success" className="text-[10px]">Active</Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Routers</CardTitle>
                <Router className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{typeCounts['Router'] || 0}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">Core routing</span>
                  <Badge variant="success" className="text-[10px]">Active</Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Switches</CardTitle>
                <Zap className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{typeCounts['Switch'] || 0}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">Network switching</span>
                  <Badge variant="success" className="text-[10px]">97% OK</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Network Throughput (Gbps)</CardTitle>
                <CardDescription>Real-time traffic across core infrastructure.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={networkPerformanceData}>
                    <defs>
                      <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="throughput" stroke="#3b82f6" fillOpacity={1} fill="url(#colorThroughput)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Critical Network Alerts</CardTitle>
                <CardDescription>Active issues requiring immediate attention.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-red-50 border-red-100">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-900">BGP Session Down</p>
                      <p className="text-xs text-red-700">Edge-Router-01 • Peer: 172.16.0.1</p>
                    </div>
                  </div>
                  <Badge variant="destructive">Critical</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50 border-yellow-100">
                  <div className="flex items-center space-x-3">
                    <Activity className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">High CPU Usage</p>
                      <p className="text-xs text-yellow-700">Core-Switch-02 • 85% Load</p>
                    </div>
                  </div>
                  <Badge variant="warning">Warning</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent className={activeDashboardTab === 'compute' ? 'block space-y-6' : 'hidden'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Servers</CardTitle>
                <DatabaseIcon className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(typeCounts['Server'] || 0) + (typeCounts['VM'] || 0)}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">Physical: {typeCounts['Server'] || 0} | VM: {typeCounts['VM'] || 0}</span>
                  <Badge variant="success" className="text-[10px]">96% OK</Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Storage Arrays</CardTitle>
                <HardDrive className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{typeCounts['Storage'] || 0}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">Storage arrays</span>
                  <Badge variant="success" className="text-[10px]">100% OK</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compute Utilization (%)</CardTitle>
                <CardDescription>CPU and Memory trends across server fleet.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={computeUtilizationData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cpu" stroke="#22c55e" strokeWidth={2} name="CPU Load" />
                    <Line type="monotone" dataKey="mem" stroke="#3b82f6" strokeWidth={2} name="Memory Usage" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Servers by Load</CardTitle>
                <CardDescription>Identifying potential performance bottlenecks.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: 'PROD-DB-01', cpu: 92, mem: 88 },
                  { name: 'WEB-FE-04', cpu: 78, mem: 65 },
                  { name: 'APP-SRV-02', cpu: 65, mem: 72 },
                ].map((srv) => (
                  <div key={srv.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{srv.name}</span>
                      <span className="text-muted-foreground">CPU: {srv.cpu}% | MEM: {srv.mem}%</span>
                    </div>
                    <Progress value={srv.cpu} className="h-1.5" indicatorClassName={srv.cpu > 80 ? "bg-red-500" : "bg-green-500"} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
