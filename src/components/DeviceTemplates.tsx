import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { deviceTemplatesApi } from '../lib/api';
import { Trash2, Plus } from 'lucide-react';

export function DeviceTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [newTemplate, setNewTemplate] = useState({ name: '', vendor: '', model: '', type: '', owner: '', criticality: 'Medium' });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    deviceTemplatesApi.list().then(setTemplates).catch(console.error);
  }, []);

  const addTemplate = async () => {
    if (!newTemplate.name || !newTemplate.vendor || !newTemplate.model || !newTemplate.type) return;
    const created = await deviceTemplatesApi.create(newTemplate);
    setTemplates(prev => [...prev, created]);
    setNewTemplate({ name: '', vendor: '', model: '', type: '', owner: '', criticality: 'Medium' });
    setIsModalOpen(false);
  };

  const deleteTemplate = async (id: string) => {
    await deviceTemplatesApi.delete(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Device Templates</CardTitle>
        <div className="flex gap-2">
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Create Template</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Device Template</DialogTitle>
                <DialogDescription>Define a new device template for streamlined provisioning.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input placeholder="Name" value={newTemplate.name} onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Input placeholder="Vendor" value={newTemplate.vendor} onChange={(e) => setNewTemplate({...newTemplate, vendor: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input placeholder="Model" value={newTemplate.model} onChange={(e) => setNewTemplate({...newTemplate, model: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Input placeholder="Type" value={newTemplate.type} onChange={(e) => setNewTemplate({...newTemplate, type: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Owner</Label>
                  <Input placeholder="Owner" value={newTemplate.owner} onChange={(e) => setNewTemplate({...newTemplate, owner: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Criticality</Label>
                  <select 
                    className="w-full bg-background border rounded-md px-3 py-2 text-sm"
                    value={newTemplate.criticality} 
                    onChange={(e) => setNewTemplate({...newTemplate, criticality: e.target.value})}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={addTemplate}>Save Template</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Criticality</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map(template => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>{template.vendor}</TableCell>
                <TableCell>{template.model}</TableCell>
                <TableCell>{template.type}</TableCell>
                <TableCell>{template.owner || 'N/A'}</TableCell>
                <TableCell>{template.criticality || 'Medium'}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => deleteTemplate(template.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
