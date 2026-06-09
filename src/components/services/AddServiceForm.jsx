import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Loader2, Camera } from 'lucide-react';

const CATEGORIES = [
  { value: 'veterinarian', label: '🏥 Veterinarian' },
  { value: 'groomer', label: '✂️ Groomer' },
  { value: 'trainer', label: '🎓 Trainer' },
  { value: 'pet_sitter', label: '🏠 Pet Sitter' },
  { value: 'pet_store', label: '🛒 Pet Store' },
  { value: 'pet_friendly_business', label: '🐾 Pet-Friendly Business' },
  { value: 'other', label: '📍 Other' },
];

export default function AddServiceForm({ user, onSaved, onClose }) {
  const [data, setData] = useState({ added_by_email: user?.email, accepts_bookings: false });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (k, v) => setData(p => ({ ...p, [k]: v }));

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set('photo_url', file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Service.create(data);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-lg text-slate-800">Add a Service</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Photo */}
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
              {data.photo_url
                ? <img src={data.photo_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl">🐾</div>
              }
              <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-xl">
                {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
            </div>
            <div className="flex-1">
              <Label className="mb-1.5 block">Business Name *</Label>
              <Input value={data.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Happy Paws Vet Clinic" />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Category *</Label>
            <Select value={data.category || ''} onValueChange={v => set('category', v)}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block">Description</Label>
            <Textarea value={data.description || ''} onChange={e => set('description', e.target.value)} placeholder="What services do you offer?" className="h-20 resize-none" />
          </div>

          <div>
            <Label className="mb-1.5 block">Address *</Label>
            <Input value={data.address || ''} onChange={e => set('address', e.target.value)} placeholder="123 Main St" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <Label className="mb-1.5 block">City</Label>
              <Input value={data.city || ''} onChange={e => set('city', e.target.value)} placeholder="Austin" />
            </div>
            <div>
              <Label className="mb-1.5 block">State</Label>
              <Input value={data.state || ''} onChange={e => set('state', e.target.value)} placeholder="TX" />
            </div>
            <div>
              <Label className="mb-1.5 block">ZIP</Label>
              <Input value={data.zip || ''} onChange={e => set('zip', e.target.value)} placeholder="78701" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Phone</Label>
              <Input value={data.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="(555) 000-0000" />
            </div>
            <div>
              <Label className="mb-1.5 block">Email</Label>
              <Input type="email" value={data.email || ''} onChange={e => set('email', e.target.value)} placeholder="hello@example.com" />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Website</Label>
            <Input value={data.website || ''} onChange={e => set('website', e.target.value)} placeholder="https://..." />
          </div>

          <div>
            <Label className="mb-1.5 block">Hours</Label>
            <Input value={data.hours || ''} onChange={e => set('hours', e.target.value)} placeholder="Mon-Fri 9am-5pm, Sat 10am-3pm" />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div>
              <Label>Accepts Online Bookings</Label>
              <p className="text-xs text-slate-400 mt-0.5">Enable a Book Now button</p>
            </div>
            <Switch checked={!!data.accepts_bookings} onCheckedChange={v => set('accepts_bookings', v)} />
          </div>

          {data.accepts_bookings && (
            <div>
              <Label className="mb-1.5 block">Booking URL</Label>
              <Input value={data.booking_url || ''} onChange={e => set('booking_url', e.target.value)} placeholder="https://booking-link.com" />
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !data.name || !data.category || !data.address} className="flex-1 rounded-xl bg-rose-500 hover:bg-rose-600">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Add Service
          </Button>
        </div>
      </div>
    </div>
  );
}