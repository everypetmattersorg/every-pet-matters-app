import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, HeartHandshake } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

const STATUS_COLORS = {
  lost: 'bg-red-100 text-red-800',
  found: 'bg-green-100 text-green-800',
  reunited: 'bg-green-100 text-green-800',
};

export default function ReportedPetsTab({ userEmail }) {
  const queryClient = useQueryClient();

  const { data: reportedPets = [], isLoading } = useQuery({
    queryKey: ['my-reported-pets', userEmail],
    queryFn: () => {
      if (!userEmail) return [];
      return base44.entities.Pet.filter({ contact_email: userEmail }, '-created_date', 100);
    },
    enabled: !!userEmail,
  });

  const handleDelete = async (petId) => {
    if (confirm('Are you sure you want to delete this pet listing?')) {
      await base44.entities.Pet.delete(petId);
      queryClient.invalidateQueries({ queryKey: ['my-reported-pets'] });
    }
  };

  const handleMarkreunited = async (petId) => {
    await base44.entities.Pet.update(petId, { status: 'reunited' });
    queryClient.invalidateQueries({ queryKey: ['my-reported-pets'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Reported Pets</h2>
        <div className="flex gap-3">
          <Link to={createPageUrl('ReportLost')}>
            <Button style={{ background: '#b1511d' }}>
              <PlusCircle className="w-4 h-4 mr-2" /> Report Lost
            </Button>
          </Link>
          <Link to={createPageUrl('ReportFound')}>
            <Button style={{ background: '#b1511d' }}>
              <PlusCircle className="w-4 h-4 mr-2" /> Report Found
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : reportedPets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="text-5xl mb-4">🐾</div>
          <p className="text-slate-500 text-lg mb-6">You haven't reported any pets yet.</p>
          <div className="flex gap-3 justify-center">
            <Link to={createPageUrl('ReportLost')}>
              <Button style={{ background: '#b1511d' }}>
                <PlusCircle className="w-4 h-4 mr-2" /> Report Lost Pet
              </Button>
            </Link>
            <Link to={createPageUrl('ReportFound')}>
              <Button style={{ background: '#b1511d' }}>
                <PlusCircle className="w-4 h-4 mr-2" /> Report Found Pet
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportedPets.map((pet) => (
            <div
              key={pet.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="relative w-full h-48 bg-slate-100">
                {pet.photo_url ? (
                  <img
                    src={pet.photo_url}
                    alt={pet.name || 'Pet'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <div className="text-4xl">🐾</div>
                  </div>
                )}
                <div
                  className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[pet.status]}`}
                >
                  {pet.status.charAt(0).toUpperCase() + pet.status.slice(1)}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-slate-800 text-lg mb-1">
                  {pet.name || 'Unnamed Pet'}
                </h3>

                <div className="space-y-2 mb-4 text-sm text-slate-600">
                  {pet.pet_type && (
                    <p>
                      <span className="font-medium">Type:</span>{' '}
                      {pet.pet_type.charAt(0).toUpperCase() + pet.pet_type.slice(1)}
                    </p>
                  )}
                  {pet.breed && (
                    <p>
                      <span className="font-medium">Breed:</span> {pet.breed}
                    </p>
                  )}
                  {pet.color && (
                    <p>
                      <span className="font-medium">Color:</span> {pet.color}
                    </p>
                  )}
                  {pet.date_lost_found && (
                    <p>
                      <span className="font-medium">Date:</span>{' '}
                      {format(new Date(pet.date_lost_found), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {pet.status !== 'reunited' && (
                    <button
                      onClick={() => handleMarkreunited(pet.id)}
                      className="w-full py-2 px-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 rounded-lg transition border border-blue-200 flex items-center justify-center gap-1.5"
                    >
                      <HeartHandshake className="w-4 h-4" /> Mark as Reunited
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        (window.location.href = `${createPageUrl('PetDetails')}?id=${pet.id}`)
                      }
                      className="flex-1 py-2 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition border border-slate-200"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleDelete(pet.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}