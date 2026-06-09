import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdoptedPetCard from '@/components/adoption/AdoptedPetCard';

export default function AdoptedPetsTab({ userEmail }) {
  const { data: adoptedPets = [], isLoading } = useQuery({
    queryKey: ['adopted-pets', userEmail],
    queryFn: () => {
      if (!userEmail) return [];
      return base44.entities.AdoptablePet.filter(
        { status: 'adopted', rescue_email: userEmail },
        '-created_date',
        50
      );
    },
    enabled: !!userEmail,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">My Adopted Pets</h2>
        <p className="text-slate-600 mt-1">Track and share updates about your adopted pets</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        </div>
      ) : adoptedPets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="text-5xl mb-4">💝</div>
          <p className="text-slate-500 text-lg mb-6">No adopted pets yet</p>
          <p className="text-slate-500 mb-6">
            Find your perfect pet on the{' '}
            <Link to={createPageUrl('Adopt')} className="text-rose-600 hover:underline font-medium">
              Adopt page
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adoptedPets.map((pet) => (
            <AdoptedPetCard key={pet.id} adoptedPet={pet} />
          ))}
        </div>
      )}
    </div>
  );
}