import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit2, Trash2, MapPin, Server, ShieldCheck } from 'lucide-react';
import { sitesApi } from '../lib/api';
import { useSite } from '../components/SiteProvider';
import { useClient } from '../components/ClientProvider';
import type { Site, SiteEnv } from '../types/inventory';

type SiteStatus = NonNullable<Site['status']>;

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

const ENV_COLOURS: Record<SiteEnv, string> = {
  PROD: 'success',
  DR: 'secondary',
  UAT: 'outline',
  DEV: 'outline',
  ISV: 'secondary',
};

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sites</h1>
          <p className="text-muted-foreground mt-1">Physical and logical infrastructure instances across all clients.</p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Site
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">PROD Sites</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{prodCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Live production</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">DR Sites</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{drCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Disaster recovery</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">DEV / UAT / ISV</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{otherCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Non-production</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2 bg-muted/50 rounded-md px-3 py-2 w-full md:w-96 border">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, IP, domain, region..."
              className="bg-transparent border-none outline-none text-sm w-full"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Env</TableHead>
                  <TableHead className="hidden sm:table-cell">IP</TableHead>
                  <TableHead className="hidden md:table-cell">Region</TableHead>
                  <TableHead className="hidden lg:table-cell">Clients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                )}
                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {sites.length === 0 ? 'No sites yet — run the migration script to seed data.' : 'No results.'}
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Server className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <div>
                          <div className="font-semibold">{s.name}</div>
                          {s.domain && <div className="text-xs text-muted-foreground">{s.domain}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ENV_COLOURS[s.env] as any}>{s.env}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell font-mono text-sm">{s.ip || '—'}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {s.region && <div className="flex items-center gap-1 text-sm"><MapPin className="w-3 h-3 text-muted-foreground" />{s.region}</div>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(s.clientIds || []).map(cid => {
                          const c = clients.find(x => x.id === cid);
                          return <Badge key={cid} variant="outline" className="text-xs">{c?.name || cid}</Badge>;
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.status === 'Active' ? 'success' : 'destructive'}>{s.status || 'Active'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(s.id)}>
                          <Trash2 className="w-4 h-4" />
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
