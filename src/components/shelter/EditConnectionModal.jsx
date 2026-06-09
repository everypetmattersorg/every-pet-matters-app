import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const STATUS_OPTIONS = ['pending', 'active', 'error', 'disconnected'];

export default function EditConnectionModal({ conn, open, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (conn) setForm({ ...conn });
  }, [conn]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.ShelterConnection.update(conn.id, form);
      toast.success('Connection updated!');
      onSaved();
      onClose();
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!conn) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Connection — {conn.shelter_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Shelter Name</Label>
              <Input value={form.shelter_name || ''} onChange={e => set('shelter_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status || 'pending'} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Contact Name</Label>
              <Input value={form.contact_name || ''} onChange={e => set('contact_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Contact Email</Label>
              <Input type="email" value={form.contact_email || ''} onChange={e => set('contact_email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>API Key</Label>
              <Input value={form.api_key || ''} onChange={e => set('api_key', e.target.value)} placeholder="API key" />
            </div>
            <div className="space-y-1.5">
              <Label>Organization ID</Label>
              <Input value={form.organization_id || ''} onChange={e => set('organization_id', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={3} value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Internal notes or error details..." />
          </div>
          <div className="flex gap-3 pt-2 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}