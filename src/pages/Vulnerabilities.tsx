import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Search, Filter, Download, ArrowUpRight } from 'lucide-react';

const vulnerabilities = [
  { cve: 'CVE-2023-20198', severity: 'Critical', cvss: 10.0, component: 'Cisco IOS XE', affected: 3, published: '2023-10-16', status: 'Open' },
  { cve: 'CVE-2024-3400', severity: 'Critical', cvss: 10.0, component: 'PAN-OS', affected: 1, published: '2024-04-12', status: 'Open' },
  { cve: 'CVE-2023-38545', severity: 'High', cvss: 8.8, component: 'curl', affected: 12, published: '2023-10-11', status: 'Mitigated' },
  { cve: 'CVE-2023-44487', severity: 'High', cvss: 7.5, component: 'HTTP/2', affected: 8, published: '2023-10-10', status: 'Open' },
  { cve: 'CVE-2024-21626', severity: 'High', cvss: 8.6, component: 'runc', affected: 5, published: '2024-01-31', status: 'Open' },
];

export function Vulnerabilities() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVulns = vulnerabilities.filter(v => 
    v.cve.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.component.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold tracking-tight">Vulnerability Management</h1>
          <p className="text-muted-foreground mt-1">NVD integration and automated firmware upgrade workflows.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button>Sync NVD Database</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical CVEs</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive absolute right-6 top-6" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">2</div>
            <p className="text-xs text-muted-foreground mt-1">Requires immediate patching</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Severity CVEs</CardTitle>
            <ShieldAlert className="h-4 w-4 text-orange-500 absolute right-6 top-6" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">3</div>
            <p className="text-xs text-muted-foreground mt-1">Schedule maintenance window</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Affected Assets</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground absolute right-6 top-6" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">29</div>
            <p className="text-xs text-muted-foreground mt-1">Total devices exposed</p>
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
                placeholder="Search CVE or Component..." 
                className="bg-transparent border-none outline-none text-sm w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CVE ID</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>CVSS Score</TableHead>
                <TableHead>Component</TableHead>
                <TableHead>Affected Assets</TableHead>
                <TableHead>Published Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Remediation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVulns.map((vuln) => (
                <TableRow key={vuln.cve}>
                  <TableCell className="font-medium text-primary hover:underline cursor-pointer flex items-center">
                    {vuln.cve}
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </TableCell>
                  <TableCell>{getSeverityBadge(vuln.severity)}</TableCell>
                  <TableCell className="font-mono text-xs">{vuln.cvss.toFixed(1)}</TableCell>
                  <TableCell>{vuln.component}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">{vuln.affected}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{vuln.published}</TableCell>
                  <TableCell>
                    {vuln.status === 'Open' ? (
                      <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">Open</Badge>
                    ) : (
                      <Badge variant="success" className="bg-green-500/10 text-green-500 border-green-500/20">Mitigated</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant={vuln.status === 'Open' ? 'default' : 'outline'} size="sm" disabled={vuln.status !== 'Open'}>
                      Upgrade Firmware
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
