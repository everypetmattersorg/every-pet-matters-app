import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Camera, X } from 'lucide-react';

const TABS = ['Basic Info', 'Medical', 'Behavior & Fun', 'Sharing'];

export default function OwnedPetForm({ pet, ownerEmail, onSave, onCancel }) {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState(pet || { owner_email: ownerEmail });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (k, v) => setData(prev => ({ ...prev, [k]: v }));

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set('photo_url', file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    if (data.id) {
      await base44.entities.OwnedPet.update(data.id, data);
    } else {
      await base44.entities.OwnedPet.create(data);
    }
    setSaving(false);
    onSave();
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-slate-100 bg-slate-50">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`flex-1 py-3 text-xs font-medium transition-colors ${tab === i ? 'text-rose-600 border-b-2 border-rose-500 bg-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4">
        {tab === 0 && (
          <>
            {/* Photo */}
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0">
                {data.photo_url
                  ? <img src={data.photo_url} alt="pet" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-3xl">🐾</div>
                }
                <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                  {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
              <div className="flex-1">
                <Label className="mb-1.5 block">Pet Name *</Label>
                <Input value={data.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Buddy" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">Pet Type *</Label>
                <Select value={data.pet_type || ''} onValueChange={v => set('pet_type', v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {['dog','cat','bird','rabbit','other'].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Gender</Label>
                <Select value={data.gender || ''} onValueChange={v => set('gender', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">Breed</Label>
              <Input value={data.breed || ''} onChange={e => set('breed', e.target.value)} placeholder="e.g. Golden Retriever" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="mb-1.5 block">Age (years)</Label>
                <Input type="number" value={data.age_years || ''} onChange={e => set('age_years', Number(e.target.value))} placeholder="0" />
              </div>
              <div>
                <Label className="mb-1.5 block">Age (months)</Label>
                <Input type="number" value={data.age_months || ''} onChange={e => set('age_months', Number(e.target.value))} placeholder="0" />
              </div>
              <div>
                <Label className="mb-1.5 block">Weight (lbs)</Label>
                <Input type="number" value={data.weight_lbs || ''} onChange={e => set('weight_lbs', Number(e.target.value))} placeholder="0" />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">Color / Markings</Label>
              <Input value={data.color || ''} onChange={e => set('color', e.target.value)} placeholder="e.g. Golden, black & white" />
            </div>

            <div>
              <Label className="mb-1.5 block">Bio</Label>
              <Textarea value={data.bio || ''} onChange={e => set('bio', e.target.value)} placeholder="Tell us about your pet's personality, story, or anything special about them..." className="h-24" />
            </div>
          </>
        )}

        {tab === 1 && (
          <>
            <div>
              <Label className="mb-1.5 block">Medical History</Label>
              <Textarea value={data.medical_history || ''} onChange={e => set('medical_history', e.target.value)} placeholder="Past conditions, surgeries, vet visits..." className="h-24" />
            </div>
            <div>
              <Label className="mb-1.5 block">Vaccinations</Label>
              <Textarea value={data.vaccinations || ''} onChange={e => set('vaccinations', e.target.value)} placeholder="Rabies, DHPP, Bordetella... (with dates)" className="h-20" />
            </div>
            <div>
              <Label className="mb-1.5 block">Allergies</Label>
              <Input value={data.allergies || ''} onChange={e => set('allergies', e.target.value)} placeholder="e.g. chicken, grass pollen" />
            </div>
            <div>
              <Label className="mb-1.5 block">Current Medications</Label>
              <Input value={data.medications || ''} onChange={e => set('medications', e.target.value)} placeholder="e.g. Heartgard monthly" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <Label className="text-sm">Microchipped</Label>
                <Switch checked={!!data.is_microchipped} onCheckedChange={v => set('is_microchipped', v)} />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <Label className="text-sm">Spayed/Neutered</Label>
                <Switch checked={!!data.spayed_neutered} onCheckedChange={v => set('spayed_neutered', v)} />
              </div>
            </div>
            {data.is_microchipped && (
              <div>
                <Label className="mb-1.5 block">Microchip ID</Label>
                <Input value={data.microchip_id || ''} onChange={e => set('microchip_id', e.target.value)} placeholder="Chip number" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">Vet Name</Label>
                <Input value={data.vet_name || ''} onChange={e => set('vet_name', e.target.value)} placeholder="Dr. Smith" />
              </div>
              <div>
                <Label className="mb-1.5 block">Vet Phone</Label>
                <Input value={data.vet_phone || ''} onChange={e => set('vet_phone', e.target.value)} placeholder="(555) 000-0000" />
              </div>
            </div>
          </>
        )}

        {tab === 2 && (
          <>
            <div>
              <Label className="mb-1.5 block">Behavioral Notes</Label>
              <Textarea value={data.behavioral_notes || ''} onChange={e => set('behavioral_notes', e.target.value)} placeholder="Temperament, fears, triggers, quirks..." className="h-24" />
            </div>
            <div>
              <Label className="mb-1.5 block">Favorite Toys 🧸</Label>
              <Input value={data.favorite_toys || ''} onChange={e => set('favorite_toys', e.target.value)} placeholder="e.g. tennis ball, squeaky toys, rope" />
            </div>
            <div>
              <Label className="mb-1.5 block">Favorite Activities ⚡</Label>
              <Input value={data.favorite_activities || ''} onChange={e => set('favorite_activities', e.target.value)} placeholder="e.g. hiking, fetch, swimming, cuddles" />
            </div>
            <div>
              <Label className="mb-1.5 block">Energy Level</Label>
              <Select value={data.energy_level || ''} onValueChange={v => set('energy_level', v)}>
                <SelectTrigger><SelectValue placeholder="Select energy level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low 😴</SelectItem>
                  <SelectItem value="medium">Medium 🐾</SelectItem>
                  <SelectItem value="high">High ⚡</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <Label className="text-xs">Good with kids</Label>
                <Switch checked={!!data.good_with_kids} onCheckedChange={v => set('good_with_kids', v)} />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <Label className="text-xs">Good with dogs</Label>
                <Switch checked={!!data.good_with_dogs} onCheckedChange={v => set('good_with_dogs', v)} />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <Label className="text-xs">Good with cats</Label>
                <Switch checked={!!data.good_with_cats} onCheckedChange={v => set('good_with_cats', v)} />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Feeding Schedule</Label>
              <Input value={data.feeding_schedule || ''} onChange={e => set('feeding_schedule', e.target.value)} placeholder="e.g. 2x daily, 1 cup each" />
            </div>
            <div>
              <Label className="mb-1.5 block">Food Brand / Diet</Label>
              <Input value={data.food_brand || ''} onChange={e => set('food_brand', e.target.value)} placeholder="e.g. Blue Buffalo, raw diet" />
            </div>
          </>
        )}

        {tab === 3 && (
          <>
            <p className="text-sm text-slate-500">Control how this pet profile is shared with the community.</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <Label>Looking for a Pet Sitter</Label>
                  <p className="text-xs text-slate-500 mt-0.5">Show this profile to available sitters</p>
                </div>
                <Switch checked={!!data.looking_for_sitter} onCheckedChange={v => set('looking_for_sitter', v)} />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <Label>Looking for a Trainer</Label>
                  <p className="text-xs text-slate-500 mt-0.5">Connect with local trainers</p>
                </div>
                <Switch checked={!!data.looking_for_trainer} onCheckedChange={v => set('looking_for_trainer', v)} />
              </div>
              <div className="flex items-center justify-between p-4 bg-rose-50 rounded-xl border border-rose-100">
                <div>
                  <Label>Share Public Profile</Label>
                  <p className="text-xs text-slate-500 mt-0.5">Generate a shareable link for this pet</p>
                </div>
                <Switch checked={!!data.share_profile} onCheckedChange={v => set('share_profile', v)} />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Emergency Contact</Label>
              <Input value={data.emergency_contact || ''} onChange={e => set('emergency_contact', e.target.value)} placeholder="Name & phone for emergencies" />
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-5 flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1 rounded-xl">Cancel</Button>
        <Button onClick={handleSave} disabled={saving || !data.name || !data.pet_type} className="flex-1 rounded-xl bg-rose-500 hover:bg-rose-600">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Save Pet
        </Button>
      </div>
    </div>
  );
}