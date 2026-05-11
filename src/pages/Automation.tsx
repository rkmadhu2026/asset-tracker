import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Play, FileCode2, Terminal, History, Search, 
  Plus, Settings, Cpu, Code, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import { FeatureHero } from '@/components/FeatureHero';

const scripts = [
  { id: 'SCR-001', name: 'Cisco_IOS_Backup.py', type: 'Backup', target: 'Cisco IOS', lastRun: '2026-04-01 14:20', status: 'Success' },
  { id: 'SCR-002', name: 'VLAN_Provisioning.py', type: 'Config', target: 'Multi-Vendor', lastRun: '2026-04-01 10:15', status: 'Success' },
  { id: 'SCR-003', name: 'Firmware_Upgrade_C9300.py', type: 'Maintenance', target: 'Cisco Catalyst', lastRun: '2026-03-31 22:00', status: 'Failed' },
  { id: 'SCR-004', name: 'Security_Audit_ACL.py', type: 'Security', target: 'Firewalls', lastRun: '2026-03-31 18:45', status: 'Success' },
];

const buildHistory = [
  { id: 'B-4521', script: 'Cisco_IOS_Backup.py', triggeredBy: 'System', duration: '45s', timestamp: '2 mins ago', status: 'Completed' },
  { id: 'B-4520', script: 'VLAN_Provisioning.py', triggeredBy: 'admin@acme.com', duration: '12s', timestamp: '1 hour ago', status: 'Completed' },
  { id: 'B-4519', script: 'Firmware_Upgrade_C9300.py', triggeredBy: 'admin@acme.com', duration: '15m', timestamp: 'Yesterday', status: 'Failed' },
];

export function Automation() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <FeatureHero
        eyebrow="Operations · Automation"
        title="Network Automation"
        description="Python-based configuration builds, scripted remediation, and infrastructure automation runs."
        icon={Terminal}
        stats={[
          { label: 'Scripts', value: scripts.length, icon: FileCode2 },
          { label: 'Recent Runs', value: buildHistory.length, icon: History },
          { label: 'Successful', value: scripts.filter(s => s.status === 'Success').length, icon: CheckCircle2 },
        ]}
        actions={
          <>
          <Button variant="outline" className="flex-1 sm:flex-none">
            <Terminal className="w-4 h-4 mr-2" />
            Console
          </Button>
          <Button className="flex-1 sm:flex-none">
            <Plus className="w-4 h-4 mr-2" />
            New Script
          </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Python Scripts List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <FileCode2 className="w-5 h-5 mr-2 text-[#C8622E]" />
                Python Automation Scripts
              </CardTitle>
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search scripts..." 
                  className="w-full pl-9 pr-4 py-2 bg-muted/50 rounded-md border text-sm outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Script Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Target Platform</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scripts.map((script) => (
                  <TableRow key={script.id}>
                    <TableCell className="font-medium flex items-center">
                      <Code className="w-4 h-4 mr-2 text-muted-foreground" />
                      {script.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{script.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{script.target}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{script.lastRun}</TableCell>
                    <TableCell>
                      <Badge variant={script.status === 'Success' ? 'success' : 'destructive'}>
                        {script.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#C8622E]">
                        <Play className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Build History / Runner Status */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <History className="w-4 h-4 mr-2 text-[#7C3AED]" />
                Recent Build History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {buildHistory.map((build) => (
                <div key={build.id} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{build.script}</p>
                    <p className="text-xs text-muted-foreground">
                      {build.id} • {build.triggeredBy} • {build.duration}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> {build.timestamp}
                    </p>
                  </div>
                  {build.status === 'Completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              ))}
              <Button variant="ghost" className="w-full text-xs mt-2">View Full History</Button>
            </CardContent>
          </Card>

          <Card style={{ background: '#FAE8DC', borderColor: '#E8C4AA' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center" style={{ color: '#7A3B1E' }}>
                <Cpu className="w-4 h-4 mr-2" />
                Automation Engine Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#A84E24' }}>Worker Nodes</span>
                  <span className="font-bold" style={{ color: '#7A3B1E' }}>4 Active</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#A84E24' }}>Queue Depth</span>
                  <span className="font-bold" style={{ color: '#7A3B1E' }}>0 Jobs</span>
                </div>
                <div className="pt-2">
                  <Badge style={{ background: '#C8622E', color: 'white' }}>Healthy</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
