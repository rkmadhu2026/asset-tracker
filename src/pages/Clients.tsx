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
  Mail,
  MapPin,
  Network,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { clientsApi } from '../lib/api';
import { useClient } from '../components/ClientProvider';
import type { Client, ClientStatus } from '../types/inventory';

const emptyForm = {
  name: '', slug: '', status: 'Active' as ClientStatus,
  parentClientId: '', legalName: '', address: '', website: '',
  primaryContactEmail: '', notes: '',
};

const displayFont = "'Lora', Georgia, serif";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'CL';
}

function normalizeWebsiteHref(website?: string) {
  if (!website) return '';
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

function statusVariant(status: ClientStatus) {
  if (status === 'Active') return 'success';
  if (status === 'Suspended') return 'warning';
  return 'destructive';
}

export function Clients() {
  const { clients, rootClients, refresh } = useClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<typeof emptyForm>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug?.toLowerCase().includes(search.toLowerCase()) ||
    c.legalName?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({
      name: c.name, slug: c.slug, status: c.status,
      parentClientId: c.parentClientId || '',
      legalName: c.legalName || '', address: c.address || '',
      website: c.website || '', primaryContactEmail: c.primaryContactEmail || '',
      notes: c.notes || '',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const validate = () => {
    const e: Partial<typeof emptyForm> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.slug.trim()) e.slug = 'Slug is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const payload = {
      ...form,
      parentClientId: form.parentClientId || null,
    };

    try {
      if (editing) {
        await clientsApi.update(editing.id, payload);
      } else {
        await clientsApi.create({ ...payload, slug: form.slug });
      }
      setIsModalOpen(false);
      refresh();
    } catch (err) {
      console.error('Failed to save client', err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await clientsApi.delete(deleteId);
      setDeleteId(null);
      refresh();
    } catch (err) {
      console.error('Failed to delete client', err);
    }
  };

  const prodClients = clients.filter(c => !c.parentClientId);
  const subClientCount = clients.filter(c => !!c.parentClientId).length;
  const activeCount = clients.filter(c => c.status === 'Active').length;
  const inactiveCount = clients.filter(c => c.status === 'Inactive').length;
  const suspendedCount = clients.filter(c => c.status === 'Suspended').length;
  const legalCoverage = clients.length ? Math.round((clients.filter(c => !!c.legalName).length / clients.length) * 100) : 0;
  const contactCoverage = clients.length ? Math.round((clients.filter(c => !!c.primaryContactEmail).length / clients.length) * 100) : 0;
  const webCoverage = clients.length ? Math.round((clients.filter(c => !!c.website).length / clients.length) * 100) : 0;
  const topFamilies = prodClients
    .map(parent => ({
      parent,
      children: clients.filter(c => c.parentClientId === parent.id),
    }))
    .sort((a, b) => b.children.length - a.children.length);
  const largestFamily = topFamilies[0];
  const filteredRootCount = filtered.filter(c => !c.parentClientId).length;
  const filteredSubCount = filtered.filter(c => !!c.parentClientId).length;

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#2d261c] bg-[#18140f] p-6 text-white shadow-[0_24px_80px_-36px_rgba(24,20,15,0.8)] sm:p-8">
        <div className="absolute inset-0 opacity-70">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#c8622e]/35 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-[#f1c27d]/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] [background-size:22px_22px]" />
        </div>
        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
          <div>
            <Badge className="mb-5 border-white/15 bg-white/10 text-white hover:bg-white/10">
              Client command center
            </Badge>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl" style={{ fontFamily: displayFont }}>
              Client Management
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#d9cdbf] sm:text-base">
              Manage clients, sub-clients, legal identity, and digital touchpoints from one operational cockpit.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-[#eadfd2]">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                <Users className="h-3.5 w-3.5 text-[#f1c27d]" />
                {rootClients.length} top-level groups
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                <Network className="h-3.5 w-3.5 text-[#f1c27d]" />
                {subClientCount} sub-client links
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#f1c27d]" />
                {legalCoverage}% legal coverage
              </span>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#bcae9f]">Network health</p>
                <p className="mt-2 text-4xl font-semibold">{activeCount}</p>
                <p className="text-sm text-[#d9cdbf]">active client records</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c8622e] shadow-[0_18px_40px_-18px_rgba(200,98,46,0.95)]">
                <Activity className="h-7 w-7" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl bg-black/20 p-3">
                <div className="text-[#bcae9f]">Inactive</div>
                <div className="mt-1 text-lg font-semibold">{inactiveCount}</div>
              </div>
              <div className="rounded-2xl bg-black/20 p-3">
                <div className="text-[#bcae9f]">Suspended</div>
                <div className="mt-1 text-lg font-semibold">{suspendedCount}</div>
              </div>
            </div>
            <Button onClick={openCreate} className="mt-5 w-full bg-white text-[#18140f] shadow-none hover:bg-[#f6eadc]">
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Clients', value: clients.length, detail: `${rootClients.length} top-level · ${subClientCount} sub-clients`, icon: Building2 },
          { label: 'Active Clients', value: activeCount, detail: `${clients.length ? Math.round((activeCount / clients.length) * 100) : 0}% of portfolio`, icon: ShieldCheck },
          { label: 'Largest Family', value: largestFamily?.children.length ?? 0, detail: largestFamily ? `${largestFamily.parent.name} sub-clients` : 'No hierarchy yet', icon: GitBranch },
          { label: 'Contact Coverage', value: `${contactCoverage}%`, detail: 'Primary contact emails captured', icon: Mail },
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
                <CardTitle className="text-base">Client Constellation</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Top-level clients with their nested business entities.</p>
              </div>
              <Badge variant="outline" className="border-[#e6d7c4] bg-white text-[#6f6256]">{topFamilies.length} groups</Badge>
            </div>
          </CardHeader>
          <CardContent className="max-h-[360px] space-y-3 overflow-y-auto p-4">
            {topFamilies.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#e6d7c4] p-6 text-center text-sm text-muted-foreground">
                No client hierarchy yet.
              </div>
            ) : topFamilies.map(({ parent, children }) => (
              <div key={parent.id} className="rounded-2xl border border-[#eee2d3] bg-gradient-to-r from-[#fffaf3] to-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1f1a13] text-sm font-semibold text-white">
                      {initials(parent.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[#1f1a13]">{parent.name}</div>
                      <div className="truncate font-mono text-xs text-muted-foreground">{parent.slug}</div>
                    </div>
                  </div>
                  <Badge variant={statusVariant(parent.status)}>{parent.status}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {children.length === 0 ? (
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-muted-foreground ring-1 ring-[#eee2d3]">No sub-clients</span>
                  ) : children.map(child => (
                    <span key={child.id} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#5f5347] ring-1 ring-[#eee2d3]">
                      <GitBranch className="h-3 w-3 text-[#c8622e]" />
                      {child.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-[#eadfce] bg-[#1f1a13] text-white">
          <CardHeader>
            <CardTitle className="text-base text-white">Data Readiness</CardTitle>
            <p className="mt-1 text-sm text-[#d8cbbd]">Operational completeness across legal, contact, and web metadata.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { label: 'Legal names', value: legalCoverage, icon: Building2 },
              { label: 'Contact emails', value: contactCoverage, icon: Mail },
              { label: 'Websites', value: webCoverage, icon: Globe },
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
                <MapPin className="mt-0.5 h-5 w-5 text-[#f1c27d]" />
                <div>
                  <p className="text-sm font-semibold">Governance cue</p>
                  <p className="mt-1 text-sm leading-5 text-[#d8cbbd]">
                    Prioritize missing legal names and primary contacts before onboarding more site relationships.
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
              <CardTitle className="text-base">Client Registry</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Showing {filtered.length} records · {filteredRootCount} parent · {filteredSubCount} sub-client
              </p>
            </div>
            <div className="flex w-full items-center gap-2 rounded-2xl border border-[#e8dccd] bg-white px-4 py-3 shadow-inner lg:w-[430px]">
              <Search className="h-4 w-4 text-[#9a8066]" />
              <input
                type="text"
                placeholder="Search name, slug, or legal name..."
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
                  <TableHead className="min-w-[260px]">Client</TableHead>
                  <TableHead className="hidden min-w-[220px] md:table-cell">Legal Identity</TableHead>
                  <TableHead className="hidden min-w-[180px] sm:table-cell">Parent</TableHead>
                  <TableHead className="hidden min-w-[200px] lg:table-cell">Digital</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      {clients.length === 0 ? 'No clients yet - run the migration script to seed data.' : 'No matching clients found.'}
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map(c => {
                  const parent = c.parentClientId ? clients.find(p => p.id === c.parentClientId) : null;
                  return (
                    <TableRow key={c.id} className="group hover:bg-[#fffaf3]">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={c.parentClientId ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f2dfcb] text-sm font-semibold text-[#9f4f25]' : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1f1a13] text-sm font-semibold text-white'}>
                            {initials(c.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {c.parentClientId
                                ? <GitBranch className="h-3.5 w-3.5 shrink-0 text-[#c8622e]" />
                                : <Building2 className="h-3.5 w-3.5 shrink-0 text-[#c8622e]" />}
                              <span className="truncate font-semibold text-[#1f1a13]">{c.name}</span>
                            </div>
                            <div className="mt-1 truncate font-mono text-xs text-muted-foreground">{c.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="max-w-[260px] truncate text-sm text-[#5f5347]">{c.legalName || 'Not captured'}</div>
                        {c.address && <div className="mt-1 max-w-[260px] truncate text-xs text-muted-foreground">{c.address}</div>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {parent
                          ? <Badge variant="outline" className="border-[#eadfce] bg-[#fffaf3] text-xs text-[#5f5347]">{parent.name}</Badge>
                          : <span className="text-xs text-muted-foreground">Top-level client</span>}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="space-y-1.5">
                          {c.website
                            ? (
                              <a href={normalizeWebsiteHref(c.website)} target="_blank" rel="noreferrer" className="inline-flex max-w-[220px] items-center gap-1.5 truncate text-xs font-medium text-primary hover:underline">
                                <Globe className="h-3.5 w-3.5 shrink-0" />
                                {c.website.replace(/^https?:\/\//, '')}
                                <ArrowUpRight className="h-3 w-3 shrink-0" />
                              </a>
                            )
                            : <div className="text-xs text-muted-foreground">No website</div>}
                          {c.primaryContactEmail && (
                            <div className="flex max-w-[220px] items-center gap-1.5 truncate text-xs text-muted-foreground">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              {c.primaryContactEmail}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteId(c.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Client' : 'Add Client'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {([
              { id: 'name', label: 'Name', required: true },
              { id: 'slug', label: 'Slug', required: true },
              { id: 'legalName', label: 'Legal Name' },
              { id: 'address', label: 'Address' },
              { id: 'website', label: 'Website' },
              { id: 'primaryContactEmail', label: 'Contact Email' },
              { id: 'notes', label: 'Notes' },
            ] as { id: keyof typeof emptyForm; label: string; required?: boolean }[]).map(f => (
              <div key={f.id} className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor={f.id} className="text-right pt-2">{f.label}{f.required && ' *'}</Label>
                <div className="col-span-3">
                  <Input
                    id={f.id}
                    value={form[f.id]}
                    onChange={e => { setForm({ ...form, [f.id]: e.target.value }); if (errors[f.id]) setErrors({ ...errors, [f.id]: undefined }); }}
                    className={errors[f.id] ? 'border-destructive' : ''}
                  />
                  {errors[f.id] && <p className="text-xs text-destructive mt-1">{errors[f.id]}</p>}
                </div>
              </div>
            ))}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Parent Client</Label>
              <div className="col-span-3">
                <Select value={form.parentClientId} onValueChange={v => setForm({ ...form, parentClientId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (top-level)</SelectItem>
                    {clients.filter(c => !editing || c.id !== editing.id).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Status</Label>
              <div className="col-span-3">
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as ClientStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
          <DialogHeader><DialogTitle>Delete Client</DialogTitle></DialogHeader>
          <p className="py-4 text-sm">Are you sure? This will not delete sub-clients or sites, but they will lose their parent reference.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
