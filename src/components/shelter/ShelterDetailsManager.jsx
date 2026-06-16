import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ImageUploadWithCrop from '@/components/pets/ImageUploadWithCrop';
import HoursOfOperationEditor from '@/components/shelter/HoursOfOperationEditor';

const EMPTY = {
  shelter_name: '', org_type: 'rescue', email: '', phone: '', website: '',
  address: '', city: '', state: '', animals_accepted: '', mission: '',
  logo_url: '', banner_url: '', accepts_volunteers: false, fosters_needed: false,
  services_offered: [], hours: '', public_listing: false, 
  instagram_url: '', facebook_url: '', tiktok_url: '', linkedin_url: '',
  sponsors: []
};

export default function ShelterDetailsManager({ open, onClose, onSaved }) {
  const queryClient = useQueryClient();
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: existing = [], isLoading } = useQuery({
    queryKey: ['my-shelter-details', user?.email],
    queryFn: () => base44.entities.ShelterDetails.filter({ created_by: user.email }),
    enabled: !!user?.email && open
  });

  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newSponsor, setNewSponsor] = useState({ name: '', url: '', photo_url: '' });

  useEffect(() => {
    if (existing.length > 0 && !editingId) {
      setForm({ ...EMPTY, ...existing[0] });
      setEditingId(existing[0].id);
    }
  }, [existing]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleLogoSelected = async (file) => {
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set('logo_url', file_url);
  };

  const handleBannerSelected = async (file) => {
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set('banner_url', file_url);
  };

  const handleSponsorLogoUpload = async (file) => {
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setNewSponsor({ ...newSponsor, photo_url: file_url });
  };

  const handleAddSponsor = () => {
    if (!newSponsor.name || !newSponsor.url) {
      toast.error('Please fill in sponsor name and website');
      return;
    }
    const sponsors = form.sponsors || [];
    sponsors.push({ name: newSponsor.name, url: newSponsor.url, photo_url: newSponsor.photo_url || '' });
    set('sponsors', sponsors);
    setNewSponsor({ name: '', url: '', photo_url: '' });
    toast.success('Sponsor added!');
  };

  const handleRemoveSponsor = (index) => {
    const sponsors = (form.sponsors || []).filter((_, i) => i !== index);
    set('sponsors', sponsors);
  };

  const handleSave = async () => {
    if (!form.shelter_name) return toast.error('Shelter name is required');
    setSaving(true);
    if (editingId) {
      await base44.entities.ShelterDetails.update(editingId, form);
      toast.success('Profile updated!');
    } else {
      const created = await base44.entities.ShelterDetails.create(form);
      setEditingId(created.id);
      toast.success('Profile created!');
    }
    queryClient.invalidateQueries({ queryKey: ['my-shelter-details'] });
    onSaved?.();
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingId ? 'Edit' : 'Create'} Shelter / Rescue Profile</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Organization Name *</Label>
                <Input value={form.shelter_name} onChange={e => set('shelter_name', e.target.value)} placeholder="e.g. Happy Paws Rescue" />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.org_type} onValueChange={v => set('org_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rescue">Rescue</SelectItem>
                    <SelectItem value="shelter">Shelter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input value={form.city} onChange={e => set('city', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Input value={form.state} onChange={e => set('state', e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Mission Statement</Label>
              <Textarea rows={2} value={form.mission} onChange={e => set('mission', e.target.value)} placeholder="A short statement about your mission..." />
            </div>
            <div className="space-y-1.5">
              <Label>Animals Accepted or Resources Needed at your Organization</Label>
              <Textarea rows={4} value={form.animals_accepted} onChange={e => set('animals_accepted', e.target.value)} placeholder="e.g. Dogs, Cats, Rabbits, Birds, etc. or describe what types of animals and resources you need help with..." />
            </div>

            <div className="space-y-2">
              <Label>Services Offered</Label>
              <div className="flex flex-wrap gap-2">
                {['Spay/Neuter', 'Microchipping', 'Rehabilitation', 'Vaccination', 'Behavioral Training', 'Adoption Counseling', 'Emergency Care', 'Foster Program'].map(service => (
                  <button
                    key={service}
                    type="button"
                    onClick={() => {
                      const services = form.services_offered || [];
                      const updated = services.includes(service)
                        ? services.filter(s => s !== service)
                        : [...services, service];
                      set('services_offered', updated);
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      (form.services_offered || []).includes(service)
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {service}
                  </button>
                ))}
              </div>
            </div>

            <HoursOfOperationEditor value={form.hours} onChange={hours => set('hours', hours)} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Logo</Label>
                <ImageUploadWithCrop onImageSelected={handleLogoSelected} currentImageUrl={form.logo_url} />
              </div>
              <div className="space-y-1.5">
                <Label>Banner Image</Label>
                <ImageUploadWithCrop onImageSelected={handleBannerSelected} currentImageUrl={form.banner_url} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Social Media</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Instagram</Label>
                  <Input value={form.instagram_url} onChange={e => set('instagram_url', e.target.value)} placeholder="https://instagram.com/..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Facebook</Label>
                  <Input value={form.facebook_url} onChange={e => set('facebook_url', e.target.value)} placeholder="https://facebook.com/..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">TikTok</Label>
                  <Input value={form.tiktok_url} onChange={e => set('tiktok_url', e.target.value)} placeholder="https://tiktok.com/..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">LinkedIn</Label>
                  <Input value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} placeholder="https://linkedin.com/..." />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold">Sponsors</div>
              {(form.sponsors || []).length > 0 && (
                <div className="space-y-2 mb-4">
                  {form.sponsors.map((sponsor, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      {sponsor.photo_url && <img src={sponsor.photo_url} alt={sponsor.name} className="w-12 h-12 object-cover rounded" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{sponsor.name}</p>
                        <a href={sponsor.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate">
                          {sponsor.url}
                        </a>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleRemoveSponsor(idx)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600 font-medium">Add New Sponsor</p>
                <div className="space-y-1.5">
                  <Label className="text-sm">Name</Label>
                  <Input value={newSponsor.name} onChange={e => setNewSponsor({ ...newSponsor, name: e.target.value })} placeholder="e.g. Acme Pet Supplies" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Website</Label>
                  <Input value={newSponsor.url} onChange={e => setNewSponsor({ ...newSponsor, url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Logo</Label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => {
                      if (e.target.files?.[0]) handleSponsorLogoUpload(e.target.files[0]);
                    }}
                    className="w-full text-xs"
                  />
                  {newSponsor.photo_url && <img src={newSponsor.photo_url} alt="preview" className="w-14 h-14 object-cover rounded border border-slate-300 mt-2" />}
                </div>
                <Button type="button" onClick={handleAddSponsor} className="w-full" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Sponsor
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Switch checked={form.accepts_volunteers} onCheckedChange={v => set('accepts_volunteers', v)} />
                <Label>Accepts Volunteers</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.fosters_needed} onCheckedChange={v => set('fosters_needed', v)} />
                <Label>Foster Homes Needed</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.public_listing} onCheckedChange={v => set('public_listing', v)} />
                <Label>Allow for public listing on everypetmatters.org for adopters and fosters</Label>
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : (editingId ? 'Update Profile' : 'Create Profile')}
              </Button>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}