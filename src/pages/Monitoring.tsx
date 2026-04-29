import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, Search, Filter, RefreshCw, 
  Wifi, WifiOff, AlertTriangle, CheckCircle2,
  Clock, Server, Network, Shield
} from 'lucide-react';
import { infrastructureApi } from '../lib/api';
import { useClient } from '@/components/ClientProvider';

export function Monitoring() {
  const [searchTerm, setSearchTerm] = useState('');
  const [devices, setDevices] = useState<any[]>([]);
  const { selectedClientId } = useClient();

  useEffect(() => {
    infrastructureApi.list(selectedClientId ? { clientId: selectedClientId } : {})
      .then(setDevices)
      .catch(console.error);
  }, [selectedClientId]);

  const onlineCount = devices.filter(d => d.status === 'Online' || !d.status).length;
  const warningCount = devices.filter(d => d.status === 'Warning').length;
  const offlineCount = devices.filter(d => d.status === 'Offline').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Activity className="h-8 mr-3 text-primary" />
            Network Monitoring
          </h1>
          <p className="text-muted-foreground mt-1">Real-time on-premise device status and performance metrics.</p>
        </div>
        <div className="flex space-x-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button className="flex-1 sm:flex-none">Configure Alerts</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-green-50 border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-green-900 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Devices Online
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{onlineCount}</div>
            <p className="text-xs text-green-600">Availability</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-yellow-900 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Performance Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{warningCount}</div>
            <p className="text-xs text-yellow-600">High latency detected</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-red-900 flex items-center">
              <WifiOff className="w-4 h-4 mr-2" />
              Devices Offline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{offlineCount}</div>
            <p className="text-xs text-red-600">Immediate action required</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 bg-muted/50 rounded-md px-3 py-2 w-full md:w-96 border">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search by name or IP..." 
                className="bg-transparent border-none outline-none text-sm w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-2 w-full md:w-auto">
              <Button variant="outline" size="sm" className="flex-1 md:flex-none">
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
                <TableHead>Device Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Latency</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>Last Poll</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.filter(d => d.name?.toLowerCase().includes(searchTerm.toLowerCase()) || d.ip?.includes(searchTerm)).map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-semibold">{device.name}</TableCell>
                  <TableCell className="text-sm">{device.os || 'Unknown'}</TableCell>
                  <TableCell className="font-mono text-xs">{device.ip}</TableCell>
                  <TableCell>
                    <Badge variant={
                      device.status === 'Online' || !device.status ? 'success' : 
                      device.status === 'Warning' ? 'warning' : 'destructive'
                    }>
                      {device.status || 'Online'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{device.latency || '1.2ms'}</TableCell>
                  <TableCell className="text-sm">{device.uptime || '124d 14h'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground flex items-center">
                    <Clock className="w-3 h-3 mr-1" /> {device.lastPoll || '45s ago'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Details</Button>
                  </TableCell>
                </TableRow>
              ))}
              {devices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No devices found for this tenant.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
