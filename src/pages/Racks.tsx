import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  Node, 
  Edge, 
  Connection, 
  addEdge,
  MarkerType,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Box, Search, Filter, Plus, Layout, 
  ArrowLeft, Info, Server, Network, Shield, 
  Zap, Database, Cpu, Thermometer, MapPin,
  MoreHorizontal, ExternalLink, Link2, Activity,
  CheckCircle2, AlertTriangle, XCircle, Share2,
  Cable, Power, Layers
} from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// --- Data Definitions ---

const racks = [
  { 
    id: 'RK-001', 
    name: 'DC1-RACK-A1', 
    dataCenter: 'Data Center 1', 
    room: 'Room 101 / Floor 1', 
    size: 42, 
    powerCapacity: '15kW', 
    coolingType: 'Hot Aisle Containment', 
    status: 'Active',
    occupancy: 75
  },
  { 
    id: 'RK-002', 
    name: 'DC1-RACK-A2', 
    dataCenter: 'Data Center 1', 
    room: 'Room 101 / Floor 1', 
    size: 42, 
    powerCapacity: '15kW', 
    coolingType: 'Hot Aisle Containment', 
    status: 'Active',
    occupancy: 45
  },
  { 
    id: 'RK-003', 
    name: 'DC2-RACK-B1', 
    dataCenter: 'Data Center 2', 
    room: 'Room 202 / Floor 2', 
    size: 48, 
    powerCapacity: '20kW', 
    coolingType: 'In-Row Cooling', 
    status: 'Maintenance',
    occupancy: 90
  },
];

const rackDevices = [
  { id: 'DEV-001', rackId: 'RK-001', name: 'sw-core-01', type: 'Core Switch', vendor: 'Cisco', model: 'Catalyst 9500', serial: 'SN-C9500-123', uPos: 41, uSize: 1, power: 'UPS-A', port: 'Eth1/1', status: 'Active', app: 'Core Network' },
  { id: 'DEV-002', rackId: 'RK-001', name: 'fw-dc1-01', type: 'Firewall', vendor: 'Fortinet', model: 'FPR-2110', serial: 'SN-FW-456', uPos: 40, uSize: 1, power: 'UPS-A', port: 'Eth1/2', status: 'Active', app: 'Edge Security' },
  { id: 'DEV-003', rackId: 'RK-001', name: 'rt-edge-01', type: 'Router', vendor: 'Cisco', model: 'ASR 1001-X', serial: 'SN-RT-789', uPos: 39, uSize: 1, power: 'UPS-B', port: 'Gi0/0/1', status: 'Active', app: 'WAN Edge' },
  { id: 'DEV-004', rackId: 'RK-001', name: 'srv-app-01', type: 'Physical Server', vendor: 'HP', model: 'ProLiant DL380', serial: 'SN-HP-001', uPos: 30, uSize: 2, power: 'PDU-1', port: 'NIC1', status: 'Active', app: 'ERP App' },
  { id: 'DEV-005', rackId: 'RK-001', name: 'srv-db-01', type: 'Physical Server', vendor: 'Dell', model: 'PowerEdge R740', serial: 'SN-DELL-002', uPos: 25, uSize: 2, power: 'PDU-2', port: 'NIC1', status: 'Warning', app: 'ERP DB' },
  { id: 'DEV-006', rackId: 'RK-001', name: 'st-san-01', type: 'SAN Storage', vendor: 'NetApp', model: 'AFF A400', serial: 'SN-NA-999', uPos: 15, uSize: 4, power: 'UPS-A/B', port: 'FC1', status: 'Active', app: 'Shared Storage' },
  { id: 'DEV-007', rackId: 'RK-001', name: 'ups-dc1-01', type: 'UPS', vendor: 'APC', model: 'Smart-UPS 5k', serial: 'SN-APC-111', uPos: 5, uSize: 3, power: 'Mains', port: 'N/A', status: 'Active', app: 'Power Backup' },
  { id: 'DEV-008', rackId: 'RK-001', name: 'pdu-dc1-01', type: 'PDU', vendor: 'Eaton', model: 'Managed PDU', serial: 'SN-ETN-222', uPos: 1, uSize: 2, power: 'UPS-A', port: 'N/A', status: 'Active', app: 'Power Dist' },
  { id: 'DEV-009', rackId: 'RK-001', name: 'pp-net-01', type: 'Patch Panel', vendor: 'Panduit', model: '48-port Cat6', serial: 'N/A', uPos: 42, uSize: 1, power: 'N/A', port: 'N/A', status: 'Active', app: 'Connectivity' },
  { id: 'DEV-010', rackId: 'RK-001', name: 'srv-test-01', type: 'Physical Server', vendor: 'Dell', model: 'PowerEdge R640', serial: 'SN-DELL-003', uPos: 20, uSize: 1, power: 'PDU-1', port: 'NIC1', status: 'Offline', app: 'Test Environment' },
];

