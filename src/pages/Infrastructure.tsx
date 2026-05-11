import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { 
  Search, Filter, Network, Server, Shield, 
  ArrowRight, ArrowLeft, ExternalLink, Info, Layers, 
  Database, Activity, Globe, Zap, Cpu, HardDrive, Fan,
  CheckCircle2, AlertTriangle, XCircle, ShoppingCart, Clock, X, Package,
  MoreVertical, RefreshCw, ChevronDown, ChevronRight, Network as NetworkIcon, ShieldCheck, FileUp, Download
} from 'lucide-react';

import { DeviceTemplates } from '@/components/DeviceTemplates';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { infrastructureApi, type Device } from '../lib/api';
import ReactFlow, { Background, Controls, MiniMap, MarkerType, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { GoogleGenAI, Type } from "@google/genai";
import { FeatureHero } from '@/components/FeatureHero';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const DeviceNode = ({ data }: { data: any }) => {
  const Icon = data.icon || Network;
  
  const cpu = parseInt(data.cpu) || 0;
  const memory = parseInt(data.memory) || 0;
  const healthScore = Math.max(0, 100 - (cpu * 0.5) - (memory * 0.5));
  const healthColor = healthScore > 80 ? 'bg-green-500' : healthScore > 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div 
      className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-primary/20 min-w-[150px] cursor-pointer relative"
      onClick={data.onClick}
    >
      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${healthColor}`} />
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-primary" />
      <div className="flex items-center">
        <div className="rounded-full p-2 bg-primary/10 mr-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="ml-2">
          <div className="text-sm font-bold">{data.label}</div>
          <div className="text-[10px] text-muted-foreground">{data.model}</div>
        </div>
      </div>
      <div className="mt-2 flex justify-between items-center">
        <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${data.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {data.status}
        </span>
        <span className="text-[8px] text-muted-foreground font-mono">{data.ip}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-primary" />
    </div>
  );
};

const nodeTypes = {
  device: DeviceNode,
};

const initialInfrastructureDevices = [
  { 
    id: 'INF-101', 
    name: 'Core-SW-01', 
    vendor: 'Cisco', 
    model: 'Catalyst 9500', 
    type: 'Switch', 
    status: 'Active', 
    site: 'DC-A',
    datacenter: 'Primary DC',
    rack: 'R-01',
    uPosition: '12U',
    hostname: 'core-sw-01.internal',
    ip: '10.0.1.1',
    iloIp: '10.0.1.101',
    mask: '255.255.255.0',
    gateway: '10.0.1.254',
    vlan: '10 (Management)',
    serial: 'SN-C9500-X123',
    firmware: 'IOS-XE 17.6.3',
    os: 'IOS-XE',
    uptime: '142 days, 4 hours',
    cpu: '12%',
    memory: '45%',
    temp: '42°C',
    ports: '48x 10G, 4x 40G',
    lastBackup: '2026-04-01 02:00',
    owner: 'Network Engineering',
    belongsTo: 'Infrastructure Dept',
    assignedTo: 'John Doe',
    criticality: 'Critical',
    purchaseDate: '2023-05-12',
    warrantyExpiry: '2028-05-12',
    ramModel: 'DDR4 3200MHz',
    totalRam: '16GB',
    cpuModel: 'Intel Xeon D-1500',
    totalCpu: '8 Cores',
    diskModel: 'NVMe SSD',
    totalDisk: '256GB',
    powerSupplies: 2,
    psuCapacity: '750W',
    poNumber: 'PO-2023-001',
    deploymentStatus: 'Production',
    licenseInfo: 'Enterprise Advantage'
  },
  { 
    id: 'INF-102', 
    name: 'Edge-RT-01', 
    vendor: 'Cisco', 
    model: 'ASR 1001-X', 
    type: 'Router', 
    status: 'Active', 
    site: 'DC-A',
    datacenter: 'Primary DC',
    rack: 'R-01',
    uPosition: '14U',
    hostname: 'edge-rt-01.internal',
    ip: '10.0.1.2',
    iloIp: '10.0.1.102',
    mask: '255.255.255.0',
    gateway: '10.0.1.254',
    vlan: '10 (Management)',
    serial: 'SN-ASR1K-Y456',
    firmware: 'IOS-XE 17.3.4',
    os: 'IOS-XE',
    uptime: '89 days, 12 hours',
    cpu: '24%',
    memory: '62%',
    temp: '48°C',
    ports: '6x 1G, 2x 10G',
    lastBackup: '2026-04-01 03:00',
    owner: 'Network Engineering',
    belongsTo: 'Infrastructure Dept',
    assignedTo: 'Jane Smith',
    criticality: 'Critical',
    purchaseDate: '2022-11-20',
    warrantyExpiry: '2027-11-20',
    ramModel: 'DDR4 2666MHz',
    totalRam: '8GB',
    cpuModel: 'Intel Xeon E3-1200',
    totalCpu: '4 Cores',
    diskModel: 'SATA SSD',
    totalDisk: '128GB',
    powerSupplies: 2,
    psuCapacity: '450W',
    poNumber: 'PO-2022-045',
    deploymentStatus: 'Production',
    licenseInfo: 'IP Base'
  },
  { 
    id: 'INF-103', 
    name: 'Access-SW-01', 
    vendor: 'Aruba', 
    model: 'CX 6300M', 
    type: 'Switch', 
    status: 'Active', 
    site: 'Branch-B',
    datacenter: 'Branch Office B',
    rack: 'B1-R02',
    uPosition: '05U',
    hostname: 'access-sw-01.branch-b',
    ip: '10.2.1.10',
    iloIp: '10.2.1.110',
    mask: '255.255.255.0',
    gateway: '10.2.1.1',
    vlan: '20 (Users)',
    serial: 'SN-ARUBA-Z789',
    firmware: 'AOS-CX 10.08',
    os: 'AOS-CX',
    uptime: '210 days, 1 hour',
    cpu: '8%',
    memory: '38%',
    temp: '39°C',
    ports: '48x 1G PoE+, 4x 10G',
    lastBackup: '2026-03-31 23:00',
    owner: 'IT Support',
    belongsTo: 'IT Dept',
    assignedTo: 'Bob Wilson',
    criticality: 'Medium',
    purchaseDate: '2024-01-15',
    warrantyExpiry: '2029-01-15',
    ramModel: 'DDR4 2400MHz',
    totalRam: '4GB',
    cpuModel: 'ARM Cortex-A53',
    totalCpu: '4 Cores',
    diskModel: 'eMMC',
    totalDisk: '16GB',
    powerSupplies: 1,
    psuCapacity: '600W',
    poNumber: 'PO-2024-012',
    deploymentStatus: 'Production',
    licenseInfo: 'Standard'
  },
  { 
    id: 'INF-104', 
    name: 'DC-Leaf-01', 
    vendor: 'Arista', 
    model: '7050SX3', 
    type: 'Switch', 
    status: 'Active', 
    site: 'DC-A',
    rack: 'R-05',
    uPosition: '22U',
    ip: '10.0.2.11',
    mask: '255.255.255.0',
    gateway: '10.0.2.1',
    vlan: '100 (Storage)',
    serial: 'SN-ARI-W012',
    firmware: 'EOS 4.27.1F',
    uptime: '45 days, 18 hours',
    cpu: '15%',
    memory: '52%',
    temp: '45°C',
    ports: '48x 25G, 6x 100G',
    lastBackup: '2026-04-01 01:00',
    owner: 'DC Ops',
    criticality: 'High',
    purchaseDate: '2023-08-30',
    warrantyExpiry: '2026-08-30'
  },
  { 
    id: 'INF-105', 
    name: 'Core-RT-01', 
    vendor: 'Huawei', 
    model: 'NetEngine AR6000', 
    type: 'Router', 
    status: 'Active', 
    site: 'DC-B',
    rack: 'B-R01',
    uPosition: '10U',
    ip: '10.1.1.1',
    mask: '255.255.255.0',
    gateway: '10.1.1.254',
    vlan: '10 (Management)',
    serial: 'SN-HUA-V345',
    firmware: 'VRP 8.180',
    uptime: '12 days, 6 hours',
    cpu: '32%',
    memory: '70%',
    temp: '52°C',
    ports: '8x 10G, 2x 40G',
    lastBackup: '2026-04-01 04:00',
    owner: 'Network Engineering',
    criticality: 'Critical',
    purchaseDate: '2024-02-10',
    warrantyExpiry: '2027-02-10'
  },
  { 
    id: 'INF-106', 
    name: 'App-Srv-01', 
    vendor: 'HP', 
    model: 'ProLiant DL380 Gen10', 
    type: 'Server', 
    status: 'Active', 
    site: 'DC-A',
    rack: 'R-08',
    uPosition: '04U',
    ip: '10.0.5.50',
    mask: '255.255.255.0',
    gateway: '10.0.5.1',
    vlan: '50 (Apps)',
    serial: 'SN-HPE-U678',
    firmware: 'iLO 5 v2.44',
    uptime: '305 days, 22 hours',
    cpu: '45%',
    memory: '82%',
    temp: '35°C',
    ports: '4x 1G, 2x 10G',
    lastBackup: '2026-04-01 00:00',
    owner: 'Server Team',
    criticality: 'High',
    purchaseDate: '2021-06-15',
    warrantyExpiry: '2026-06-15'
  },
  { 
    id: 'INF-107', 
    name: 'DB-Srv-01', 
    vendor: 'Dell', 
    model: 'PowerEdge R740', 
    type: 'Server', 
    status: 'Warning', 
    site: 'DC-B',
    rack: 'B-R05',
    uPosition: '08U',
    ip: '10.1.5.60',
    mask: '255.255.255.0',
    gateway: '10.1.5.1',
    vlan: '60 (DB)',
    serial: 'SN-DELL-T901',
    firmware: 'iDRAC9 v5.10',
    uptime: '15 days, 3 hours',
    cpu: '78%',
    memory: '94%',
    temp: '58°C',
    ports: '2x 10G, 2x 25G',
    lastBackup: '2026-03-31 22:00',
    owner: 'DBA Team',
    criticality: 'Critical',
    purchaseDate: '2022-03-12',
    warrantyExpiry: '2027-03-12'
  },
  { 
    id: 'INF-108', 
    name: 'Edge-FW-01', 
    vendor: 'Fortinet', 
    model: 'FortiGate 100F', 
    type: 'Firewall', 
    status: 'Active', 
    site: 'DC-A',
    rack: 'R-01',
    uPosition: '01U',
    ip: '10.0.0.1',
    mask: '255.255.255.0',
    gateway: '10.0.0.254',
    vlan: '1 (Untagged)',
    serial: 'SN-FORTI-S234',
    firmware: 'FortiOS 7.0.5',
    uptime: '412 days, 10 hours',
    cpu: '18%',
    memory: '41%',
    temp: '44°C',
    ports: '22x 1G, 2x 10G',
    lastBackup: '2026-04-01 05:00',
    owner: 'Security Team',
    criticality: 'Critical',
    purchaseDate: '2020-09-10',
    warrantyExpiry: '2025-09-10'
  },
  { 
    id: 'INF-109', 
    name: 'Backup-Srv-01', 
    vendor: 'HP', 
    model: 'StoreOnce 3620', 
    type: 'Server', 
    status: 'Offline', 
    site: 'DC-B',
    rack: 'B-R10',
    uPosition: '02U',
    ip: '10.1.10.100',
    mask: '255.255.255.0',
    gateway: '10.1.10.1',
    vlan: '100 (Backup)',
    serial: 'SN-HPE-R567',
    firmware: 'v4.3.2',
    uptime: '0 days',
    cpu: '0%',
    memory: '0%',
    temp: '22°C',
    ports: '4x 1G, 2x 10G',
    lastBackup: '2026-03-25 01:00',
    owner: 'Backup Team',
    criticality: 'Medium',
    purchaseDate: '2023-12-05',
    warrantyExpiry: '2028-12-05'
  },
  // New Assets from User Request
  {
    id: 'INF-201',
    name: 'Quad Port 1G NIC',
    vendor: 'Sheeltron',
    model: 'Quad Port 1G NIC',
    type: 'NIC',
    status: 'Active',
    site: 'eCity',
    assignedTo: 'Finspot-Domestic',
    purchaseDate: '2026-03-13',
    poNumber: '2516753',
    quantity: 6,
    unitPrice: 7800,
    totalValue: 46800,
    depreciationMethod: 'SLM',
    criticality: 'Medium'
  },
  {
    id: 'INF-202',
    name: 'HPE iLO Advance 3yrs',
    vendor: 'HPE',
    model: 'iLO Advance',
    type: 'License',
    status: 'Active',
    site: 'eCity',
    assignedTo: 'Finspot-Domestic',
    purchaseDate: '2026-03-13',
    poNumber: '2516753',
    quantity: 1,
    unitPrice: 30000,
    totalValue: 30000,
    depreciationMethod: 'SLM',
    criticality: 'Medium'
  },
  {
    id: 'INF-203',
    name: 'AMC 5Yrs',
    vendor: 'Sheeltron',
    model: '5 years AMC',
    type: 'Service',
    status: 'Active',
    site: 'eCity',
    assignedTo: 'Finspot-Domestic',
    purchaseDate: '2026-03-13',
    poNumber: '2516753',
    quantity: 1,
    unitPrice: 120000,
    totalValue: 120000,
    depreciationMethod: 'SLM',
    criticality: 'Medium'
  },
  {
    id: 'INF-204',
    name: 'Server - Dell DL380',
    vendor: 'Dell',
    model: 'DL380 Gen10 Plus',
    type: 'Server',
    status: 'Active',
    site: 'eCity',
    assignedTo: 'Finspot-Domestic',
    purchaseDate: '2026-03-13',
    poNumber: '2516753',
    serial: 'CNXD2J001S, CNXD1C01M8',
    quantity: 2,
    unitPrice: 230000,
    totalValue: 460000,
    depreciationMethod: 'SLM',
    criticality: 'Critical'
  },
  {
    id: 'INF-205',
    name: '64GB RAM (HP Authenticated)',
    vendor: 'HP',
    model: '64GB RAM',
    type: 'Component',
    status: 'Active',
    site: 'eCity',
    assignedTo: 'Finspot-Domestic',
    purchaseDate: '2026-03-13',
    poNumber: '2516753',
    quantity: 8,
    unitPrice: 72000,
    totalValue: 576000,
    depreciationMethod: 'SLM',
    criticality: 'Medium'
  },
  {
    id: 'INF-206',
    name: 'Intel Gold 6346 Processor',
    vendor: 'Intel',
    model: 'Gold 6346 (16-Core)',
    type: 'Component',
    status: 'Active',
    site: 'eCity',
    assignedTo: 'Finspot-Domestic',
    purchaseDate: '2026-03-13',
    poNumber: '2516753',
    quantity: 2,
    unitPrice: 160000,
    totalValue: 320000,
    depreciationMethod: 'SLM',
    criticality: 'High'
  },
  {
    id: 'INF-207',
    name: 'Micron 1.9TB Pro NVMe U.3 SSD',
    vendor: 'Micron',
    model: '1.9TB Pro NVMe',
    type: 'Storage',
    status: 'Active',
    site: 'eCity',
    assignedTo: 'Finspot-Domestic',
    purchaseDate: '2026-03-13',
    poNumber: '2516753',
    quantity: 6,
    unitPrice: 48000,
    totalValue: 288000,
    depreciationMethod: 'SLM',
    criticality: 'Medium'
  },
  {
    id: 'INF-208',
    name: 'Quad Port 1G NIC',
    vendor: 'Sheeltron',
    model: 'Quad Port 1G NIC',
    type: 'NIC',
    status: 'Active',
    site: 'eCity',
    assignedTo: 'Finspot-Domestic',
    purchaseDate: '2026-03-13',
    poNumber: '2516753',
    quantity: 2,
    unitPrice: 7800,
    totalValue: 15600,
    depreciationMethod: 'SLM',
    criticality: 'Medium'
  },
  {
    id: 'INF-209',
    name: 'HPE iLO Advance 3yrs',
    vendor: 'HPE',
    model: 'iLO Advance',
    type: 'License',
    status: 'Active',
    site: 'eCity',
    assignedTo: 'Finspot-Domestic',
    purchaseDate: '2026-03-13',
    poNumber: '2516753',
    quantity: 2,
    unitPrice: 30000,
    totalValue: 60000,
    depreciationMethod: 'SLM',
    criticality: 'Medium'
  },
  {
    id: 'INF-210',
    name: 'AMC 5Yrs',
    vendor: 'Sheeltron',
    model: '5 years AMC',
    type: 'Service',
    status: 'Active',
    site: 'eCity',
    assignedTo: 'Finspot-Domestic',
    purchaseDate: '2026-03-13',
    poNumber: '2516753',
    quantity: 2,
    unitPrice: 100000,
    totalValue: 200000,
    depreciationMethod: 'SLM',
    criticality: 'Medium'
  },
  {
    id: 'INF-211',
    name: 'Server - Dell DL380',
    vendor: 'Dell',
    model: 'DL380 Gen10 Plus',
    type: 'Server',
    status: 'Active',
    site: 'eCity',
    assignedTo: 'Finspot-Domestic',
    purchaseDate: '2026-03-13',
    poNumber: '2516753',
    serial: 'CNX30203GP, CNXD2J001T',
    quantity: 2,
    unitPrice: 230000,
    totalValue: 460000,
    depreciationMethod: 'SLM',
    criticality: 'Critical'
  },
  {
    id: 'INF-212',
    name: '64GB RAM (HP Authenticated)',
    vendor: 'HP',
    model: '64GB RAM',
    type: 'Component',
    status: 'Active',
    site: 'eCity',
    assignedTo: 'Finspot-Domestic',
    purchaseDate: '2026-03-13',
    poNumber: '2516753',
    quantity: 8,
    unitPrice: 72000,
    totalValue: 576000,
    depreciationMethod: 'SLM',
    criticality: 'Medium'
  },
  {
    id: 'INF-213',
    name: 'Intel Gold 6346 Processor',
    vendor: 'Intel',
    model: 'Gold 6346 (16-Core)',
    type: 'Component',
    status: 'Active',
    site: 'eCity',
    assignedTo: 'Finspot-Domestic',
    purchaseDate: '2026-03-13',
    poNumber: '2516753',
    quantity: 2,
    unitPrice: 160000,
    totalValue: 320000,
    depreciationMethod: 'SLM',
    criticality: 'High'
  },
  {
    id: 'INF-214',
    name: 'Micron 3.2TB PRO NVMe U.3 SSD',
    vendor: 'Micron',
    model: '3.2TB PRO NVMe',
    type: 'Storage',
    status: 'Active',
    site: 'eCity',
    assignedTo: 'Finspot-Domestic',
    purchaseDate: '2026-03-13',
    poNumber: '2516753',
    quantity: 8,
    unitPrice: 65000,
    totalValue: 520000,
    depreciationMethod: 'SLM',
    criticality: 'Medium'
  },
  {
    id: 'INF-215',
    name: 'Quad Port 1G NIC',
    vendor: 'Sheeltron',
    model: 'Quad Port 1G NIC',
    type: 'NIC',
    status: 'Active',
    site: 'eCity',
    assignedTo: 'Finspot-Domestic',
    purchaseDate: '2026-03-13',
    poNumber: '2516753',
    quantity: 2,
    unitPrice: 7800,
    totalValue: 15600,
    depreciationMethod: 'SLM',
    criticality: 'Medium'
  },
  // Client Servers from Image
  {
    id: 'INF-301',
    name: 'IndMoney Prod',
    hostname: 'le-indmoney-prod',
    deploymentStatus: 'Production',
    ip: '10.172.0.10',
    type: 'K8s Namespace',
    status: 'Active',
    owner: 'IndMoney',
    criticality: 'Critical'
  },
  {
    id: 'INF-302',
    name: 'PL India Prod',
    hostname: 'le-pl-india-prod',
    deploymentStatus: 'Production',
    ip: '10.40.1.10',
    type: 'K8s Namespace',
    status: 'Active',
    owner: 'PL India',
    criticality: 'Critical'
  },
  {
    id: 'INF-303',
    name: 'Neo Wealth Prod',
    hostname: 'le-neo-wealth-prod',
    deploymentStatus: 'Production',
    ip: '10.40.40.23',
    type: 'K8s Namespace',
    status: 'Active',
    owner: 'Neo Wealth',
    criticality: 'Critical'
  },
  {
    id: 'INF-304',
    name: 'Flattrade Prod',
    hostname: 'le-ftc-prod',
    deploymentStatus: 'Production',
    ip: '202.87.54.194',
    type: 'K8s Namespace',
    status: 'Active',
    owner: 'Flattrade (FTC)',
    criticality: 'Critical'
  },
  {
    id: 'INF-305',
    name: 'Way2Wealth Prod',
    hostname: 'le-w2w-prod',
    deploymentStatus: 'Production',
    ip: '192.168.12.109',
    type: 'K8s Namespace',
    status: 'Active',
    owner: 'Way2Wealth',
    criticality: 'Critical'
  },
  {
    id: 'INF-306',
    name: 'IFSC Prod',
    hostname: 'le-ifsc-prod',
    deploymentStatus: 'Production',
    ip: '10.200.1.18',
    type: 'K8s Namespace',
    status: 'Active',
    owner: 'IFSC (FinSpot)',
    criticality: 'Critical'
  },
  {
    id: 'INF-307',
    name: 'Lemonn Prod',
    hostname: 'le-lemonn-prod',
    deploymentStatus: 'Production',
    ip: '154.210.170.126',
    type: 'K8s Namespace',
    status: 'Active',
    owner: 'Lemonn',
    criticality: 'Critical'
  },
  {
    id: 'INF-308',
    name: 'DX Prod',
    hostname: 'le-dx-prod',
    deploymentStatus: 'Production',
    ip: '206.1.32.216',
    type: 'K8s Namespace',
    status: 'Active',
    owner: 'DX (FinSpot)',
    criticality: 'Critical'
  },
  {
    id: 'INF-309',
    name: 'Mirae Asset Prod',
    hostname: 'le-mirae-prod',
    deploymentStatus: 'Production',
    ip: '192.168.152.156',
    type: 'K8s Namespace',
    status: 'Active',
    owner: 'Mirae Asset',
    criticality: 'Critical'
  },
  {
    id: 'INF-310',
    name: 'SMIFS Prod',
    hostname: 'le-smifs-prod',
    deploymentStatus: 'Production',
    ip: '154.210.175.188',
    type: 'K8s Namespace',
    status: 'Active',
    owner: 'SMIFS',
    criticality: 'Critical'
  },
  {
    id: 'INF-311',
    name: 'VACHANA ISV',
    hostname: 'le-isv-prod',
    deploymentStatus: 'ISV',
    ip: '10.10.0.101',
    type: 'K8s Namespace',
    status: 'Active',
    owner: 'VACHANA',
    criticality: 'High'
  },
  {
    id: 'INF-312',
    name: 'VERTEX ISV',
    hostname: 'le-vertex-prod',
    deploymentStatus: 'ISV',
    ip: '10.10.0.101',
    type: 'K8s Namespace',
    status: 'Active',
    owner: 'VERTEX',
    criticality: 'High'
  },
  {
    id: 'INF-313',
    name: 'BULLSMART ISV',
    hostname: 'le-bullsmart-prod',
    deploymentStatus: 'ISV',
    ip: '10.10.0.101',
    type: 'K8s Namespace',
    status: 'Active',
    owner: 'BULLSMART',
    criticality: 'High'
  },
  {
    id: 'INF-314',
    name: 'SKYCOMMOD ISV',
    hostname: 'le-skycmdt-prod',
    deploymentStatus: 'ISV',
    ip: '10.10.0.101',
    type: 'K8s Namespace',
    status: 'Active',
    owner: 'SKYCOMMOD',
    criticality: 'High'
  },
  {
    id: 'INF-315',
    name: 'AIONION ISV',
    hostname: 'le-aionion-prod',
    deploymentStatus: 'ISV',
    ip: '10.10.0.101',
    type: 'K8s Namespace',
    status: 'Active',
    owner: 'AIONION',
    criticality: 'High'
  },
  {
    id: 'INF-316',
    name: 'FinSpot DR',
    hostname: 'fs-dr-le',
    deploymentStatus: 'DR',
    ip: '10.173.0.10',
    type: 'K8s Namespace',
    status: 'Active',
    owner: 'FinSpot',
    criticality: 'Critical'
  },
  {
    id: 'INF-317',
    name: 'FinSpot DEV',
    hostname: 'fs-le-dev-finspot',
    deploymentStatus: 'Development',
    ip: '172.16.0.56',
    type: 'K8s Namespace',
    status: 'Active',
    owner: 'FinSpot',
    criticality: 'Low'
  },
  {
    id: 'INF-318',
    name: 'FinSpot UAT',
    hostname: 'fs-le-uat',
    deploymentStatus: 'Staging',
    ip: '172.16.0.55',
    type: 'K8s Namespace',
    status: 'Active',
    owner: 'FinSpot',
    criticality: 'Medium'
  }
];

const modelCatalog = [
  { 
    model: 'CX 6300M', 
    vendor: 'Aruba', 
    category: 'Access Switch', 
    features: 'PoE+, Stackable, 10G Uplinks', 
    eol: '2028-12-31', 
    eos: '2030-12-31',
    warranty: 'Lifetime Limited',
    power: 'Max 880W',
    mtbf: '450,000 hrs',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ethernet%20Switch.jpg?width=420',
    sourceUrl: 'https://www.arubanetworks.com/products/switches/access/6300-series/',
  },
  { 
    model: '7050SX3', 
    vendor: 'Arista', 
    category: 'DC Leaf', 
    features: '25G SFP28, Ultra Low Latency', 
    eol: '2027-06-30', 
    eos: '2029-06-30',
    warranty: '1 Year Hardware',
    power: 'Typical 180W',
    mtbf: '380,000 hrs',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Network_switch.jpg?width=420',
    sourceUrl: 'https://www.arista.com/en/products/7050x3-series',
  },
  { 
    model: 'NetEngine AR6000', 
    vendor: 'Huawei', 
    category: 'Enterprise Router', 
    features: 'SD-WAN, High Performance', 
    eol: '2029-01-15', 
    eos: '2031-01-15',
    warranty: '3 Year Standard',
    power: 'Max 350W',
    mtbf: '520,000 hrs',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ethernet%20Switch.jpg?width=420',
    sourceUrl: 'https://support.huawei.com/enterprise/en/doc/EDOC1000013597/88f2e4a/s5720-52x-li-ac',
  },
  { 
    model: 'ProLiant DL380 Gen10', 
    vendor: 'HP', 
    category: 'Rack Server', 
    features: 'Scalable, Secure, Reliable', 
    eol: '2026-11-20', 
    eos: '2028-11-20',
    warranty: '3-3-3 NBD',
    power: '800W Platinum',
    mtbf: '280,000 hrs',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/HP%20ProLiant%20DL360%20and%20two%20DL380.jpg?width=420',
    sourceUrl: 'https://www.hpe.com/us/en/servers/proliant-dl380.html',
  },
  { 
    model: 'PowerEdge R740', 
    vendor: 'Dell', 
    category: 'Rack Server', 
    features: 'High Performance, Storage Rich', 
    eol: '2027-03-15', 
    eos: '2029-03-15',
    warranty: 'ProSupport 24x7',
    power: '750W Titanium',
    mtbf: '310,000 hrs',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Dell%20PowerEdge%20servers.jpg?width=420',
    sourceUrl: 'https://www.dell.com/support/home/en-in/product-support/product/poweredge-r740/overview',
  },
];

const modelVisuals = {
  switch: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ethernet%20Switch.jpg?width=220',
  ciscoSwitch: 'https://commons.wikimedia.org/wiki/Special:FilePath/Network_switch.jpg?width=220',
  firewall: 'https://commons.wikimedia.org/wiki/Special:FilePath/Network_firewall.svg?width=220',
  server: 'https://commons.wikimedia.org/wiki/Special:FilePath/HP%20ProLiant%20DL360%20and%20two%20DL380.jpg?width=220',
  ubuntu: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ubuntu-logo-2022.svg?width=220',
  windows: 'https://commons.wikimedia.org/wiki/Special:FilePath/Windows_logo_-_2021.svg?width=220',
  redhat: 'https://commons.wikimedia.org/wiki/Special:FilePath/Red_Hat_logo.svg?width=220',
  router: 'https://commons.wikimedia.org/wiki/Special:FilePath/Wireless_router.jpg?width=220',
};

function modelImageFor(device: any) {
  const text = `${device.vendor || ''} ${device.model || ''} ${device.type || ''}`.toLowerCase();
  if (text.includes('windows')) return modelVisuals.windows;
  if (text.includes('ubuntu')) return modelVisuals.ubuntu;
  if (text.includes('centos') || text.includes('red hat')) return modelVisuals.redhat;
  if (text.includes('fortinet') || text.includes('fortigate') || text.includes('60f') || text.includes('100f') || text.includes('firewall')) return modelVisuals.firewall;
  if (text.includes('cisco') || text.includes('catalyst')) return modelVisuals.ciscoSwitch;
  if (text.includes('huawei') || text.includes('s5720') || text.includes('switch')) return modelVisuals.switch;
  if (text.includes('router')) return modelVisuals.router;
  if (text.includes('server') || text.includes('vm')) return modelVisuals.server;
  return modelVisuals.switch;
}

const partsInventory = [
  { part: 'PSU-800W-AC', vendor: 'HP', compatible: 'ProLiant DL380', stock: 12, status: 'In Stock' },
  { part: 'SFP-10G-SR', vendor: 'Cisco', compatible: 'Catalyst 9k, Nexus', stock: 45, status: 'In Stock' },
  { part: 'FAN-MOD-7050', vendor: 'Arista', compatible: '7050SX Series', stock: 5, status: 'Low Stock' },
  { part: 'MEM-32GB-DDR4', vendor: 'Dell', compatible: 'PowerEdge R740', stock: 24, status: 'In Stock' },
];

const connections = [
  { id: 'c1', fromId: 'INF-101', toId: 'INF-102', type: 'Network', fromPort: 'Gi1/0/1', toPort: 'Gi0/1', speed: '10G', status: 'Up' },
  { id: 'c2', fromId: 'INF-101', toId: 'INF-103', type: 'Network', fromPort: 'Gi1/0/2', toPort: 'Gi0/48', speed: '1G', status: 'Up' },
  { id: 'c3', fromId: 'INF-101', toId: 'INF-104', type: 'Network', fromPort: 'Gi1/0/3', toPort: 'Eth1/1', speed: '25G', status: 'Up' },
  { id: 'c4', fromId: 'INF-101', toId: 'INF-108', type: 'Network', fromPort: 'Gi1/0/4', toPort: 'Port1', speed: '1G', status: 'Up' },
  { id: 'c5', fromId: 'INF-106', toId: 'INF-103', type: 'Network', fromPort: 'NIC1', toPort: 'Gi0/10', speed: '1G', status: 'Up' },
  { id: 'c6', fromId: 'INF-107', toId: 'INF-104', type: 'Network', fromPort: 'NIC1', toPort: 'Eth1/10', speed: '10G', status: 'Up' },
  { id: 'c7', fromId: 'INF-101', toId: 'PDU-A1', type: 'Power', fromPort: 'PSU1', toPort: 'Outlet 1', load: '0.5A', status: 'Active' },
  { id: 'c8', fromId: 'INF-101', toId: 'PDU-A1', type: 'Power', fromPort: 'PSU2', toPort: 'Outlet 2', load: '0.4A', status: 'Active' },
  { id: 'c9', fromId: 'INF-102', toId: 'PDU-A1', type: 'Power', fromPort: 'PSU1', toPort: 'Outlet 3', load: '0.8A', status: 'Active' },
  { id: 'c10', fromId: 'INF-106', toId: 'PDU-B2', type: 'Power', fromPort: 'PSU1', toPort: 'Outlet 5', load: '1.2A', status: 'Active' },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'Switch': return <Network className="w-3.5 h-3.5 mr-1.5 text-[#C8622E]" />;
    case 'Router': return <Globe className="w-3.5 h-3.5 mr-1.5 text-[#D97706]" />;
    case 'Server': return <Server className="w-3.5 h-3.5 mr-1.5 text-green-500" />;
    case 'Firewall': return <Shield className="w-3.5 h-3.5 mr-1.5 text-red-500" />;
    case 'Access Point': return <Zap className="w-3.5 h-3.5 mr-1.5 text-yellow-500" />;
    case 'Storage': return <HardDrive className="w-3.5 h-3.5 mr-1.5 text-orange-500" />;
    case 'Load Balancer': return <Layers className="w-3.5 h-3.5 mr-1.5 text-[#7C3AED]" />;
    default: return <Activity className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />;
  }
};

import { useClient } from '../components/ClientProvider';

export function Infrastructure() {
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [isDeviceDetailsOpen, setIsDeviceDetailsOpen] = useState(false);
  const [newType, setNewType] = useState('Switch');
  const [newOwner, setNewOwner] = useState('');
  const [newSite, setNewSite] = useState('');
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleNormalize = async () => {
    if (!selectedDevice) return;
    setIsNormalizing(true);
    try {
      const prompt = `Normalize the following device data into a consistent format. 
      Return the result as a JSON object matching the existing device structure.
      Device Data: ${JSON.stringify(selectedDevice)}
      
      Ensure fields like 'vendor', 'model', 'type', 'cpuModel', 'ramModel', 'diskModel' are standardized.
      Standardize units for 'totalRam', 'totalDisk', 'psuCapacity'.
      Standardize 'deploymentStatus' to one of: 'Production', 'Staging', 'Development', 'Retired'.
      Standardize 'criticality' to one of: 'Critical', 'High', 'Medium', 'Low'.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              vendor: { type: Type.STRING },
              model: { type: Type.STRING },
              type: { type: Type.STRING },
              cpuModel: { type: Type.STRING },
              ramModel: { type: Type.STRING },
              diskModel: { type: Type.STRING },
              totalRam: { type: Type.STRING },
              totalDisk: { type: Type.STRING },
              psuCapacity: { type: Type.STRING },
              deploymentStatus: { type: Type.STRING },
              criticality: { type: Type.STRING },
              os: { type: Type.STRING },
              firmware: { type: Type.STRING }
            }
          }
        }
      });

      const normalizedData = JSON.parse(response.text);
      await infrastructureApi.update(selectedDevice.id, normalizedData);
      setDevices(prev => prev.map(d => d.id === selectedDevice.id ? { ...d, ...normalizedData } : d));
      alert("Device data normalized successfully!");
    } catch (error) {
      console.error("Error normalizing device data:", error);
      alert("Failed to normalize device data.");
    } finally {
      setIsNormalizing(false);
    }
  };
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [pageTab, setPageTab] = useState('inventory');
  const [documents, setDocuments] = useState<any[]>([]);
  const [dependencyFilter, setDependencyFilter] = useState('All');
  const [groupBy, setGroupBy] = useState<string>('None');
  const [secondaryGroupBy, setSecondaryGroupBy] = useState<string>('None');
  const [filters, setFilters] = useState({
    type: 'All',
    vendor: 'All',
    site: 'All',
    status: 'All',
    criticality: 'All',
    owner: 'All'
  });
  const navigate = useNavigate();
  const { selectedClientId } = useClient();

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    infrastructureApi.list(selectedClientId ? { clientId: selectedClientId } : {})
      .then(setDevices)
      .catch(console.error);
  }, [selectedClientId]);

  useEffect(() => {
    if (selectedDeviceId) {
      infrastructureApi.listDocuments(selectedDeviceId).then(setDocuments).catch(console.error);
    } else {
      setDocuments([]);
    }
  }, [selectedDeviceId]);

  const statusCounts = devices.reduce((acc, device) => {
    acc[device.status] = (acc[device.status] || 0) + 1;
    return acc;
  }, { Active: 0, Warning: 0, Offline: 0 } as Record<string, number>);

  const uniqueTypes = Array.from(new Set(['All', 'Switch', 'Router', 'Server', 'Firewall', 'Storage', 'Power', 'Patch Panel', ...devices.map(d => d.type)]));
  const uniqueVendors = ['All', ...new Set(devices.map(d => d.vendor))];
  const uniqueSites = ['All', ...new Set(devices.map(d => d.site))];
  const uniqueStatuses = ['All', ...new Set(devices.map(d => d.status))];
  const uniqueCriticalities = ['All', 'Critical', 'High', 'Medium', 'Low'];
  const uniqueOwners = ['All', ...new Set(devices.map(d => d.owner))];

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filters.type === 'All' || device.type === filters.type;
    const matchesVendor = filters.vendor === 'All' || device.vendor === filters.vendor;
    const matchesSite = filters.site === 'All' || device.site === filters.site;
    const matchesStatus = filters.status === 'All' || device.status === filters.status;
    const matchesCriticality = filters.criticality === 'All' || device.criticality === filters.criticality;
    const matchesOwner = filters.owner === 'All' || device.owner === filters.owner;

    return matchesSearch && matchesType && matchesVendor && matchesSite && matchesStatus && matchesCriticality && matchesOwner;
  });

  const selectedDevice = devices.find(d => d.id === selectedDeviceId);
  const deviceModelInfo = modelCatalog.find(m => m.model === selectedDevice?.model);

  const { dependencyNodes, dependencyEdges } = useMemo(() => {
    if (!selectedDevice) return { dependencyNodes: [], dependencyEdges: [] };

    const filteredConnections = connections.filter(c => 
      (c.fromId === selectedDevice.id || c.toId === selectedDevice.id) &&
      (dependencyFilter === 'All' || c.type === dependencyFilter)
    );

    const nodes: any[] = [];
    const edges: any[] = [];
    const addedNodeIds = new Set<string>();

    // Add selected device node
    nodes.push({
      id: selectedDevice.id,
      type: 'device',
      position: { x: 400, y: 200 },
      data: { 
        label: selectedDevice.name, 
        model: selectedDevice.model, 
        status: selectedDevice.status, 
        ip: selectedDevice.ip,
        cpu: selectedDevice.cpu,
        memory: selectedDevice.memory,
        icon: selectedDevice.type === 'Switch' ? Network : (selectedDevice.type === 'Server' ? Server : Globe),
        onClick: () => {
          setSelectedDeviceId(selectedDevice.id);
          setIsDeviceDetailsOpen(true);
        }
      }
    });
    addedNodeIds.add(selectedDevice.id);

    let upstreamCount = 0;
    let downstreamCount = 0;

    filteredConnections.forEach((conn) => {
      const isUpstream = conn.toId === selectedDevice.id;
      const otherId = isUpstream ? conn.fromId : conn.toId;
      const otherDevice = devices.find(d => d.id === otherId) || { id: otherId, name: otherId, model: 'Unknown', status: 'Unknown', ip: 'Unknown', type: 'Unknown' };

      if (!addedNodeIds.has(otherId)) {
        nodes.push({
          id: otherId,
          type: 'device',
          position: { 
            x: isUpstream ? 200 + (upstreamCount * 200) : 200 + (downstreamCount * 200), 
            y: isUpstream ? 50 : 350 
          },
          data: { 
            label: otherDevice.name, 
            model: otherDevice.model, 
            status: otherDevice.status, 
            ip: otherDevice.ip,
            cpu: otherDevice.cpu,
            memory: otherDevice.memory,
            icon: otherDevice.type === 'Switch' ? Network : (otherDevice.type === 'Server' ? Server : Globe),
            onClick: () => {
              setSelectedDeviceId(otherDevice.id);
              setIsDeviceDetailsOpen(true);
            }
          }
        });
        addedNodeIds.add(otherId);
        if (isUpstream) upstreamCount++;
        else downstreamCount++;
      }

      edges.push({
        id: conn.id,
        source: conn.fromId,
        target: conn.toId,
        animated: conn.status === 'Active' || conn.status === 'Up',
        label: conn.type,
        style: { stroke: conn.type === 'Network' ? '#3b82f6' : (conn.type === 'Power' ? '#eab308' : '#a855f7'), strokeWidth: 2 }
      });
    });

    return { dependencyNodes: nodes, dependencyEdges: edges };
  }, [selectedDevice, connections, dependencyFilter, devices]);

  // Grouping logic
  const getGroupedDevices = () => {
    if (groupBy === 'None') return { 'All Devices': filteredDevices };

    const groups: Record<string, any> = {};
    
    filteredDevices.forEach(device => {
      const primaryKey = (device as any)[groupBy.toLowerCase()] || 'Unknown';
      
      if (!groups[primaryKey]) {
        groups[primaryKey] = secondaryGroupBy === 'None' ? [] : {};
      }

      if (secondaryGroupBy === 'None') {
        groups[primaryKey].push(device);
      } else {
        const secondaryKey = (device as any)[secondaryGroupBy.toLowerCase()] || 'Unknown';
        if (!groups[primaryKey][secondaryKey]) {
          groups[primaryKey][secondaryKey] = [];
        }
        groups[primaryKey][secondaryKey].push(device);
      }
    });

    return groups;
  };

  const groupedDevices = getGroupedDevices();

  const calculateHealthScore = (device: any) => {
    if (device.status === 'Offline') return 0;
    
    let score = 100;
    
    // CPU penalty
    const cpuVal = parseInt(device.cpu);
    if (cpuVal > 60) score -= (cpuVal - 60) * 0.5;
    
    // Memory penalty
    const memVal = parseInt(device.memory);
    if (memVal > 70) score -= (memVal - 70) * 1;
    
    // Temp penalty
    const tempVal = parseInt(device.temp);
    if (tempVal > 50) score -= (tempVal - 50) * 2;
    
    // Status penalty
    if (device.status === 'Warning') score -= 20;
    
    return Math.max(0, Math.round(score));
  };

  const getHealthBadgeVariant = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'destructive';
  };

  const handleBulkUpdate = async () => {
    const updates: any = {};
    if (newType) updates.type = newType;
    if (newOwner) updates.owner = newOwner;
    if (newSite) updates.site = newSite;
    
    if (Object.keys(updates).length === 0) return;

    try {
      await Promise.all(selectedDeviceIds.map(id => infrastructureApi.update(id, updates)));
      setDevices(prev => prev.map(d => selectedDeviceIds.includes(d.id) ? { ...d, ...updates } : d));
      setSelectedDeviceIds([]);
      setIsBulkEditOpen(false);
      setNewOwner('');
      setNewSite('');
    } catch (error) {
      console.error("Error updating devices:", error);
    }
  };

  const toggleSelectAll = () => {
    if (selectedDeviceIds.length === filteredDevices.length) {
      setSelectedDeviceIds([]);
    } else {
      setSelectedDeviceIds(filteredDevices.map(d => d.id));
    }
  };

  const toggleSelectDevice = (id: string) => {
    setSelectedDeviceIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      if (lines.length < 2) return;
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const headerMapping: Record<string, string> = {
        'sl.no': 'id',
        'asset description': 'name',
        'category': 'type',
        'location': 'site',
        'used by': 'assignedTo',
        'make': 'vendor',
        'model': 'model',
        'serial number': 'serial',
        'date of purchase': 'purchaseDate',
        'vendor': 'vendor',
        'invoice no.': 'poNumber',
        'qty': 'quantity',
        'price per unit': 'unitPrice',
        'value': 'totalValue',
        'useful life in years': 'usefulLife',
        'residual value': 'residualValue',
        'depreciation method': 'depreciationMethod',
        'depreciation for the year': 'depreciationYear',
        'accumulated depreciation': 'accumulatedDepreciation',
        'net book value': 'netBookValue'
      };

      const newDevices = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim());
        const device: any = {
          status: 'Active',
          owner: 'Network Engineering',
          criticality: 'Medium',
          site: 'DC-A',
          rack: 'R-01',
          uPosition: '1U',
          uptime: '0 days',
          cpu: '0%',
          memory: '0%',
          temp: '25°C',
          lastBackup: new Date().toISOString().split('T')[0]
        };
        
        headers.forEach((header, index) => {
          if (values[index]) {
            const mappedKey = headerMapping[header] || header;
            device[mappedKey] = values[index];
          }
        });
        
        // Ensure ID if missing
        if (!device.id) device.id = `INF-${Math.floor(1000 + Math.random() * 9000)}`;
        return device;
      });

      try {
        await Promise.all(newDevices.map(device => infrastructureApi.create(device)));
        infrastructureApi.list(selectedClientId ? { clientId: selectedClientId } : {}).then(setDevices).catch(console.error);
        alert(`Successfully imported ${newDevices.length} devices.`);
      } catch (error) {
        console.error("Error importing devices:", error);
        alert("Failed to import devices. Please check the CSV format.");
      }
      // Reset input
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleDownloadReport = () => {
    const headers = [
      'ID', 'Name', 'Vendor', 'Model', 'Type', 'Status', 'Site', 'Datacenter', 'Rack', 'UPosition', 
      'Hostname', 'IP', 'ILO IP', 'Serial', 'Criticality', 'Owner', 'Belongs To', 'Assigned To',
      'OS', 'CPU Model', 'Total CPU', 'RAM Model', 'Total RAM', 'Disk Model', 'Total Disk',
      'Power Supplies', 'PSU Capacity', 'PO Number', 'Deployment Status', 'Warranty Expiry', 'License Info',
      'Quantity', 'Unit Price', 'Total Value', 'Depreciation Method', 'Useful Life', 'Residual Value'
    ];
    const csvContent = [
      headers.join(','),
      ...filteredDevices.map(d => [
        d.id,
        `"${d.name}"`,
        `"${d.vendor || ''}"`,
        `"${d.model || ''}"`,
        d.type,
        d.status,
        `"${d.site || ''}"`,
        `"${d.datacenter || ''}"`,
        `"${d.rack || ''}"`,
        `"${d.uPosition || ''}"`,
        `"${d.hostname || ''}"`,
        d.ip || '',
        d.iloIp || '',
        d.serial || '',
        d.criticality || '',
        `"${d.owner || ''}"`,
        `"${d.belongsTo || ''}"`,
        `"${d.assignedTo || ''}"`,
        `"${d.os || ''}"`,
        `"${d.cpuModel || ''}"`,
        `"${d.totalCpu || ''}"`,
        `"${d.ramModel || ''}"`,
        `"${d.totalRam || ''}"`,
        `"${d.diskModel || ''}"`,
        `"${d.totalDisk || ''}"`,
        d.powerSupplies || '',
        `"${d.psuCapacity || ''}"`,
        `"${d.poNumber || ''}"`,
        `"${d.deploymentStatus || ''}"`,
        d.warrantyExpiry || '',
        `"${d.licenseInfo || ''}"`,
        d.quantity || 1,
        d.unitPrice || '',
        d.totalValue || '',
        d.depreciationMethod || 'SLM',
        `"${d.usefulLife || '5 Years'}"`,
        d.residualValue || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'infrastructure_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 relative">
      <FeatureHero
        eyebrow="Network · Infrastructure"
        title="Infrastructure Inventory"
        description="Multi-vendor on-premise device management, monitoring, templates, topology links, and lifecycle reporting."
        icon={Network}
        stats={[
          { label: 'Devices', value: devices.length, icon: Server },
          { label: 'Selected', value: selectedDeviceIds.length, icon: CheckCircle2 },
          { label: 'Warnings', value: devices.filter(d => d.status === 'Warning').length, icon: AlertTriangle },
        ]}
        actions={
          <>
          {selectedDeviceIds.length > 0 && (
            <Button 
              variant="outline" 
              className="flex-1 sm:flex-none border-[#E8C4AA] bg-[#FAE8DC] text-[#C8622E] hover:bg-[#F5D5BE]"
              onClick={() => setIsBulkEditOpen(true)}
            >
              Bulk Edit Type ({selectedDeviceIds.length})
            </Button>
          )}
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => navigate('/topology')}>
            <Layers className="w-4 h-4 mr-2" />
            Topology
          </Button>
          <div className="relative flex-1 sm:flex-none">
            <input
              type="file"
              accept=".csv"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileUpload}
              title="Import devices from CSV"
            />
            <Button variant="outline" className="w-full">
              <FileUp className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
          </div>
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={handleDownloadReport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button className="flex-1 sm:flex-none" onClick={() => setIsAddDeviceOpen(true)}>Add Device</Button>
          </>
        }
      />

      <Tabs className="w-full">
        <TabsList>
          <TabsTrigger active={pageTab === 'inventory'} onClick={() => setPageTab('inventory')}>Inventory</TabsTrigger>
          <TabsTrigger active={pageTab === 'templates'} onClick={() => setPageTab('templates')}>Templates</TabsTrigger>
        </TabsList>
        <TabsContent className={pageTab === 'inventory' ? 'block space-y-6' : 'hidden'}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 border-l-4 border-l-[#C8622E]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Network Switches</p>
              <p className="text-2xl font-bold">{devices.filter(d => d.type === 'Switch' || d.type === 'Router').length}</p>
              <p className="text-[10px] text-muted-foreground">Cisco, Aruba, Arista, Huawei</p>
            </div>
            <Network className="w-8 h-8 text-[#E8C4AA]" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Enterprise Servers</p>
              <p className="text-2xl font-bold">{devices.filter(d => d.type === 'Server' || d.type === 'VM').length}</p>
              <p className="text-[10px] text-muted-foreground">HP ProLiant, Dell PowerEdge</p>
            </div>
            <Server className="w-8 h-8 text-green-100" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Security & Firewalls</p>
              <p className="text-2xl font-bold">{devices.filter(d => d.type === 'Firewall').length}</p>
              <p className="text-[10px] text-muted-foreground">Fortinet, Cisco, Palo Alto</p>
            </div>
            <Shield className="w-8 h-8 text-red-100" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-[#7C3AED]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Storage & Other</p>
              <p className="text-2xl font-bold">{devices.filter(d => d.type === 'Storage' || d.type === 'Power' || d.type === 'Device').length}</p>
              <p className="text-[10px] text-muted-foreground">PSUs, Fans, SFPs, Memory</p>
            </div>
            <Cpu className="w-8 h-8 text-[#D8C6F0]" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-orange-500">
          <div className="flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs text-muted-foreground font-medium">Device Status Overview</p>
              <Badge variant="outline" className="text-[9px] h-4 px-1 font-mono">
                Total: {devices.length}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col items-center">
                <CheckCircle2 className="w-4 h-4 text-green-500 mb-1" />
                <span className="text-sm font-bold">{statusCounts.Active}</span>
                <span className="text-[8px] text-muted-foreground uppercase">Active</span>
              </div>
              <div className="flex flex-col items-center">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mb-1" />
                <span className="text-sm font-bold">{statusCounts.Warning}</span>
                <span className="text-[8px] text-muted-foreground uppercase">Warning</span>
              </div>
              <div className="flex flex-col items-center">
                <XCircle className="w-4 h-4 text-red-500 mb-1" />
                <span className="text-sm font-bold">{statusCounts.Offline}</span>
                <span className="text-[8px] text-muted-foreground uppercase">Offline</span>
              </div>
            </div>

            <div className="mt-3 h-1.5 w-full flex rounded-full overflow-hidden bg-muted">
              <div 
                className="h-full bg-green-500" 
                style={{ width: `${(statusCounts.Active / devices.length) * 100}%` }} 
              />
              <div 
                className="h-full bg-yellow-500" 
                style={{ width: `${(statusCounts.Warning / devices.length) * 100}%` }} 
              />
              <div 
                className="h-full bg-red-500" 
                style={{ width: `${(statusCounts.Offline / devices.length) * 100}%` }} 
              />
            </div>

            <p className="text-[8px] text-muted-foreground mt-2 text-right italic">
              Auto-refreshing: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Table */}
        <Card className="lg:col-span-2 overflow-hidden border-[#eadfce] bg-white shadow-[0_20px_80px_-45px_rgba(67,48,31,0.45)]">
          <CardHeader className="border-b border-[#f0e5d8] bg-[#fffaf3] pb-5">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#1f1a13] text-white">
                      <Server className="h-4 w-4" />
                    </span>
                    On-Premise Devices
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Showing {filteredDevices.length} of {devices.length} devices across vendors, sites, owners, and status states.
                  </CardDescription>
                </div>
                <div className="relative w-full xl:w-[360px]">
                  <Search className="w-4 h-4 absolute left-4 top-3.5 text-[#9a8066]" />
                  <input 
                    type="text" 
                    placeholder="Search infrastructure..." 
                    className="w-full rounded-2xl border border-[#e8dccd] bg-white py-3 pl-11 pr-4 text-sm outline-none shadow-inner placeholder:text-[#b0a090]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a8066]">Type</label>
                  <Select value={filters.type} onValueChange={(val) => setFilters(prev => ({ ...prev, type: val }))} className="h-9 rounded-xl border-[#e8dccd] bg-white text-xs">
                    <SelectValue placeholder="Select Type" />
                    {uniqueTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a8066]">Vendor</label>
                  <Select value={filters.vendor} onValueChange={(val) => setFilters(prev => ({ ...prev, vendor: val }))} className="h-9 rounded-xl border-[#e8dccd] bg-white text-xs">
                    <SelectValue placeholder="Select Vendor" />
                    {uniqueVendors.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a8066]">Site</label>
                  <Select value={filters.site} onValueChange={(val) => setFilters(prev => ({ ...prev, site: val }))} className="h-9 rounded-xl border-[#e8dccd] bg-white text-xs">
                    <SelectValue placeholder="Select Site" />
                    {uniqueSites.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a8066]">Status</label>
                  <Select value={filters.status} onValueChange={(val) => setFilters(prev => ({ ...prev, status: val }))} className="h-9 rounded-xl border-[#e8dccd] bg-white text-xs">
                    <SelectValue placeholder="Select Status" />
                    {uniqueStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a8066]">Criticality</label>
                  <Select value={filters.criticality} onValueChange={(val) => setFilters(prev => ({ ...prev, criticality: val }))} className="h-9 rounded-xl border-[#e8dccd] bg-white text-xs">
                    <SelectValue placeholder="Select Criticality" />
                    {uniqueCriticalities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a8066]">Owner</label>
                  <Select value={filters.owner} onValueChange={(val) => setFilters(prev => ({ ...prev, owner: val }))} className="h-9 rounded-xl border-[#e8dccd] bg-white text-xs">
                    <SelectValue placeholder="Select Owner" />
                    {uniqueOwners.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </Select>
                </div>
              </div>

              {(filters.type !== 'All' || filters.vendor !== 'All' || filters.site !== 'All' || filters.status !== 'All' || filters.criticality !== 'All' || filters.owner !== 'All' || searchTerm !== '') && (
                <div className="flex items-center justify-between pt-3 border-t border-[#eadfce]">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(filters).map(([key, value]) => value !== 'All' && (
                      <Badge key={key} variant="outline" className="text-[10px] py-0 h-6 flex items-center gap-1 border-[#eadfce] bg-white text-[#5f5347]">
                        <span className="capitalize text-muted-foreground">{key}:</span> {value}
                        <X 
                          className="w-2.5 h-2.5 cursor-pointer hover:text-red-500" 
                          onClick={() => setFilters(prev => ({ ...prev, [key]: 'All' }))}
                        />
                      </Badge>
                    ))}
                    {searchTerm && (
                      <Badge variant="outline" className="text-[10px] py-0 h-6 flex items-center gap-1 border-[#eadfce] bg-white text-[#5f5347]">
                        <span className="text-muted-foreground">Search:</span> {searchTerm}
                        <X 
                          className="w-2.5 h-2.5 cursor-pointer hover:text-red-500" 
                          onClick={() => setSearchTerm('')}
                        />
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-[10px] text-muted-foreground hover:text-red-500"
                    onClick={() => {
                      setFilters({
                        type: 'All',
                        vendor: 'All',
                        site: 'All',
                        status: 'All',
                        criticality: 'All',
                        owner: 'All'
                      });
                      setSearchTerm('');
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#eadfce]">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a8066]">Group By</label>
                  <select 
                    className="w-full rounded-xl border border-[#e8dccd] bg-white px-3 py-2 text-xs outline-none"
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                  >
                    <option value="None">None</option>
                    <option value="Site">Site</option>
                    <option value="Type">Type</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Status">Status</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a8066]">Then By</label>
                  <select 
                    className="w-full rounded-xl border border-[#e8dccd] bg-white px-3 py-2 text-xs outline-none disabled:opacity-50"
                    value={secondaryGroupBy}
                    onChange={(e) => setSecondaryGroupBy(e.target.value)}
                    disabled={groupBy === 'None'}
                  >
                    <option value="None">None</option>
                    <option value="Site">Site</option>
                    <option value="Type">Type</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Status">Status</option>
                  </select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white">
                  <TableHead className="w-[40px]">
                    <Checkbox 
                      id="select-all"
                      checked={selectedDeviceIds.length === filteredDevices.length && filteredDevices.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="min-w-[220px]">Hostname</TableHead>
                  <TableHead className="hidden md:table-cell">Serial Number</TableHead>
                  <TableHead className="min-w-[120px]">Vendor</TableHead>
                  <TableHead className="min-w-[180px]">Model</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Backup</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedDevices).map(([primaryKey, primaryValue]) => {
                  if (Array.isArray(primaryValue)) {
                    // Single level grouping or no grouping
                    return (
                      <React.Fragment key={primaryKey}>
                        {groupBy !== 'None' && (
                          <TableRow className="bg-[#fff5ec] hover:bg-[#fff5ec]">
                            <TableCell colSpan={11} className="py-3 px-5 font-bold text-xs uppercase tracking-[0.16em] text-[#9a4f25]">
                              {primaryKey} ({primaryValue.length})
                            </TableCell>
                          </TableRow>
                        )}
                        {primaryValue.map((device) => (
                          <TableRow 
                            key={device.id} 
                            className={cn(
                              "cursor-pointer transition-colors hover:bg-[#fffaf3]",
                              selectedDeviceIds.includes(device.id) && "bg-[#fff5ec]"
                            )}
                            onClick={() => {
                              setSelectedDeviceId(device.id);
                              setIsDeviceDetailsOpen(true);
                            }}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox 
                                id={`select-${device.id}`}
                                checked={selectedDeviceIds.includes(device.id)}
                                onCheckedChange={() => toggleSelectDevice(device.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#1f1a13] text-white">
                                  {getTypeIcon(device.type)}
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate font-semibold text-[#1f1a13]">{device.name}</div>
                                  <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{device.ip || 'No management IP'}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell font-mono text-xs">{device.serial}</TableCell>
                            <TableCell className="text-sm font-medium text-[#5f5347]">{device.vendor || 'Unknown'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-11 w-14 shrink-0 overflow-hidden rounded-xl border border-[#eadfce] bg-[#fffaf3]">
                                  <img
                                    src={modelImageFor(device)}
                                    alt={`${device.model || device.type || 'Device'} visual`}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                    onError={(event) => { event.currentTarget.style.display = 'none'; }}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium text-[#1f1a13]">{device.model || 'Unknown'}</div>
                                  <div className="truncate text-[11px] text-muted-foreground">{device.vendor || 'Unknown vendor'}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="inline-flex items-center rounded-full bg-[#fff5ec] px-3 py-1 text-xs font-semibold text-[#9f4f25] ring-1 ring-[#eadfce]">
                                {getTypeIcon(device.type)}
                                {device.type}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-[#5f5347]">{device.site || '—'}</TableCell>
                            <TableCell className="hidden lg:table-cell text-xs font-mono text-muted-foreground">{device.lastBackup}</TableCell>
                            <TableCell>
                              <Badge variant={getHealthBadgeVariant(calculateHealthScore(device))} className="font-mono text-[10px]">
                                {calculateHealthScore(device)}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                device.status === 'Active' ? 'success' : 
                                device.status === 'Warning' ? 'warning' : 'destructive'
                              }>
                                {device.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right relative">
                              <div className="flex items-center justify-end space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-xs text-[#C8622E] hover:text-[#A84E24] hover:bg-[#FAE8DC]"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDeviceId(device.id);
                                  }}
                                >
                                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                                  Details
                                </Button>
                                
                                <div className="relative">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(activeMenuId === device.id ? null : device.id);
                                    }}
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                  
                                  {activeMenuId === device.id && (
                                    <div className="absolute right-0 mt-2 w-48 bg-card border rounded-md shadow-lg z-50 py-1 text-left">
                                      <button 
                                        className="w-full px-4 py-2 text-xs hover:bg-muted flex items-center"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedDeviceId(device.id);
                                          setActiveMenuId(null);
                                        }}
                                      >
                                        <Info className="w-3.5 h-3.5 mr-2" />
                                        View Details
                                      </button>
                                      <button 
                                        className="w-full px-4 py-2 text-xs hover:bg-muted flex items-center"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // Mock edit functionality
                                          console.log('Edit Device:', device.id);
                                          setActiveMenuId(null);
                                        }}
                                      >
                                        <RefreshCw className="w-3.5 h-3.5 mr-2" />
                                        Edit Device
                                      </button>
                                      <button 
                                        className="w-full px-4 py-2 text-xs hover:bg-[#FAE8DC] flex items-center text-[#C8622E]"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // Mock connectivity check
                                          console.log('Check Connectivity:', device.id);
                                          setActiveMenuId(null);
                                        }}
                                      >
                                        <Activity className="w-3.5 h-3.5 mr-2" />
                                        Check Connectivity
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    );
                  } else {
                    // Two level grouping
                    return (
                      <React.Fragment key={primaryKey}>
                        <TableRow className="bg-[#fff5ec] hover:bg-[#fff5ec]">
                          <TableCell colSpan={11} className="py-3 px-5 font-bold text-xs uppercase tracking-[0.16em] text-[#9a4f25]">
                            {primaryKey}
                          </TableCell>
                        </TableRow>
                        {Object.entries(primaryValue).map(([secondaryKey, secondaryValue]: [string, any]) => (
                          <React.Fragment key={secondaryKey}>
                            <TableRow className="bg-[#fffaf3] hover:bg-[#fffaf3]">
                              <TableCell colSpan={11} className="py-2 px-8 font-semibold text-xs uppercase tracking-[0.14em] text-[#9a8066]">
                                {secondaryKey} ({secondaryValue.length})
                              </TableCell>
                            </TableRow>
                            {secondaryValue.map((device: any) => (
                              <TableRow 
                                key={device.id} 
                                className={cn(
                                  "cursor-pointer transition-colors hover:bg-[#fffaf3]",
                                  selectedDeviceIds.includes(device.id) && "bg-[#fff5ec]"
                                )}
                                onClick={() => {
                                  setSelectedDeviceId(device.id);
                                  setIsDeviceDetailsOpen(true);
                                }}
                              >
                                <TableCell onClick={(e) => e.stopPropagation()} className="pl-8">
                                  <Checkbox 
                                    id={`select-grouped-${device.id}`}
                                    checked={selectedDeviceIds.includes(device.id)}
                                    onCheckedChange={() => toggleSelectDevice(device.id)}
                                  />
                                </TableCell>
                                <TableCell className="pl-12">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#1f1a13] text-white">
                                      {getTypeIcon(device.type)}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="truncate font-semibold text-[#1f1a13]">{device.name}</div>
                                      <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{device.ip || 'No management IP'}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell font-mono text-xs">{device.serial}</TableCell>
                                <TableCell className="text-sm font-medium text-[#5f5347]">{device.vendor || 'Unknown'}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="h-11 w-14 shrink-0 overflow-hidden rounded-xl border border-[#eadfce] bg-[#fffaf3]">
                                      <img
                                        src={modelImageFor(device)}
                                        alt={`${device.model || device.type || 'Device'} visual`}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                        onError={(event) => { event.currentTarget.style.display = 'none'; }}
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="truncate text-sm font-medium text-[#1f1a13]">{device.model || 'Unknown'}</div>
                                      <div className="truncate text-[11px] text-muted-foreground">{device.vendor || 'Unknown vendor'}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm">
                                  <div className="inline-flex items-center rounded-full bg-[#fff5ec] px-3 py-1 text-xs font-semibold text-[#9f4f25] ring-1 ring-[#eadfce]">
                                    {getTypeIcon(device.type)}
                                    {device.type}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-[#5f5347]">{device.site || '—'}</TableCell>
                                <TableCell className="hidden lg:table-cell text-xs font-mono text-muted-foreground">{device.lastBackup}</TableCell>
                                <TableCell>
                                  <Badge variant={getHealthBadgeVariant(calculateHealthScore(device))} className="font-mono text-[10px]">
                                    {calculateHealthScore(device)}%
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={
                                    device.status === 'Active' ? 'success' : 
                                    device.status === 'Warning' ? 'warning' : 'destructive'
                                  }>
                                    {device.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right relative">
                                  <div className="flex items-center justify-end space-x-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-xs text-[#C8622E] hover:text-[#A84E24] hover:bg-[#FAE8DC]"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedDeviceId(device.id);
                                      }}
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                                      Details
                                    </Button>
                                    
                                    <div className="relative">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 w-8 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveMenuId(activeMenuId === device.id ? null : device.id);
                                        }}
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                      
                                      {activeMenuId === device.id && (
                                        <div className="absolute right-0 mt-2 w-48 bg-card border rounded-md shadow-lg z-50 py-1 text-left">
                                          <button 
                                            className="w-full px-4 py-2 text-xs hover:bg-muted flex items-center"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedDeviceId(device.id);
                                              setActiveMenuId(null);
                                            }}
                                          >
                                            <Info className="w-3.5 h-3.5 mr-2" />
                                            View Details
                                          </button>
                                          <button 
                                            className="w-full px-4 py-2 text-xs hover:bg-muted flex items-center"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // Mock edit functionality
                                              console.log('Edit Device:', device.id);
                                              setActiveMenuId(null);
                                            }}
                                          >
                                            <RefreshCw className="w-3.5 h-3.5 mr-2" />
                                            Edit Device
                                          </button>
                                          <button 
                                            className="w-full px-4 py-2 text-xs hover:bg-[#FAE8DC] flex items-center text-[#C8622E]"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // Mock connectivity check
                                              console.log('Check Connectivity:', device.id);
                                              setActiveMenuId(null);
                                            }}
                                          >
                                            <Activity className="w-3.5 h-3.5 mr-2" />
                                            Check Connectivity
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    );
                  }
                })}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        {/* Model Catalog & Parts */}
        <div className="space-y-6">
          <Card className="overflow-hidden border-[#eadfce] bg-white shadow-[0_20px_80px_-45px_rgba(67,48,31,0.35)]">
            <CardHeader className="border-b border-[#f0e5d8] bg-[#1f1a13] text-white">
              <CardTitle className="text-lg flex items-center">
                <span className="mr-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-[#f1c27d]">
                  <Info className="w-4 h-4" />
                </span>
                Model Catalog
              </CardTitle>
              <CardDescription className="text-[#d8cbbd]">Standardized hardware profiles and lifecycle references.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 bg-[#fffaf3] p-4">
              {modelCatalog.map((item, idx) => {
                const associatedParts = partsInventory.filter(p => 
                  item.model.includes(p.compatible) || p.compatible.includes(item.model)
                );

                return (
                  <div key={idx} className="rounded-2xl border border-[#eadfce] bg-white p-4 shadow-sm transition-colors hover:bg-[#fffaf3]">
                    <div className="mb-3 h-28 overflow-hidden rounded-2xl border border-[#eadfce] bg-[#fffaf3]">
                      <img
                        src={item.imageUrl}
                        alt={`${item.vendor} ${item.model}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(event) => { event.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm text-[#1f1a13]">{item.model}</span>
                      <Badge variant="outline" className="border-[#eadfce] bg-[#fff5ec] text-[10px] text-[#9f4f25]">{item.vendor}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-2">{item.category}</p>
                    <div className="text-[10px] text-[#9f4f25] font-medium mb-3">{item.features}</div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="p-2 bg-[#fffaf3] rounded-xl border border-[#eadfce]">
                        <p className="text-[8px] text-muted-foreground uppercase font-bold">End of Life</p>
                        <p className="text-[10px] font-mono">{item.eol}</p>
                      </div>
                      <div className="p-2 bg-[#fffaf3] rounded-xl border border-[#eadfce]">
                        <p className="text-[8px] text-muted-foreground uppercase font-bold">End of Support</p>
                        <p className="text-[10px] font-mono">{item.eos}</p>
                      </div>
                    </div>

                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-[9px]">
                        <span className="text-muted-foreground">Warranty:</span>
                        <span className="font-medium">{item.warranty}</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-muted-foreground">Power:</span>
                        <span className="font-medium">{item.power}</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-muted-foreground">MTBF:</span>
                        <span className="font-medium">{item.mtbf}</span>
                      </div>
                    </div>
                    
                    {associatedParts.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#eadfce] space-y-2">
                        <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider">Associated Parts</p>
                        {associatedParts.map((part, pIdx) => (
                          <div key={pIdx} className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">{part.part}</span>
                            <div className="flex items-center space-x-2">
                              <span className={cn(
                                "font-bold",
                                part.stock < 10 ? "text-red-500" : "text-green-600"
                              )}>
                                {part.stock} in stock
                              </span>
                              {part.stock < 10 && (
                                <Button variant="outline" size="sm" className="h-6 px-2 text-[8px] border-red-200 hover:bg-red-50 text-red-600">
                                  <ShoppingCart className="h-2 w-2 mr-1" />
                                  Reorder
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center text-[10px] font-semibold text-[#9f4f25] hover:underline"
                    >
                      Product source <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                );
              })}
              <Button variant="outline" className="w-full rounded-2xl border-[#eadfce] bg-white text-xs text-[#9f4f25] hover:bg-[#fff5ec]">Explore Full Catalog</Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-[#eadfce] bg-white shadow-[0_20px_80px_-45px_rgba(67,48,31,0.35)]">
            <CardHeader className="border-b border-[#f0e5d8] bg-[#fffaf3]">
              <CardTitle className="text-lg flex items-center">
                <span className="mr-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-[#1f1a13] text-[#f1c27d]">
                  <Zap className="w-4 h-4" />
                </span>
                Critical Spare Parts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {partsInventory.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#1f1a13]">{item.part}</p>
                    <p className="text-[10px] text-muted-foreground">For {item.vendor} {item.compatible}</p>
                  </div>
                  <div className="text-right flex flex-col items-end space-y-1">
                    <p className="text-xs font-bold">{item.stock}</p>
                    <Badge variant={item.status === 'Low Stock' ? 'warning' : 'outline'} className="text-[8px] h-4">
                      {item.status}
                    </Badge>
                    {item.stock < 10 && (
                      <Button variant="outline" size="sm" className="h-6 px-2 text-[8px] border-red-200 hover:bg-red-50">
                        <ShoppingCart className="h-2 w-2 mr-1 text-red-500" />
                        Reorder
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Device Modal */}
      <Dialog open={isAddDeviceOpen} onOpenChange={setIsAddDeviceOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Device</DialogTitle>
            <DialogDescription>
              Enter the details of the new device to add it to the infrastructure inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Device Name</label>
                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="e.g. Core-SW-02" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Asset Serial Number</label>
                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="e.g. SN-123456789" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date of Purchase</label>
                <input type="date" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Invoice Number <span className="text-muted-foreground font-normal">[Optional]</span></label>
                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="e.g. INV-2024-001" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <input type="number" min="1" defaultValue="1" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit Price</label>
                <input type="number" min="0" step="0.01" placeholder="0.00" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Price</label>
                <input type="number" min="0" step="0.01" placeholder="0.00" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Warranty Expiry</label>
                <input type="date" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Name of the Customer</label>
                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="e.g. Internal - IT Dept" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Disposal Date</label>
                <input type="date" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Disposal Qty</label>
                <input type="number" min="0" defaultValue="0" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Disposal Value</label>
                <input type="number" min="0" step="0.01" placeholder="0.00" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDeviceOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsAddDeviceOpen(false)}>Save Device</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Modal */}
      <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Bulk Edit Devices</DialogTitle>
            <DialogDescription>
              Update fields for {selectedDeviceIds.length} selected devices. Leave blank to skip.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="type" className="text-right text-sm font-medium">Type</label>
              <select 
                id="type"
                className="col-span-3 bg-muted/50 border rounded-md px-3 py-2 text-sm outline-none"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              >
                <option value="Switch">Switch</option>
                <option value="Router">Router</option>
                <option value="Server">Server</option>
                <option value="Firewall">Firewall</option>
                <option value="Access Point">Access Point</option>
                <option value="Storage">Storage</option>
                <option value="Load Balancer">Load Balancer</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="owner" className="text-right text-sm font-medium">Owner</label>
              <Input id="owner" className="col-span-3" value={newOwner} onChange={(e) => setNewOwner(e.target.value)} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="site" className="text-right text-sm font-medium">Site</label>
              <Input id="site" className="col-span-3" value={newSite} onChange={(e) => setNewSite(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkEditOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkUpdate}>Apply Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Device Detail Modal Overlay */}
      {isDeviceDetailsOpen && selectedDevice && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsDeviceDetailsOpen(false)}
        >
          <div 
            className="bg-background border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b flex items-center justify-between bg-muted/30">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {getTypeIcon(selectedDevice.type)}
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">{selectedDevice.name}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={
                      selectedDevice.status === 'Active' ? 'success' : 
                      selectedDevice.status === 'Warning' ? 'warning' : 'destructive'
                    }>
                      {selectedDevice.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{selectedDevice.id} • {selectedDevice.site}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNormalize} 
                  disabled={isNormalizing}
                  className="hidden sm:flex items-center"
                >
                  {isNormalizing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2 text-yellow-500" />}
                  Normalize with Gemini
                </Button>
                <Button variant="outline" size="sm" className="hidden sm:flex">Web Console</Button>
                <Button variant="outline" size="sm" className="hidden sm:flex">SSH</Button>
                <Button variant="ghost" size="icon" onClick={() => setIsDeviceDetailsOpen(false)} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <Tabs className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 mb-6">
                  <TabsTrigger 
                    active={activeTab === 'general'} 
                    onClick={() => setActiveTab('general')}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                  >
                    General
                  </TabsTrigger>
                  <TabsTrigger 
                    active={activeTab === 'network'} 
                    onClick={() => setActiveTab('network')}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                  >
                    Network
                  </TabsTrigger>
                  <TabsTrigger 
                    active={activeTab === 'technical'} 
                    onClick={() => setActiveTab('technical')}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                  >
                    Technical
                  </TabsTrigger>
                  <TabsTrigger 
                    active={activeTab === 'health'} 
                    onClick={() => setActiveTab('health')}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                  >
                    Health
                  </TabsTrigger>
                  <TabsTrigger 
                    active={activeTab === 'maintenance'} 
                    onClick={() => setActiveTab('maintenance')}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                  >
                    Maintenance
                  </TabsTrigger>
                  <TabsTrigger 
                    active={activeTab === 'documents'} 
                    onClick={() => setActiveTab('documents')}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                  >
                    Documents
                  </TabsTrigger>
                  <TabsTrigger 
                    active={activeTab === 'dependencies'} 
                    onClick={() => setActiveTab('dependencies')}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                  >
                    Dependencies
                  </TabsTrigger>
                  <TabsTrigger 
                    active={activeTab === 'financials'} 
                    onClick={() => setActiveTab('financials')}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                  >
                    Financials
                  </TabsTrigger>
                </TabsList>

                <TabsContent className={activeTab === 'general' ? 'block space-y-6' : 'hidden'}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center">
                          <ShieldCheck className="w-4 h-4 mr-2 text-primary" />
                          Ownership & Assignment
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Device Belongs To</div>
                          <div className="font-medium">{selectedDevice.belongsTo || selectedDevice.owner}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Device Assigned To</div>
                          <div className="font-medium">{selectedDevice.assignedTo || 'Unassigned'}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Criticality</div>
                          <div>
                            <Badge variant={selectedDevice.criticality === 'Critical' ? 'destructive' : selectedDevice.criticality === 'High' ? 'warning' : 'outline'} className="h-4 text-[8px]">
                              {selectedDevice.criticality}
                            </Badge>
                          </div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Asset Tag</div>
                          <div className="font-mono">{selectedDevice.id}</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center">
                          <Globe className="w-4 h-4 mr-2 text-primary" />
                          Location Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Location / Site</div>
                          <div className="font-medium">{selectedDevice.site}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Datacenter / Office</div>
                          <div className="font-medium">{selectedDevice.datacenter || 'N/A'}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Rack / Position</div>
                          <div className="font-medium">{selectedDevice.rack} / {selectedDevice.uPosition}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">U-Space</div>
                          <div className="font-medium">{selectedDevice.uPosition}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent className={activeTab === 'network' ? 'block space-y-6' : 'hidden'}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center">
                          <Info className="w-4 h-4 mr-2 text-primary" />
                          Identification
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Asset Tag</div>
                          <div className="font-mono">{selectedDevice.id}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Hostname</div>
                          <div className="font-medium">{selectedDevice.hostname || 'N/A'}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Serial Number</div>
                          <div className="font-mono">{selectedDevice.serial}</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center">
                          <Network className="w-4 h-4 mr-2 text-primary" />
                          Network Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">LAN / DMZ IP</div>
                          <div className="font-mono font-bold">{selectedDevice.ip}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">ILO IP</div>
                          <div className="font-mono">{selectedDevice.iloIp || 'N/A'}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Subnet Mask</div>
                          <div className="font-mono">{selectedDevice.mask}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Gateway</div>
                          <div className="font-mono">{selectedDevice.gateway}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent className={activeTab === 'technical' ? 'block space-y-6' : 'hidden'}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center">
                          <Layers className="w-4 h-4 mr-2 text-primary" />
                          Device Specifications
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Device Type</div>
                          <div className="font-medium">{selectedDevice.type}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Device Brand</div>
                          <div className="font-medium">{selectedDevice.vendor}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Model</div>
                          <div className="font-medium">{selectedDevice.model}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Operating System</div>
                          <div className="font-medium">{selectedDevice.os || 'N/A'}</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center">
                          <Cpu className="w-4 h-4 mr-2 text-primary" />
                          Hardware Configuration
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">CPU Model</div>
                          <div className="font-medium">{selectedDevice.cpuModel || 'N/A'}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Total CPU</div>
                          <div className="font-medium">{selectedDevice.totalCpu || 'N/A'}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">RAM Model</div>
                          <div className="font-medium">{selectedDevice.ramModel || 'N/A'}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Total RAM</div>
                          <div className="font-medium">{selectedDevice.totalRam || 'N/A'}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Disk Model</div>
                          <div className="font-medium">{selectedDevice.diskModel || 'N/A'}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Total Disk</div>
                          <div className="font-medium">{selectedDevice.totalDisk || 'N/A'}</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center">
                          <Zap className="w-4 h-4 mr-2 text-primary" />
                          Power Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Number of PSUs</div>
                          <div className="font-medium">{selectedDevice.powerSupplies || 'N/A'}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">PSU Capacity</div>
                          <div className="font-medium">{selectedDevice.psuCapacity || 'N/A'}</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center">
                          <ShoppingCart className="w-4 h-4 mr-2 text-primary" />
                          Procurement & Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">PO Number</div>
                          <div className="font-mono">{selectedDevice.poNumber || 'N/A'}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Deployment Status</div>
                          <div className="font-medium">{selectedDevice.deploymentStatus || 'N/A'}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Warranty Details</div>
                          <div className="font-medium">{selectedDevice.warrantyExpiry}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">License Info</div>
                          <div className="font-medium">{selectedDevice.licenseInfo || 'N/A'}</div>
                        </div>
                      </CardContent>
                    </Card>

                    {deviceModelInfo && (
                      <Card className="md:col-span-2">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-bold flex items-center">
                            <Package className="w-4 h-4 mr-2 text-primary" />
                            Model Catalog Specifications
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                              <p className="text-muted-foreground uppercase font-bold text-[8px]">Category</p>
                              <p className="font-medium">{deviceModelInfo.category}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground uppercase font-bold text-[8px]">Power Profile</p>
                              <p className="font-medium">{deviceModelInfo.power}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground uppercase font-bold text-[8px]">MTBF</p>
                              <p className="font-medium">{deviceModelInfo.mtbf}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground uppercase font-bold text-[8px]">Warranty Type</p>
                              <p className="font-medium">{deviceModelInfo.warranty}</p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-muted-foreground uppercase font-bold text-[8px]">Standard Features</p>
                              <p className="font-medium">{deviceModelInfo.features}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground uppercase font-bold text-[8px]">End of Life</p>
                              <p className="font-medium text-orange-600">{deviceModelInfo.eol}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground uppercase font-bold text-[8px]">End of Support</p>
                              <p className="font-medium text-red-600">{deviceModelInfo.eos}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent className={activeTab === 'health' ? 'block space-y-6' : 'hidden'}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="md:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold">Real-time Metrics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground font-medium">CPU Usage</span>
                            <span className="font-bold">{selectedDevice.cpu}</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all duration-500",
                                parseInt(selectedDevice.cpu) > 70 ? "bg-red-500" : "bg-green-500"
                              )} 
                              style={{ width: selectedDevice.cpu }} 
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground font-medium">Memory Usage</span>
                            <span className="font-bold">{selectedDevice.memory}</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all duration-500",
                                parseInt(selectedDevice.memory) > 85 ? "bg-red-500" : "bg-green-500"
                              )} 
                              style={{ width: selectedDevice.memory }} 
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground font-medium">Temperature</span>
                            <span className="font-bold">{selectedDevice.temp}</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all duration-500",
                                parseInt(selectedDevice.temp) > 55 ? "bg-red-500" : "bg-[#C8622E]"
                              )} 
                              style={{ width: `${(parseInt(selectedDevice.temp) / 80) * 100}%` }} 
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold">Alerts</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedDevice.status === 'Warning' ? (
                            <div className="p-2 bg-yellow-50 border border-yellow-100 rounded text-[9px] text-yellow-800 flex items-start">
                              <AlertTriangle className="w-3 h-3 mr-1.5 mt-0.5 flex-shrink-0" />
                              <span>High memory utilization detected. Threshold exceeded 85%.</span>
                            </div>
                          ) : selectedDevice.status === 'Offline' ? (
                            <div className="p-2 bg-red-50 border border-red-100 rounded text-[9px] text-red-800 flex items-start">
                              <XCircle className="w-3 h-3 mr-1.5 mt-0.5 flex-shrink-0" />
                              <span>Device is unreachable. Check power and connectivity.</span>
                            </div>
                          ) : (
                            <div className="p-2 bg-green-50 border border-green-100 rounded text-[9px] text-green-800 flex items-start">
                              <CheckCircle2 className="w-3 h-3 mr-1.5 mt-0.5 flex-shrink-0" />
                              <span>All systems operational.</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent className={activeTab === 'maintenance' ? 'block space-y-6' : 'hidden'}>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-2.5 border rounded-lg bg-muted/20">
                      <div className="p-1.5 rounded-full" style={{ background: '#FAE8DC' }}><Clock className="w-3 h-3 text-[#C8622E]" /></div>
                      <div className="flex-1">
                        <p className="text-xs font-bold">Firmware Upgrade</p>
                        <p className="text-[10px] text-muted-foreground">Upgraded to v17.6.3</p>
                        <p className="text-[8px] text-muted-foreground mt-0.5">Jan 12, 2026</p>
                      </div>
                      <Badge variant="outline" className="text-[8px] h-4">Success</Badge>
                    </div>
                    <div className="flex items-start space-x-3 p-2.5 border rounded-lg bg-muted/20">
                      <div className="p-1.5 bg-green-100 rounded-full"><CheckCircle2 className="w-3 h-3 text-green-600" /></div>
                      <div className="flex-1">
                        <p className="text-xs font-bold">Physical Audit</p>
                        <p className="text-[10px] text-muted-foreground">Verified rack position.</p>
                        <p className="text-[8px] text-muted-foreground mt-0.5">Mar 01, 2026</p>
                      </div>
                      <Badge variant="outline" className="text-[8px] h-4">Verified</Badge>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent className={activeTab === 'documents' ? 'block space-y-6' : 'hidden'}>
                  <div className="space-y-4">
                    <div className="p-4 border-2 border-dashed rounded-lg text-center">
                      <input 
                        type="file" 
                        id="document-upload" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file && selectedDeviceId) {
                            const formData = new FormData();
                            formData.append('file', file);
                            const res = await fetch('/api/upload', {
                              method: 'POST',
                              headers: { Authorization: `Bearer ${localStorage.getItem('jwt') || ''}` },
                              body: formData,
                            });
                            if (!res.ok) throw new Error('Upload failed');
                            const { url } = await res.json();
                            await infrastructureApi.addDocument(selectedDeviceId, { name: file.name, url, type: file.type });
                            infrastructureApi.listDocuments(selectedDeviceId).then(setDocuments).catch(console.error);
                          }
                        }}
                      />
                      <label htmlFor="document-upload" className="cursor-pointer flex flex-col items-center">
                        <FileUp className="w-8 h-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">Click to upload invoice or document</p>
                        <p className="text-xs text-muted-foreground">PDF, Images, etc.</p>
                      </label>
                    </div>
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 border rounded-lg">
                          <p className="text-xs font-medium">{doc.name}</p>
                          <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs text-[#C8622E] hover:underline">View</a>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent className={activeTab === 'dependencies' ? 'block space-y-6' : 'hidden'}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Dependency Graph</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Filter by type:</span>
                      <Select value={dependencyFilter} onValueChange={setDependencyFilter} className="w-[150px]">
                        <SelectItem value="All">All Types</SelectItem>
                        <SelectItem value="Network">Network</SelectItem>
                        <SelectItem value="Power">Power</SelectItem>
                        <SelectItem value="Application">Application</SelectItem>
                      </Select>
                    </div>
                  </div>
                  <div className="h-[500px] border rounded-lg bg-muted/10">
                    <ReactFlow 
                      nodes={dependencyNodes} 
                      edges={dependencyEdges} 
                      nodeTypes={nodeTypes}
                      fitView
                      attributionPosition="bottom-right"
                    >
                      <Background color="#ccc" gap={16} />
                      <Controls />
                      <MiniMap 
                        nodeColor={(node) => {
                          switch (node.type) {
                            case 'device': return '#3b82f6';
                            default: return '#eee';
                          }
                        }}
                        nodeStrokeWidth={3}
                      />
                    </ReactFlow>
                  </div>
                </TabsContent>

                <TabsContent className={activeTab === 'financials' ? 'block space-y-6' : 'hidden'}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center">
                          <ShoppingCart className="w-4 h-4 mr-2 text-primary" />
                          Procurement Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Vendor</div>
                          <div className="font-medium">{selectedDevice.vendor}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Purchase Date</div>
                          <div className="font-medium">{selectedDevice.purchaseDate || 'N/A'}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Invoice / PO No.</div>
                          <div className="font-mono">{selectedDevice.poNumber || 'N/A'}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Quantity</div>
                          <div className="font-medium">{selectedDevice.quantity || 1}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Unit Price</div>
                          <div className="font-medium">
                            {selectedDevice.unitPrice ? `₹${selectedDevice.unitPrice.toLocaleString()}` : 'N/A'}
                          </div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Total Value</div>
                          <div className="font-bold text-primary">
                            {selectedDevice.totalValue ? `₹${selectedDevice.totalValue.toLocaleString()}` : 'N/A'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-primary" />
                          Asset Lifecycle & Depreciation
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Depreciation Method</div>
                          <div className="font-medium">{selectedDevice.depreciationMethod || 'SLM'}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Useful Life</div>
                          <div className="font-medium">{selectedDevice.usefulLife || '5 Years'}</div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Residual Value</div>
                          <div className="font-medium">
                            {selectedDevice.residualValue ? `₹${selectedDevice.residualValue.toLocaleString()}` : '₹0'}
                          </div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Accumulated Depr.</div>
                          <div className="font-medium text-red-600">
                            {selectedDevice.accumulatedDepreciation ? `₹${selectedDevice.accumulatedDepreciation.toLocaleString()}` : '₹0'}
                          </div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Net Book Value</div>
                          <div className="font-bold text-green-600">
                            {selectedDevice.netBookValue ? `₹${selectedDevice.netBookValue.toLocaleString()}` : (selectedDevice.totalValue ? `₹${selectedDevice.totalValue.toLocaleString()}` : 'N/A')}
                          </div>
                          <div className="text-muted-foreground uppercase font-bold text-[9px]">Warranty Details</div>
                          <div className="font-medium">{selectedDevice.warrantyExpiry || 'N/A'}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedDevice.owner && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center">
                          <Globe className="w-4 h-4 mr-2 text-primary" />
                          Client / Project Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div className="space-y-1">
                            <div className="text-muted-foreground uppercase font-bold text-[9px]">Client Name</div>
                            <div className="font-bold text-sm">{selectedDevice.owner}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-muted-foreground uppercase font-bold text-[9px]">Environment</div>
                            <div>
                              <Badge variant={
                                selectedDevice.deploymentStatus === 'Production' ? 'success' : 
                                selectedDevice.deploymentStatus === 'DR' ? 'warning' : 'outline'
                              }>
                                {selectedDevice.deploymentStatus || 'N/A'}
                              </Badge>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-muted-foreground uppercase font-bold text-[9px]">K8s Namespace / Slug</div>
                            <div className="font-mono bg-muted px-2 py-1 rounded">{selectedDevice.hostname || 'N/A'}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-muted/10 flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedDeviceId(null)}>Close</Button>
              <Button size="sm">Edit Device</Button>
            </div>
          </div>
        </div>
      )}
        </TabsContent>
        <TabsContent className={pageTab === 'templates' ? 'block' : 'hidden'}>
          <DeviceTemplates />
        </TabsContent>
      </Tabs>
    </div>
  );
}
