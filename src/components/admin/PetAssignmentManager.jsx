import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';

export default function PetAssignmentManager() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: pets = [], isLoading: petsLoading } = useQuery({
    queryKey: ['admin-pets'],
    queryFn: () => base44.entities.Pet.list('-created_date', 200),
  });

  const { data: rescues = [] } = useQuery({
    queryKey: ['all-rescues'],
    queryFn: () => base44.entities.Rescue.list(),
  });

  const filteredPets = pets.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.source?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openDialog = (pet = null) => {
    if (pet) {
      setEditing(pet);
      setFormData(pet);
    } else {
      setEditing(null);
      setFormData({ species: 'dog' });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.source) {
      toast.error('Name and shelter/rescue required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.Pet.update(editing.id, formData);
        toast.success('Pet updated');
      } else {
        await base44.entities.Pet.create(formData);
        toast.success('Pet created');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-pets'] });
      setOpen(false);
    } catch (err) {
      toast.error('Error saving: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this pet?')) return;
    try {
      await base44.entities.Pet.delete(id);
      queryClient.invalidateQueries({ queryKey: ['admin-pets'] });
      toast.success('Pet deleted');
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const reassignPet = async (petId, newSource) => {
    if (!newSource) return;
    try {
      await base44.entities.Pet.update(petId, { source: newSource });
      queryClient.invalidateQueries({ queryKey: ['admin-pets'] });
      toast.success('Pet reassigned');
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input 
            placeholder="Search pets..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button size="sm" className="gap-2" onClick={() => openDialog()}>
          <Plus className="w-4 h-4" /> Add Pet
        </Button>
      </div>

      {petsLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : filteredPets.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No pets found</p>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredPets.map(pet => (
            <Card key={pet.id}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{pet.name}</p>
                      <span className="text-xs text-muted-foreground">{pet.species}{pet.breed ? ` • ${pet.breed}` : ''}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">🏠 {pet.source || 'Unassigned'}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7" onClick={() => openDialog(pet)}><Pencil className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 text-red-600" onClick={() => handleDelete(pet.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>

                {/* Reassign */}
                <div className="mt-2 pt-2 border-t flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground">Shelter/Rescue:</span>
                  <Select onValueChange={(val) => reassignPet(pet.id, val)}>
                    <SelectTrigger className="w-40 h-7 text-xs">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {rescues.map(r => (
                        <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Pet' : 'Add Pet'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold">Name *</label>
              <Input value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Pet name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold">Species</label>
                <Select value={formData.species || 'dog'} onValueChange={(v) => setFormData({...formData, species: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">Dog</SelectItem>
                    <SelectItem value="cat">Cat</SelectItem>
                    <SelectItem value="bird">Bird</SelectItem>
                    <SelectItem value="rabbit">Rabbit</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold">Breed</label>
                <Input value={formData.breed || ''} onChange={(e) => setFormData({...formData, breed: e.target.value})} placeholder="Breed" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold">Age</label>
                <Input value={formData.age || ''} onChange={(e) => setFormData({...formData, age: e.target.value})} placeholder="e.g. 2 years" />
              </div>
              <div>
                <label className="text-xs font-semibold">Gender</label>
                <Select value={formData.gender || ''} onValueChange={(v) => setFormData({...formData, gender: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold">Shelter/Rescue *</label>
              <Select value={formData.source || ''} onValueChange={(v) => setFormData({...formData, source: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select organization..." />
                </SelectTrigger>
                <SelectContent>
                  {rescues.map(r => (
                    <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold">Description</label>
              <Textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Pet description" className="h-16" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold">Adoption Status</label>
                <Select value={formData.adoption_status || 'Available'} onValueChange={(v) => setFormData({...formData, adoption_status: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Adopted">Adopted</SelectItem>
                    <SelectItem value="Transferred">Transferred</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold mt-2">
                  <input type="checkbox" checked={formData.urgent || false} onChange={(e) => setFormData({...formData, urgent: e.target.checked})} className="w-3 h-3 rounded" />
                  Urgent
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
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