// --- Components ---

const RackDependencyMap = ({ devices }: { devices: any[] }) => {
  const initialNodes: Node[] = useMemo(() => devices.map((d, i) => ({
    id: d.id,
    data: { label: d.name, type: d.type },
    position: { x: (i % 3) * 200, y: Math.floor(i / 3) * 100 },
    style: { 
      background: d.type === 'Core Switch' || d.type === 'Router' ? '#3b82f6' : 
                  d.type === 'UPS' || d.type === 'PDU' ? '#f59e0b' :
                  d.type === 'Patch Panel' ? '#10b981' : '#64748b',
      color: '#fff',
      fontSize: '10px',
      fontWeight: 'bold',
      borderRadius: '8px',
      padding: '10px',
      width: 150,
      textAlign: 'center',
      border: 'none'
    }
  })), [devices]);

  const initialEdges: Edge[] = [
    { id: 'e1-2', source: 'DEV-001', target: 'DEV-002', label: '10G', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e1-3', source: 'DEV-001', target: 'DEV-003', label: '10G', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e1-4', source: 'DEV-001', target: 'DEV-004', label: '1G', markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e1-5', source: 'DEV-001', target: 'DEV-005', label: '1G', markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e7-8', source: 'DEV-007', target: 'DEV-008', label: 'Power', style: { stroke: '#f59e0b', strokeWidth: 2 } },
    { id: 'e8-4', source: 'DEV-008', target: 'DEV-004', label: 'Power', style: { stroke: '#f59e0b' } },
    { id: 'e9-1', source: 'DEV-009', target: 'DEV-001', label: 'Uplink', style: { stroke: '#10b981' } },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  return (
    <div className="h-[500px] w-full border rounded-xl overflow-hidden relative" style={{ background: '#FAF7F3' }}>
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="flex items-center space-x-2 bg-white/80 backdrop-blur p-2 rounded-lg border shadow-sm">
          <div className="w-3 h-3 rounded-full" style={{ background: '#C8622E' }} />
          <span className="text-[10px] font-medium">Network</span>
          <div className="w-3 h-3 bg-amber-500 rounded-full ml-2" />
          <span className="text-[10px] font-medium">Power</span>
          <div className="w-3 h-3 bg-emerald-500 rounded-full ml-2" />
          <span className="text-[10px] font-medium">Patching</span>
        </div>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background color="#cbd5e1" gap={20} />
        <Controls />
        <MiniMap zoomable pannable />
      </ReactFlow>
    </div>
  );
};

const RackVisualization = ({ rack, devices, onDeviceClick }: { rack: any, devices: any[], onDeviceClick?: (device: any) => void }) => {
  const units = Array.from({ length: rack.size }, (_, i) => rack.size - i);
  
  const getDeviceAtU = (u: number) => {
    return devices.find(d => u >= d.uPos && u < d.uPos + d.uSize);
  };

  return (
    <div className="flex flex-col border-4 border-gray-800 rounded-lg bg-gray-900 p-2 w-full max-w-md mx-auto shadow-2xl">
      <div className="text-center text-gray-400 text-[10px] font-bold mb-2 uppercase tracking-widest">
        {rack.name} • {rack.size}U
      </div>
      <div className="space-y-0.5">
        {units.map((u) => {
          const device = getDeviceAtU(u);
          const isStartOfDevice = device && device.uPos + device.uSize - 1 === u;
          
          if (device && !isStartOfDevice) return null;

          return (
            <div key={u} className="flex h-8 items-stretch group">
              <div className="w-8 flex items-center justify-center text-[10px] font-mono text-gray-500 border-r border-gray-800 bg-gray-900/50">
                {u}
              </div>
              {device ? (
                <div 
                  className={cn(
                    "flex-1 flex items-center px-3 text-[10px] font-bold border rounded-sm transition-all cursor-pointer",
                    device.status === 'Active' ? "bg-green-600/20 border-green-500/50 text-green-200 hover:bg-green-600/30" : 
                    device.status === 'Warning' ? "bg-yellow-600/20 border-yellow-500/50 text-yellow-200 hover:bg-yellow-600/30" :
                    device.status === 'Offline' ? "bg-red-600/20 border-red-500/50 text-red-200 hover:bg-red-600/30" :
                    "bg-gray-700/20 border-gray-600/50 text-gray-400"
                  )}
                  style={{ height: `${device.uSize * 32 + (device.uSize - 1) * 2}px` }}
                  title={`Serial: ${device.serial}\nStatus: ${device.status}\nApp: ${device.app}\nPower: ${device.power}`}
                  onClick={() => onDeviceClick && onDeviceClick(device)}
                >
                  <div className="flex items-center w-full justify-between">
                    <div className="flex items-center overflow-hidden">
                      <div className={cn("w-2 h-2 rounded-full mr-2 shrink-0", 
                        device.status === 'Active' ? "bg-green-500" :
                        device.status === 'Warning' ? "bg-yellow-500" :
                        device.status === 'Offline' ? "bg-red-500" : "bg-gray-500"
                      )} />
                      {device.status === 'Active' && <CheckCircle2 className="w-3 h-3 mr-1 shrink-0" />}
                      {device.status === 'Warning' && <AlertTriangle className="w-3 h-3 mr-1 shrink-0" />}
                      {device.status === 'Offline' && <XCircle className="w-3 h-3 mr-1 shrink-0" />}
                      <span className="truncate">{device.name}</span>
                      <span className="ml-2 text-[8px] opacity-50 font-normal hidden sm:inline">({device.model})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-12 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full", 
                            device.power === 'UPS-A' ? "bg-[#C8622E]" :
                            device.power === 'UPS-B' ? "bg-[#7C3AED]" :
                            device.power === 'PDU-1' ? "bg-orange-500" : "bg-yellow-500"
                          )} 
                          style={{ width: `${Math.floor(Math.random() * 80) + 10}%` }}
                        />
                      </div>
                      <Badge variant="outline" className="text-[7px] h-3 px-1 border-current opacity-70">
                        {device.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 border border-dashed border-gray-800 rounded-sm hover:bg-gray-800/30 transition-colors"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export function Racks() {
  const [selectedRack, setSelectedRack] = useState<any>(null);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRelTab, setActiveRelTab] = useState('map');
  const [viewTab, setViewTab] = useState('racks');
  const [primaryGroupBy, setPrimaryGroupBy] = useState('None');
  const [secondaryGroupBy, setSecondaryGroupBy] = useState('None');

  const filteredRacks = racks.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.dataCenter.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGroupKey = (item: any, key: string) => {
    if (key === 'Site') {
      const rack = racks.find(r => r.id === item.rackId);
      return rack?.dataCenter || 'Unknown';
    }
    return item[key.toLowerCase()] || 'Unknown';
  };

  const renderDeviceRow = (device: any) => (
    <TableRow key={device.id}>
      <TableCell className="font-mono text-xs text-muted-foreground">U{device.uPos}</TableCell>
      <TableCell>
        <div className="font-semibold">{device.name}</div>
        <div className="text-[10px] text-muted-foreground">{device.type}</div>
      </TableCell>
      <TableCell className="text-xs">{device.vendor} {device.model}</TableCell>
      <TableCell className="font-mono text-[10px]">{device.serial}</TableCell>
      <TableCell className="text-xs">{device.power}</TableCell>
      <TableCell>
        <Badge variant={
          device.status === 'Active' ? 'success' : 
          device.status === 'Warning' ? 'warning' : 'destructive'
        } className="text-[8px] h-4">
          {device.status}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="icon">
          <Link2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );

  const GroupingControls = () => (
    <div className="flex flex-wrap gap-4 mb-4 p-4 bg-muted/20 rounded-lg border">
      <div className="flex items-center space-x-2">
        <span className="text-xs font-bold text-muted-foreground uppercase">Primary Group:</span>
        <Select value={primaryGroupBy} onValueChange={setPrimaryGroupBy} className="w-[160px] h-8 text-xs">
          <SelectItem value="None">None</SelectItem>
          <SelectItem value="Site">Site</SelectItem>
          <SelectItem value="Type">Type</SelectItem>
          <SelectItem value="Vendor">Vendor</SelectItem>
          <SelectItem value="Status">Status</SelectItem>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-xs font-bold text-muted-foreground uppercase">Secondary Group:</span>
        <Select value={secondaryGroupBy} onValueChange={setSecondaryGroupBy} className="w-[160px] h-8 text-xs">
          <SelectItem value="None">None</SelectItem>
          <SelectItem value="Site">Site</SelectItem>
          <SelectItem value="Type">Type</SelectItem>
          <SelectItem value="Vendor">Vendor</SelectItem>
          <SelectItem value="Status">Status</SelectItem>
        </Select>
      </div>
    </div>
  );

  const GroupedTable = ({ devices }: { devices: any[] }) => {
    const grouped = useMemo(() => {
      if (primaryGroupBy === 'None') return { 'All Devices': devices };
      
      const groups: Record<string, any> = {};
      devices.forEach(device => {
        const pKey = getGroupKey(device, primaryGroupBy);
        if (!groups[pKey]) groups[pKey] = secondaryGroupBy === 'None' ? [] : {};
        
        if (secondaryGroupBy === 'None') {
          groups[pKey].push(device);
        } else {
          const sKey = getGroupKey(device, secondaryGroupBy);
          if (!groups[pKey][sKey]) groups[pKey][sKey] = [];
          groups[pKey][sKey].push(device);
        }
      });
      return groups;
    }, [devices, primaryGroupBy, secondaryGroupBy]);

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>U</TableHead>
            <TableHead>Device Name</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Serial</TableHead>
            <TableHead>Power</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(grouped).map(([pKey, pValue]: [string, any]) => {
            const itemCount = secondaryGroupBy === 'None' 
              ? (pValue as any[]).length 
              : Object.values(pValue as Record<string, any[]>).reduce((acc, curr) => acc + curr.length, 0);
            
            return (
              <React.Fragment key={pKey}>
                {primaryGroupBy !== 'None' && (
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={7} className="font-bold text-primary py-2 text-xs">
                      {primaryGroupBy}: {pKey} ({itemCount})
                    </TableCell>
                  </TableRow>
                )}
                {secondaryGroupBy !== 'None' && primaryGroupBy !== 'None' ? (
                  Object.entries(pValue as Record<string, any[]>).map(([sKey, sValue]) => (
                    <React.Fragment key={sKey}>
                      <TableRow className="bg-muted/20">
                        <TableCell colSpan={7} className="font-semibold text-muted-foreground py-1 pl-8 italic text-[10px]">
                          {secondaryGroupBy}: {sKey} ({sValue.length})
                        </TableCell>
                      </TableRow>
                      {sValue.map(device => renderDeviceRow(device))}
                    </React.Fragment>
                  ))
                ) : (
                  (primaryGroupBy === 'None' ? pValue as any[] : pValue as any[]).map((device: any) => renderDeviceRow(device))
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  if (selectedRack) {
    const devicesInRack = rackDevices.filter(d => d.rackId === selectedRack.id);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedRack(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{selectedRack.name}</h1>
              <p className="text-sm text-muted-foreground">{selectedRack.dataCenter} • {selectedRack.room}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Activity className="w-4 h-4 mr-2" />
              Sensor Data
            </Button>
            <Button size="sm">Edit Rack</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rack Visualization */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Elevation View</CardTitle>
                <CardDescription>Visual U-position mapping.</CardDescription>
              </CardHeader>
              <CardContent className="pb-8">
                <RackVisualization rack={selectedRack} devices={devicesInRack} onDeviceClick={setSelectedDevice} />
              </CardContent>
            </Card>
          </div>

          {/* Rack Details & Inventory */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg" style={{ background: '#FAE8DC' }}><Zap className="w-5 h-5 text-[#C8622E]" /></div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Power Usage</p>
                    <p className="text-lg font-bold">8.4 kW / {selectedRack.powerCapacity}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg"><Thermometer className="w-5 h-5 text-green-600" /></div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Temp (Avg)</p>
                    <p className="text-lg font-bold">22.4°C</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg" style={{ background: '#EDE4F6' }}><Layout className="w-5 h-5 text-[#7C3AED]" /></div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Occupancy</p>
                    <p className="text-lg font-bold">{selectedRack.occupancy}%</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Power Distribution</CardTitle>
                <CardDescription>Load distribution across rack PDUs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {['UPS-A', 'UPS-B', 'PDU-1', 'PDU-2'].map((pdu) => {
                  const load = Math.floor(Math.random() * 60) + 20;
                  return (
                    <div key={pdu} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">{pdu}</span>
                        <span className="text-muted-foreground">{load}%</span>
                      </div>
                      <Progress value={load} indicatorClassName={cn(
                        load > 75 ? "bg-red-500" : load > 50 ? "bg-yellow-500" : "bg-green-500"
                      )} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rack Inventory (CMDB)</CardTitle>
                <CardDescription>Detailed list of equipment in {selectedRack.name}.</CardDescription>
              </CardHeader>
              <CardContent>
                <GroupingControls />
                <GroupedTable devices={devicesInRack.sort((a, b) => b.uPos - a.uPos)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">Dependency & Relationship Map</CardTitle>
                  <CardDescription>Visualize and manage connections between devices, power, and patching.</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Cable className="w-4 h-4 mr-2" />
                    Auto-Map
                  </Button>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Connection
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger 
                      active={activeRelTab === 'map'} 
                      onClick={() => setActiveRelTab('map')}
                      className="flex items-center"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Visual Map
                    </TabsTrigger>
                    <TabsTrigger 
                      active={activeRelTab === 'list'} 
                      onClick={() => setActiveRelTab('list')}
                      className="flex items-center"
                    >
                      <Layers className="w-4 h-4 mr-2" />
                      Connection List
                    </TabsTrigger>
                  </TabsList>
                  <div className={activeRelTab === 'map' ? 'block' : 'hidden'}>
                    <RackDependencyMap devices={devicesInRack} />
                  </div>
                  <div className={activeRelTab === 'list' ? 'block' : 'hidden'}>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead>Source Device</TableHead>
                            <TableHead>Target Device</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[
                            { from: 'sw-core-01', to: 'fw-dc1-01', type: 'Network', cap: '10G SFP+', status: 'Active' },
                            { from: 'sw-core-01', to: 'rt-edge-01', type: 'Network', cap: '10G SFP+', status: 'Active' },
                            { from: 'ups-dc1-01', to: 'pdu-dc1-01', type: 'Power', cap: '32A', status: 'Active' },
                            { from: 'pdu-dc1-01', to: 'srv-app-01', type: 'Power', cap: 'C13', status: 'Active' },
                            { from: 'pp-net-01', to: 'sw-core-01', type: 'Patching', cap: 'Cat6', status: 'Active' },
                          ].map((conn, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{conn.from}</TableCell>
                              <TableCell className="font-medium">{conn.to}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px]">
                                  {conn.type === 'Power' ? <Power className="w-3 h-3 mr-1" /> : <Cable className="w-3 h-3 mr-1" />}
                                  {conn.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{conn.cap}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                                  <span className="text-xs">{conn.status}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Relationships & Dependencies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center p-3 border rounded-lg bg-muted/20">
                    <div className="p-2 rounded-full mr-4" style={{ background: '#FAE8DC' }}><Network className="w-4 h-4 text-[#C8622E]" /></div>
                    <div className="flex-1">
                      <p className="text-xs font-bold">Network Connectivity</p>
                      <p className="text-[10px] text-muted-foreground">All compute nodes connected to sw-core-01 via 10G SFP+.</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[10px]">View Map</Button>
                  </div>
                  <div className="flex items-center p-3 border rounded-lg bg-muted/20">
                    <div className="p-2 bg-yellow-100 rounded-full mr-4"><Zap className="w-4 h-4 text-yellow-600" /></div>
                    <div className="flex-1">
                      <p className="text-xs font-bold">Power Redundancy</p>
                      <p className="text-[10px] text-muted-foreground">Dual-path power verified for 8/9 devices. srv-db-01 on single PDU.</p>
                    </div>
                    <Badge variant="warning" className="text-[8px]">Risk Detected</Badge>
                  </div>
                  <div className="flex items-center p-3 border rounded-lg bg-muted/20">
                    <div className="p-2 bg-green-100 rounded-full mr-4"><Shield className="w-4 h-4 text-green-600" /></div>
                    <div className="flex-1">
                      <p className="text-xs font-bold">Application Hosting</p>
                      <p className="text-[10px] text-muted-foreground">srv-app-01 & srv-db-01 host the 'ERP Production' application.</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[10px]">App Details</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Layout className="h-8 mr-3 text-primary" />
            Rack Master Table
          </h1>
          <p className="text-muted-foreground mt-1">Manage data center rack infrastructure, occupancy, and environmental status.</p>
        </div>
        <div className="flex space-x-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none">
            <MapPin className="w-4 h-4 mr-2" />
            Floor Map
          </Button>
          <Button className="flex-1 sm:flex-none">
            <Plus className="w-4 h-4 mr-2" />
            Add Rack
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4" style={{ background: '#FAE8DC', borderColor: '#E8C4AA' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase" style={{ color: '#A84E24' }}>Total Racks</p>
              <p className="text-2xl font-bold" style={{ color: '#7A3B1E' }}>{racks.length}</p>
            </div>
            <Box className="w-8 h-8" style={{ color: '#E8C4AA' }} />
          </div>
        </Card>
        <Card className="p-4 bg-green-50 border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-700 font-bold uppercase">Avg Occupancy</p>
              <p className="text-2xl font-bold text-green-900">
                {Math.round(racks.reduce((acc, r) => acc + r.occupancy, 0) / racks.length)}%
              </p>
            </div>
            <Layout className="w-8 h-8 text-green-200" />
          </div>
        </Card>
        <Card className="p-4" style={{ background: '#EDE4F6', borderColor: '#D8C6F0' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase" style={{ color: '#5B21B6' }}>Total Devices</p>
              <p className="text-2xl font-bold" style={{ color: '#3B0764' }}>{rackDevices.length}</p>
            </div>
            <Zap className="w-8 h-8" style={{ color: '#D8C6F0' }} />
          </div>
        </Card>
      </div>

      <Tabs className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger 
            active={viewTab === 'racks'} 
            onClick={() => setViewTab('racks')}
          >
            Rack Master Table
          </TabsTrigger>
          <TabsTrigger 
            active={viewTab === 'devices'} 
            onClick={() => setViewTab('devices')}
          >
            Global Inventory
          </TabsTrigger>
        </TabsList>

        <div className={viewTab === 'racks' ? 'block' : 'hidden'}>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-2 bg-muted/50 rounded-md px-3 py-2 w-full md:w-96 border">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search racks, data centers, rooms..." 
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
                    <TableHead>Rack ID</TableHead>
                    <TableHead>Rack Name</TableHead>
                    <TableHead>Data Center</TableHead>
                    <TableHead>Room / Floor</TableHead>
                    <TableHead>Size (U)</TableHead>
                    <TableHead>Power</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRacks.map((rack) => (
                    <TableRow 
                      key={rack.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedRack(rack)}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">{rack.id}</TableCell>
                      <TableCell className="font-bold">{rack.name}</TableCell>
                      <TableCell className="text-sm">{rack.dataCenter}</TableCell>
                      <TableCell className="text-sm">{rack.room}</TableCell>
                      <TableCell className="text-sm">{rack.size}U</TableCell>
                      <TableCell className="text-sm">{rack.powerCapacity}</TableCell>
                      <TableCell>
                        <Badge variant={rack.status === 'Active' ? 'success' : 'warning'}>
                          {rack.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className={viewTab === 'devices' ? 'block' : 'hidden'}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Global Device Inventory</CardTitle>
              <CardDescription>Consolidated view of all equipment across all data centers and racks.</CardDescription>
            </CardHeader>
            <CardContent>
              <GroupingControls />
              <GroupedTable devices={rackDevices} />
            </CardContent>
          </Card>
        </div>
      </Tabs>

      {/* Device Details Modal */}
      <Dialog open={!!selectedDevice} onOpenChange={(open) => !open && setSelectedDevice(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Device Details</DialogTitle>
            <DialogDescription>
              Information for {selectedDevice?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedDevice && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right text-sm font-medium text-muted-foreground">Name</span>
                <span className="col-span-3 font-semibold">{selectedDevice.name}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right text-sm font-medium text-muted-foreground">Type</span>
                <span className="col-span-3">{selectedDevice.type}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right text-sm font-medium text-muted-foreground">Vendor / Model</span>
                <span className="col-span-3">{selectedDevice.vendor} {selectedDevice.model}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right text-sm font-medium text-muted-foreground">Serial</span>
                <span className="col-span-3 font-mono text-sm">{selectedDevice.serial}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right text-sm font-medium text-muted-foreground">Position</span>
                <span className="col-span-3">U{selectedDevice.uPos} ({selectedDevice.uSize}U)</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right text-sm font-medium text-muted-foreground">Power</span>
                <span className="col-span-3">{selectedDevice.power}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right text-sm font-medium text-muted-foreground">Status</span>
                <div className="col-span-3">
                  <Badge variant={selectedDevice.status === 'Active' ? 'success' : selectedDevice.status === 'Warning' ? 'warning' : 'destructive'}>
                    {selectedDevice.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right text-sm font-medium text-muted-foreground">Application</span>
                <span className="col-span-3">{selectedDevice.app}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDevice(null)}>Close</Button>
            <Button>View Full Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
