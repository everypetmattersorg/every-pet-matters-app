import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyReportedPets({ userEmail }) {
  const queryClient = useQueryClient();

  const { data: pets = [], isLoading } = useQuery({
    queryKey: ['myReportedPets', userEmail],
    queryFn: () =>
      base44.entities.Pet.filter(
        { contact_email: userEmail },
        '-created_date'
      ),
    enabled: !!userEmail,
  });

  const deleteMutation = useMutation({
    mutationFn: (petId) => base44.entities.Pet.delete(petId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myReportedPets'] });
    },
  });

  const handleDelete = (petId) => {
    if (confirm('Are you sure you want to delete this pet report?')) {
      deleteMutation.mutate(petId);
    }
  };

  const statusColors = {
    lost: 'bg-rose-100 text-rose-700',
    found: 'bg-emerald-100 text-emerald-700',
    reunited: 'bg-violet-100 text-violet-700',
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-4">
            <Skeleton className="h-6 w-1/3 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">
          {pets.length === 0 ? 'No Reported Pets' : `${pets.length} Pet${pets.length !== 1 ? 's' : ''} Reported`}
        </h2>
        <Link to={createPageUrl('ReportLost')}>
          <Button className="gap-2 bg-rose-600 hover:bg-rose-700">
            <Plus className="w-4 h-4" />
            Report Pet
          </Button>
        </Link>
      </div>

      {pets.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 mb-4">You haven't reported any pets yet</p>
          <Link to={createPageUrl('ReportLost')}>
            <Button className="bg-rose-600 hover:bg-rose-700">Report Lost or Found Pet</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {pets.map(pet => (
            <div
              key={pet.id}
              className="bg-gradient-to-r from-white to-slate-50 border border-slate-200 rounded-lg p-4 hover:border-rose-200 transition"
            >
              <div className="flex gap-4">
                {/* Pet Image */}
                {pet.photo_url && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                    <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Pet Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-slate-900">{pet.name || pet.pet_type}</h3>
                    <Badge className={`capitalize ${statusColors[pet.status]}`}>{pet.status}</Badge>
                  </div>

                  <div className="space-y-1 text-sm text-slate-600">
                    {pet.breed && <p>{pet.pet_type.charAt(0).toUpperCase() + pet.pet_type.slice(1)} • {pet.breed}</p>}
                    {pet.color && <p>Color: {pet.color}</p>}
                    {pet.location && (
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {pet.location}
                      </p>
                    )}
                    {pet.date_lost_found && (
                      <p className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(pet.date_lost_found), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>

                  {pet.description && (
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{pet.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(pet.id)}
                    disabled={deleteMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}