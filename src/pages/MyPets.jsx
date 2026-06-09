import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Share2, Copy, Check } from 'lucide-react';
import OwnedPetCard from '@/components/mypets/OwnedPetCard';
import OwnedPetForm from '@/components/mypets/OwnedPetForm';
import { toast } from 'sonner';

export default function MyPets() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: pets = [], isLoading } = useQuery({
    queryKey: ['owned_pets', user?.email],
    queryFn: () => base44.entities.OwnedPet.filter({ owner_email: user.email }, '-created_date', 50),
    enabled: !!user,
  });

  const handleEdit = (pet) => { setEditingPet(pet); setShowForm(true); };
  const handleNew = () => { setEditingPet(null); setShowForm(true); };

  const handleSave = () => {
    queryClient.invalidateQueries({ queryKey: ['owned_pets'] });
    setShowForm(false);
    setEditingPet(null);
    toast.success('Pet profile saved!');
  };

  const handleShare = (pet) => {
    const url = `${window.location.origin}${window.location.pathname}#/PetOwnerProfile?pet=${pet.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(pet.id);
    toast.success('Shareable link copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (pet) => {
    if (!confirm(`Remove ${pet.name} from your pets?`)) return;
    await base44.entities.OwnedPet.delete(pet.id);
    queryClient.invalidateQueries({ queryKey: ['owned_pets'] });
    toast.success('Pet removed.');
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">My Pets</h1>
            <p className="text-slate-500 mt-1">Manage profiles for all your furry friends</p>
          </div>
          <Button onClick={handleNew} className="rounded-xl bg-rose-500 hover:bg-rose-600 gap-2">
            <PlusCircle className="w-4 h-4" /> Add Pet
          </Button>
        </div>

        {showForm && (
          <div className="mb-8">
            <OwnedPetForm
              pet={editingPet}
              ownerEmail={user.email}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingPet(null); }}
            />
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : pets.length === 0 && !showForm ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🐾</div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No pets yet</h3>
            <p className="text-slate-500 mb-6">Add your first pet's profile to get started</p>
            <Button onClick={handleNew} className="rounded-xl bg-rose-500 hover:bg-rose-600">
              <PlusCircle className="w-4 h-4 mr-2" /> Add My First Pet
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map(pet => (
              <OwnedPetCard
                key={pet.id}
                pet={pet}
                onEdit={handleEdit}
                onShare={handleShare}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}