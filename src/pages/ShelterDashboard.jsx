import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Loader2, PawPrint, Eye, EyeOff, Plus, Binoculars, Trash2, X, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

const GENDER_OPTIONS = ['Male', 'Female', 'Unknown'];
const SIZE_OPTIONS = ['Small', 'Medium', 'Large', 'Extra Large'];

function EditPetModal({ pet, open, onClose, onSaved }) {
  const [form, setForm] = useState({ ...pet });
  const [saving, setSaving] = useState(false);
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: myShelters = [] } = useQuery({
    queryKey: ['my-shelter-details', user?.email],
    queryFn: () => base44.entities.ShelterDetails.filter({ created_by: user.email }),
    enabled: !!user?.email
  });
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Pet.update(pet.id, form);
    toast.success('Pet updated!');
    onSaved();
    onClose();
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit {pet.name}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          {myShelters.length > 0 &&
            <div className="space-y-1.5">
              <Label>Shelter / Rescue</Label>
              <Select value={form.source || ''} onValueChange={(v) => set('source', v)}>
                <SelectTrigger><SelectValue placeholder="Select shelter..." /></SelectTrigger>
                <SelectContent>{myShelters.map((s) => <SelectItem key={s.id} value={s.shelter_name}>{s.shelter_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          }
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Name</Label>
              <Input value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Species</Label><Input value={form.species || ''} onChange={(e) => set('species', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Breed</Label><Input value={form.breed || ''} onChange={(e) => set('breed', e.target.value)} /></div>
            <div className="space-y-1.5 col-span-2">
              <Label>Age</Label>
              <div className="flex gap-2">
                <Input
                  type="number" min="0" placeholder="e.g. 3"
                  value={form.age ? (form.age.match(/^\d+/) || [''])[0] : ''}
                  onChange={(e) => {
                    const unit = form.age?.includes('month') ? 'months' : 'years';
                    set('age', e.target.value ? `${e.target.value} ${unit}` : '');
                  }}
                  className="w-24" />
                <Select
                  value={form.age?.includes('month') ? 'months' : 'years'}
                  onValueChange={(unit) => {
                    const num = form.age ? (form.age.match(/^\d+/) || [''])[0] : '';
                    set('age', num ? `${num} ${unit}` : '');
                  }}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="years">Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={form.gender || ''} onValueChange={(v) => set('gender', v)}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>{GENDER_OPTIONS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Size</Label>
              <Select value={form.size || ''} onValueChange={(v) => set('size', v)}>
                <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                <SelectContent>{SIZE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Weight (lbs)</Label><Input type="number" value={form.weight || ''} onChange={(e) => set('weight', parseFloat(e.target.value) || null)} /></div>
            <div className="space-y-1.5"><Label>Location</Label><Input value={form.location || ''} onChange={(e) => set('location', e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={form.description || ''} onChange={(e) => set('description', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            {[{ key: 'vaccinated', label: 'Vaccinated' }, { key: 'spayed_neutered', label: 'Spayed/Neutered' }, { key: 'dewormed', label: 'Dewormed' }, { key: 'transfer_needed', label: 'Transfer Needed' }, { key: 'rescue_needed', label: 'Rescue Needed' }, { key: 'urgent', label: 'Urgent' }, { key: 'stipend_available', label: 'Stipend Available' }].map(({ key, label }) =>
              <div key={key} className="flex items-center gap-2">
                <Switch checked={!!form[key]} onCheckedChange={(v) => set(key, v)} />
                <Label>{label}</Label>
              </div>
            )}
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

const EMPTY_PET = { name: '', species: '', breed: '', age: '', gender: '', size: '', weight: '', location: '', photo_urls: [], description: '', bio: '', medical_notes: '', urgent_deadline: '', vaccinated: false, spayed_neutered: false, dewormed: false, transfer_needed: false, rescue_needed: false, urgent: false, stipend_available: false };

function CreatePetModal({ open, onClose, onSaved, userAffiliatedOrg }) {
  const [form, setForm] = useState({ ...EMPTY_PET });
  const [saving, setSaving] = useState(false);
  const { data: currentUser } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: myShelters = [] } = useQuery({
    queryKey: ['my-shelter-details', currentUser?.email],
    queryFn: () => base44.entities.ShelterDetails.filter({ created_by: currentUser.email }),
    enabled: !!currentUser?.email
  });
  const [selectedShelter, setSelectedShelter] = useState(userAffiliatedOrg || '');

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY_PET });
      setSelectedShelter(userAffiliatedOrg || '');
    }
  }, [open, userAffiliatedOrg]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!selectedShelter && !userAffiliatedOrg) return toast.error('Please select a shelter or set your affiliated organization in your profile first');
    if (!form.name) return toast.error('Pet name is required');
    setSaving(true);
    await base44.entities.Pet.create({
      ...form,
      photo_url: form.photo_urls?.[0] || '',
      weight: form.weight ? parseFloat(form.weight) : null,
      source: selectedShelter || userAffiliatedOrg || 'Manual',
      source_id: `manual_${Date.now()}`
    });
    toast.success(`${form.name} added successfully!`);
    onSaved();
    onClose();
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a Pet Manually</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {myShelters.length > 0 ?
            <div className="space-y-1.5">
              <Label>Shelter / Rescue</Label>
              <Select value={selectedShelter} onValueChange={setSelectedShelter}>
                <SelectTrigger><SelectValue placeholder="Select shelter..." /></SelectTrigger>
                <SelectContent>{myShelters.map((s) => <SelectItem key={s.id} value={s.shelter_name}>{s.shelter_name}</SelectItem>)}</SelectContent>
              </Select>
            </div> :
            !userAffiliatedOrg ?
              <div className="flex items-start gap-3 px-3 py-2 rounded-md border border-red-300 bg-red-50 text-sm">
                <span className="text-red-700 font-medium flex-1">⚠️ Please set your affiliated shelter/rescue organization in your profile before adding pets.</span>
              </div> :
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-primary/5 text-sm">
                <span className="font-medium">🏠 {userAffiliatedOrg}</span>
              </div>
          }
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Buddy" />
            </div>
            <div className="space-y-1.5">
              <Label>Species</Label>
              <Input value={form.species} onChange={(e) => set('species', e.target.value)} placeholder="Dog, Cat..." />
            </div>
            <div className="space-y-1.5">
              <Label>Breed</Label>
              <Input value={form.breed} onChange={(e) => set('breed', e.target.value)} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Age</Label>
              <div className="flex gap-2">
                <Input
                  type="number" min="0" placeholder="e.g. 3"
                  value={form.age ? (form.age.match(/^\d+/) || [''])[0] : ''}
                  onChange={(e) => {
                    const unit = form.age?.includes('month') ? 'months' : 'years';
                    set('age', e.target.value ? `${e.target.value} ${unit}` : '');
                  }}
                  className="w-24" />
                <Select
                  value={form.age?.includes('month') ? 'months' : 'years'}
                  onValueChange={(unit) => {
                    const num = form.age ? (form.age.match(/^\d+/) || [''])[0] : '';
                    set('age', num ? `${num} ${unit}` : '');
                  }}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="years">Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(v) => set('gender', v)}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>{GENDER_OPTIONS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Size</Label>
              <Select value={form.size} onValueChange={(v) => set('size', v)}>
                <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                <SelectContent>{SIZE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Weight (lbs)</Label>
              <Input type="number" value={form.weight} onChange={(e) => set('weight', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="City, State" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Photos (up to 5, including HEIC)</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4">
              <input
                type="file"
                id="pet-images"
                multiple
                accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heic-sequence"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  const currentCount = form.photo_urls?.length || 0;
                  const available = 5 - currentCount;
                  const toUpload = files.slice(0, available);

                  for (const file of toUpload) {
                    try {
                      const { file_url } = await base44.integrations.Core.UploadFile({ file });
                      set('photo_urls', [...(form.photo_urls || []), file_url]);
                    } catch (err) {
                      toast.error(`Failed to upload ${file.name}`);
                    }
                  }
                  e.target.value = '';
                }}
                className="hidden"
              />
              <label htmlFor="pet-images" className="cursor-pointer flex flex-col items-center justify-center gap-2 py-2">
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-600">Click to upload or drag photos</span>
                <span className="text-xs text-slate-500">{(form.photo_urls?.length || 0)} of 5</span>
              </label>
              {(form.photo_urls || []).length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {form.photo_urls.map((url, idx) => (
                    <div key={idx} className="relative">
                      <img src={url} alt={`photo ${idx + 1}`} className="w-full h-20 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => set('photo_urls', form.photo_urls.filter((_, i) => i !== idx))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Bio</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="A short story about this pet..." />
          </div>
          <div className="space-y-1.5">
            <Label>Medical Notes</Label>
            <Textarea rows={3} value={form.medical_notes} onChange={(e) => set('medical_notes', e.target.value)} placeholder="Allergies, medications, vet history, special needs..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'vaccinated', label: 'Vaccinated' },
              { key: 'spayed_neutered', label: 'Spayed / Neutered' },
              { key: 'dewormed', label: 'Dewormed' },
              { key: 'transfer_needed', label: 'Transfer Needed' },
              { key: 'rescue_needed', label: 'Rescue Needed' },
              { key: 'urgent', label: 'Urgent' },
              { key: 'stipend_available', label: 'Stipend Available' }
            ].map(({ key, label }) =>
              <div key={key} className="flex items-center gap-2">
                <Switch checked={!!form[key]} onCheckedChange={(v) => set(key, v)} />
                <Label className="cursor-pointer">{label}</Label>
              </div>
            )}
          </div>
          {form.urgent &&
            <div className="space-y-1.5">
              <Label>Urgent Deadline</Label>
              <Input type="date" value={form.urgent_deadline} onChange={(e) => set('urgent_deadline', e.target.value)} />
            </div>
          }
          <div className="flex gap-3 pt-2 border-t">
            <Button onClick={handleSave} disabled={saving || (!selectedShelter && !userAffiliatedOrg)}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Add Pet'}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const STATUS_COLORS = {
  Available: 'bg-green-100 text-green-700 border-green-300',
  Adopted: 'bg-blue-100 text-blue-700 border-blue-300',
  Transferred: 'bg-purple-100 text-purple-700 border-purple-300'
};

function ShelterPetCard({ pet, onEdit, onToggleVisibility, onStatusChange, onDelete }) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${pet.name}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await base44.entities.Pet.delete(pet.id);
      toast.success(`${pet.name} deleted`);
      onDelete();
    } catch (err) {
      toast.error('Failed to delete pet');
    }
    setDeleting(false);
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    await base44.entities.Pet.update(pet.id, { adoption_status: newStatus });
    toast.success(`${pet.name} marked as ${newStatus}`);
    onStatusChange();
    setUpdatingStatus(false);
  };

  return (
    <>
      <Card className="overflow-hidden flex flex-col">
        {pet.photo_url ?
          <div className="flex items-center justify-center bg-muted">
            <img src={pet.photo_url} alt={pet.name} className="w-full h-40 object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.nextSibling.style.display = 'flex'; }} />
          </div> : null}
        <div className="flex items-center justify-center bg-muted h-40"
          style={{ display: pet.photo_url ? 'none' : 'flex' }}><span className="text-4xl">🐾</span></div>
        <CardContent className="px-[22px] py-8 flex-1 flex flex-col gap-3">
          <div>
            <p className="font-semibold text-base leading-tight">{pet.name}</p>
            {pet.source && pet.source !== 'Manual' &&
              <p className="text-xs text-muted-foreground mt-0.5">🏠 {pet.source}</p>
            }
          </div>
          <div className="flex gap-1 shrink-0 flex-wrap">
            <Button
              size="sm" variant="outline"
              className={`gap-1 text-xs ${pet.hidden_from_public ? 'text-amber-600 border-amber-300 bg-amber-50' : ''}`}
              title={pet.hidden_from_public ? 'Hidden from public — click to show' : 'Visible to public — click to hide'}
              onClick={() => onToggleVisibility(pet)}>
              {pet.hidden_from_public ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setShowPreview(true)} title="Preview public listing">
              <Binoculars className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => onEdit(pet)}>
              <Pencil className="w-3 h-3" /> Edit
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={handleDelete} disabled={deleting}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          {pet.hidden_from_public &&
            <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">🙈 Hidden from public</p>
          }
          <div className="text-muted-foreground text-sm grid grid-cols-1 gap-y-1">
            {pet.species && <span>{pet.species}</span>}
            {pet.breed && <span className="truncate">{pet.breed}</span>}
            {pet.age && <span>{pet.age}</span>}
            {pet.gender && <span>{pet.gender}</span>}
            {pet.weight && <span>{pet.weight} lbs</span>}
            {pet.location && <span className="truncate col-span-2">{pet.location}</span>}
          </div>
          <div className="flex flex-wrap gap-1 mt-auto pt-1">
            {pet.urgent && <Badge className="bg-red-100 text-red-700 text-xs">Urgent</Badge>}
            {pet.rescue_needed && <Badge className="bg-orange-100 text-orange-700 text-xs">Rescue Needed</Badge>}
            {pet.transfer_needed && <Badge className="bg-blue-100 text-blue-700 text-xs">Transfer</Badge>}
            {pet.stipend_available && <Badge className="bg-emerald-100 text-emerald-800 text-xs">💰 Stipend</Badge>}
            {pet.vaccinated && <Badge className="bg-green-100 text-green-700 text-xs">Vaccinated</Badge>}
            {pet.spayed_neutered && <Badge className="bg-green-100 text-green-700 text-xs">Spayed/Neutered</Badge>}
          </div>
          <div className="pt-2 border-t mt-1">
            <p className="text-xs text-muted-foreground mb-1.5 font-medium">Animal Status</p>
            <div className="flex gap-1.5 flex-wrap">
              {['Available', 'Adopted', 'Transferred'].map((status) =>
                <button
                  key={status}
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange(status)}
                  className={`px-2.5 py-1 rounded-full text-xs border font-medium transition-colors ${pet.adoption_status === status ? STATUS_COLORS[status] : 'bg-white border-border text-muted-foreground hover:border-primary'}`}>
                  {status}
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {showPreview &&
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Public Preview: {pet.name}</DialogTitle>
            </DialogHeader>
            <div className="pt-2">
              {pet.photo_urls?.[0] || pet.photo_url ?
                <img src={pet.photo_urls?.[0] || pet.photo_url} alt={pet.name} className="w-full h-48 object-cover rounded-lg" referrerPolicy="no-referrer" /> :
                <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center text-4xl">🐾</div>
              }
              <div className="space-y-3 mt-4">
                <div>
                  <h2 className="text-xl font-semibold">{pet.name}</h2>
                  {pet.source && pet.source !== 'Manual' && <p className="text-sm text-muted-foreground">🏠 {pet.source}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {pet.species && <div><span className="font-medium text-muted-foreground">Species</span><p>{pet.species}</p></div>}
                  {pet.breed && <div><span className="font-medium text-muted-foreground">Breed</span><p>{pet.breed}</p></div>}
                  {pet.age && <div><span className="font-medium text-muted-foreground">Age</span><p>{pet.age}</p></div>}
                  {pet.gender && <div><span className="font-medium text-muted-foreground">Gender</span><p>{pet.gender}</p></div>}
                  {pet.weight && <div><span className="font-medium text-muted-foreground">Weight</span><p>{pet.weight} lbs</p></div>}
                  {pet.location && <div><span className="font-medium text-muted-foreground">Location</span><p>{pet.location}</p></div>}
                </div>
                {pet.description &&
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">About</p>
                    <p className="text-sm mt-1">{pet.description}</p>
                  </div>
                }
                <div className="flex flex-wrap gap-2">
                  {pet.urgent && <Badge className="bg-red-100 text-red-700">Urgent</Badge>}
                  {pet.rescue_needed && <Badge className="bg-orange-100 text-orange-700">Rescue Needed</Badge>}
                  {pet.transfer_needed && <Badge className="bg-blue-100 text-blue-700">Transfer Needed</Badge>}
                  {pet.vaccinated && <Badge className="bg-green-100 text-green-700">Vaccinated</Badge>}
                  {pet.spayed_neutered && <Badge className="bg-green-100 text-green-700">Spayed/Neutered</Badge>}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      }
    </>
  );
}

export default function ShelterDashboard() {
  const [editingPet, setEditingPet] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: connections = [] } = useQuery({
    queryKey: ['my-shelter-connections'],
    queryFn: () => base44.entities.ShelterConnection.filter({ created_by: user?.email }),
    enabled: !!user
  });

  const shelterNames = connections.map((c) => c.shelter_name);

  const { data: allPets = [], isLoading, refetch } = useQuery({
    queryKey: ['shelter-pets', shelterNames, user?.email],
    queryFn: () => base44.entities.Pet.list('-created_date', 500),
    enabled: !!user
  });

  const handleToggleVisibility = async (pet) => {
    await base44.entities.Pet.update(pet.id, { hidden_from_public: !pet.hidden_from_public });
    toast.success(pet.hidden_from_public ? `${pet.name} is now visible to the public` : `${pet.name} is now hidden from public`);
    refetch();
  };

  const affiliatedOrg = user?.affiliated_organization;
  const myPets = allPets.filter((pet) => {
    if (pet.created_by === user?.email) return true;
    if (shelterNames.some((name) =>
      pet.source?.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(pet.source?.toLowerCase() || '')
    )) return true;
    if (affiliatedOrg && pet.source_id?.startsWith('admin_manual_') &&
      (pet.source?.toLowerCase() === affiliatedOrg.toLowerCase())) return true;
    return false;
  });

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/ShelterPortal">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">🐾 My Shelter Pets</h1>
              <p className="text-xs text-muted-foreground">Manage pets synced from your connected shelters</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {myPets.length > 0 &&
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {myPets.length} pet{myPets.length !== 1 ? 's' : ''}
              </Badge>
            }
            <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" /> Add Pet
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ?
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div> :
          myPets.length === 0 ?
            <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
              <PawPrint className="w-12 h-12 text-muted-foreground/40" />
              <p className="text-lg font-medium text-muted-foreground">No pets yet</p>
              <p className="text-sm text-muted-foreground">Pets from your connected shelters will appear here, or add them manually.</p>
              <Button size="sm" className="gap-1.5 mt-2" onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4" /> Add a Pet
              </Button>
            </div> :
            <>
              {connections.map((conn) => {
                const connPets = myPets.filter((pet) =>
                  pet.source?.toLowerCase().includes(conn.shelter_name.toLowerCase()) ||
                  conn.shelter_name.toLowerCase().includes(pet.source?.toLowerCase() || '')
                );
                if (connPets.length === 0) return null;
                return (
                  <div key={conn.id} className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">🏠</div>
                      <div>
                        <h2 className="font-semibold text-lg">{conn.shelter_name}</h2>
                        <p className="text-xs text-muted-foreground">{conn.software_platform} · {connPets.length} pets</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {connPets.map((pet) =>
                        <ShelterPetCard key={pet.id} pet={pet} onEdit={setEditingPet} onToggleVisibility={handleToggleVisibility} onStatusChange={refetch} onDelete={refetch} />
                      )}
                    </div>
                  </div>
                );
              })}
              {(() => {
                const manualPets = myPets.filter((pet) =>
                  !connections.some((conn) =>
                    pet.source?.toLowerCase().includes(conn.shelter_name.toLowerCase()) ||
                    conn.shelter_name.toLowerCase().includes(pet.source?.toLowerCase() || '')
                  )
                );
                if (manualPets.length === 0) return null;
                return (
                  <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">✏️</div>
                      <div>
                        <h2 className="font-semibold text-lg">Manually Added</h2>
                        <p className="text-xs text-muted-foreground">{manualPets.length} pet{manualPets.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {manualPets.map((pet) =>
                        <ShelterPetCard key={pet.id} pet={pet} onEdit={setEditingPet} onToggleVisibility={handleToggleVisibility} onStatusChange={refetch} onDelete={refetch} />
                      )}
                    </div>
                  </div>
                );
              })()}
            </>
        }
      </div>

      {editingPet &&
        <EditPetModal pet={editingPet} open={!!editingPet} onClose={() => setEditingPet(null)} onSaved={refetch} />
      }

      <CreatePetModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={refetch}
        userAffiliatedOrg={user?.affiliated_organization} />
    </div>
  );
}