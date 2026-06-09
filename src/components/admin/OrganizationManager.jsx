import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

export default function OrganizationManager() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: rescues = [], isLoading } = useQuery({
    queryKey: ['all-rescues'],
    queryFn: () => base44.entities.Rescue.list('-created_date', 100),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const openDialog = (rescue = null) => {
    if (rescue) {
      setEditing(rescue);
      setFormData(rescue);
    } else {
      setEditing(null);
      setFormData({ org_type: 'rescue' });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Name and email required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.Rescue.update(editing.id, formData);
        toast.success('Organization updated');
      } else {
        await base44.entities.Rescue.create(formData);
        toast.success('Organization created');
      }
      queryClient.invalidateQueries({ queryKey: ['all-rescues'] });
      setOpen(false);
    } catch (err) {
      toast.error('Error saving: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this organization?')) return;
    try {
      await base44.entities.Rescue.delete(id);
      queryClient.invalidateQueries({ queryKey: ['all-rescues'] });
      toast.success('Organization deleted');
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const assignToUser = async (rescueId, userId) => {
    if (!userId) return;
    try {
      const user = users.find(u => u.id === userId);
      await base44.entities.User.update(userId, { 
        role: 'rescue',
        affiliated_organization: rescueId 
      });
      toast.success(`Assigned to ${user.full_name}`);
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Organizations</h3>
        <Button size="sm" className="gap-2" onClick={() => openDialog()}>
          <Plus className="w-4 h-4" /> New Organization
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : rescues.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No organizations yet</p>
      ) : (
        <div className="space-y-3">
          {rescues.map(org => (
            <Card key={org.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{org.name}</p>
                      <Badge variant="outline" className="text-xs">{org.org_type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{org.email}</p>
                    {org.address && <p className="text-xs text-muted-foreground mt-1">📍 {org.address}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openDialog(org)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(org.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>

                {/* Assign to user */}
                <div className="mt-3 pt-3 border-t flex gap-2 items-center">
                  <span className="text-xs font-medium text-muted-foreground">Assign to:</span>
                  <Select onValueChange={(userId) => assignToUser(org.id, userId)}>
                    <SelectTrigger className="w-48 h-8 text-xs">
                      <SelectValue placeholder="Select user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(u => u.role === 'user').map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Organization' : 'New Organization'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold">Type</label>
              <Select value={formData.org_type || 'rescue'} onValueChange={(v) => setFormData({...formData, org_type: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rescue">Rescue</SelectItem>
                  <SelectItem value="shelter">Shelter</SelectItem>
                  <SelectItem value="welfare">Animal Welfare</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold">Name</label>
              <Input value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Organization name" />
            </div>
            <div>
              <label className="text-xs font-semibold">Email</label>
              <Input value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="contact@org.com" />
            </div>
            <div>
              <label className="text-xs font-semibold">Phone</label>
              <Input value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="(555) 000-0000" />
            </div>
            <div>
              <label className="text-xs font-semibold">Address</label>
              <Input value={formData.address || ''} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Street address" />
            </div>
            <div>
              <label className="text-xs font-semibold">Mission</label>
              <Textarea value={formData.mission_statement || ''} onChange={(e) => setFormData({...formData, mission_statement: e.target.value})} placeholder="Mission statement" className="h-20" />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}