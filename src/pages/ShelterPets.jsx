import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PetCard from '@/components/pets/PetCard';

export default function ShelterPetsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const source = urlParams.get('source') || '';
  const navigate = useNavigate();

  const { data: allPets = [], isLoading, refetch } = useQuery({
    queryKey: ['shelter-pets-page', source],
    queryFn: () => base44.entities.Pet.list('-created_date', 500),
    enabled: !!source,
  });

  const pets = allPets.filter(p => p.source === source && !p.hidden_from_public);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div>
            <h1 className="text-xl font-bold">{source}</h1>
            <p className="text-xs text-muted-foreground">{pets.length} pet{pets.length !== 1 ? 's' : ''} available</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : pets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
            <span className="text-5xl">🐾</span>
            <p className="text-lg font-medium">No pets found for this shelter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {pets.map(pet => (
              <PetCard key={pet.id} pet={pet} onStatusUpdate={refetch} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}