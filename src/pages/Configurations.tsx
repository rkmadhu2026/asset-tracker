import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileCode2, History, Search, GitCommit, ArrowRightLeft, Sparkles, Loader2 } from 'lucide-react';
import { validateConfig } from '@/services/gemini';
import { detectDrift } from '@/services/driftService';
import { useAuth } from '@/components/AuthProvider';
import { configTasksApi, driftsApi, validationHistoryApi } from '../lib/api';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfigurationManager } from '@/components/ConfigurationManager';
import { useClient } from '@/components/ClientProvider';

const diffData = [
  { line: 1, type: 'unchanged', content: 'version 17.3' },
  { line: 2, type: 'unchanged', content: '!' },
  { line: 3, type: 'unchanged', content: 'hostname Core-Router-01' },
  { line: 4, type: 'unchanged', content: '!' },
  { line: 5, type: 'removed', content: 'snmp-server community public RO' },
  { line: 6, type: 'added', content: 'snmp-server group v3group v3 priv' },
  { line: 7, type: 'added', content: 'snmp-server user admin v3group v3 auth sha MyPass priv aes 128 MyPriv' },
  { line: 8, type: 'unchanged', content: '!' },
  { line: 9, type: 'modified', content: 'interface GigabitEthernet0/0/0' },
  { line: 10, type: 'unchanged', content: ' ip address 10.0.0.1 255.255.255.0' },
  { line: 11, type: 'unchanged', content: ' no shutdown' },
];

const devices = [
  { id: 'Core-Router-01', name: 'Core-Router-01', ip: '10.0.0.1', os: 'Cisco IOS' },
  { id: 'Edge-FW-02', name: 'Edge-FW-02', ip: '10.0.5.254', os: 'PAN-OS' },
  { id: 'Access-Switch-L2', name: 'Access-Switch-L2', ip: '10.0.10.1', os: 'Junos OS' },
];

const getMockConfig = (os: string) => {
  if (os === 'Cisco IOS') {
    return `version 17.3\n!\nhostname Core-Router-01\n!\nsnmp-server group v3group v3 priv\nsnmp-server user admin v3group v3 auth sha MyPass priv aes 128 MyPriv\n!\ninterface GigabitEthernet0/0/0\n ip address 10.0.0.1 255.255.255.0\n no shutdown`;
  } else if (os === 'PAN-OS') {
    return `set deviceconfig system hostname Edge-FW-02\nset deviceconfig system ip-address 10.0.5.254\nset network interface ethernet ethernet1/1 layer3 ip 10.0.5.254/24`;
  } else {
    return `system {\n  host-name Access-Switch-L2;\n}\ninterfaces {\n  ge-0/0/0 {\n    unit 0 {\n      family inet {\n        address 10.0.10.1/24;\n      }\n    }\n  }\n}`;
  }
};

