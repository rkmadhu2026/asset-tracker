import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, Download, Clock, User, Settings, ShieldAlert, Activity } from 'lucide-react';
import { format } from 'date-fns';

const auditLogs = [
  { id: 'LOG-001', timestamp: new Date('2026-04-01T22:30:00'), user: 'admin@acme.com', action: 'Configuration Backup', type: 'Config', severity: 'Info', details: 'Manual backup triggered for Core-Router-01' },
  { id: 'LOG-002', timestamp: new Date('2026-04-01T22:15:00'), user: 'system', action: 'Vulnerability Scan', type: 'System', severity: 'Warning', details: 'Found 2 new vulnerabilities in Edge-FW-02' },
  { id: 'LOG-003', timestamp: new Date('2026-04-01T21:45:00'), user: 'j.doe@acme.com', action: 'User Login', type: 'User', severity: 'Info', details: 'Successful login from 192.168.1.45' },
  { id: 'LOG-004', timestamp: new Date('2026-04-01T21:30:00'), user: 'admin@acme.com', action: 'Firmware Upgrade', type: 'Config', severity: 'Critical', details: 'Upgraded Core-Router-01 to v17.4' },
  { id: 'LOG-005', timestamp: new Date('2026-04-01T20:00:00'), user: 'system', action: 'Compliance Audit', type: 'System', severity: 'Info', details: 'Weekly CIS benchmark scan completed' },
  { id: 'LOG-006', timestamp: new Date('2026-04-01T19:15:00'), user: 'm.smith@acme.com', action: 'Asset Deleted', type: 'User', severity: 'Warning', details: 'Deleted legacy-switch-05 from CMDB' },
  { id: 'LOG-007', timestamp: new Date('2026-04-01T18:45:00'), user: 'system', action: 'Config Drift Detected', type: 'Config', severity: 'Warning', details: 'Drift detected on Access-Switch-L2' },
];

export function AuditLog() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLogs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityBadge = (severity: string) => {
    switch(severity) {
      case 'Critical': return <Badge variant="destructive">Critical</Badge>;
      case 'Warning': return <Badge variant="warning">Warning</Badge>;
      case 'Info': return <Badge variant="secondary">Info</Badge>;
      default: return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'User': return <User className="w-4 h-4 text-blue-500" />;
      case 'System': return <Activity className="w-4 h-4 text-green-500" />;
      case 'Config': return <Settings className="w-4 h-4 text-purple-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Comprehensive track of all user actions, system events, and configuration changes.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 bg-muted/50 rounded-md px-3 py-2 w-96 border">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search logs by user, action, or details..." 
                className="bg-transparent border-none outline-none text-sm w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User / Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {format(log.timestamp, 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                  <TableCell className="font-medium">{log.user}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(log.type)}
                      <span className="text-xs font-medium">{log.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{log.action}</TableCell>
                  <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                    {log.details}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
