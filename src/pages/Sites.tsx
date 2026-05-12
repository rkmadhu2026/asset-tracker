import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Activity,
  ArrowUpRight,
  Building2,
  Edit2,
  GitBranch,
  Globe,
  Link2,
  MapPin,
  Network,
  Plus,
  Search,
  Server,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { sitesApi } from '../lib/api';
import { useSite } from '../components/SiteProvider';
import { useClient } from '../components/ClientProvider';
import type { Site, SiteEnv } from '../types/inventory';

type SiteStatus = NonNullable<Site['status']>;
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

type SiteFormState = {
  name: string;
  env: SiteEnv;
  region: string;
  ip: string;
  url: string;
  domain: string;
  status: SiteStatus;
  notes: string;
  clientIds: string[];
};

const ENV_COLOURS: Record<SiteEnv, BadgeVariant> = {
  PROD: 'success',
  DR: 'secondary',
  UAT: 'outline',
  DEV: 'outline',
  ISV: 'secondary',
};

const displayFont = "'Lora', Georgia, serif";

const emptyForm: SiteFormState = {
  name: '',
  env: 'PROD',
  region: '',
  ip: '',
  url: '',
  domain: '',
  status: 'Active',
  notes: '',
  clientIds: [],
};

function normalizeHref(value?: string) {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function statusVariant(status?: SiteStatus): BadgeVariant {
  return (status ?? 'Active') === 'Active' ? 'success' : 'destructive';
}

export function Sites() {
  const { sites, loading, refresh } = useSite();
  const { clients } = useClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = sites.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.ip?.includes(search) ||
    s.domain?.toLowerCase().includes(search.toLowerCase()) ||
    s.region?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEdit = (s: Site) => {
    setEditing(s);
    setForm({
      name: s.name,
      env: s.env,
      region: s.region || '',
      ip: s.ip || '',
      url: s.url || '',
      domain: s.domain || '',
      status: (s.status ?? 'Active') as SiteStatus,
      notes: s.notes || '',
      clientIds: s.clientIds || [],
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.clientIds.length === 0) e.clientIds = 'At least one client is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    try {
      const apiPayload = { ...form, client_ids: form.clientIds };
      if (editing) {
        await sitesApi.update(editing.id, apiPayload);
      } else {
        await sitesApi.create(apiPayload);
      }
      setIsModalOpen(false);
      refresh();
    } catch (err) {
      console.error('Failed to save site', err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await sitesApi.delete(deleteId);
      setDeleteId(null);
      refresh();
    } catch (err) {
      console.error('Failed to delete site', err);
    }
  };

  const toggleClientId = (id: string) => {
    setForm(f => ({
      ...f,
      clientIds: f.clientIds.includes(id)
        ? f.clientIds.filter(c => c !== id)
        : [...f.clientIds, id],
    }));
    if (errors.clientIds) setErrors(e => ({ ...e, clientIds: undefined }));
  };

  const prodCount = sites.filter(s => s.env === 'PROD').length;
  const drCount = sites.filter(s => s.env === 'DR').length;
  const otherCount = sites.length - prodCount - drCount;
  const activeCount = sites.filter(s => (s.status ?? 'Active') === 'Active').length;
  const inactiveCount = sites.length - activeCount;
  const domainCoverage = sites.length ? Math.round((sites.filter(s => !!s.domain).length / sites.length) * 100) : 0;
  const ipCoverage = sites.length ? Math.round((sites.filter(s => !!s.ip).length / sites.length) * 100) : 0;
  const urlCoverage = sites.length ? Math.round((sites.filter(s => !!s.url).length / sites.length) * 100) : 0;
  const regions = [...new Set(sites.map(s => s.region).filter(Boolean))];
  const filteredActiveCount = filtered.filter(s => (s.status ?? 'Active') === 'Active').length;
  const selectedSiteName = new URLSearchParams(window.location.search).get('site') || 'all sites';

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#2d261c] bg-[#18140f] p-5 text-white shadow-[0_24px_80px_-36px_rgba(24,20,15,0.8)] sm:p-6">
        <div className="absolute inset-0 opacity-70">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#c8622e]/35 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-[#f1c27d]/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] [background-size:22px_22px]" />
        </div>
        <div className="relative grid gap-5 lg:grid-cols-[1.35fr_0.85fr] lg:items-end">
          <div>
            <Badge className="mb-3 border-white/15 bg-white/10 text-white hover:bg-white/10">
              {selectedSiteName} &gt; Domain Status
            </Badge>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl" style={{ fontFamily: displayFont }}>
              Sites & Domain Status
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#d9cdbf] sm:text-base">
              Track environment readiness, DNS identity, public URLs, and client associations across every infrastructure site.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#eadfd2]">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                <Server className="h-3.5 w-3.5 text-[#f1c27d]" />
                {sites.length} total sites
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                <Globe className="h-3.5 w-3.5 text-[#f1c27d]" />
                {domainCoverage}% domain coverage
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#f1c27d]" />
                {regions.length} regions
              </span>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#bcae9f]">Availability posture</p>
                <p className="mt-2 text-4xl font-semibold">{activeCount}</p>
                <p className="text-sm text-[#d9cdbf]">active site records</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c8622e] shadow-[0_18px_40px_-18px_rgba(200,98,46,0.95)]">
                <Activity className="h-7 w-7" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-2xl bg-black/20 p-3">
                <div className="text-[#bcae9f]">PROD</div>
                <div className="mt-1 text-lg font-semibold">{prodCount}</div>
              </div>
              <div className="rounded-2xl bg-black/20 p-3">
                <div className="text-[#bcae9f]">DR</div>
                <div className="mt-1 text-lg font-semibold">{drCount}</div>
              </div>
              <div className="rounded-2xl bg-black/20 p-3">
                <div className="text-[#bcae9f]">Other</div>
                <div className="mt-1 text-lg font-semibold">{otherCount}</div>
              </div>
            </div>
            <Button onClick={openCreate} className="mt-5 w-full bg-white text-[#18140f] shadow-none hover:bg-[#f6eadc]">
              <Plus className="mr-2 h-4 w-4" />
              Add Site
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Sites', value: sites.length, detail: `${prodCount} PROD · ${drCount} DR · ${otherCount} non-prod`, icon: Server },
          { label: 'Active Status', value: activeCount, detail: `${inactiveCount} inactive site records`, icon: ShieldCheck },
          { label: 'Domain Coverage', value: `${domainCoverage}%`, detail: 'Sites with DNS/domain captured', icon: Globe },
          { label: 'IP Coverage', value: `${ipCoverage}%`, detail: 'Sites with reachable IP metadata', icon: Network },
        ].map(stat => (
          <Card key={stat.label} className="group overflow-hidden border-[#eadfce] bg-[#fffaf3] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-28px_rgba(82,63,42,0.55)]">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a8066]">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-[#1f1a13]">{stat.value}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f2dfcb] text-[#c8622e] transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105">
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-sm text-[#6f6256]">{stat.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden border-[#eadfce] bg-white">
          <CardHeader className="border-b border-[#f0e5d8] bg-[#fffaf3]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Environment Map</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Site records grouped by environment and operational role.</p>
              </div>
              <Badge variant="outline" className="border-[#e6d7c4] bg-white text-[#6f6256]">{regions.length} regions</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 md:grid-cols-2">
            {(['PROD', 'DR', 'UAT', 'DEV', 'ISV'] as SiteEnv[]).map(env => {
              const envSites = sites.filter(s => s.env === env);
              return (
                <div key={env} className="rounded-2xl border border-[#eee2d3] bg-gradient-to-r from-[#fffaf3] to-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1f1a13] text-white">
                        <Server className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-[#1f1a13]">{env}</div>
                        <div className="text-xs text-muted-foreground">{envSites.length} sites</div>
                      </div>
                    </div>
                    <Badge variant={ENV_COLOURS[env]}>{env}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {envSites.slice(0, 4).map(site => (
                      <span key={site.id} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#5f5347] ring-1 ring-[#eee2d3]">
                        <MapPin className="h-3 w-3 text-[#c8622e]" />
                        {site.name}
                      </span>
                    ))}
                    {envSites.length > 4 && (
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-muted-foreground ring-1 ring-[#eee2d3]">+{envSites.length - 4} more</span>
                    )}
                    {envSites.length === 0 && (
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-muted-foreground ring-1 ring-[#eee2d3]">No sites</span>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-[#eadfce] bg-[#1f1a13] text-white">
          <CardHeader>
            <CardTitle className="text-base text-white">Domain Readiness</CardTitle>
            <p className="mt-1 text-sm text-[#d8cbbd]">Completeness checks for browser access, routing, and inventory traceability.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { label: 'Domains', value: domainCoverage, icon: Globe },
              { label: 'IP addresses', value: ipCoverage, icon: Network },
              { label: 'URLs', value: urlCoverage, icon: Link2 },
            ].map(item => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-[#eadfd2]">
                    <item.icon className="h-4 w-4 text-[#f1c27d]" />
                    {item.label}
                  </span>
                  <span className="font-semibold">{item.value}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#f1c27d] to-[#c8622e]" style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
            <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-4">
              <div className="flex items-start gap-3">
                <Globe className="mt-0.5 h-5 w-5 text-[#f1c27d]" />
                <div>
                  <p className="text-sm font-semibold">DNS cue</p>
                  <p className="mt-1 text-sm leading-5 text-[#d8cbbd]">
                    Missing domains should be corrected before publishing site links through ingress or NodePort bookmarks.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-[#eadfce] bg-white shadow-[0_20px_80px_-45px_rgba(67,48,31,0.45)]">
        <CardHeader className="border-b border-[#f0e5d8] bg-[#fffaf3] pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-base">Site Registry</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Showing {filtered.length} records · {filteredActiveCount} active · {filtered.length - filteredActiveCount} inactive
              </p>
            </div>
            <div className="flex w-full items-center gap-2 rounded-2xl border border-[#e8dccd] bg-white px-4 py-3 shadow-inner lg:w-[430px]">
              <Search className="h-4 w-4 text-[#9a8066]" />
              <input
                type="text"
                placeholder="Search site, IP, domain, or region..."
                className="w-full border-none bg-transparent text-sm outline-none placeholder:text-[#b0a090]"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white">
                  <TableHead className="min-w-[260px]">Site</TableHead>
                  <TableHead>Env</TableHead>
                  <TableHead className="hidden min-w-[180px] sm:table-cell">Network</TableHead>
                  <TableHead className="hidden min-w-[180px] md:table-cell">Region</TableHead>
                  <TableHead className="hidden min-w-[220px] lg:table-cell">Clients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">Loading...</TableCell></TableRow>
                )}
                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      {sites.length === 0 ? 'No sites yet - run the migration script to seed data.' : 'No matching sites found.'}
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map(s => (
                  <TableRow key={s.id} className="group hover:bg-[#fffaf3]">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1f1a13] text-white">
                          <Server className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-[#1f1a13]">{s.name}</div>
                          {s.domain
                            ? <div className="mt-1 truncate text-xs text-muted-foreground">{s.domain}</div>
                            : <div className="mt-1 text-xs text-muted-foreground">Domain not captured</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ENV_COLOURS[s.env]}>{s.env}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="font-mono text-sm text-[#5f5347]">{s.ip || 'No IP'}</div>
                      {s.url && (
                        <a href={normalizeHref(s.url)} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-[190px] items-center gap-1.5 truncate text-xs font-medium text-primary hover:underline">
                          <Link2 className="h-3.5 w-3.5 shrink-0" />
                          {s.url.replace(/^https?:\/\//, '')}
                          <ArrowUpRight className="h-3 w-3 shrink-0" />
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {s.region
                        ? <div className="flex items-center gap-1.5 text-sm text-[#5f5347]"><MapPin className="h-3.5 w-3.5 text-[#c8622e]" />{s.region}</div>
                        : <span className="text-xs text-muted-foreground">No region</span>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex max-w-[280px] flex-wrap gap-1.5">
                        {(s.clientIds || []).length === 0 && <span className="text-xs text-muted-foreground">No clients linked</span>}
                        {(s.clientIds || []).map(cid => {
                          const c = clients.find(x => x.id === cid);
                          return (
                            <Badge key={cid} variant="outline" className="border-[#eadfce] bg-[#fffaf3] text-xs text-[#5f5347]">
                              {c?.parentClientId && <GitBranch className="mr-1 h-3 w-3" />}
                              {c?.name || cid}
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(s.status)}>{s.status || 'Active'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteId(s.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Site' : 'Add Site'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            {([
              { id: 'name', label: 'Name', required: true },
              { id: 'ip', label: 'IP Address' },
              { id: 'url', label: 'URL' },
              { id: 'domain', label: 'Domain' },
              { id: 'region', label: 'Region' },
              { id: 'notes', label: 'Notes' },
            ] as { id: keyof typeof emptyForm; label: string; required?: boolean }[]).map(f => (
              <div key={f.id} className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor={f.id} className="text-right pt-2">{f.label}{f.required && ' *'}</Label>
                <div className="col-span-3">
                  <Input
                    id={f.id}
                    value={form[f.id] as string}
                    onChange={e => { setForm({ ...form, [f.id]: e.target.value }); if (errors[f.id]) setErrors({ ...errors, [f.id]: undefined }); }}
                    className={errors[f.id] ? 'border-destructive' : ''}
                  />
                  {errors[f.id] && <p className="text-xs text-destructive mt-1">{errors[f.id]}</p>}
                </div>
              </div>
            ))}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Env</Label>
              <div className="col-span-3">
                <Select value={form.env} onValueChange={v => setForm({ ...form, env: v as SiteEnv })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['PROD','DR','UAT','DEV','ISV'] as SiteEnv[]).map(e => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Status</Label>
              <div className="col-span-3">
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as SiteStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Clients *</Label>
              <div className="col-span-3 space-y-1 max-h-40 overflow-y-auto border rounded-md p-2">
                {clients.map(c => (
                  <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted rounded px-1 py-0.5">
                    <input
                      type="checkbox"
                      checked={form.clientIds.includes(c.id)}
                      onChange={() => toggleClientId(c.id)}
                      className="accent-primary"
                    />
                    <span>{c.name}</span>
                    {c.parentClientId && <span className="text-xs text-muted-foreground">(sub-client)</span>}
                  </label>
                ))}
              </div>
              {errors.clientIds && <p className="col-start-2 col-span-3 text-xs text-destructive">{errors.clientIds}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Site</DialogTitle></DialogHeader>
          <p className="py-4 text-sm">Are you sure? Infrastructure devices referencing this site will lose their site link.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
