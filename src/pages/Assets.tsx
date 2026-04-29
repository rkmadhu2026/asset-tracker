import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { 
  Search, Filter, MoreHorizontal, Server, HardDrive, Network, 
  ArrowLeft, Calendar, DollarSign, ShieldAlert, ShieldCheck, 
  User, Users, MapPin, Link2, FileText, History, Package, 
  Activity, Info, Cpu, Database, Zap, Globe, Tag, 
  ArrowRightLeft, Boxes, ClipboardList, AlertCircle, Loader2, Sparkles, Plus,
  Terminal, Command, ChevronRight, Play, Edit, Trash2, FileUp, Download, Columns,
  AppWindow, Layers
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { storage, ref, uploadBytes, getDownloadURL } from '../firebase';
import { assetsApi } from '../lib/api';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';

const assets = [
  { 
    id: 'AS-1001', 
    name: 'Core-Router-01', 
    ip: '10.0.0.1', 
    type: 'Network', 
    category: 'Router',
    manufacturer: 'Cisco',
    model: 'ISR 4451',
    status: 'Active', 
    risk: 15, 
    warranty: '2027-12-31', 
    os: 'Cisco IOS XE 18.1.1',
    serial: 'SN-992837465',
    purchaseDate: '2023-01-15',
    invoice: 'INV-2023-001',
    qty: 1,
    unitPrice: 12500,
    totalPrice: 12500,
    customer: 'Internal - IT Dept',
    location: 'Data Center A',
    rack: 'R-04',
    uPosition: '12U',
    owner: 'Network Team',
    supportGroup: 'Network Operations',
    vendor: 'Cisco Systems',
    po: 'PO-98765',
    lifecycle: 'Production',
    lastAudit: '2024-03-01',
    compliance: 'Compliant',
    disposalDate: null,
    disposalQty: 0,
    disposalValue: 0,
    firmware: 'v18.1.1r',
    hostname: 'core-router-01.acme.local',
    tags: ['core', 'network', 'cisco']
  },
  { id: 'AS-1002', name: 'Edge-FW-02', ip: '10.0.5.254', type: 'Firewall', manufacturer: 'Fortinet', model: 'Fortigate 100F', status: 'Warning', risk: 45, warranty: '2025-06-15', os: 'FortiOS 8.0.2', serial: 'SN-FW-882736', tags: ['edge', 'security', 'firewall'] },
  { id: 'AS-2001', name: 'DB-Server-Prod', ip: '10.1.10.50', type: 'Server', manufacturer: 'Dell', model: 'PowerEdge R740', status: 'Active', risk: 10, warranty: '2028-01-01', os: 'Windows Server 2025', serial: 'SN-SRV-112233', tags: ['db', 'prod', 'server'] },
  { id: 'AS-2002', name: 'App-Server-01', ip: '10.1.20.10', type: 'Server', manufacturer: 'HP', model: 'ProLiant DL380 Gen11', status: 'Critical', risk: 85, warranty: '2023-11-30', os: 'Ubuntu 24.04 LTS', serial: 'SN-SRV-445566', tags: ['app', 'prod', 'server'] },
  { id: 'AS-1003', name: 'Access-Switch-L2', ip: '10.0.10.1', type: 'Network', manufacturer: 'Cisco', model: 'Catalyst 9200L 48T 4G', status: 'Active', risk: 25, warranty: '2026-05-20', os: 'Cisco IOS XE 17.12', serial: 'SN-SW-778899', tags: ['access', 'network', 'switch'] },
  { id: 'AS-1004', name: 'Core-Switch-01', ip: '10.0.0.2', type: 'Network', manufacturer: 'Huawei', model: 'S6720S 26Q EI 24S AC', status: 'Active', risk: 12, warranty: '2027-08-12', os: 'VRP 8.5', serial: 'SN-HW-112233', tags: ['core', 'network', 'huawei'] },
  { id: 'AS-1005', name: 'Dist-Switch-01', ip: '10.0.1.1', type: 'Network', manufacturer: 'Arista', model: '7050X3', status: 'Active', risk: 18, warranty: '2026-12-01', os: 'EOS 4.32', serial: 'SN-AR-445566', tags: ['dist', 'network', 'arista'] },
  { id: 'AS-1006', name: 'Edge-Router-01', ip: '10.0.0.5', type: 'Network', manufacturer: 'Cisco', model: 'ISR 1000', status: 'Active', risk: 20, warranty: '2025-10-10', os: 'IOS XE 16.12', serial: 'SN-CS-778899', tags: ['edge', 'network', 'cisco'] },
  { id: 'AS-1007', name: 'Branch-Switch-01', ip: '10.5.1.1', type: 'Network', manufacturer: 'Aruba', model: '2930F 24G 4SFP', status: 'Active', risk: 15, warranty: '2026-03-15', os: 'ArubaOS 16.10', serial: 'SN-AB-112233', tags: ['branch', 'network', 'aruba'] },
  { id: 'AS-1008', name: 'Storage-Array-01', ip: '10.1.50.10', type: 'Storage', manufacturer: 'NetApp', model: 'AFF A200', status: 'Active', risk: 8, warranty: '2028-05-20', os: 'ONTAP 9.10', serial: 'SN-NA-445566', tags: ['storage', 'netapp'] },
  { id: 'AS-1009', name: 'Web-Security-GW', ip: '10.0.5.10', type: 'Firewall', manufacturer: 'Barracuda', model: 'BARRACUDA 300', status: 'Active', risk: 30, warranty: '2025-01-01', os: 'Barracuda OS 8.0', serial: 'SN-BC-778899', tags: ['security', 'barracuda'] },
  { id: 'AS-1010', name: 'DC-Switch-01', ip: '10.1.0.1', type: 'Network', manufacturer: 'Dell', model: 's5248F', status: 'Active', risk: 10, warranty: '2027-11-30', os: 'OS10', serial: 'SN-DE-112233', tags: ['dc', 'network', 'dell'] },
  { id: 'AS-1011', name: 'SAN-Switch-01', ip: '10.1.50.1', type: 'Network', manufacturer: 'HPE', model: 'SN3600B FC', status: 'Active', risk: 5, warranty: '2029-01-01', os: 'FOS 9.0', serial: 'SN-HP-445566', tags: ['san', 'network', 'hpe'] },
  { id: 'AS-1012', name: 'Branch-FW-01', ip: '10.5.0.1', type: 'Firewall', manufacturer: 'Fortinet', model: 'Fortigate 60F', status: 'Active', risk: 22, warranty: '2026-09-12', os: 'FortiOS 7.0', serial: 'SN-FT-778899', tags: ['branch', 'security', 'fortigate'] },
  { id: 'AS-1013', name: 'Core-Switch-02', ip: '10.0.0.3', type: 'Network', manufacturer: 'Cisco', model: 'Nexus 9000', status: 'Active', risk: 5, warranty: '2030-01-01', os: 'NX-OS 10.2', serial: 'SN-CS-112233', tags: ['core', 'network', 'cisco'] },
];

import { Label } from '@/components/ui/label';

interface AssetType {
  id: string;
  name: string;
}

interface AssetDocument {
  id: string;
  assetId: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: any;
}

import { useClient } from '../components/ClientProvider';

export function Assets() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [viewMode, setViewMode] = useState<'inventory' | 'stock'>('inventory');
  const [stockTab, setStockTab] = useState('inventory');
  const [vendorFilter, setVendorFilter] = useState('All Vendors');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<any[]>([]);
  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);
  const [isAddDeviceTypeOpen, setIsAddDeviceTypeOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newDeviceTypeName, setNewDeviceTypeName] = useState('');
  const [assetDocuments, setAssetDocuments] = useState<AssetDocument[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [assetsData, setAssetsData] = useState<any[]>([]);
  const { selectedClientId } = useClient();

  useEffect(() => {
    if (!selectedClientId) return;

    const q = query(collection(db, 'assets'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbAssets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (dbAssets.length === 0) {
        // Seed initial data
        assets.forEach(async (asset) => {
          await setDoc(doc(db, 'assets', asset.id), { ...asset, tenantId: selectedClientId });
        });
      } else {
        setAssetsData(dbAssets.filter((a: any) => a.tenantId === selectedClientId || !a.tenantId));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'assets');
    });
    return () => unsubscribe();
  }, [selectedClientId]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'asset_types'), (snapshot) => {
      const types = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssetType));
      setAssetTypes(types);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'asset_types');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'device_types'), (snapshot) => {
      const types = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDeviceTypes(types);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'device_types');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedAsset) {
      setAssetDocuments([]);
      return;
    }
    const q = query(collection(db, 'asset_documents'), where('assetId', '==', selectedAsset.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssetDocument));
      setAssetDocuments(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'asset_documents');
    });
    return () => unsubscribe();
  }, [selectedAsset]);

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedAsset) return;

    setIsUploadingDoc(true);
    try {
      const docRef = ref(storage, `assets/${selectedAsset.id}/${file.name}`);
      await uploadBytes(docRef, file);
      const downloadUrl = await getDownloadURL(docRef);

      await addDoc(collection(db, 'asset_documents'), {
        assetId: selectedAsset.id,
        name: file.name,
        type: file.type,
        url: downloadUrl,
        uploadedAt: serverTimestamp()
      });
      alert(`Successfully uploaded ${file.name}`);
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to upload document.");
    } finally {
      setIsUploadingDoc(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleAddAssetType = async () => {
    if (!newTypeName.trim()) return;
    await addDoc(collection(db, 'asset_types'), {
      name: newTypeName,
      createdAt: serverTimestamp()
    });
    setNewTypeName('');
    setIsAddTypeOpen(false);
  };

  const handleAddDeviceType = async () => {
    if (!newDeviceTypeName.trim()) return;
    await addDoc(collection(db, 'device_types'), {
      name: newDeviceTypeName,
      createdAt: serverTimestamp()
    });
    setNewDeviceTypeName('');
    setIsAddDeviceTypeOpen(false);
  };

  const uniqueVendors = useMemo(() => {
    const vendors = assetsData.map(a => a.manufacturer).filter(Boolean);
    return ['All Vendors', ...Array.from(new Set(vendors))].sort();
  }, [assetsData]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const filteredAssets = assetsData.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
      asset.ip.includes(debouncedSearchTerm) ||
      asset.serial?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      asset.tags?.some((tag: string) => tag.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
    
    const matchesVendor = vendorFilter === 'All Vendors' || asset.manufacturer === vendorFilter;
    const matchesType = typeFilter === 'All Types' || asset.type === typeFilter;
    
    return matchesSearch && matchesVendor && matchesType;
  });

  const getRiskBadge = (score: number) => {
    if (score < 25) return <Badge variant="success">Low ({score})</Badge>;
    if (score < 45) return <Badge variant="warning">Medium ({score})</Badge>;
    if (score < 70) return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">High ({score})</Badge>;
    return <Badge variant="destructive">Critical ({score})</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Active': return <Badge variant="success">Active</Badge>;
      case 'Warning': return <Badge variant="warning">Warning</Badge>;
      case 'Critical': return <Badge variant="destructive">Critical</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Network': return <Network className="w-4 h-4 text-blue-500" />;
      case 'Firewall': return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case 'Server': return <Server className="w-4 h-4 text-green-500" />;
      default: return <HardDrive className="w-4 h-4 text-gray-500" />;
    }
  };

  const [isNormalizing, setIsNormalizing] = useState(false);
  const [normalizationProgress, setNormalizationProgress] = useState(0);
  const [normalizationScope, setNormalizationScope] = useState('single');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [showNowAssist, setShowNowAssist] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'type' | 'owner' | 'status'>('type');
  const [bulkUpdateValue, setBulkUpdateValue] = useState('');
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [cmdInput, setCmdInput] = useState('');
  const [cmdOutput, setCmdOutput] = useState<string[]>(['Asset Command Center v1.0.0', 'Type "help" for available commands.']);
  const [isValidatingConfig, setIsValidatingConfig] = useState(false);
  const [configValidationResult, setConfigValidationResult] = useState<string | null>(null);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const handleCmdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdInput.trim()) return;

    const input = cmdInput.toLowerCase().trim();
    setCmdOutput(prev => [...prev, `> ${cmdInput}`]);

    if (input === 'help') {
      setCmdOutput(prev => [...prev, 'Available commands:', '- list: Show all assets', '- status: System health check', '- normalize: Run data normalization', '- clear: Clear terminal']);
    } else if (input === 'list') {
      setCmdOutput(prev => [...prev, `Found ${assetsData.length} assets in inventory.`]);
    } else if (input === 'status') {
      setCmdOutput(prev => [...prev, 'All systems operational. 98.4% asset compliance.']);
    } else if (input === 'clear') {
      setCmdOutput(['Asset Command Center v1.0.0']);
    } else if (input.startsWith('find ')) {
      const query = input.replace('find ', '');
      const found = assetsData.filter(a => a.name.toLowerCase().includes(query));
      setCmdOutput(prev => [...prev, `Found ${found.length} matches for "${query}".`]);
    } else {
      setCmdOutput(prev => [...prev, `Unknown command: ${input}`]);
    }
    setCmdInput('');
  };

  const handleNormalize = async (scope: string = 'single') => {
    setIsNormalizing(true);
    setNormalizationProgress(0);
    
    // Simulate normalization process with progress
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setNormalizationProgress((i / steps) * 100);
    }
    
    setIsNormalizing(false);
    setNormalizationProgress(0);
    
    let message = '';
    if (scope === 'single') message = `Asset ${selectedAsset?.id || ''} normalized successfully.`;
    else if (scope === 'selected') message = `${selectedAssetIds.length} assets normalized successfully.`;
    else if (scope === 'type') message = `All ${selectedAsset?.type || 'Network'} assets normalized successfully.`;
    else message = 'All assets normalized successfully.';
    
    alert(message);
  };

  const handleBulkUpdate = async () => {
    if (!bulkUpdateValue) return;
    
    try {
      const updatePromises = selectedAssetIds.map(id => 
        setDoc(doc(db, 'assets', id), { [bulkActionType]: bulkUpdateValue }, { merge: true })
      );
      await Promise.all(updatePromises);
      setSelectedAssetIds([]);
      setIsBulkEditOpen(false);
      setBulkUpdateValue('');
      alert(`Successfully updated ${selectedAssetIds.length} assets.`);
    } catch (error) {
      console.error("Error performing bulk update:", error);
      alert("Failed to update assets. Please try again.");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, parse CSV and upload to database
      console.log('Uploading file:', file.name);
      alert(`Successfully imported assets from ${file.name}`);
    }
  };

  const handleDownloadReport = () => {
    const headers = ['ID', 'Name', 'Type', 'Manufacturer', 'Model', 'Status', 'IP', 'Serial', 'Risk', 'Warranty'];
    const csvContent = [
      headers.join(','),
      ...filteredAssets.map(a => [
        a.id,
        `"${a.name}"`,
        a.type,
        `"${a.manufacturer || ''}"`,
        `"${a.model || ''}"`,
        a.status,
        a.ip,
        a.serial || '',
        a.risk || '',
        a.warranty || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'assets_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleValidateConfig = async () => {
    setIsValidatingConfig(true);
    setIsValidationModalOpen(true);
    setConfigValidationResult(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Validate the following asset configuration and identify any potential issues, misconfigurations, or security risks. Provide a brief, structured summary.
        
Asset Details:
${JSON.stringify(selectedAsset, null, 2)}`,
      });
      setConfigValidationResult(response.text || 'No validation result returned.');
    } catch (error) {
      console.error('Error validating config:', error);
      setConfigValidationResult('Failed to validate configuration. Please try again.');
    } finally {
      setIsValidatingConfig(false);
    }
  };

  if (selectedAsset) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedAsset(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{selectedAsset.name}</h1>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{selectedAsset.id}</span>
                <span>•</span>
                <span>{selectedAsset.type}</span>
                <span>•</span>
                {getStatusBadge(selectedAsset.status)}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="flex space-x-2">
              <div className="w-48">
                <Select onValueChange={(v) => setNormalizationScope(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">This Asset Only</SelectItem>
                    <SelectItem value="type">All {selectedAsset.type} Devices</SelectItem>
                    <SelectItem value="all">All Infrastructure Assets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleNormalize(normalizationScope)} disabled={isNormalizing}>
                {isNormalizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Normalize Data
              </Button>
              <Button size="sm" variant="outline" onClick={handleValidateConfig} disabled={isValidatingConfig}>
                {isValidatingConfig ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                Validate Config
              </Button>
              <Button size="sm">
                <History className="w-4 h-4 mr-2" />
                Update Lifecycle
              </Button>
            </div>
            {isNormalizing && (
              <div className="w-full space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Normalizing...</span>
                  <span>{Math.round(normalizationProgress)}%</span>
                </div>
                <Progress value={normalizationProgress} className="h-1" />
              </div>
            )}
          </div>
        </div>

        <Tabs className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="w-max sm:w-full justify-start sm:justify-center">
              <TabsTrigger active={activeTab === 'general'} onClick={() => setActiveTab('general')}>General</TabsTrigger>
              <TabsTrigger active={activeTab === 'financial'} onClick={() => setActiveTab('financial')}>Financial</TabsTrigger>
              <TabsTrigger active={activeTab === 'technical'} onClick={() => setActiveTab('technical')}>Technical</TabsTrigger>
              <TabsTrigger active={activeTab === 'hardware'} onClick={() => setActiveTab('hardware')}>Hardware</TabsTrigger>
              <TabsTrigger active={activeTab === 'location'} onClick={() => setActiveTab('location')}>Location & Rack</TabsTrigger>
              <TabsTrigger active={activeTab === 'relationships'} onClick={() => setActiveTab('relationships')}>Relationships</TabsTrigger>
              <TabsTrigger active={activeTab === 'governance'} onClick={() => setActiveTab('governance')}>Governance</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent className={activeTab === 'general' ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Info className="w-4 h-4 mr-2" />
                    Asset Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-muted-foreground">Asset Type</div>
                    <div className="font-medium">{selectedAsset.type}</div>
                    <div className="text-muted-foreground">Asset Category</div>
                    <div className="font-medium">{selectedAsset.category || 'N/A'}</div>
                    <div className="text-muted-foreground">Manufacturer</div>
                    <div className="font-medium">{selectedAsset.manufacturer || 'N/A'}</div>
                    <div className="text-muted-foreground">Model</div>
                    <div className="font-medium">{selectedAsset.model || 'N/A'}</div>
                    <div className="text-muted-foreground">Serial Number</div>
                    <div className="font-mono">{selectedAsset.serial || 'N/A'}</div>
                    <div className="text-muted-foreground">Quantity</div>
                    <div className="font-medium">{selectedAsset.qty}</div>
                    <div className="text-muted-foreground">Tags</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedAsset.tags?.map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Location & Ownership
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-muted-foreground">Data Center</div>
                    <div className="font-medium">{selectedAsset.location || 'N/A'}</div>
                    <div className="text-muted-foreground">Rack / Position</div>
                    <div className="font-medium">{selectedAsset.rack} / {selectedAsset.uPosition}</div>
                    <div className="text-muted-foreground">Support Group</div>
                    <div className="font-medium">{selectedAsset.supportGroup || 'N/A'}</div>
                    <div className="text-muted-foreground">Owner</div>
                    <div className="font-medium">{selectedAsset.owner || 'N/A'}</div>
                    <div className="text-muted-foreground">Customer</div>
                    <div className="font-medium">{selectedAsset.customer || 'N/A'}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent className={activeTab === 'financial' ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Asset Financials
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-muted-foreground">Vendor</div>
                    <div className="font-medium">{selectedAsset.vendor || 'N/A'}</div>
                    <div className="text-muted-foreground">Purchase Order (PO)</div>
                    <div className="font-mono">{selectedAsset.po || 'N/A'}</div>
                    <div className="text-muted-foreground">Invoice Number</div>
                    <div className="font-mono">{selectedAsset.invoice || 'N/A'}</div>
                    <div className="text-muted-foreground">Date of Purchase</div>
                    <div className="font-medium">{selectedAsset.purchaseDate || 'N/A'}</div>
                    <div className="text-muted-foreground">Unit Price</div>
                    <div className="font-medium">${selectedAsset.unitPrice?.toLocaleString()}</div>
                    <div className="text-muted-foreground font-bold">Total Price</div>
                    <div className="font-bold">${selectedAsset.totalPrice?.toLocaleString()}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <History className="w-4 h-4 mr-2" />
                    Lifecycle & Disposal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-muted-foreground">Warranty / AMC</div>
                    <div className="font-medium text-orange-500">{selectedAsset.warranty || 'N/A'}</div>
                    <div className="text-muted-foreground">Lifecycle Status</div>
                    <div className="font-medium">{selectedAsset.lifecycle || 'N/A'}</div>
                    <div className="text-muted-foreground">Disposal Date</div>
                    <div className="font-medium">{selectedAsset.disposalDate || '-'}</div>
                    <div className="text-muted-foreground">Disposal Qty</div>
                    <div className="font-medium">{selectedAsset.disposalQty || '0'}</div>
                    <div className="text-muted-foreground">Disposal Value</div>
                    <div className="font-medium">{selectedAsset.disposalValue ? `$${selectedAsset.disposalValue}` : '-'}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent className={activeTab === 'technical' ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    Network & System Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-muted-foreground">Management IP</div>
                    <div className="font-mono">{selectedAsset.ip || 'N/A'}</div>
                    <div className="text-muted-foreground">Hostnames / DNS</div>
                    <div className="font-mono">{selectedAsset.hostname || 'N/A'}</div>
                    <div className="text-muted-foreground">OS & Version</div>
                    <div className="font-medium">{selectedAsset.os || 'N/A'}</div>
                    <div className="text-muted-foreground">Firmware Version</div>
                    <div className="font-mono">{selectedAsset.firmware || 'N/A'}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Network Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-muted-foreground">Monitoring Status</div>
                    <div><Badge variant="success">Online</Badge></div>
                    <div className="text-muted-foreground">SNMP Status</div>
                    <div className="text-green-600 font-medium">v3 Connected</div>
                    <div className="text-muted-foreground">Last Poll</div>
                    <div className="font-medium">2 mins ago</div>
                    <div className="text-muted-foreground">Uptime</div>
                    <div className="font-medium">124 days, 14:22:10</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent className={activeTab === 'hardware' ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <Cpu className="w-4 h-4 mr-2" />
                      Hardware Components
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">SN: {selectedAsset.serial || 'N/A'}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Component</TableHead>
                        <TableHead className="text-xs">Serial Number</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-xs font-medium">CPU 1 (Intel Xeon)</TableCell>
                        <TableCell className="text-xs font-mono">PROC-9928-A</TableCell>
                        <TableCell><Badge variant="outline" className="text-[8px] h-4">Healthy</Badge></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs font-medium">Memory Module A1</TableCell>
                        <TableCell className="text-xs font-mono">MEM-8827-X</TableCell>
                        <TableCell><Badge variant="outline" className="text-[8px] h-4">Healthy</Badge></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs font-medium">Power Supply 1</TableCell>
                        <TableCell className="text-xs font-mono">PSU-7726-B</TableCell>
                        <TableCell><Badge variant="outline" className="text-[8px] h-4">Active</Badge></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs font-medium">Power Supply 2</TableCell>
                        <TableCell className="text-xs font-mono">PSU-7726-C</TableCell>
                        <TableCell><Badge variant="outline" className="text-[8px] h-4">Standby</Badge></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    Parts & Modules
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 border rounded-lg bg-muted/10">
                      <p className="text-xs font-bold mb-2">Expansion Modules / Line Cards</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Slot 1: 48-port 10/100/1000Base-T</span>
                          <span className="font-mono">LC-48T-01</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Slot 2: 4-port 10G SFP+ Uplink</span>
                          <span className="font-mono">LC-4SFP-02</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg bg-muted/10">
                      <p className="text-xs font-bold mb-2">Installed SFPs / Transceivers</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Port 1/1: 10GBASE-SR SFP+</span>
                          <span className="font-mono text-green-600">Connected</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Port 1/2: 10GBASE-SR SFP+</span>
                          <span className="font-mono text-red-600">No Link</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent className={activeTab === 'location' ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Location & Rack Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-muted-foreground">Location</div>
                    <div className="font-medium">{selectedAsset.location || 'N/A'}</div>
                    <div className="text-muted-foreground">Rack Number</div>
                    <div className="font-medium">{selectedAsset.rack || 'N/A'}</div>
                    <div className="text-muted-foreground">U-Space</div>
                    <div className="font-medium">{selectedAsset.uPosition || 'N/A'}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent className={activeTab === 'relationships' ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Link2 className="w-4 h-4 mr-2" />
                    Relationship Tables & Dependency Mapping
                  </CardTitle>
                  <CardDescription>Mapping App ↔ Server ↔ Network connections.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-muted/20">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold">Upstream Dependencies</span>
                        <Badge variant="outline">2 Connections</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Network className="w-4 h-4 mr-2 text-blue-500" />
                          <span className="text-muted-foreground mr-2">Connected to:</span>
                          <span className="font-medium">Core-Switch-Agg-01 (Network Connection)</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                          <span className="text-muted-foreground mr-2">Powered by:</span>
                          <span className="font-medium">UPS-Rack-04-A (Power Device)</span>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-muted/20">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold">Downstream Dependents</span>
                        <Badge variant="outline">15 Connections</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Network className="w-4 h-4 mr-2 text-green-500" />
                          <span className="text-muted-foreground mr-2">Provides Network to:</span>
                          <span className="font-medium">App-Server-Cluster-01 (Server)</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <AppWindow className="w-4 h-4 mr-2 text-purple-500" />
                          <span className="text-muted-foreground mr-2">Supports App:</span>
                          <span className="font-medium">ERP Production System (Application)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent className={activeTab === 'governance' ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Governance & Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-muted-foreground">Compliance Tracking</div>
                    <div><Badge variant="success">Compliant</Badge></div>
                    <div className="text-muted-foreground">Asset Audit Records</div>
                    <div className="font-medium">{selectedAsset.lastAudit}</div>
                    <div className="text-muted-foreground">Lifecycle Status</div>
                    <div className="font-medium">{selectedAsset.lifecycle}</div>
                    <div className="text-muted-foreground">Audit Frequency</div>
                    <div className="font-medium">Quarterly</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Documentation & History
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleDocumentUpload}
                        disabled={isUploadingDoc}
                        title="Upload Document"
                      />
                      <Button variant="outline" size="sm" disabled={isUploadingDoc}>
                        {isUploadingDoc ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileUp className="w-4 h-4 mr-2" />}
                        Upload
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Attachments</p>
                    {assetDocuments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                    ) : (
                      assetDocuments.map(doc => (
                        <Button 
                          key={doc.id} 
                          variant="outline" 
                          className="w-full justify-start text-xs" 
                          size="sm"
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          <FileText className="w-3 h-3 mr-2" />
                          {doc.name}
                        </Button>
                      ))
                    )}
                  </div>
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Recent History</p>
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2 text-xs">
                        <History className="w-3 h-3 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Audit Completed</p>
                          <p className="text-muted-foreground">Mar 01, 2024 by system</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2 text-xs">
                        <Activity className="w-3 h-3 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Firmware Updated</p>
                          <p className="text-muted-foreground">Jan 12, 2024 by admin</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets (Configuration Items)</h1>
          <p className="text-muted-foreground mt-1">Comprehensive CMDB for hardware, infra, and network inventory.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setIsCmdOpen(true)}>
            <Terminal className="w-4 h-4 mr-2" />
            CMD Center
          </Button>
          {selectedAssetIds.length > 0 && (
            <Button variant="secondary" className="flex-1 sm:flex-none" onClick={() => setIsBulkEditOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Bulk Edit ({selectedAssetIds.length})
            </Button>
          )}
          <Button 
            variant={viewMode === 'stock' ? 'default' : 'outline'} 
            className="flex-1 sm:flex-none"
            onClick={() => setViewMode(viewMode === 'inventory' ? 'stock' : 'inventory')}
          >
            <Boxes className="w-4 h-4 mr-2" />
            Stock & Inventory
          </Button>
          <div className="relative flex-1 sm:flex-none">
            <input
              type="file"
              accept=".csv"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileUpload}
              title="Import assets from CSV"
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
          <Button className="flex-1 sm:flex-none" onClick={() => setIsAddAssetOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add CI
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setIsAddTypeOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Asset Type
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setIsAddDeviceTypeOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Device Type
          </Button>
        </div>
      </div>

      <Dialog open={isAddTypeOpen} onOpenChange={setIsAddTypeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Asset Type</DialogTitle>
            <DialogDescription>Enter the name of the new asset type.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddAssetType}>Add Type</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDeviceTypeOpen} onOpenChange={setIsAddDeviceTypeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Device Type</DialogTitle>
            <DialogDescription>Enter the name of the new device type.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="device-type-name" className="text-right">Name</Label>
              <Input id="device-type-name" value={newDeviceTypeName} onChange={(e) => setNewDeviceTypeName(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddDeviceType}>Add Device Type</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CMD Center Modal */}
      <Dialog open={isCmdOpen} onOpenChange={setIsCmdOpen}>
        <DialogContent className="sm:max-w-[600px] bg-slate-950 text-slate-50 border-slate-800 font-mono p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center space-x-2">
              <Command className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold">Asset Command Center</span>
            </div>
            <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">v1.0.0</Badge>
          </div>
          <div className="h-[300px] overflow-y-auto p-4 space-y-1 text-sm">
            {cmdOutput.map((line, i) => (
              <div key={i} className={cn(
                line.startsWith('>') ? "text-blue-400" : "text-slate-300",
                line.includes('Unknown') ? "text-red-400" : ""
              )}>
                {line}
              </div>
            ))}
          </div>
          <form onSubmit={handleCmdSubmit} className="p-4 bg-slate-900/50 border-t border-slate-800 flex items-center space-x-2">
            <ChevronRight className="w-4 h-4 text-blue-400" />
            <input 
              autoFocus
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-50 placeholder:text-slate-600"
              placeholder="Enter command..."
              value={cmdInput}
              onChange={(e) => setCmdInput(e.target.value)}
            />
            <Button type="submit" size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-slate-800">
              <Play className="w-3 h-3" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Asset Modal */}
      <Dialog open={isAddAssetOpen} onOpenChange={setIsAddAssetOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Asset (CI)</DialogTitle>
            <DialogDescription>
              Enter the details of the new asset to add it to the CMDB.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* General Information */}
            <div>
              <h3 className="text-lg font-medium mb-4 border-b pb-2">General Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Device Belongs TO</label>
                  <Input placeholder="e.g. IT Dept" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Device Assigned TO</label>
                  <Input placeholder="e.g. John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Asset TAG</label>
                  <Input placeholder="e.g. TAG-12345" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hostname</label>
                  <Input placeholder="e.g. srv-prod-01" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Device Type</label>
                  <Input placeholder="e.g. Server, Switch" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Deployment Status</label>
                  <Select onValueChange={() => {}}>
                    <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Hardware Details */}
            <div>
              <h3 className="text-lg font-medium mb-4 border-b pb-2">Hardware Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Device Brand</label>
                  <Input placeholder="e.g. Dell, Cisco" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Model</label>
                  <Input placeholder="e.g. PowerEdge R740" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">OS</label>
                  <Input placeholder="e.g. Windows Server 2022" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">RAM Model with Capacity</label>
                  <Input placeholder="e.g. DDR4 3200MHz 16GB" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Total RAM</label>
                  <Input placeholder="e.g. 128GB" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CPU Model with Capacity</label>
                  <Input placeholder="e.g. Intel Xeon Gold 6230 2.1G" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Total CPU</label>
                  <Input placeholder="e.g. 40 Cores" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">HardDisk Model with Capacity</label>
                  <Input placeholder="e.g. SSD SAS 1.92TB" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Total HardDisk</label>
                  <Input placeholder="e.g. 15.36TB" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Number of Power Supply</label>
                  <Input type="number" min="1" placeholder="e.g. 2" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Each Power supply Capacity</label>
                  <Input placeholder="e.g. 750W" />
                </div>
              </div>
            </div>

            {/* Network & Location */}
            <div>
              <h3 className="text-lg font-medium mb-4 border-b pb-2">Network & Location</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">LAN/DMZ IP</label>
                  <Input placeholder="e.g. 10.0.0.10" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">ILO IP</label>
                  <Input placeholder="e.g. 10.0.1.10" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input placeholder="e.g. New York" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Datacenter/Office details</label>
                  <Input placeholder="e.g. DC-01" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rack Number</label>
                  <Input placeholder="e.g. R-05" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">U-Space</label>
                  <Input placeholder="e.g. 10U-12U" />
                </div>
              </div>
            </div>

            {/* Financial & Licensing */}
            <div>
              <h3 className="text-lg font-medium mb-4 border-b pb-2">Financial & Licensing</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">PO Number</label>
                  <Input placeholder="e.g. PO-98765" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Warranty Details</label>
                  <Input placeholder="e.g. 3 Years NBD" />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium">Additional License information</label>
                  <Input placeholder="e.g. Enterprise Plus License" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddAssetOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsAddAssetOpen(false)}>Save Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validation Modal */}
      <Dialog open={isValidationModalOpen} onOpenChange={setIsValidationModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configuration Validation</DialogTitle>
            <DialogDescription>
              AI-powered analysis of the asset configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isValidatingConfig ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm text-muted-foreground">Analyzing configuration with Gemini AI...</p>
              </div>
            ) : configValidationResult ? (
              <div className="markdown-body text-sm bg-muted/50 p-4 rounded-md">
                <Markdown>{configValidationResult}</Markdown>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsValidationModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Modal */}
      <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Bulk Edit Assets</DialogTitle>
            <DialogDescription>
              Updating {selectedAssetIds.length} selected assets. Changes will apply to all selected items.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium">Action Type</label>
              <div className="col-span-3">
                <Select value={bulkActionType} onValueChange={(v: 'type' | 'owner' | 'status') => setBulkActionType(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status">Update Status</SelectItem>
                    <SelectItem value="type">Update Type</SelectItem>
                    <SelectItem value="owner">Update Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium">New Value</label>
              <div className="col-span-3">
                {bulkActionType === 'status' ? (
                  <Select value={bulkUpdateValue} onValueChange={setBulkUpdateValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="disposed">Disposed</SelectItem>
                    </SelectContent>
                  </Select>
                ) : bulkActionType === 'type' ? (
                  <Select value={bulkUpdateValue} onValueChange={setBulkUpdateValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {assetTypes.map(type => (
                        <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input 
                    value={bulkUpdateValue} 
                    onChange={(e) => setBulkUpdateValue(e.target.value)} 
                    placeholder="Enter new owner name" 
                  />
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkEditOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              setIsBulkEditOpen(false);
              setSelectedAssetIds([]);
            }}>Apply Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Now Assist Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          size="lg" 
          className="rounded-full h-14 w-14 shadow-xl bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowNowAssist(!showNowAssist)}
        >
          <Sparkles className="w-6 h-6 text-white" />
        </Button>
      </div>

      {showNowAssist && (
        <Card className="fixed bottom-24 right-6 w-80 z-50 shadow-2xl border-blue-200 animate-in slide-in-from-bottom-4">
          <CardHeader className="bg-blue-600 text-white rounded-t-lg py-3">
            <CardTitle className="text-sm flex items-center">
              <Sparkles className="w-4 h-4 mr-2" />
              Now Assist for HAM
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="bg-muted p-2 rounded text-xs">
              Hello! I can help you fulfill hardware requests, check inventory, or automate lifecycle tasks. What can I do for you today?
            </div>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start text-[10px]" onClick={() => alert('Checking stock for ISR 4451...')}>
                Check stock for ISR 4451
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-[10px]" onClick={() => alert('Starting RMA for Edge-FW-02...')}>
                Start RMA for Edge-FW-02
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-[10px]" onClick={() => alert('Reserving 5 laptops for onboarding...')}>
                Reserve 5 laptops for onboarding
              </Button>
            </div>
            <div className="flex space-x-2">
              <input type="text" placeholder="Ask me anything..." className="flex-1 text-xs border rounded px-2 py-1 outline-none focus:ring-1 ring-blue-500" />
              <Button size="sm" className="h-8 w-8 p-0"><ArrowRightLeft className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'stock' ? (
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Stock Value</p>
                  <h3 className="text-2xl font-bold mt-1">$2.4M</h3>
                </div>
                <div className="p-3 bg-green-100 rounded-full"><DollarSign className="w-6 h-6 text-green-600" /></div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Low Stock Alerts</p>
                  <h3 className="text-2xl font-bold mt-1">8 Items</h3>
                </div>
                <div className="p-3 bg-red-100 rounded-full"><AlertCircle className="w-6 h-6 text-red-600" /></div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recent Movements</p>
                  <h3 className="text-2xl font-bold mt-1">24 (In/Out)</h3>
                </div>
                <div className="p-3 bg-blue-100 rounded-full"><ArrowRightLeft className="w-6 h-6 text-blue-600" /></div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <Tabs className="w-full">
                <div className="flex justify-between items-center mb-4">
                  <TabsList>
                    <TabsTrigger active={stockTab === 'inventory'} onClick={() => setStockTab('inventory')}>Inventory & Stock</TabsTrigger>
                    <TabsTrigger active={stockTab === 'rma'} onClick={() => setStockTab('rma')}>RMA Requests</TabsTrigger>
                    <TabsTrigger active={stockTab === 'reservations'} onClick={() => setStockTab('reservations')}>Asset Reservations</TabsTrigger>
                  </TabsList>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    New Request
                  </Button>
                </div>
                <TabsContent className={stockTab === 'inventory' ? 'block' : 'hidden'}>
                  <CardTitle>Inventory & Stock (Spare Parts)</CardTitle>
                  <CardDescription>Tracking asset movements and spare parts availability.</CardDescription>
                  <Table className="mt-4">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>In Stock</TableHead>
                        <TableHead>Min Threshold</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">SFP+ 10G Module</TableCell>
                        <TableCell>Network Spare</TableCell>
                        <TableCell>45</TableCell>
                        <TableCell>10</TableCell>
                        <TableCell>DC-A / Cabinet 1</TableCell>
                        <TableCell><Badge variant="success">Healthy</Badge></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">CAT6a 2m Cable</TableCell>
                        <TableCell>Cabling</TableCell>
                        <TableCell>120</TableCell>
                        <TableCell>50</TableCell>
                        <TableCell>DC-B / Storage</TableCell>
                        <TableCell><Badge variant="success">Healthy</Badge></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">2TB NVMe SSD</TableCell>
                        <TableCell>Server Spare</TableCell>
                        <TableCell>4</TableCell>
                        <TableCell>5</TableCell>
                        <TableCell>DC-A / Secure Storage</TableCell>
                        <TableCell><Badge variant="warning">Low Stock</Badge></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent className={stockTab === 'rma' ? 'block' : 'hidden'}>
                  <CardTitle>Return Merchandise Authorization (RMA)</CardTitle>
                  <CardDescription>Manage products to be returned, replaced, or repaired.</CardDescription>
                  <Table className="mt-4">
                    <TableHeader>
                      <TableRow>
                        <TableHead>RMA ID</TableHead>
                        <TableHead>Asset</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono">RMA-2024-001</TableCell>
                        <TableCell>Edge-FW-02</TableCell>
                        <TableCell>Palo Alto</TableCell>
                        <TableCell>Hardware Failure</TableCell>
                        <TableCell><Badge variant="warning">In Progress</Badge></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">RMA-2024-002</TableCell>
                        <TableCell>Core-Switch-01</TableCell>
                        <TableCell>Cisco</TableCell>
                        <TableCell>Firmware Bug</TableCell>
                        <TableCell><Badge variant="success">Completed</Badge></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent className={stockTab === 'reservations' ? 'block' : 'hidden'}>
                  <CardTitle>Asset Reservations</CardTitle>
                  <CardDescription>Reserve temporary assets and track fulfillment.</CardDescription>
                  <Table className="mt-4">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Res ID</TableHead>
                        <TableHead>Asset Type</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Date Range</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono">RES-99283</TableCell>
                        <TableCell>MacBook Pro 14"</TableCell>
                        <TableCell>John Doe</TableCell>
                        <TableCell>Apr 10 - Apr 20</TableCell>
                        <TableCell><Badge variant="outline">Reserved</Badge></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">RES-99284</TableCell>
                        <TableCell>iPad Air</TableCell>
                        <TableCell>Jane Smith</TableCell>
                        <TableCell>Apr 15 - Apr 18</TableCell>
                        <TableCell><Badge variant="success">Fulfilled</Badge></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg"><Server className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Servers</p>
                <p className="text-xl font-bold">482</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg"><Network className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Network</p>
                <p className="text-xl font-bold">156</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center space-x-4">
              <div className="p-2 bg-purple-100 rounded-lg"><Database className="w-5 h-5 text-purple-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Storage</p>
                <p className="text-xl font-bold">24</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center space-x-4">
              <div className="p-2 bg-yellow-100 rounded-lg"><Zap className="w-5 h-5 text-yellow-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Power/UPS</p>
                <p className="text-xl font-bold">12</p>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-2 bg-muted/50 rounded-md px-3 py-2 w-full md:w-96 border">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search by hostname, IP, or serial..." 
                    className="bg-transparent border-none outline-none text-sm w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2 w-full md:w-auto">
                  <div className="relative w-full md:w-[180px]">
                    <Filter className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <Select value={typeFilter} onValueChange={setTypeFilter} className="pl-8">
                      <SelectValue placeholder="Filter by Type" />
                      <SelectItem value="All Types">All Types</SelectItem>
                      {assetTypes.map(type => (
                        <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                      ))}
                    </Select>
                  </div>
                  <div className="relative w-full md:w-[180px]">
                    <Filter className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <Select value={vendorFilter} onValueChange={setVendorFilter} className="pl-8">
                      <SelectValue placeholder="Filter by Vendor" />
                      {uniqueVendors.map(vendor => (
                        <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                      ))}
                    </Select>
                  </div>
                  {selectedAssetIds.length > 0 && (
                    <div className="flex space-x-2">
                      {selectedAssetIds.length > 1 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"
                          onClick={() => setIsCompareModalOpen(true)}
                        >
                          <Columns className="w-4 h-4 mr-2" />
                          Compare ({selectedAssetIds.length})
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                        onClick={() => handleNormalize('selected')}
                        disabled={isNormalizing}
                      >
                        {isNormalizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        Normalize ({selectedAssetIds.length})
                      </Button>
                      <div className="relative">
                        <Edit className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-blue-600 pointer-events-none" />
                        <Select 
                          value=""
                          className="h-9 w-[160px] bg-blue-50 text-blue-600 border-blue-200 pl-8"
                          onValueChange={(val) => {
                            if (val) {
                              setBulkActionType(val as any);
                              setIsBulkEditOpen(true);
                            }
                          }}
                        >
                          <SelectItem value="">Bulk Actions</SelectItem>
                          <SelectItem value="type">Edit Type</SelectItem>
                          <SelectItem value="owner">Assign Owner</SelectItem>
                          <SelectItem value="status">Update Status</SelectItem>
                        </Select>
                      </div>
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                    <Tag className="w-4 h-4 mr-2" />
                    Categories
                  </Button>
                </div>
              </div>
              {isNormalizing && (
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Normalizing {selectedAssetIds.length > 0 ? `${selectedAssetIds.length} selected assets` : 'assets'}...</span>
                    <span>{Math.round(normalizationProgress)}%</span>
                  </div>
                  <Progress value={normalizationProgress} className="h-1" />
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox 
                          id="select-all" 
                          checked={selectedAssetIds.length === filteredAssets.length && filteredAssets.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedAssetIds(filteredAssets.map(a => a.id));
                            else setSelectedAssetIds([]);
                          }}
                        />
                      </TableHead>
                      <TableHead>Asset Tag</TableHead>
                      <TableHead>Hostname</TableHead>
                      <TableHead className="hidden md:table-cell">Serial Number</TableHead>
                      <TableHead className="hidden md:table-cell">IP Address</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="hidden sm:table-cell">OS / Firmware</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Tags</TableHead>
                      <TableHead className="hidden lg:table-cell">Risk</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.map((asset) => (
                      <TableRow 
                        key={asset.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedAsset(asset)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            id={`select-${asset.id}`}
                            checked={selectedAssetIds.includes(asset.id)}
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedAssetIds([...selectedAssetIds, asset.id]);
                              else setSelectedAssetIds(selectedAssetIds.filter(id => id !== asset.id));
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-muted-foreground">{asset.id}</TableCell>
                        <TableCell className="font-semibold">{asset.name}</TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs">{asset.serial || 'N/A'}</TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs">{asset.ip}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(asset.type)}
                            <span className="hidden sm:inline">{asset.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{asset.os}</TableCell>
                        <TableCell>{getStatusBadge(asset.status)}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {asset.tags?.map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{getRiskBadge(asset.risk)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={(e) => {
                            e.stopPropagation();
                            // Open context menu
                          }}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Bulk Edit Dialog */}
      <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="capitalize">Bulk Update {bulkActionType}</DialogTitle>
            <DialogDescription>
              This will update the {bulkActionType} for {selectedAssetIds.length} selected assets.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="bulk-value" className="text-right text-sm font-medium">
                New {bulkActionType}
              </label>
              {bulkActionType === 'status' ? (
                <select 
                  id="bulk-value"
                  className="col-span-3 bg-background border rounded-md px-3 py-2 text-sm"
                  value={bulkUpdateValue}
                  onChange={(e) => setBulkUpdateValue(e.target.value)}
                >
                  <option value="">Select Status</option>
                  <option value="Active">Active</option>
                  <option value="Warning">Warning</option>
                  <option value="Critical">Critical</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Disposed">Disposed</option>
                </select>
              ) : bulkActionType === 'type' ? (
                <select 
                  id="bulk-value"
                  className="col-span-3 bg-background border rounded-md px-3 py-2 text-sm"
                  value={bulkUpdateValue}
                  onChange={(e) => setBulkUpdateValue(e.target.value)}
                >
                  <option value="">Select Type</option>
                  <option value="Network">Network</option>
                  <option value="Server">Server</option>
                  <option value="Storage">Storage</option>
                  <option value="Firewall">Firewall</option>
                  <option value="Power">Power</option>
                </select>
              ) : (
                <Input 
                  id="bulk-value" 
                  className="col-span-3" 
                  placeholder="Enter new owner name..."
                  value={bulkUpdateValue}
                  onChange={(e) => setBulkUpdateValue(e.target.value)}
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkEditOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkUpdate} disabled={!bulkUpdateValue}>Confirm & Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compare Devices Modal */}
      <Dialog open={isCompareModalOpen} onOpenChange={setIsCompareModalOpen}>
        <DialogContent className="max-w-[90vw] w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compare Devices</DialogTitle>
            <DialogDescription>
              Side-by-side comparison of {selectedAssetIds.length} selected devices.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px] sticky left-0 bg-background z-10">Property</TableHead>
                  {selectedAssetIds.map(id => {
                    const asset = assetsData.find(a => a.id === id);
                    return <TableHead key={id} className="min-w-[250px]">{asset?.name || id}</TableHead>;
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Hardware */}
                <TableRow className="bg-muted/50"><TableCell colSpan={selectedAssetIds.length + 1} className="font-bold text-xs uppercase">Hardware</TableCell></TableRow>
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">Manufacturer</TableCell>
                  {selectedAssetIds.map(id => {
                    const asset = assetsData.find(a => a.id === id);
                    const allValues = selectedAssetIds.map(i => assetsData.find(a => a.id === i)?.manufacturer);
                    const isDifferent = new Set(allValues).size > 1;
                    return <TableCell key={id} className={isDifferent ? 'bg-yellow-50/50' : ''}>{asset?.manufacturer || 'N/A'}</TableCell>;
                  })}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">Model</TableCell>
                  {selectedAssetIds.map(id => {
                    const asset = assetsData.find(a => a.id === id);
                    const allValues = selectedAssetIds.map(i => assetsData.find(a => a.id === i)?.model);
                    const isDifferent = new Set(allValues).size > 1;
                    return <TableCell key={id} className={isDifferent ? 'bg-yellow-50/50' : ''}>{asset?.model || 'N/A'}</TableCell>;
                  })}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">Type</TableCell>
                  {selectedAssetIds.map(id => {
                    const asset = assetsData.find(a => a.id === id);
                    const allValues = selectedAssetIds.map(i => assetsData.find(a => a.id === i)?.type);
                    const isDifferent = new Set(allValues).size > 1;
                    return <TableCell key={id} className={isDifferent ? 'bg-yellow-50/50' : ''}>{asset?.type || 'N/A'}</TableCell>;
                  })}
                </TableRow>

                {/* Firmware / OS */}
                <TableRow className="bg-muted/50"><TableCell colSpan={selectedAssetIds.length + 1} className="font-bold text-xs uppercase">Firmware & OS</TableCell></TableRow>
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">OS / Version</TableCell>
                  {selectedAssetIds.map(id => {
                    const asset = assetsData.find(a => a.id === id);
                    const allValues = selectedAssetIds.map(i => assetsData.find(a => a.id === i)?.os);
                    const isDifferent = new Set(allValues).size > 1;
                    return <TableCell key={id} className={isDifferent ? 'bg-yellow-50/50' : ''}>{asset?.os || 'N/A'}</TableCell>;
                  })}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">Firmware</TableCell>
                  {selectedAssetIds.map(id => {
                    const asset = assetsData.find(a => a.id === id);
                    const allValues = selectedAssetIds.map(i => assetsData.find(a => a.id === i)?.firmware);
                    const isDifferent = new Set(allValues).size > 1;
                    return <TableCell key={id} className={isDifferent ? 'bg-yellow-50/50' : ''}>{asset?.firmware || 'N/A'}</TableCell>;
                  })}
                </TableRow>

                {/* Configuration */}
                <TableRow className="bg-muted/50"><TableCell colSpan={selectedAssetIds.length + 1} className="font-bold text-xs uppercase">Configuration</TableCell></TableRow>
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">IP Address</TableCell>
                  {selectedAssetIds.map(id => {
                    const asset = assetsData.find(a => a.id === id);
                    const allValues = selectedAssetIds.map(i => assetsData.find(a => a.id === i)?.ip);
                    const isDifferent = new Set(allValues).size > 1;
                    return <TableCell key={id} className={isDifferent ? 'bg-yellow-50/50 font-mono text-xs' : 'font-mono text-xs'}>{asset?.ip || 'N/A'}</TableCell>;
                  })}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">Location</TableCell>
                  {selectedAssetIds.map(id => {
                    const asset = assetsData.find(a => a.id === id);
                    const allValues = selectedAssetIds.map(i => assetsData.find(a => a.id === i)?.location);
                    const isDifferent = new Set(allValues).size > 1;
                    return <TableCell key={id} className={isDifferent ? 'bg-yellow-50/50' : ''}>{asset?.location || 'N/A'}</TableCell>;
                  })}
                </TableRow>

                {/* Performance / Status */}
                <TableRow className="bg-muted/50"><TableCell colSpan={selectedAssetIds.length + 1} className="font-bold text-xs uppercase">Performance & Status</TableCell></TableRow>
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">Status</TableCell>
                  {selectedAssetIds.map(id => {
                    const asset = assetsData.find(a => a.id === id);
                    const allValues = selectedAssetIds.map(i => assetsData.find(a => a.id === i)?.status);
                    const isDifferent = new Set(allValues).size > 1;
                    return <TableCell key={id} className={isDifferent ? 'bg-yellow-50/50' : ''}>{getStatusBadge(asset?.status || 'Unknown')}</TableCell>;
                  })}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">Risk Score</TableCell>
                  {selectedAssetIds.map(id => {
                    const asset = assetsData.find(a => a.id === id);
                    const allValues = selectedAssetIds.map(i => assetsData.find(a => a.id === i)?.risk);
                    const isDifferent = new Set(allValues).size > 1;
                    return <TableCell key={id} className={isDifferent ? 'bg-yellow-50/50' : ''}>{getRiskBadge(asset?.risk || 0)}</TableCell>;
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompareModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

