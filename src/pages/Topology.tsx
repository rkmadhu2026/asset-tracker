import React, { useCallback, useEffect, useState } from 'react';
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
  Position,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Network, Server, Shield, Globe, Database, HardDrive, RefreshCw, ZoomIn, Loader2 } from 'lucide-react';
import { infrastructureApi, type Device } from '../lib/api';
import { useClient } from '../components/ClientProvider';
import { FeatureHero } from '@/components/FeatureHero';

// ── helpers ──────────────────────────────────────────────────────────────────

function tierOf(type: string): number {
  const t = (type || '').toLowerCase();
  if (t === 'router')   return 0;
  if (t === 'firewall') return 1;
  if (t === 'switch')   return 2;
  if (t === 'storage')  return 3;
  if (t === 'server')   return 4;
  return 5; // VM, Device, etc.
}

function iconFor(type: string) {
  const t = (type || '').toLowerCase();
  if (t === 'router')   return Globe;
  if (t === 'firewall') return Shield;
  if (t === 'server')   return Server;
  if (t === 'storage')  return Database;
  if (t === 'switch')   return Network;
  return HardDrive;
}

function subnet3(ip?: string): string {
  if (!ip) return '';
  return ip.split('.').slice(0, 3).join('.');
}

const PHYS_STYLE = {
  type: 'smoothstep',
  animated: false,
  labelStyle: { fontSize: 7, fill: '#A09688' },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#8C7E6E' },
  style: { stroke: '#8C7E6E', strokeWidth: 2 },
};

const LOGIC_STYLE = {
  type: 'smoothstep',
  animated: true,
  labelStyle: { fontSize: 7, fill: '#C8622E' },
  style: { stroke: '#C8622E', strokeWidth: 1.5 },
};

// Round-robin: each lower device gets ONE upper device
function assignRR<T>(upper: T[], lower: T[]): Array<{ u: T; l: T }> {
  return lower.map((l, i) => ({ u: upper[i % upper.length], l }));
}

function buildEdges(devices: Device[]): Edge[] {
  if (devices.length < 2) return [];
  const edges: Edge[] = [];
  const physPairs = new Set<string>();

  const byTier: Record<number, Device[]> = {};
  for (const d of devices) {
    const t = tierOf(d.type);
    (byTier[t] ??= []).push(d);
  }
  const tierNums = Object.keys(byTier).map(Number).sort((a, b) => a - b);

  // Physical: round-robin each lower tier onto upper tier devices
  for (let i = 0; i < tierNums.length - 1; i++) {
    const upper = byTier[tierNums[i]];
    const lower = byTier[tierNums[i + 1]];
    for (const { u, l } of assignRR(upper, lower)) {
      const id = `phys-${u.id}-${l.id}`;
      edges.push({ id, source: u.id, target: l.id, label: 'Physical', ...PHYS_STYLE, data: { linkType: 'physical' } });
      physPairs.add(`${u.id}||${l.id}`);
      physPairs.add(`${l.id}||${u.id}`);
    }
  }

  // Fallback: if still 0 edges (all same type), chain devices
  if (edges.length === 0) {
    const sorted = [...devices].sort((a, b) => tierOf(a.type) - tierOf(b.type));
    for (let i = 0; i < sorted.length - 1; i++) {
      const id = `chain-${i}`;
      edges.push({ id, source: sorted[i].id, target: sorted[i + 1].id, label: 'Link', ...PHYS_STYLE, data: { linkType: 'physical' } });
      physPairs.add(`${sorted[i].id}||${sorted[i + 1].id}`);
    }
  }

  // Logical: devices sharing a /24 subnet (capped at 8 per device to avoid clutter)
  const subnetMap: Record<string, Device[]> = {};
  for (const d of devices) {
    const s = subnet3(d.ip);
    if (!s) continue;
    (subnetMap[s] ??= []).push(d);
  }
  const logicCount: Record<string, number> = {};
  const seen = new Set<string>();

  for (const group of Object.values(subnetMap)) {
    if (group.length < 2) continue;
    for (let a = 0; a < group.length; a++) {
      for (let b = a + 1; b < group.length; b++) {
        const da = group[a], db = group[b];
        if (physPairs.has(`${da.id}||${db.id}`)) continue;
        const key = [da.id, db.id].sort().join('~~');
        if (seen.has(key)) continue;
        if ((logicCount[da.id] ?? 0) >= 4 || (logicCount[db.id] ?? 0) >= 4) continue;
        seen.add(key);
        logicCount[da.id] = (logicCount[da.id] ?? 0) + 1;
        logicCount[db.id] = (logicCount[db.id] ?? 0) + 1;
        edges.push({ id: `logic-${key}`, source: da.id, target: db.id, label: 'Logical', ...LOGIC_STYLE, data: { linkType: 'logical' } });
      }
    }
  }

  return edges;
}

