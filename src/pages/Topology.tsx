import React, { useCallback, useMemo, useEffect, useState } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  MarkerType,
  Node,
  Edge,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Network, Server, Shield, Globe, Database, Info, Zap, HardDrive, Layers, RefreshCw, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { infrastructureApi } from '../lib/api';
import { useClient } from '../components/ClientProvider';

// Custom Node Component for Network Devices
const DeviceNode = ({ data }: { data: any }) => {
  const Icon = data.icon || Network;
  
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-primary/20 min-w-[150px]">
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

const connections = [
  { id: 'c1', fromId: 'INF-101', toId: 'INF-102', type: 'Network', fromPort: 'Gi1/0/1', toPort: 'Gi0/1', speed: '10G', status: 'Up' },
  { id: 'c2', fromId: 'INF-101', toId: 'INF-103', type: 'Network', fromPort: 'Gi1/0/2', toPort: 'Gi0/48', speed: '1G', status: 'Up' },
  { id: 'c3', fromId: 'INF-101', toId: 'INF-104', type: 'Network', fromPort: 'Gi1/0/3', toPort: 'Eth1/1', speed: '25G', status: 'Up' },
  { id: 'c4', fromId: 'INF-101', toId: 'INF-108', type: 'Network', fromPort: 'Gi1/0/4', toPort: 'Port1', speed: '1G', status: 'Up' },
  { id: 'c5', fromId: 'INF-106', toId: 'INF-103', type: 'Network', fromPort: 'NIC1', toPort: 'Gi0/10', speed: '1G', status: 'Up' },
  { id: 'c6', fromId: 'INF-107', toId: 'INF-104', type: 'Network', fromPort: 'NIC1', toPort: 'Eth1/10', speed: '10G', status: 'Up' },
];

const initialEdges: Edge[] = connections.map(conn => ({
  id: conn.id,
  source: conn.fromId,
  target: conn.toId,
  label: conn.speed,
  animated: conn.status === 'Up',
  labelStyle: { fontSize: 8, fill: '#666' },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
  style: { stroke: conn.status === 'Up' ? '#94a3b8' : '#ef4444' }
}));

export function Topology() {
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { selectedClientId } = useClient();

  useEffect(() => {
    infrastructureApi.list(selectedClientId ? { clientId: selectedClientId } : {})
      .then(deviceList => {
        const newNodes: Node[] = deviceList.map((device: any, index: number) => {
          let x = 0;
          let y = 0;

          if (device.type === 'Router') {
            x = 400; y = 0;
          } else if (device.type === 'Firewall') {
            x = 600; y = 0;
          } else if (device.type === 'Switch') {
            if (device.model?.includes('9500')) {
              x = 400; y = 150;
            } else {
              x = device.id === 'INF-103' ? 200 : 600;
              y = 300;
            }
          } else if (device.type === 'Server') {
            x = device.id === 'INF-106' ? 100 : (device.id === 'INF-107' ? 700 : 400);
            y = 450;
          } else {
            x = (index % 4) * 200;
            y = Math.floor(index / 4) * 150 + 600;
          }

          let icon = Network;
          if (device.type === 'Router') icon = Globe;
          if (device.type === 'Server') icon = Server;
          if (device.type === 'Firewall') icon = Shield;
          if (device.type === 'Database') icon = Database;

          return {
            id: device.id,
            type: 'device',
            data: { label: device.name, model: device.model, ip: device.ip, status: device.status, icon },
            position: { x, y },
          };
        });
        setNodes(newNodes);
      })
      .catch(console.error);
  }, [selectedClientId, setNodes]);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/infrastructure')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Network Topology</h1>
            <p className="text-sm text-muted-foreground">Live visualization of infrastructure nodes and logical connections.</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => {}}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Layout
          </Button>
          <Button size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export SVG
          </Button>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden border-2 relative bg-card/50 backdrop-blur-sm">
        <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
          <div className="bg-background/95 backdrop-blur p-3 rounded-lg border shadow-lg text-[11px] space-y-2 min-w-[140px]">
            <p className="font-bold border-b pb-1 mb-1">Legend</p>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Active Node</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span>Warning State</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span>Offline/Critical</span>
            </div>
            <div className="flex items-center pt-1">
              <div className="w-6 h-0.5 bg-slate-400 mr-2"></div>
              <span>Physical Link</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-0.5 border-t border-dashed border-slate-400 mr-2"></div>
              <span>Logical Path</span>
            </div>
          </div>
        </div>
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-muted/5"
        >
          <Background color="#ccc" gap={20} />
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              if (node.type === 'device') return '#0043ce';
              return '#eee';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </Card>
    </div>
  );
}
