import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44, supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus, Truck, ChevronRight, ChevronDown, Pencil, Trash2, Loader2,
  PawPrint, User, Phone, Mail, MapPin, Calendar, ArrowRight, X
} from 'lucide-react';

// ── Status config ──────────────────────────────────────────────────────────────
const ANIMAL_STATUSES = [
  { value: 'pulled',          label: 'Pulled',          color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { value: 'health_cleared',  label: 'Health Cleared',  color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { value: 'foster_assigned', label: 'Foster Assigned', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'scheduled',       label: 'Scheduled',       color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { value: 'in_transit',      label: 'In Transit',      color: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
  { value: 'arrived',         label: 'Arrived',         color: 'bg-green-100 text-green-700 border-green-300' },
];

const RUN_STATUSES = [
  { value: 'draft',       label: 'Draft',       color: 'bg-slate-100 text-slate-600' },
  { value: 'confirmed',   label: 'Confirmed',   color: 'bg-blue-100 text-blue-700' },
  { value: 'in_transit',  label: 'In Transit',  color: 'bg-indigo-100 text-indigo-700' },
  { value: 'completed',   label: 'Completed',   color: 'bg-green-100 text-green-700' },
  { value: 'cancelled',   label: 'Cancelled',   color: 'bg-red-100 text-red-600' },
];

function statusConfig(list, value) {
  return list.find((s) => s.value === value) || list[0];
}

// ── Create/Edit Run Modal ──────────────────────────────────────────────────────
const EMPTY_RUN = {
  run_name: '', transport_date: '', transport_time: '',
  pickup_location: '', dropoff_location: '',
  status: 'draft',
  driver_name: '', driver_email: '', driver_phone: '',
  coordinator_name: '', coordinator_email: '',
  receiving_org_name: '', receiving_contact_name: '',
  receiving_contact_email: '', receiving_contact_phone: '',
  vehicle_info: '', notes: '',
};

function RunModal({ run, shelterSource, userEmail, open, onClose, onSaved }) {
  const [form, setForm] = useState(run ? { ...run } : { ...EMPTY_RUN });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // EPM users for driver/coordinator pickers
  const { data: epmUsers = [] } = useQuery({
    queryKey: ['all-profiles-transport'],
    queryFn: () => base44.entities.User.list(),
  });

  const handleSave = async () => {
    if (!form.run_name) return toast.error('Run name is required');
    setSaving(true);
    try {
      const payload = { ...form, shelter_source: shelterSource, created_by: userEmail };
      if (run) {
        await base44.entities.TransportRun.update(run.id, payload);
        toast.success('Transport run updated');
      } else {
        await base44.entities.TransportRun.create(payload);
        toast.success('Transport run created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error('Error saving run: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{run ? 'Edit Transport Run' : 'New Transport Run'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          {/* Core */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Run Name *</Label>
              <Input value={form.run_name} onChange={(e) => set('run_name', e.target.value)} placeholder="e.g. Northeast Rescue Run #12" />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={form.transport_date || ''} onChange={(e) => set('transport_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Input type="time" value={form.transport_time || ''} onChange={(e) => set('transport_time', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Pickup Location</Label>
              <Input value={form.pickup_location || ''} onChange={(e) => set('pickup_location', e.target.value)} placeholder="City, State" />
            </div>
            <div className="space-y-1.5">
              <Label>Drop-off Location</Label>
              <Input value={form.dropoff_location || ''} onChange={(e) => set('dropoff_location', e.target.value)} placeholder="City, State" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RUN_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Vehicle / Transport Info</Label>
              <Input value={form.vehicle_info || ''} onChange={(e) => set('vehicle_info', e.target.value)} placeholder="White van, trailer, etc." />
            </div>
          </div>

          {/* Driver */}
          <div className="border rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2"><Truck className="w-4 h-4" /> Driver</p>
            <div className="space-y-1.5">
              <Label>EPM User (optional)</Label>
              <Select value={form.driver_user_id || ''} onValueChange={(v) => set('driver_user_id', v || null)}>
                <SelectTrigger><SelectValue placeholder="Select EPM user..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— None —</SelectItem>
                  {epmUsers.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={form.driver_name || ''} onChange={(e) => set('driver_name', e.target.value)} placeholder="External driver" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.driver_email || ''} onChange={(e) => set('driver_email', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.driver_phone || ''} onChange={(e) => set('driver_phone', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Coordinator */}
          <div className="border rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2"><User className="w-4 h-4" /> Coordinator</p>
            <div className="space-y-1.5">
              <Label>EPM User (optional)</Label>
              <Select value={form.coordinator_user_id || ''} onValueChange={(v) => set('coordinator_user_id', v || null)}>
                <SelectTrigger><SelectValue placeholder="Select EPM user..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— None —</SelectItem>
                  {epmUsers.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={form.coordinator_name || ''} onChange={(e) => set('coordinator_name', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.coordinator_email || ''} onChange={(e) => set('coordinator_email', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Receiving org */}
          <div className="border rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2"><MapPin className="w-4 h-4" /> Receiving Organization</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Organization Name</Label>
                <Input value={form.receiving_org_name || ''} onChange={(e) => set('receiving_org_name', e.target.value)} placeholder="Receiving shelter / rescue" />
              </div>
              <div className="space-y-1.5">
                <Label>Contact Name</Label>
                <Input value={form.receiving_contact_name || ''} onChange={(e) => set('receiving_contact_name', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Contact Phone</Label>
                <Input value={form.receiving_contact_phone || ''} onChange={(e) => set('receiving_contact_phone', e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Contact Email</Label>
                <Input type="email" value={form.receiving_contact_email || ''} onChange={(e) => set('receiving_contact_email', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} placeholder="Any special instructions, meeting points, etc." />
          </div>

          <div className="flex gap-3 pt-2 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : (run ? 'Save Changes' : 'Create Run')}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Add/Edit Animal Modal ──────────────────────────────────────────────────────
const EMPTY_ANIMAL = {
  pet_name: '', pet_species: '', pet_breed: '',
  transport_status: 'pulled', crate_number: '',
  foster_name: '', foster_email: '', foster_phone: '',
  external_contact_name: '', external_contact_email: '', external_contact_phone: '',
  notes: '',
};

function AnimalModal({ animal, runId, shelterPets, open, onClose, onSaved }) {
  const [form, setForm] = useState(animal ? { ...animal } : { ...EMPTY_ANIMAL });
  const [saving, setSaving] = useState(false);
  const [petSearch, setPetSearch] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const { data: epmUsers = [] } = useQuery({
    queryKey: ['all-profiles-transport'],
    queryFn: () => base44.entities.User.list(),
  });

  const filteredPets = (shelterPets || []).filter((p) =>
    p.name?.toLowerCase().includes(petSearch.toLowerCase()) ||
    p.breed?.toLowerCase().includes(petSearch.toLowerCase())
  ).slice(0, 20);

  const selectPet = (pet) => {
    set('pet_id', pet.id);
    set('pet_name', pet.name || '');
    set('pet_species', pet.species || '');
    set('pet_breed', pet.breed || '');
    setPetSearch('');
  };

  const handleSave = async () => {
    if (!form.pet_name) return toast.error('Animal name is required');
    saving || setSaving(true);
    try {
      const payload = { ...form, run_id: runId };
      if (animal) {
        await base44.entities.TransportAnimal.update(animal.id, payload);
        toast.success('Animal updated');
      } else {
        await base44.entities.TransportAnimal.create(payload);
        toast.success('Animal added to run');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error('Error saving: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{animal ? 'Edit Animal' : 'Add Animal to Run'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Pet picker */}
          {!animal && (
            <div className="space-y-1.5">
              <Label>Search shelter pets</Label>
              <Input
                value={petSearch}
                onChange={(e) => setPetSearch(e.target.value)}
                placeholder="Type to search your shelter pets..."
              />
              {petSearch && filteredPets.length > 0 && (
                <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
                  {filteredPets.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectPet(p)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2">
                      <PawPrint className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="font-medium">{p.name}</span>
                      {p.species && <span className="text-muted-foreground">· {p.species}</span>}
                      {p.breed && <span className="text-muted-foreground truncate">· {p.breed}</span>}
                    </button>
                  ))}
                </div>
              )}
              {petSearch && filteredPets.length === 0 && (
                <p className="text-xs text-muted-foreground">No matches — fill in name manually below</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.pet_name} onChange={(e) => set('pet_name', e.target.value)} placeholder="Animal name" />
            </div>
            <div className="space-y-1.5">
              <Label>Species</Label>
              <Input value={form.pet_species || ''} onChange={(e) => set('pet_species', e.target.value)} placeholder="Dog, Cat..." />
            </div>
            <div className="space-y-1.5">
              <Label>Breed</Label>
              <Input value={form.pet_breed || ''} onChange={(e) => set('pet_breed', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Crate #</Label>
              <Input value={form.crate_number || ''} onChange={(e) => set('crate_number', e.target.value)} placeholder="e.g. A1" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Transport Status</Label>
            <Select value={form.transport_status} onValueChange={(v) => set('transport_status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ANIMAL_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Foster */}
          <div className="border rounded-lg p-3 space-y-3">
            <p className="text-sm font-semibold">Foster / Receiving Person</p>
            <div className="space-y-1.5">
              <Label>EPM User (optional)</Label>
              <Select value={form.foster_user_id || ''} onValueChange={(v) => set('foster_user_id', v || null)}>
                <SelectTrigger><SelectValue placeholder="Select EPM user..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— None —</SelectItem>
                  {epmUsers.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={form.foster_name || ''} onChange={(e) => set('foster_name', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.foster_email || ''} onChange={(e) => set('foster_email', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.foster_phone || ''} onChange={(e) => set('foster_phone', e.target.value)} />
              </div>
            </div>
          </div>

          {/* External contact */}
          <div className="border rounded-lg p-3 space-y-3">
            <p className="text-sm font-semibold">External Contact (override)</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={form.external_contact_name || ''} onChange={(e) => set('external_contact_name', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.external_contact_email || ''} onChange={(e) => set('external_contact_email', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.external_contact_phone || ''} onChange={(e) => set('external_contact_phone', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} placeholder="Medical needs, behavioral notes, etc." />
          </div>

          <div className="flex gap-3 pt-2 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : (animal ? 'Save Changes' : 'Add Animal')}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Animal status pill (inline update) ────────────────────────────────────────
function AnimalStatusPill({ animal, onChange }) {
  const [updating, setUpdating] = useState(false);
  const cfg = statusConfig(ANIMAL_STATUSES, animal.transport_status);
  const nextIdx = (ANIMAL_STATUSES.findIndex((s) => s.value === animal.transport_status) + 1) % ANIMAL_STATUSES.length;
  const next = ANIMAL_STATUSES[nextIdx];

  const advance = async () => {
    setUpdating(true);
    try {
      await base44.entities.TransportAnimal.update(animal.id, { transport_status: next.value });
      onChange();
    } catch {
      toast.error('Could not update status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <button
      onClick={advance}
      disabled={updating}
      title={`Advance to: ${next.label}`}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-medium transition-opacity hover:opacity-80 ${cfg.color}`}>
      {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
      {cfg.label}
      <ChevronRight className="w-3 h-3 opacity-60" />
    </button>
  );
}

// ── Status Board view ──────────────────────────────────────────────────────────
function StatusBoard({ runs, animals, onAnimalChange }) {
  const allAnimals = animals;

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3 min-w-max">
        {ANIMAL_STATUSES.map((status) => {
          const group = allAnimals.filter((a) => a.transport_status === status.value);
          const run = (animalId) => runs.find((r) => r.id === allAnimals.find((a) => a.id === animalId)?.run_id);
          return (
            <div key={status.value} className="w-52 flex-shrink-0">
              <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg border-b-2 ${status.color} border-b-current`}>
                <span className="text-xs font-semibold">{status.label}</span>
                <span className="text-xs font-bold">{group.length}</span>
              </div>
              <div className="bg-slate-50 rounded-b-lg border border-t-0 min-h-24 p-2 space-y-2">
                {group.map((a) => {
                  const r = runs.find((x) => x.id === a.run_id);
                  return (
                    <div key={a.id} className="bg-white rounded-md border p-2 text-xs space-y-1 shadow-sm">
                      <div className="flex items-center gap-1 font-semibold">
                        <PawPrint className="w-3 h-3 text-muted-foreground" />
                        {a.pet_name}
                        {a.crate_number && <span className="text-muted-foreground">· #{a.crate_number}</span>}
                      </div>
                      {r && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Truck className="w-3 h-3" />
                          <span className="truncate">{r.run_name}</span>
                        </div>
                      )}
                      {(a.foster_name || a.external_contact_name) && (
                        <div className="text-muted-foreground truncate">→ {a.foster_name || a.external_contact_name}</div>
                      )}
                      <AnimalStatusPill animal={a} onChange={onAnimalChange} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Run card with expandable animal roster ─────────────────────────────────────
function RunCard({ run, animals, shelterPets, onRunEdit, onRunDelete, onAnimalChange }) {
  const [expanded, setExpanded] = useState(false);
  const [addAnimalOpen, setAddAnimalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const qc = useQueryClient();

  const runAnimals = animals.filter((a) => a.run_id === run.id);
  const runStatus = statusConfig(RUN_STATUSES, run.status);

  const handleDeleteRun = async () => {
    if (!window.confirm(`Delete "${run.run_name}" and all its animals?`)) return;
    setDeleting(true);
    try {
      // animals cascade-delete via FK
      await base44.entities.TransportRun.delete(run.id);
      toast.success('Run deleted');
      onRunDelete();
    } catch (err) {
      toast.error('Delete failed: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAnimal = async (animal) => {
    if (!window.confirm(`Remove ${animal.pet_name} from this run?`)) return;
    try {
      await base44.entities.TransportAnimal.delete(animal.id);
      toast.success('Animal removed');
      onAnimalChange();
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Run header */}
          <div
            className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => setExpanded((e) => !e)}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{run.run_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${runStatus.color}`}>{runStatus.label}</span>
                <span className="text-xs text-muted-foreground">{runAnimals.length} animal{runAnimals.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                {run.transport_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(run.transport_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {run.transport_time && ` · ${run.transport_time}`}
                  </span>
                )}
                {(run.pickup_location || run.dropoff_location) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {run.pickup_location}
                    {run.pickup_location && run.dropoff_location && <ArrowRight className="w-3 h-3" />}
                    {run.dropoff_location}
                  </span>
                )}
                {run.driver_name && (
                  <span className="flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    {run.driver_name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onRunEdit(run); }}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteRun(); }} disabled={deleting}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
              {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </div>
          </div>

          {/* Animal roster */}
          {expanded && (
            <div className="border-t px-4 pb-4 pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Animal Roster</p>
                <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={() => setAddAnimalOpen(true)}>
                  <Plus className="w-3.5 h-3.5" /> Add Animal
                </Button>
              </div>

              {runAnimals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No animals on this run yet</p>
              ) : (
                <div className="space-y-2">
                  {runAnimals.map((animal) => {
                    const animalStatus = statusConfig(ANIMAL_STATUSES, animal.transport_status);
                    return (
                      <div key={animal.id} className="flex items-start gap-3 bg-slate-50 rounded-lg p-3 text-sm">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{animal.pet_name}</span>
                            {animal.pet_species && <span className="text-muted-foreground text-xs">{animal.pet_species}</span>}
                            {animal.pet_breed && <span className="text-muted-foreground text-xs">· {animal.pet_breed}</span>}
                            {animal.crate_number && <span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded font-mono">#{animal.crate_number}</span>}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <AnimalStatusPill animal={animal} onChange={onAnimalChange} />
                            {(animal.foster_name || animal.foster_email) && (
                              <span className="text-xs text-muted-foreground">Foster: {animal.foster_name || animal.foster_email}</span>
                            )}
                            {(animal.external_contact_name) && (
                              <span className="text-xs text-muted-foreground">Contact: {animal.external_contact_name}</span>
                            )}
                          </div>
                          {animal.notes && <p className="text-xs text-muted-foreground italic">{animal.notes}</p>}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingAnimal(animal)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDeleteAnimal(animal)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AnimalModal
        open={addAnimalOpen}
        onClose={() => setAddAnimalOpen(false)}
        runId={run.id}
        shelterPets={shelterPets}
        onSaved={onAnimalChange}
      />
      {editingAnimal && (
        <AnimalModal
          open={!!editingAnimal}
          onClose={() => setEditingAnimal(null)}
          animal={editingAnimal}
          runId={run.id}
          shelterPets={shelterPets}
          onSaved={() => { onAnimalChange(); setEditingAnimal(null); }}
        />
      )}
    </>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function TransportLogistics({ user, shelterPets, shelterSource }) {
  const [view, setView] = useState('runs'); // 'runs' | 'board'
  const [createRunOpen, setCreateRunOpen] = useState(false);
  const [editingRun, setEditingRun] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const qc = useQueryClient();

  const userEmail = user?.email;

  const { data: runs = [], isLoading: loadingRuns, refetch: refetchRuns } = useQuery({
    queryKey: ['transport-runs', userEmail],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transport_runs')
        .select('*')
        .order('transport_date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userEmail,
  });

  const { data: animals = [], isLoading: loadingAnimals, refetch: refetchAnimals } = useQuery({
    queryKey: ['transport-animals', userEmail],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transport_animals')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userEmail,
  });

  const refresh = () => { refetchRuns(); refetchAnimals(); };

  const filteredRuns = statusFilter === 'all' ? runs : runs.filter((r) => r.status === statusFilter);

  const loading = loadingRuns || loadingAnimals;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border rounded-lg overflow-hidden text-sm">
            <button
              onClick={() => setView('runs')}
              className={`px-3 py-1.5 font-medium transition-colors ${view === 'runs' ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-100'}`}>
              Runs
            </button>
            <button
              onClick={() => setView('board')}
              className={`px-3 py-1.5 font-medium transition-colors ${view === 'board' ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-100'}`}>
              Status Board
            </button>
          </div>
          {/* Status filter (runs view only) */}
          {view === 'runs' && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {RUN_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setCreateRunOpen(true)}>
          <Plus className="w-4 h-4" /> New Run
        </Button>
      </div>

      {/* Summary strip */}
      {runs.length > 0 && (
        <div className="flex gap-3 flex-wrap text-xs">
          {RUN_STATUSES.filter((s) => s.value !== 'cancelled').map((s) => {
            const count = runs.filter((r) => r.status === s.value).length;
            if (!count) return null;
            return (
              <span key={s.value} className={`px-2.5 py-1 rounded-full font-medium border ${s.color}`}>
                {count} {s.label}
              </span>
            );
          })}
          <span className="px-2.5 py-1 rounded-full font-medium border bg-slate-100 text-slate-600">
            {animals.length} animals total
          </span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
        </div>
      ) : view === 'board' ? (
        animals.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No animals on any run yet — create a run and add animals to it.</p>
          </div>
        ) : (
          <StatusBoard runs={runs} animals={animals} onAnimalChange={refresh} />
        )
      ) : filteredRuns.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium mb-1">{statusFilter !== 'all' ? 'No runs with this status' : 'No transport runs yet'}</p>
          <p className="text-sm">Create a run to start organizing transports.</p>
          <Button size="sm" className="mt-4 gap-1.5" onClick={() => setCreateRunOpen(true)}>
            <Plus className="w-4 h-4" /> New Run
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRuns.map((run) => (
            <RunCard
              key={run.id}
              run={run}
              animals={animals}
              shelterPets={shelterPets}
              onRunEdit={setEditingRun}
              onRunDelete={refresh}
              onAnimalChange={refresh}
            />
          ))}
        </div>
      )}

      {/* Create run modal */}
      <RunModal
        open={createRunOpen}
        onClose={() => setCreateRunOpen(false)}
        shelterSource={shelterSource}
        userEmail={userEmail}
        onSaved={refresh}
      />

      {/* Edit run modal */}
      {editingRun && (
        <RunModal
          open={!!editingRun}
          run={editingRun}
          onClose={() => setEditingRun(null)}
          shelterSource={shelterSource}
          userEmail={userEmail}
          onSaved={() => { refresh(); setEditingRun(null); }}
        />
      )}
    </div>
  );
}
