import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import OwnedPetCard from './OwnedPetCard';
import OwnedPetForm from './OwnedPetForm';

export default function OwnedPetsTab({ userEmail }) {
  const [showForm, setShowForm] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const queryClient = useQueryClient();

  const { data: ownedPets = [], isLoading } = useQuery({
    queryKey: ['owned_pets', userEmail],
    queryFn: () =>
      base44.entities.OwnedPet.filter({ owner_email: userEmail }, '-created_date', 50),
    enabled: !!userEmail,
  });

  const handleNewPet = () => {
    setEditingPet(null);
    setShowForm(true);
  };

  const handleEditPet = (pet) => {
    setEditingPet(pet);
    setShowForm(true);
  };

  const handleSavePet = () => {
    queryClient.invalidateQueries({ queryKey: ['owned_pets'] });
    setShowForm(false);
    setEditingPet(null);
    toast.success('Pet profile saved!');
  };

  const handleSharePet = (pet) => {
    const url = `${window.location.origin}${window.location.pathname}#/PetOwnerProfile?pet=${pet.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(pet.id);
    toast.success('Shareable link copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeletePet = async (pet) => {
    if (!confirm(`Remove ${pet.name} from your pets?`)) return;
    await base44.entities.OwnedPet.delete(pet.id);
    queryClient.invalidateQueries({ queryKey: ['owned_pets'] });
    toast.success('Pet removed.');
  };

  const handleToggleVisibility = async (pet) => {
    await base44.entities.OwnedPet.update(pet.id, { share_profile: !pet.share_profile });
    queryClient.invalidateQueries({ queryKey: ['owned_pets'] });
    toast.success(pet.share_profile ? 'Pet profile made private' : 'Pet profile made public');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">My Pets</h2>
        <Button
          onClick={handleNewPet}
          className="rounded-xl gap-2"
          style={{ background: '#b1511d' }}
        >
          <PlusCircle className="w-4 h-4" /> Add Pet
        </Button>
      </div>

      {showForm && (
        <div className="mb-8">
          <OwnedPetForm
            pet={editingPet}
            ownerEmail={userEmail}
            onSave={handleSavePet}
            onCancel={() => {
              setShowForm(false);
              setEditingPet(null);
            }}
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : ownedPets.length === 0 && !showForm ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="text-5xl mb-4">🐾</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No pets yet</h3>
          <p className="text-slate-500 mb-6">Add your first pet's profile to get started</p>
          <Button
            onClick={handleNewPet}
            className="rounded-xl"
            style={{ background: '#b1511d' }}
          >
            <PlusCircle className="w-4 h-4 mr-2" /> Add My First Pet
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ownedPets.map((pet) => (
            <OwnedPetCard
              key={pet.id}
              pet={pet}
              onEdit={handleEditPet}
              onShare={handleSharePet}
              onDelete={handleDeletePet}
              onToggleVisibility={handleToggleVisibility}
            />
          ))}
        </div>
      )}
    </div>
  );
}