import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PetCard from '@/components/pets/PetCard';
import UserPreferencesPanel from '@/components/preferences/UserPreferencesPanel';

export default function SavedPets() {
  const [tab, setTab] = useState('saved');
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: favorites = [], isLoading: favLoading } = useQuery({
    queryKey: ['favorites', user?.email],
    queryFn: () => base44.entities.Favorite.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: pets = [], isLoading: petsLoading } = useQuery({
    queryKey: ['all-pets-saved'],
    queryFn: () => base44.entities.Pet.list('-created_date', 500),
    enabled: favorites.length > 0,
  });

  const savedPetIds = new Set(favorites.map(f => f.pet_id));
  const savedPets = pets.filter(p => savedPetIds.has(p.id));
  const isLoading = favLoading || petsLoading;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link to="/PetDashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">❤️ My Saved Pets</h1>
            <p className="text-xs text-muted-foreground">{savedPets.length} saved pet{savedPets.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 flex gap-1 mt-2">
          <button onClick={() => setTab('saved')} className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${tab === 'saved' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Saved Pets</button>
          <button onClick={() => setTab('preferences')} className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${tab === 'preferences' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Match Preferences</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {tab === 'preferences' ? (
          <UserPreferencesPanel user={user} />
        ) : isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : savedPets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
            <span className="text-5xl">🐾</span>
            <p className="text-lg font-medium">No saved pets yet</p>
            <p className="text-sm">Click the ♡ heart on any pet to save it here</p>
            <Link to="/PetDashboard">
              <Button variant="outline" className="mt-2">Browse Pets</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {savedPets.map(pet => (
              <PetCard key={pet.id} pet={pet} distance={null} onStatusUpdate={() => {}} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}