function layoutNodes(devices: Device[]): Node[] {
  const byTier: Record<number, Device[]> = {};
  for (const d of devices) {
    const t = tierOf(d.type);
    (byTier[t] ??= []).push(d);
  }
  const tierNums = Object.keys(byTier).map(Number).sort((a, b) => a - b);
  const TIER_H  = 180;
  const COL_W   = 200;
  const MAX_PER_ROW = 10; // wrap long rows
  const nodes: Node[] = [];

  tierNums.forEach((t, ti) => {
    const group = byTier[t];
    group.forEach((d, i) => {
      const col = i % MAX_PER_ROW;
      const row = Math.floor(i / MAX_PER_ROW);
      nodes.push({
        id: d.id,
        type: 'device',
        position: { x: col * COL_W, y: ti * TIER_H + row * 90 },
        data: { label: d.name, model: d.model, ip: d.ip, status: d.status, type: d.type, icon: iconFor(d.type) },
      });
    });
  });
  return nodes;
}

// ── Custom Node ───────────────────────────────────────────────────────────────

const DeviceNode = ({ data }: { data: any }) => {
  const Icon = data.icon || HardDrive;
  const dot =
    data.status === 'Active'  ? 'bg-green-500'  :
    data.status === 'Warning' ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="px-3 py-2 rounded-lg min-w-[155px] cursor-grab select-none"
      style={{ background: '#FDFAF7', border: '1px solid #E8E1D8', boxShadow: '0 1px 4px rgba(41,37,36,0.08)' }}>
      <Handle type="target" position={Position.Top}    className="!w-2 !h-2 !bg-[#A09688] !border-0" />
      <div className="flex items-center gap-2">
        <div className="rounded-md p-1.5 shrink-0" style={{ background: '#F0EAE0' }}>
          <Icon className="h-3.5 w-3.5 text-[#6B6458]" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold leading-tight truncate text-[#19160F]">{data.label}</p>
          <p className="text-[9px] text-[#A09688] truncate">{data.type}</p>
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          <span className="text-[8px] text-[#6B6458]">{data.status}</span>
        </div>
        <span className="text-[8px] text-[#A09688] font-mono">{data.ip || '—'}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-[#A09688] !border-0" />
    </div>
  );
};

const nodeTypes = { device: DeviceNode };

// ── Inner component ───────────────────────────────────────────────────────────

const NODE_LIMIT = 80;

function TopologyInner() {
  const { fitView } = useReactFlow();
  const { selectedClientId } = useClient();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const [stats, setStats] = useState({ nodes: 0, physical: 0, logical: 0 });
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async (clientId: string | null) => {
    // Require a client selection — "All Clients" would render 350+ nodes
    if (!clientId) {
      setNodes([]);
      setEdges([]);
      setStats({ nodes: 0, physical: 0, logical: 0 });
      setTruncated(false);
      return;
    }
    setLoading(true);
    try {
      let devices = await infrastructureApi.list({ clientId });
      const wasTruncated = devices.length > NODE_LIMIT;
      if (wasTruncated) devices = devices.slice(0, NODE_LIMIT);
      setTruncated(wasTruncated);
      const newNodes = layoutNodes(devices);
      const newEdges = buildEdges(devices);
      setNodes(newNodes);
      setEdges(newEdges);
      setStats({
        nodes:    devices.length,
        physical: newEdges.filter(e => (e.data as any)?.linkType === 'physical').length,
        logical:  newEdges.filter(e => (e.data as any)?.linkType === 'logical').length,
      });
      setLoaded(l => !l);
    } catch (e) {
      console.error('Topology load failed:', e);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);

  // fitView after nodes settle — only runs when loaded toggles (after data arrives)
  useEffect(() => {
    if (nodes.length > 0) setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 80);
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(selectedClientId); }, [selectedClientId, load]);

  const onConnect = useCallback(
    (params: any) => setEdges(eds => addEdge(params, eds)),
    [setEdges],
  );

  const noClient = !selectedClientId;

  return (
    <div className="min-h-[calc(100vh-10rem)] flex flex-col gap-3">
      <FeatureHero
        eyebrow="Network · Topology"
        title="Network Topology"
        description="Visualize physical links, logical paths, device health, and relationship maps across selected clients."
        icon={Network}
        stats={[
          { label: 'Nodes', value: stats.nodes, icon: Network },
          { label: 'Physical', value: stats.physical, icon: ZoomIn },
          { label: 'Logical', value: stats.logical, icon: RefreshCw },
        ]}
        actions={
          <>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          {!noClient && (
            <>
              <Badge variant="outline">{stats.nodes} nodes</Badge>
              <Badge variant="outline" className="text-[#6B6458] border-[#A09688]">{stats.physical} physical</Badge>
              <Badge variant="outline" className="text-[#C8622E] border-[#C8622E]/40">{stats.logical} logical</Badge>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => load(selectedClientId)} disabled={loading || noClient}>
            <RefreshCw className="w-4 h-4 mr-1" />Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => fitView({ padding: 0.12, duration: 400 })} disabled={noClient || stats.nodes === 0}>
            <ZoomIn className="w-4 h-4 mr-1" />Fit
          </Button>
          </>
        }
      />

      {/* Truncation warning */}
      {truncated && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <Network className="h-3.5 w-3.5 shrink-0" />
          Showing first {NODE_LIMIT} devices — select a more specific client to see all nodes.
        </div>
      )}

      <Card className="min-h-[620px] flex-1 overflow-hidden border relative">
        {/* Legend */}
        <div className="absolute top-3 left-3 z-10 rounded-lg p-3 text-[11px] space-y-1.5 min-w-[140px]"
          style={{ background: 'rgba(253,250,247,0.96)', border: '1px solid #E8E1D8', boxShadow: '0 2px 8px rgba(41,37,36,0.1)' }}>
          <p className="font-semibold text-xs pb-1" style={{ borderBottom: '1px solid #E8E1D8', color: '#19160F' }}>Legend</p>
          <div className="flex items-center gap-2 text-[#6B6458]"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/><span>Active</span></div>
          <div className="flex items-center gap-2 text-[#6B6458]"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"/><span>Warning</span></div>
          <div className="flex items-center gap-2 text-[#6B6458]"><div className="w-1.5 h-1.5 rounded-full bg-red-500"/><span>Offline</span></div>
          <div className="pt-1.5 space-y-1.5" style={{ borderTop: '1px solid #E8E1D8' }}>
            <div className="flex items-center gap-2 text-[#6B6458]">
              <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#8C7E6E" strokeWidth="2"/></svg>
              <span>Physical</span>
            </div>
            <div className="flex items-center gap-2 text-[#6B6458]">
              <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#C8622E" strokeWidth="2" strokeDasharray="5 3"/></svg>
              <span>Logical</span>
            </div>
          </div>
        </div>

        {/* No client selected */}
        {noClient && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-muted-foreground gap-3">
            <Network className="w-10 h-10 opacity-30" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Select a client to view topology</p>
              <p className="text-xs mt-1">Use the Client Context selector in the sidebar.</p>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/60">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state — client selected but no devices */}
        {!loading && !noClient && stats.nodes === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-muted-foreground">
            <Network className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No infrastructure devices found for this client</p>
            <p className="text-xs mt-1">Add devices on the Infrastructure page first.</p>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          minZoom={0.05}
          maxZoom={2.5}
          style={{ background: '#FAF7F3' }}
        >
          <Background color="#E8E1D8" gap={24} />
          <Controls />
          <MiniMap
            nodeColor={n => {
              const s = (n.data as any)?.status;
              return s === 'Active' ? '#22c55e' : s === 'Warning' ? '#eab308' : '#ef4444';
            }}
            maskColor="rgba(0,0,0,0.05)"
          />
        </ReactFlow>
      </Card>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export function Topology() {
  return (
    <ReactFlowProvider>
      <TopologyInner />
    </ReactFlowProvider>
  );
}
