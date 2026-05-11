import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, Download, Clock, User, Settings, Activity, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { auditLogsApi, type AuditLogRow } from '@/lib/api';
import { FeatureHero } from '@/components/FeatureHero';

const TYPE_OPTIONS   = ['User', 'System', 'Config'];
const SEV_OPTIONS    = ['Info', 'Warning', 'Critical'];

function severityBadge(s: string) {
  if (s === 'Critical') return <Badge variant="destructive">Critical</Badge>;
  if (s === 'Warning')  return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Warning</Badge>;
  return <Badge variant="secondary">Info</Badge>;
}

function typeIcon(t: string) {
  if (t === 'User')   return <User className="w-4 h-4 text-[#C8622E]" />;
  if (t === 'Config') return <Settings className="w-4 h-4 text-[#D97706]" />;
  return <Activity className="w-4 h-4 text-[#16A34A]" />;
}

function detailsText(row: AuditLogRow): string {
  if (!row.details) return '';
  if (typeof row.details === 'object' && row.details.message) return row.details.message;
  return JSON.stringify(row.details);
}

function toCSV(rows: AuditLogRow[]): string {
  const header = ['Timestamp', 'User', 'Type', 'Severity', 'Action', 'Resource', 'Details'];
  const lines = rows.map(r => [
    format(new Date(r.created_at), 'yyyy-MM-dd HH:mm:ss'),
    r.user_email,
    r.type,
    r.severity,
    r.action,
    r.resource_type ? `${r.resource_type}/${r.resource_id ?? ''}` : '',
    detailsText(r).replace(/,/g, ';'),
  ].join(','));
  return [header.join(','), ...lines].join('\n');
}

export function AuditLog() {
  const [logs, setLogs]         = useState<AuditLogRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [typeFilter, setType]   = useState('');
  const [sevFilter, setSev]     = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await auditLogsApi.list({
        search:   search   || undefined,
        type:     typeFilter || undefined,
        severity: sevFilter  || undefined,
        limit: 200,
      });
      setLogs(rows);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, sevFilter]);

  useEffect(() => {
    const t = setTimeout(fetchLogs, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchLogs, search]);

  function handleExport() {
    const csv  = toCSV(logs);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const activeFilters = [typeFilter, sevFilter].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <FeatureHero
        eyebrow="Governance · Audit Trail"
        title="Audit Logs"
        description="Comprehensive record of user actions, system events, severity signals, and configuration changes."
        icon={Activity}
        stats={[
          { label: 'Loaded Events', value: logs.length, icon: Activity },
          { label: 'Filters', value: activeFilters, icon: Filter },
          { label: 'Critical', value: logs.filter(l => l.severity === 'Critical').length, icon: Settings },
        ]}
        actions={
        <Button variant="outline" onClick={handleExport} disabled={!logs.length}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
        }
      />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2 w-96 border">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search by user, action, or details…"
                className="bg-transparent border-none outline-none text-sm w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')}>
                  <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(v => !v)}
                className={activeFilters ? 'border-amber-400 text-amber-700' : ''}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter {activeFilters ? `(${activeFilters})` : ''}
              </Button>
              {activeFilters > 0 && (
                <Button variant="ghost" size="sm" onClick={() => { setType(''); setSev(''); }}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="flex gap-3 mt-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Type:</span>
                {TYPE_OPTIONS.map(t => (
                  <button
                    key={t}
                    onClick={() => setType(prev => prev === t ? '' : t)}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      typeFilter === t
                        ? 'bg-stone-800 text-white border-stone-800'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Severity:</span>
                {SEV_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => setSev(prev => prev === s ? '' : s)}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      sevFilter === s
                        ? 'bg-stone-800 text-white border-stone-800'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading audit logs…</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchLogs}>Retry</Button>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Clock className="w-8 h-8 opacity-30" />
              <p className="text-sm">No audit events found.</p>
              {(search || typeFilter || sevFilter) && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setType(''); setSev(''); }}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="w-24">Type</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="w-24">Severity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{log.user_email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {typeIcon(log.type)}
                        <span className="text-xs font-medium">{log.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-sm">{log.action}</TableCell>
                    <TableCell>{severityBadge(log.severity)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-sm truncate">
                      {detailsText(log)}
                      {log.resource_type && (
                        <span className="ml-2 text-xs text-stone-400 font-mono">
                          {log.resource_type}/{log.resource_id}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && logs.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 text-right">
              {logs.length} event{logs.length !== 1 ? 's' : ''}
              {logs.length === 200 ? ' (showing latest 200)' : ''}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
