import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit2, Trash2, Globe, Building2, GitBranch } from 'lucide-react';
import { clientsApi } from '../lib/api';
import { useClient } from '../components/ClientProvider';
import type { Client, ClientStatus } from '../types/inventory';

const REGIONS = ['Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'GIFT City', 'Hyderabad'];

const emptyForm = {
  name: '', slug: '', status: 'Active' as ClientStatus,
  parentClientId: '', legalName: '', address: '', website: '',
  primaryContactEmail: '', notes: '',
};

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Management</h1>
          <p className="text-muted-foreground mt-1">Manage clients, sub-clients, and their legal details.</p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{rootClients.length} top-level · {subClientCount} sub-clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">of {clients.length} clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">ISV Sub-clients</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{subClientCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Nested under parent clients</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 bg-muted/50 rounded-md px-3 py-2 w-full md:w-96 border">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, slug, or legal name..."
                className="bg-transparent border-none outline-none text-sm w-full"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden md:table-cell">Legal Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Parent</TableHead>
                  <TableHead className="hidden lg:table-cell">Website</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {clients.length === 0 ? 'No clients yet — run the migration script to seed data.' : 'No results.'}
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {c.parentClientId
                          ? <GitBranch className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          : <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                        <div>
                          <div className="font-semibold">{c.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{c.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{c.legalName || '—'}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {c.parentClientId
                        ? <Badge variant="outline" className="text-xs">{clients.find(p => p.id === c.parentClientId)?.name || c.parentClientId}</Badge>
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {c.website
                        ? <a href={c.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline"><Globe className="w-3 h-3" />{c.website.replace(/^https?:\/\//, '')}</a>
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'Active' ? 'success' : 'destructive'}>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(c.id)}>
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
