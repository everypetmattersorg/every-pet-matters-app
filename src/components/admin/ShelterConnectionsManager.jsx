import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
  disconnected: 'bg-gray-100 text-gray-600'
};

const STATUS_ICONS = {
  pending: <Clock className="w-4 h-4" />,
  active: <CheckCircle2 className="w-4 h-4" />,
  error: <AlertCircle className="w-4 h-4" />,
  disconnected: <AlertCircle className="w-4 h-4" />
};

export default function ShelterConnectionsManager() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['shelter-connections-admin'],
    queryFn: () => base44.entities.ShelterConnection.list('-created_date', 100),
  });

  const { data: rescues = [] } = useQuery({
    queryKey: ['all-rescues'],
    queryFn: () => base44.entities.Rescue.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const openDialog = (conn = null) => {
    if (conn) {
      setEditing(conn);
      setFormData(conn);
    } else {
      setEditing(null);
      setFormData({ software_platform: 'ShelterLuv', status: 'pending' });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!formData.shelter_name || !formData.contact_email || !formData.software_platform) {
      toast.error('Shelter name, email, and platform required');
      return;
    }
    if (formData.software_platform === 'ShelterLuv' && !formData.organization_id) {
      toast.error('Organization ID required for ShelterLuv');
      return;
    }
    setSaving(true);
    try {
      const saveData = {
        shelter_name: formData.shelter_name,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        software_platform: formData.software_platform,
        api_key: formData.api_key,
        api_secret: formData.api_secret,
        organization_id: formData.organization_id,
        status: formData.status || 'pending'
      };
      if (editing) {
        await base44.entities.ShelterConnection.update(editing.id, saveData);
        toast.success('Connection updated');
      } else {
        await base44.entities.ShelterConnection.create(saveData);
        toast.success('Connection created');
      }
      queryClient.invalidateQueries({ queryKey: ['shelter-connections-admin'] });
      setOpen(false);
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Error saving: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this connection?')) return;
    try {
      await base44.entities.ShelterConnection.delete(id);
      queryClient.invalidateQueries({ queryKey: ['shelter-connections-admin'] });
      toast.success('Connection deleted');
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const assignToOrganization = async (connId, rescueId) => {
    if (!rescueId) return;
    // Note: In real scenario, create a relationship table or update Rescue with connection_id
    // For now, we update the connection's shelter_name to match
    const rescue = rescues.find(r => r.id === rescueId);
    if (rescue) {
      try {
        await base44.entities.ShelterConnection.update(connId, { shelter_name: rescue.name });
        queryClient.invalidateQueries({ queryKey: ['shelter-connections-admin'] });
        toast.success(`Assigned to ${rescue.name}`);
      } catch (err) {
        toast.error('Error: ' + err.message);
      }
    }
  };

  const assignToUser = async (connId, userId) => {
    if (!userId) return;
    try {
      const user = users.find(u => u.id === userId);
      const conn = connections.find(c => c.id === connId);
      // Store user's email on the connection
      await base44.entities.ShelterConnection.update(connId, { contact_email: user.email, contact_name: user.full_name || conn?.contact_name || '' });
      // Find the matching Rescue org by shelter name and link user to it
      const matchingRescue = rescues.find(r => r.name?.toLowerCase() === conn?.shelter_name?.toLowerCase());
      const userUpdates = { role: user.role === 'user' ? 'rescue' : user.role };
      if (matchingRescue) userUpdates.affiliated_organization = matchingRescue.name;
      await base44.entities.User.update(userId, userUpdates);
      toast.success(`Assigned ${conn?.shelter_name} to ${user.full_name || user.email}${matchingRescue ? ' (org linked)' : ''}`);
      queryClient.invalidateQueries({ queryKey: ['shelter-connections-admin'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Shelter Connections</h3>
        <Button size="sm" className="gap-2" onClick={() => openDialog()}>
          <Plus className="w-4 h-4" /> New Connection
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : connections.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No connections yet</p>
      ) : (
        <div className="space-y-3">
          {connections.map(conn => (
            <Card key={conn.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{conn.shelter_name}</p>
                      <Badge className={`text-xs flex items-center gap-1 ${STATUS_COLORS[conn.status] || 'bg-gray-100'}`}>
                        {STATUS_ICONS[conn.status]} {conn.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{conn.software_platform} • {conn.contact_email}</p>
                    {conn.contact_name && <p className="text-xs text-muted-foreground mt-0.5">👤 {conn.contact_name}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openDialog(conn)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(conn.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>

                {/* Assign to organization */}
                <div className="mt-3 pt-3 border-t space-y-2">
                  <div className="flex gap-2 items-center">
                    <span className="text-xs font-medium text-muted-foreground">Organization:</span>
                    <Select onValueChange={(rescueId) => assignToOrganization(conn.id, rescueId)}>
                      <SelectTrigger className="w-48 h-8 text-xs">
                        <SelectValue placeholder="Assign to org..." />
                      </SelectTrigger>
                      <SelectContent>
                        {rescues.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assign to user */}
                  <div className="flex gap-2 items-center">
                    <span className="text-xs font-medium text-muted-foreground">User:</span>
                    <Select onValueChange={(userId) => assignToUser(conn.id, userId)}>
                      <SelectTrigger className="w-48 h-8 text-xs">
                        <SelectValue placeholder="Assign to user..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Connection' : 'New Shelter Connection'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Platform</label>
              <Select value={formData.software_platform || 'ShelterLuv'} onValueChange={(v) => setFormData({...formData, software_platform: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ShelterLuv">ShelterLuv</SelectItem>
                  <SelectItem value="RescueGroups">RescueGroups</SelectItem>
                  <SelectItem value="Petfinder">Petfinder</SelectItem>
                  <SelectItem value="Adopt-a-Pet">Adopt-a-Pet</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Shelter Name *</label>
              <Input value={formData.shelter_name || ''} onChange={(e) => setFormData({...formData, shelter_name: e.target.value})} placeholder="Shelter or organization name" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Contact Name</label>
              <Input value={formData.contact_name || ''} onChange={(e) => setFormData({...formData, contact_name: e.target.value})} placeholder="Contact person" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Email *</label>
              <Input value={formData.contact_email || ''} onChange={(e) => setFormData({...formData, contact_email: e.target.value})} placeholder="contact@shelter.com" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Phone</label>
              <Input value={formData.contact_phone || ''} onChange={(e) => setFormData({...formData, contact_phone: e.target.value})} placeholder="(555) 000-0000" />
            </div>
            {formData.software_platform === 'ShelterLuv' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold">Organization ID *</label>
                <Input value={formData.organization_id || ''} onChange={(e) => setFormData({...formData, organization_id: e.target.value})} placeholder="ShelterLuv organization ID" />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-semibold">API Key</label>
              <Input className="preserve-case" value={formData.api_key || ''} onChange={(e) => setFormData({...formData, api_key: e.target.value})} placeholder="API key or token" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">API Secret</label>
              <Input className="preserve-case" value={formData.api_secret || ''} onChange={(e) => setFormData({...formData, api_secret: e.target.value})} placeholder="API secret (if required)" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Status</label>
              <Select value={formData.status || 'pending'} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="disconnected">Disconnected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2 sticky bottom-0 bg-white">
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