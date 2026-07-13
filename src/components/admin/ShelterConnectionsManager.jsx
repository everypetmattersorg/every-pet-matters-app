import { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, CheckCircle2, AlertCircle, Clock, RefreshCw } from 'lucide-react';

const PLATFORMS = ['ShelterLuv', 'Adopt-a-Pet', 'ShelterManager', 'RescueGroups', 'Petfinder', 'Other'];

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
  disconnected: 'bg-gray-100 text-gray-600',
};
const STATUS_ICONS = {
  pending: <Clock className="w-3 h-3" />,
  active: <CheckCircle2 className="w-3 h-3" />,
  error: <AlertCircle className="w-3 h-3" />,
  disconnected: <AlertCircle className="w-3 h-3" />,
};

const EMPTY_FORM = { software_platform: 'ShelterLuv', status: 'pending', shelterluv_adoptable_statuses: ['Adoption Available', 'Available Foster'] };

export default function ShelterConnectionsManager() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(null);
  const qc = useQueryClient();

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['shelter-connections-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.from('shelter_connections').select('*').order('created_date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: shelterDetails = [] } = useQuery({
    queryKey: ['all-shelter-details'],
    queryFn: async () => {
      const { data } = await supabase.from('shelter_details').select('id, shelter_name, city, state').order('shelter_name');
      return data ?? [];
    },
  });

  const { data: rescues = [] } = useQuery({
    queryKey: ['all-rescues-admin'],
    queryFn: async () => {
      const { data } = await supabase.from('rescues').select('id, name, city, state').order('name');
      return data ?? [];
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-profiles-admin'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, full_name, email, role').order('email');
      return data ?? [];
    },
  });

  const set = (k, v) => setFormData(prev => ({ ...prev, [k]: v }));

  const openNew = () => { setEditing(null); setFormData(EMPTY_FORM); setOpen(true); };
  const openEdit = (conn) => { setEditing(conn); setFormData({ ...conn }); setOpen(true); };

  const handleSave = async () => {
    if (!formData.shelter_name?.trim() || !formData.contact_email?.trim() || !formData.software_platform) {
      toast.error('Shelter name, email, and platform are required');
      return;
    }
    setSaving(true);
    try {
      const row = {
        shelter_name: formData.shelter_name.trim(),
        contact_name: formData.contact_name || null,
        contact_email: formData.contact_email.trim(),
        contact_phone: formData.contact_phone || null,
        software_platform: formData.software_platform,
        api_key: formData.api_key || null,
        api_secret: formData.api_secret || null,
        organization_id: formData.organization_id || null,
        status: formData.status || 'pending',
        notes: formData.notes || null,
        shelter_details_id: formData.shelter_details_id || null,
        user_profile_id: formData.user_profile_id || null,
        shelterluv_adoptable_statuses: formData.software_platform === 'ShelterLuv'
          ? (formData.shelterluv_adoptable_statuses || ['Adoption Available', 'Available Foster'])
          : null,
      };
      if (editing) {
        const { error } = await supabase.from('shelter_connections').update(row).eq('id', editing.id);
        if (error) throw error;
        toast.success('Connection updated');
      } else {
        const { error } = await supabase.from('shelter_connections').insert(row);
        if (error) throw error;
        toast.success('Connection created');
      }
      qc.invalidateQueries({ queryKey: ['shelter-connections-admin'] });
      setOpen(false);
    } catch (err) {
      toast.error('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this connection?')) return;
    const { error } = await supabase.from('shelter_connections').delete().eq('id', id);
    if (error) { toast.error('Delete failed: ' + error.message); return; }
    qc.invalidateQueries({ queryKey: ['shelter-connections-admin'] });
    toast.success('Connection deleted');
  };

  const handleSync = async (conn) => {
    setSyncing(conn.id);
    const platform = conn.software_platform?.toLowerCase();
    const endpoint = platform === 'shelterluv' ? '/api/sync-shelterluv'
      : platform === 'adopt-a-pet' ? '/api/sync-adoptapet'
      : null;
    if (!endpoint) { toast.error(`No sync endpoint for ${conn.software_platform}`); setSyncing(null); return; }
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: conn.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');
      toast.success(`Synced ${data.animals_synced ?? 0} pets`);
      qc.invalidateQueries({ queryKey: ['shelter-connections-admin'] });
    } catch (err) {
      toast.error('Sync error: ' + err.message);
    } finally {
      setSyncing(null);
    }
  };

  const statusesText = (arr) => Array.isArray(arr) ? arr.join(', ') : '';
  const parseStatuses = (text) => text.split(',').map(s => s.trim()).filter(Boolean);

  const linkedShelter = (conn) => {
    if (conn.shelter_details_id) return shelterDetails.find(s => s.id === conn.shelter_details_id);
    return null;
  };
  const linkedUser = (conn) => {
    if (conn.user_profile_id) return users.find(u => u.id === conn.user_profile_id);
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Shelter & Rescue Connections</h3>
        <Button size="sm" className="gap-2" onClick={openNew}>
          <Plus className="w-4 h-4" /> New Connection
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : connections.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No connections yet.</p>
      ) : (
        <div className="space-y-3">
          {connections.map(conn => {
            const shelter = linkedShelter(conn);
            const user = linkedUser(conn);
            return (
              <Card key={conn.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold truncate">{conn.shelter_name}</p>
                        <Badge className={`text-xs flex items-center gap-1 ${STATUS_COLORS[conn.status] || 'bg-gray-100'}`}>
                          {STATUS_ICONS[conn.status]} {conn.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{conn.software_platform}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{conn.contact_email}{conn.contact_name ? ` · ${conn.contact_name}` : ''}</p>
                      {conn.last_sync && <p className="text-xs text-muted-foreground mt-0.5">Last sync: {new Date(conn.last_sync).toLocaleString()} · {conn.pets_synced ?? 0} pets</p>}
                      {conn.notes && <p className="text-xs text-red-500 mt-0.5 truncate">{conn.notes}</p>}
                      <div className="flex gap-3 mt-1.5 flex-wrap">
                        {shelter && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">🏠 {shelter.shelter_name}{shelter.city ? `, ${shelter.city}` : ''}</span>}
                        {user && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">👤 {user.full_name || user.email}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button size="sm" variant="outline" className="gap-1 text-xs" disabled={syncing === conn.id} onClick={() => handleSync(conn)}>
                        {syncing === conn.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Sync
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(conn)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(conn.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Connection' : 'New Shelter Connection'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pb-2">

            {/* Platform */}
            <div className="space-y-1">
              <label className="text-xs font-semibold">Platform *</label>
              <Select value={formData.software_platform} onValueChange={v => set('software_platform', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Shelter name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold">Shelter / Rescue Name *</label>
              <Input value={formData.shelter_name || ''} onChange={e => set('shelter_name', e.target.value)} placeholder="Humane Society of Yuma" />
            </div>

            {/* Contact */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Contact Name</label>
                <Input value={formData.contact_name || ''} onChange={e => set('contact_name', e.target.value)} placeholder="Kevin Clark" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Contact Email *</label>
                <Input value={formData.contact_email || ''} onChange={e => set('contact_email', e.target.value)} placeholder="kevin@shelter.org" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Contact Phone</label>
              <Input value={formData.contact_phone || ''} onChange={e => set('contact_phone', e.target.value)} placeholder="(555) 000-0000" />
            </div>

            {/* Platform-specific fields */}
            {formData.software_platform === 'ShelterLuv' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">API Key</label>
                  <Input value={formData.api_key || ''} onChange={e => set('api_key', e.target.value)} placeholder="ShelterLuv API key" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Adoptable Statuses (comma-separated)</label>
                  <Input
                    value={statusesText(formData.shelterluv_adoptable_statuses)}
                    onChange={e => set('shelterluv_adoptable_statuses', parseStatuses(e.target.value))}
                    placeholder="Adoption Available, Available Foster"
                  />
                  <p className="text-xs text-muted-foreground">Only animals with these statuses will be synced</p>
                </div>
              </>
            )}

            {formData.software_platform === 'Adopt-a-Pet' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">API Key</label>
                  <Input value={formData.api_key || ''} onChange={e => set('api_key', e.target.value)} placeholder="Adopt-a-Pet API key" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Shelter ID (organization_id)</label>
                  <Input value={formData.organization_id || ''} onChange={e => set('organization_id', e.target.value)} placeholder="Adopt-a-Pet shelter ID" />
                </div>
              </>
            )}

            {formData.software_platform === 'ShelterManager' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">API Key</label>
                  <Input value={formData.api_key || ''} onChange={e => set('api_key', e.target.value)} placeholder="ShelterManager API key" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Account ID / Shelter ID</label>
                  <Input value={formData.organization_id || ''} onChange={e => set('organization_id', e.target.value)} placeholder="ShelterManager account ID" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">API Secret</label>
                  <Input value={formData.api_secret || ''} onChange={e => set('api_secret', e.target.value)} placeholder="API secret (if required)" />
                </div>
              </>
            )}

            {!['ShelterLuv', 'Adopt-a-Pet', 'ShelterManager'].includes(formData.software_platform) && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">API Key</label>
                  <Input value={formData.api_key || ''} onChange={e => set('api_key', e.target.value)} placeholder="API key" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">API Secret</label>
                  <Input value={formData.api_secret || ''} onChange={e => set('api_secret', e.target.value)} placeholder="API secret" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Organization / Shelter ID</label>
                  <Input value={formData.organization_id || ''} onChange={e => set('organization_id', e.target.value)} placeholder="Organization ID" />
                </div>
              </>
            )}

            {/* Link to shelter profile */}
            <div className="space-y-1">
              <label className="text-xs font-semibold">Link to Shelter Profile</label>
              <Select value={formData.shelter_details_id || 'none'} onValueChange={v => set('shelter_details_id', v === 'none' ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Select shelter profile..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— none —</SelectItem>
                  {shelterDetails.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.shelter_name}{s.city ? ` · ${s.city}, ${s.state}` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Link to rescue profile (rescues table) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold">Link to Rescue Profile</label>
              <Select value={formData.rescue_id || 'none'} onValueChange={v => set('rescue_id', v === 'none' ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Select rescue profile..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— none —</SelectItem>
                  {rescues.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}{r.city ? ` · ${r.city}, ${r.state}` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Link to user */}
            <div className="space-y-1">
              <label className="text-xs font-semibold">Link to User Account</label>
              <Select value={formData.user_profile_id || 'none'} onValueChange={v => set('user_profile_id', v === 'none' ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Select user..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— none —</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name ? `${u.full_name} (${u.email})` : u.email} · {u.role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-semibold">Status</label>
              <Select value={formData.status || 'pending'} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="disconnected">Disconnected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs font-semibold">Notes</label>
              <Input value={formData.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Any notes about this connection..." />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editing ? 'Save Changes' : 'Create Connection'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
