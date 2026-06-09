import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ImageUploadWithCrop from './ImageUploadWithCrop';

const GENDER_OPTIONS = ['Male', 'Female', 'Unknown'];
const SIZE_OPTIONS = ['Small', 'Medium', 'Large', 'Extra Large'];

export default function CreatePetModal({ open, onClose, onSaved, defaultSource = '', shelterNames = [] }) {
  const [form, setForm] = useState({
    name: '',
    species: '',
    breed: '',
    age: '',
    gender: '',
    size: '',
    weight: null,
    location: '',
    description: '',
    source: defaultSource || 'Manual',
    photo_url: '',
    vaccinated: false,
    spayed_neutered: false,
    dewormed: false,
    transfer_needed: false,
    rescue_needed: false,
    urgent: false,
  });
  const [saving, setSaving] = useState(false);
  const [uploadedImageData, setUploadedImageData] = useState(null);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleImageSelected = async (imageData) => {
    if (imageData) {
      setSaving(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: imageData });
        setUploadedImageData(file_url);
        set('photo_url', file_url);
      } catch (err) {
        toast.error('Failed to upload image');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.species) {
      toast.error('Please fill in name and species');
      return;
    }
    setSaving(true);
    await base44.entities.Pet.create(form);
    toast.success('Pet created!');
    setForm({
      name: '', species: '', breed: '', age: '', gender: '', size: '', weight: null,
      location: '', description: '', source: defaultSource || 'Manual', photo_url: '',
      vaccinated: false, spayed_neutered: false, dewormed: false, transfer_needed: false,
      rescue_needed: false, urgent: false,
    });
    setUploadedImageData(null);
    onSaved();
    onClose();
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add a New Pet</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Pet Photo</Label>
            <ImageUploadWithCrop onImageSelected={handleImageSelected} currentImageUrl={form.photo_url} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Species *</Label><Input value={form.species} onChange={e => set('species', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Breed</Label><Input value={form.breed} onChange={e => set('breed', e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>Age</Label>
              <Input
                value={form.age}
                onChange={e => set('age', e.target.value)}
                placeholder="e.g. 2 years, 6 months, Adult…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={v => set('gender', v)}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>{GENDER_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Size</Label>
              <Select value={form.size} onValueChange={v => set('size', v)}>
                <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                <SelectContent>{SIZE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Weight (lbs)</Label><Input type="number" value={form.weight || ''} onChange={e => set('weight', parseFloat(e.target.value) || null)} /></div>
            <div className="space-y-1.5"><Label>Location</Label><Input value={form.location} onChange={e => set('location', e.target.value)} /></div>
          </div>

          <div className="space-y-1.5">
            <Label>Source</Label>
            <Select value={form.source} onValueChange={v => set('source', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Manual">Manual</SelectItem>
                {shelterNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} /></div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'vaccinated', label: 'Vaccinated' },
              { key: 'spayed_neutered', label: 'Spayed/Neutered' },
              { key: 'dewormed', label: 'Dewormed' },
              { key: 'transfer_needed', label: 'Transfer Needed' },
              { key: 'rescue_needed', label: 'Rescue Needed' },
              { key: 'urgent', label: 'Urgent' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <Switch checked={form[key]} onCheckedChange={v => set(key, v)} />
                <Label>{label}</Label>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Create Pet'}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}