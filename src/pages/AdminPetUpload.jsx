import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Plus, ShieldAlert, PawPrint, Pencil, Trash2, Check } from 'lucide-react';
import PhotoManager from '@/components/pets/PhotoManager';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const GENDER_OPTIONS = ['Male', 'Female', 'Unknown'];
const SIZE_OPTIONS = ['Small', 'Medium', 'Large', 'Extra Large'];
const EMPTY_PET = {
  name: '', species: '', breed: '', age: '', gender: '', size: '',
  weight: '', location: '', photo_urls: [], description: '',
  adoption_status: 'Available',
  vaccinated: false, spayed_neutered: false, dewormed: false,
  transfer_needed: false, rescue_needed: false, urgent: false,
  stipend_available: false,
  kid_friendly: '', dog_friendly: '', cat_friendly: ''
};

function PetForm({ form, setForm, selectedSource, setSelectedSource, shelterOptions, onSave, onCancel, saving, isEdit }) {
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label>Shelter / Rescue *</Label>
        {shelterOptions.length > 0 ? (
          <Select value={selectedSource} onValueChange={setSelectedSource}>
            <SelectTrigger><SelectValue placeholder="Select a shelter..." /></SelectTrigger>
            <SelectContent>
              {shelterOptions.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
              <SelectItem value="__custom__">✏️ Enter manually...</SelectItem>
            </SelectContent>
          </Select>
        ) : null}
        {(selectedSource === '__custom__' || shelterOptions.length === 0) && (
          <Input
            placeholder="Enter shelter or rescue name"
            value={selectedSource === '__custom__' ? '' : selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Name *</Label>
          <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Buddy" />
        </div>
        <div className="space-y-1.5">
          <Label>Species</Label>
          <Input value={form.species} onChange={e => set('species', e.target.value)} placeholder="Dog, Cat..." />
        </div>
        <div className="space-y-1.5">
          <Label>Breed</Label>
          <Input value={form.breed} onChange={e => set('breed', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Age</Label>
          <div className="flex gap-2">
            <Input
              type="number" min="0" placeholder="e.g. 3"
              value={form.age ? (form.age.match(/^\d+/) || [''])[0] : ''}
              onChange={e => {
                const unit = form.age?.includes('month') ? 'months' : 'years';
                set('age', e.target.value ? `${e.target.value} ${unit}` : '');
              }}
              className="w-20"
            />
            <Select
              value={form.age?.includes('month') ? 'months' : 'years'}
              onValueChange={unit => {
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
          <Select value={form.gender} onValueChange={v => set('gender', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{GENDER_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Size</Label>
          <Select value={form.size} onValueChange={v => set('size', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{SIZE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Weight (lbs)</Label>
          <Input type="number" value={form.weight} onChange={e => set('weight', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Location</Label>
          <Input value={form.location} onChange={e => set('location', e.target.value)} placeholder="City, State" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Photos <span className="text-muted-foreground font-normal text-xs">(up to 5)</span></Label>
        <PhotoManager
          photoUrls={form.photo_urls || []}
          focalPoints={form.photo_focal_points || []}
          onChange={(urls) => setForm(f => ({ ...f, photo_urls: urls }))}
          onFocalPointsChange={(fps) => setForm(f => ({ ...f, photo_focal_points: fps }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Adoption Status</Label>
        <Select value={form.adoption_status || 'Available'} onValueChange={v => set('adoption_status', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="Adopted">Adopted</SelectItem>
            <SelectItem value="Transferred">Transferred</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="A short story about this pet..." />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'kid_friendly', label: '👧 Kid Friendly' },
          { key: 'dog_friendly', label: '🐕 Dog Friendly' },
          { key: 'cat_friendly', label: '🐈 Cat Friendly' },
        ].map(({ key, label }) => (
          <div key={key} className="space-y-1.5">
            <Label className="text-xs">{label}</Label>
            <Select value={form[key]} onValueChange={v => set(key, v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Unknown" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="unsure">Unsure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        {[
          { key: 'vaccinated', label: 'Vaccinated' },
          { key: 'spayed_neutered', label: 'Spayed / Neutered' },
          { key: 'dewormed', label: 'Dewormed' },
          { key: 'transfer_needed', label: 'Transfer Needed' },
          { key: 'rescue_needed', label: 'Rescue Needed' },
          { key: 'urgent', label: 'Urgent' },
          { key: 'stipend_available', label: 'Stipend Available' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <Switch checked={!!form[key]} onCheckedChange={v => set(key, v)} />
            <Label>{label}</Label>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-3 border-t">
        <Button onClick={onSave} disabled={saving} className="bg-[#708238] hover:bg-[#5a6a2c] text-white gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {saving ? (isEdit ? 'Saving...' : 'Adding...') : isEdit ? 'Save Changes' : 'Add Pet'}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          {isEdit ? 'Cancel' : 'Clear Form'}
        </Button>
      </div>
    </div>
  );
}

export default function AdminPetUpload() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('add');
  const [form, setForm] = useState({ ...EMPTY_PET });
  const [selectedSource, setSelectedSource] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSource, setEditSource] = useState('');
  const [deleting, setDeleting] = useState(null);

  const { data: user, isLoading: loadingMe } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allConnections = [] } = useQuery({
    queryKey: ['all-shelter-connections'],
    queryFn: () => base44.entities.ShelterConnection.list(),
    enabled: user?.role === 'admin',
  });

  const { data: allShelterDetails = [] } = useQuery({
    queryKey: ['all-shelter-details'],
    queryFn: () => base44.entities.ShelterDetails.list(),
    enabled: user?.role === 'admin',
  });

  const { data: allPets = [], isLoading: loadingPets, refetch: refetchPets } = useQuery({
    queryKey: ['admin-manual-pets'],
    queryFn: () => base44.entities.Pet.list('-created_date', 500),
    enabled: user?.role === 'admin',
  });

  const adminPets = allPets.filter(p => p.source_id?.startsWith('admin_manual_'));

  const shelterOptions = [
    ...new Set([
      ...allConnections.map(c => c.shelter_name),
      ...allShelterDetails.map(s => s.shelter_name),
    ])
  ].filter(Boolean).sort();

  const handleAdd = async () => {
    if (!form.name) return toast.error('Pet name is required');
    if (!selectedSource) return toast.error('Please select a shelter / source');
    setSaving(true);
    await base44.entities.Pet.create({
      ...form,
      photo_url: form.photo_urls?.[0] || '',
      photo_focal_points: form.photo_focal_points || [],
      weight: form.weight ? parseFloat(form.weight) : null,
      source: selectedSource,
      source_id: `admin_manual_${Date.now()}`,
      adoption_status: form.adoption_status || 'Available',
    });
    toast.success(`${form.name} added successfully!`);
    setForm({ ...EMPTY_PET });
    setSelectedSource('');
    queryClient.invalidateQueries({ queryKey: ['pets'] });
    refetchPets();
    setSaving(false);
    setTab('manage');
  };

  const startEdit = (pet) => {
    setEditingPet(pet.id);
    setEditForm({
      name: pet.name || '', species: pet.species || '', breed: pet.breed || '',
      age: pet.age || '', gender: pet.gender || '', size: pet.size || '',
      weight: pet.weight || '', location: pet.location || '',
      photo_urls: pet.photo_urls || (pet.photo_url ? [pet.photo_url] : []),
      photo_focal_points: pet.photo_focal_points || [],
      description: pet.description || '',
      vaccinated: !!pet.vaccinated, spayed_neutered: !!pet.spayed_neutered,
      dewormed: !!pet.dewormed, transfer_needed: !!pet.transfer_needed,
      rescue_needed: !!pet.rescue_needed, urgent: !!pet.urgent,
      stipend_available: !!pet.stipend_available,
      adoption_status: pet.adoption_status || 'Available',
      kid_friendly: pet.kid_friendly || '', dog_friendly: pet.dog_friendly || '',
      cat_friendly: pet.cat_friendly || '',
    });
    setEditSource(pet.source || '');
  };

  const handleUpdate = async () => {
    if (!editForm.name) return toast.error('Pet name is required');
    setSaving(true);
    await base44.entities.Pet.update(editingPet, {
      ...editForm,
      photo_url: editForm.photo_urls?.[0] || '',
      photo_focal_points: editForm.photo_focal_points || [],
      weight: editForm.weight ? parseFloat(editForm.weight) : null,
      source: editSource,
    });
    toast.success(`${editForm.name} updated!`);
    setEditingPet(null);
    queryClient.invalidateQueries({ queryKey: ['pets'] });
    refetchPets();
    setSaving(false);
  };

  const handleDelete = async (pet) => {
    if (!confirm(`Delete ${pet.name}? This cannot be undone.`)) return;
    setDeleting(pet.id);
    await base44.entities.Pet.delete(pet.id);
    toast.success(`${pet.name} deleted`);
    queryClient.invalidateQueries({ queryKey: ['pets'] });
    refetchPets();
    setDeleting(null);
  };

  if (loadingMe) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );

  if (user?.role !== 'admin') return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
      <ShieldAlert className="w-16 h-16 text-red-400" />
      <h1 className="text-2xl font-bold">Access Denied</h1>
      <p className="text-muted-foreground">This page is restricted to administrators only.</p>
      <Link to="/PetDashboard"><Button variant="outline">Go Back</Button></Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link to="/AdminUsers">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <PawPrint className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-xl font-bold">Admin Pet Upload</h1>
            <Badge variant="secondary" className="text-xs">Admin Only</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex gap-1 mb-6 bg-white border rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab('add')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'add' ? 'bg-[#708238] text-white' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Add Pet
          </button>
          <button
            onClick={() => setTab('manage')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${tab === 'manage' ? 'bg-[#708238] text-white' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Manage Uploaded
            {adminPets.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === 'manage' ? 'bg-white/20' : 'bg-muted'}`}>{adminPets.length}</span>
            )}
          </button>
        </div>

        {tab === 'add' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add a Pet on Behalf of a Shelter</CardTitle>
              <p className="text-sm text-muted-foreground">Manually upload pet cards and assign them to any shelter or rescue.</p>
            </CardHeader>
            <CardContent>
              <PetForm
                form={form} setForm={setForm}
                selectedSource={selectedSource} setSelectedSource={setSelectedSource}
                shelterOptions={shelterOptions}
                onSave={handleAdd}
                onCancel={() => { setForm({ ...EMPTY_PET }); setSelectedSource(''); }}
                saving={saving}
                isEdit={false}
              />
            </CardContent>
          </Card>
        )}

        {tab === 'manage' && (
          <div className="space-y-4">
            {loadingPets ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : adminPets.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <PawPrint className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No admin-uploaded pets yet.</p>
                <Button size="sm" className="mt-4 bg-[#708238] hover:bg-[#5a6a2c] text-white" onClick={() => setTab('add')}>Add your first pet</Button>
              </div>
            ) : adminPets.map(pet => (
              <Card key={pet.id} className={editingPet === pet.id ? 'ring-2 ring-[#708238]' : ''}>
                {editingPet === pet.id ? (
                  <CardContent className="pt-5">
                    <p className="font-semibold mb-4">Editing: {editForm.name || pet.name}</p>
                    <PetForm
                      form={editForm} setForm={setEditForm}
                      selectedSource={editSource} setSelectedSource={setEditSource}
                      shelterOptions={shelterOptions}
                      onSave={handleUpdate}
                      onCancel={() => setEditingPet(null)}
                      saving={saving}
                      isEdit={true}
                    />
                  </CardContent>
                ) : (
                  <CardContent className="pt-4 pb-4">
                    <div className="flex gap-3 items-start">
                      {(pet.photo_url || pet.photo_urls?.[0]) ? (
                        <img src={pet.photo_url || pet.photo_urls[0]} alt={pet.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-2xl shrink-0">🐾</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{pet.name}</p>
                        <p className="text-sm text-muted-foreground">{pet.source}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {pet.species && <Badge variant="secondary" className="text-xs">{pet.species}</Badge>}
                          {pet.breed && <Badge variant="secondary" className="text-xs">{pet.breed}</Badge>}
                          {pet.age && <Badge variant="secondary" className="text-xs">{pet.age}</Badge>}
                          {pet.urgent && <Badge className="text-xs bg-red-100 text-red-700">Urgent</Badge>}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => startEdit(pet)}>
                          <Pencil className="w-3 h-3" /> Edit
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          className="gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          disabled={deleting === pet.id}
                          onClick={() => handleDelete(pet)}
                        >
                          {deleting === pet.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}