export function Configurations() {
  const [isValidating, setIsValidating] = useState(false);
  const [validatingDeviceId, setValidatingDeviceId] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [drifts, setDrifts] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedLines, setSelectedLines] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState('diff');
  const { selectedClientId } = useClient();

  const { user } = useAuth();

  useEffect(() => {
    configTasksApi.list().then(setTasks).catch(console.error);
  }, [selectedClientId]);

  const syncToStartup = async () => {
    console.log("Syncing configuration to startup-config...");
    // Mock sync logic
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Sync complete.");
  };

  const addTask = async () => {
    if (!newTaskTitle) return;
    const created = await configTasksApi.create({
      title: newTaskTitle,
      priority: newTaskPriority,
      assigned_to: newTaskAssignedTo,
      due_date: newTaskDueDate || undefined,
      status: 'Pending',
    });
    setTasks(prev => [created, ...prev]);
    setNewTaskTitle('');
    setNewTaskAssignedTo('');
    setNewTaskDueDate('');
  };

  useEffect(() => {
    driftsApi.list().then(setDrifts).catch(console.error);
  }, [selectedClientId]);

  const isDriftDetected = (deviceId: string) => drifts.some(d => d.device_id === deviceId);

  useEffect(() => {
    validationHistoryApi.list().then(setHistory).catch(console.error);
  }, []);

  const handleValidate = async () => {
    setIsValidating(true);
    setValidationResult(null);
    const config = diffData.map(d => d.content).join('\n');
    const result = await validateConfig(config);
    const finalResult = result || "No issues found.";
    setValidationResult(finalResult);
    
    // Detect drift
    await detectDrift('Core-Router-01', config);
    
    if (user) {
      await validationHistoryApi.create({ result: finalResult, details: { config } });
    }

    // Trigger auto-sync if enabled and validation passed
    if (autoSyncEnabled && finalResult === "No issues found.") {
      await syncToStartup();
    }
    
    setIsValidating(false);
  };

  const handleDeviceValidate = async (device: any) => {
    setValidatingDeviceId(device.id);
    setSelectedDeviceId(device.id);
    setValidationResult(null);
    setShowHistory(false);
    
    const config = getMockConfig(device.os);
    const result = await validateConfig(config);
    const finalResult = result || "No issues found.";
    setValidationResult(finalResult);
    
    if (user) {
      await validationHistoryApi.create({ result: finalResult, details: { config } });
    }

    setValidatingDeviceId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuration Management</h1>
          <p className="text-muted-foreground mt-1">Version control, diffs, and automated backups.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Search className="w-4 h-4 mr-2" />
            Regex Search
          </Button>
          <Button>Backup Now</Button>
        </div>
      </div>

      <Tabs className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger active={activeTab === 'diff'} onClick={() => setActiveTab('diff')}>Configuration Diff</TabsTrigger>
          <TabsTrigger active={activeTab === 'manager'} onClick={() => setActiveTab('manager')}>Device Manager</TabsTrigger>
        </TabsList>

        <TabsContent className={activeTab === 'diff' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Device List */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Network Devices</CardTitle>
            <div className="relative mt-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Filter devices..." 
                className="w-full pl-9 pr-4 py-2 bg-muted/50 rounded-md border text-sm outline-none"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {devices.map(device => (
                <div 
                  key={device.id} 
                  className={cn("p-4 cursor-pointer", selectedDeviceId === device.id ? "bg-muted/30 border-l-4 border-primary" : "hover:bg-muted/10")}
                  onClick={() => setSelectedDeviceId(device.id)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">{device.name}</span>
                    <div className="flex items-center">
                      {isDriftDetected(device.id) ? (
                        <Button variant="outline" size="sm" className="text-[10px] h-6" onClick={(e) => { e.stopPropagation(); setSelectedDeviceId(device.id); }}>
                          Review Drift
                        </Button>
                      ) : (
                        <Badge variant="success" className="text-[10px] px-1.5 py-0">Synced</Badge>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 ml-2" 
                        onClick={(e) => { e.stopPropagation(); handleDeviceValidate(device); }}
                        disabled={validatingDeviceId === device.id}
                        title="Validate Configuration with Gemini"
                      >
                        {validatingDeviceId === device.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-primary" />}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{device.ip} • {device.os}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Configuration Tasks */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Configuration Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <input 
                type="text" 
                placeholder="New task..." 
                className="col-span-2 px-3 py-2 bg-muted/50 rounded-md border text-sm outline-none"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
              <input 
                type="text" 
                placeholder="Assigned to..." 
                className="px-3 py-2 bg-muted/50 rounded-md border text-sm outline-none"
                value={newTaskAssignedTo}
                onChange={(e) => setNewTaskAssignedTo(e.target.value)}
              />
              <input 
                type="date" 
                className="px-3 py-2 bg-muted/50 rounded-md border text-sm outline-none"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
              />
              <select 
                className="px-2 py-2 bg-muted/50 rounded-md border text-sm outline-none"
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              <Button onClick={addTask}>Add</Button>
            </div>
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id} className="flex justify-between items-center p-2 bg-muted/20 rounded border">
                  <div>
                    <span className="text-sm font-medium">{task.title}</span>
                    <p className="text-xs text-muted-foreground">{task.assigned_to || 'Unassigned'} • Due: {task.due_date || 'N/A'}</p>
                  </div>
                  <Badge variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'warning' : 'secondary'}>{task.priority}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Content: Diff View */}
        <Card className="col-span-2 flex flex-col">
          <CardHeader className="border-b bg-muted/10 flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-lg">Configuration Diff</CardTitle>
              <CardDescription>{selectedDeviceId || 'Select a device to review drift'}</CardDescription>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="font-mono bg-muted px-2 py-1 rounded">Startup Config</span>
                <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono bg-muted px-2 py-1 rounded border-primary/50 border">Running Config</span>
              </div>
              <Button size="sm" variant="outline" onClick={handleValidate} disabled={isValidating}>
                {isValidating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Validate with Gemini
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowHistory(!showHistory)}>
                <History className="w-4 h-4 mr-2" />
                {showHistory ? 'Hide History' : 'History'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm">
            {showHistory ? (
              <div className="p-4 space-y-4 text-foreground bg-background h-full overflow-auto">
                {history.length === 0 ? (
                  <p className="text-muted-foreground text-center py-10">No history found.</p>
                ) : (
                  history.map((h, i) => (
                    <div key={h.id || i} className="p-4 bg-muted rounded-lg space-y-2 border">
                      <div className="text-xs text-muted-foreground">
                        {h.created_at ? new Date(h.created_at).toLocaleString() : ''}
                      </div>
                      <div className="font-bold text-sm">Analysis Result:</div>
                      <div className="text-sm prose prose-sm">{h.result}</div>
                      <div className="font-bold text-sm mt-2">Configuration:</div>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto border border-border">{(h.details as any)?.config}</pre>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <>
                {validationResult && (
                  <div className="p-4 bg-muted/20 border-b border-primary/20 text-sm">
                    <h4 className="font-bold mb-2 flex items-center text-primary">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Gemini Analysis
                    </h4>
                    <div className="prose prose-sm max-w-none">
                      {validationResult}
                    </div>
                  </div>
                )}
                <div className="w-full font-mono text-sm border rounded-md overflow-hidden bg-background">
                  {diffData.map((line, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center py-1 border-b border-border/50 last:border-0 ${
                        line.type === 'added' ? 'bg-green-500/10 text-green-800' :
                        line.type === 'removed' ? 'bg-red-500/10 text-red-800' :
                        line.type === 'modified' ? 'bg-[#C8622E]/10 text-[#7A3B1E]' :
                        'text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center px-3">
                        <input 
                          type="checkbox" 
                          className="w-3.5 h-3.5 rounded-sm border-gray-300 cursor-pointer"
                          checked={selectedLines.includes(idx)}
                          onChange={() => {
                            if (selectedLines.includes(idx)) {
                              setSelectedLines(selectedLines.filter(l => l !== idx));
                            } else {
                              setSelectedLines([...selectedLines, idx]);
                            }
                          }}
                        />
                      </div>
                      <div className="w-12 text-right pr-3 text-muted-foreground select-none border-r border-border/50 text-xs">
                        {line.line}
                      </div>
                      <div className={`w-8 text-center font-bold select-none text-xs ${
                        line.type === 'added' ? 'text-green-600' :
                        line.type === 'removed' ? 'text-red-600' :
                        line.type === 'modified' ? 'text-[#C8622E]' : 'text-transparent'
                      }`}>
                        {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : line.type === 'modified' ? '•' : ' '}
                      </div>
                      <div className="whitespace-pre flex-1 pl-2">{line.content}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
          <div className="p-4 border-t bg-muted/10 flex justify-between items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                console.log('Reconciling lines:', selectedLines.map(idx => diffData[idx]));
                setSelectedLines([]);
              }}
              disabled={selectedLines.length === 0}
            >
              Reconcile Selected
            </Button>
            <div className="flex space-x-4 text-xs font-medium">
              <span className="flex items-center text-green-500"><div className="w-3 h-3 bg-green-500/20 border border-green-500 mr-1 rounded-sm"></div> Added</span>
              <span className="flex items-center text-red-500"><div className="w-3 h-3 bg-red-500/20 border border-red-500 mr-1 rounded-sm"></div> Removed</span>
              <span className="flex items-center text-[#C8622E]"><div className="w-3 h-3 bg-[#C8622E]/20 border border-[#C8622E] mr-1 rounded-sm"></div> Modified</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="autoSync" 
                  checked={autoSyncEnabled} 
                  onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                />
                <label htmlFor="autoSync" className="text-xs font-medium">Auto-Sync Approved</label>
              </div>
              <div className="flex space-x-2">
                <Button variant="destructive" size="sm">Rollback</Button>
                <Button variant="default" size="sm" onClick={syncToStartup}>Sync to Startup</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
        </TabsContent>

        <TabsContent className={activeTab === 'manager' ? 'block' : 'hidden'}>
          <ConfigurationManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
