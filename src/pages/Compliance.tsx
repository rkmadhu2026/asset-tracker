import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, Search, Filter, PlayCircle, XCircle, CheckCircle2 } from 'lucide-react';

const complianceRules = [
  { id: 'CIS-1.1', framework: 'CIS', description: 'Ensure passwords are encrypted', status: 'Failed', affected: 2, severity: 'High' },
  { id: 'CIS-2.3', framework: 'CIS', description: 'Disable SNMP v1/v2c', status: 'Passed', affected: 0, severity: 'Medium' },
  { id: 'SOX-404.1', framework: 'SOX', description: 'Enforce RBAC Logging via TACACS+', status: 'Failed', affected: 1, severity: 'Critical' },
  { id: 'HIPAA-164.312', framework: 'HIPAA', description: 'Enforce IPsec VPN encryption', status: 'Passed', affected: 0, severity: 'High' },
  { id: 'CIS-3.1', framework: 'CIS', description: 'Disable Telnet access', status: 'Failed', affected: 1, severity: 'High' },
];

export function Compliance() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRules = complianceRules.filter(r => 
    r.framework.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityBadge = (severity: string) => {
    switch(severity) {
      case 'Critical': return <Badge variant="destructive" className="bg-red-600">Critical</Badge>;
      case 'High': return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">High</Badge>;
      case 'Medium': return <Badge variant="warning">Medium</Badge>;
      case 'Low': return <Badge variant="success">Low</Badge>;
      default: return <Badge variant="outline">{severity}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Regulatory Compliance</h1>
          <p className="text-muted-foreground mt-1">Continuous auditing against CIS, SOX, and HIPAA frameworks.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Generate Audit Report
          </Button>
          <Button>Run Compliance Scan</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CIS Benchmarks</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500 absolute right-6 top-6" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between mb-2">
              <div className="text-3xl font-bold text-green-500">92%</div>
              <span className="text-xs text-muted-foreground">2 Failed Rules</span>
            </div>
            <Progress value={92} indicatorClassName="bg-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">SOX Compliance</CardTitle>
            <ShieldCheck className="h-4 w-4 text-yellow-500 absolute right-6 top-6" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between mb-2">
              <div className="text-3xl font-bold text-yellow-500">85%</div>
              <span className="text-xs text-muted-foreground">1 Failed Rule</span>
            </div>
            <Progress value={85} indicatorClassName="bg-yellow-500" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">HIPAA Security Rule</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500 absolute right-6 top-6" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between mb-2">
              <div className="text-3xl font-bold text-green-500">98%</div>
              <span className="text-xs text-muted-foreground">0 Failed Rules</span>
            </div>
            <Progress value={98} indicatorClassName="bg-green-500" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 bg-muted/50 rounded-md px-3 py-2 w-96 border">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search Framework or Rule..." 
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
                <TableHead>Rule ID</TableHead>
                <TableHead>Framework</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Affected Assets</TableHead>
                <TableHead className="text-right">Remediation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium text-muted-foreground">{rule.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">{rule.framework}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{rule.description}</TableCell>
                  <TableCell>{getSeverityBadge(rule.severity)}</TableCell>
                  <TableCell>
                    {rule.status === 'Failed' ? (
                      <div className="flex items-center text-destructive text-sm font-medium">
                        <XCircle className="w-4 h-4 mr-1" />
                        Failed
                      </div>
                    ) : (
                      <div className="flex items-center text-green-500 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Passed
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {rule.affected > 0 ? (
                      <Badge variant="destructive" className="font-mono bg-red-500/10 text-red-500 border-red-500/20">{rule.affected} Devices</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant={rule.status === 'Failed' ? 'default' : 'outline'} size="sm" disabled={rule.status !== 'Failed'}>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Run Configlet
                    </Button>
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
