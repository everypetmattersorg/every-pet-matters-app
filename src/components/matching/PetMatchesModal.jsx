import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, X, Heart, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdopterMatchCard from './AdopterMatchCard';
import { matchAdoptersForPet } from './matchingAlgorithm';

export default function PetMatchesModal({ pet, isOpen, onClose }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && pet) {
      fetchMatches();
    }
  }, [isOpen, pet]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all users with preferences
      const allUsers = await base44.entities.User.list();
      const adopters = [];

      // Get preferences for each user
      for (const user of allUsers) {
        const preferences = await base44.entities.Preferences.filter(
          { user_email: user.email },
          undefined,
          1
        );
        if (preferences && preferences.length > 0) {
          adopters.push({
            ...user,
            pet_preferences: preferences[0].pet_preferences || {
              preferred_pet_types: preferences[0].preferred_pet_types,
              preferred_energy_level: preferences[0].preferred_energy_level,
              living_situation: preferences[0].living_situation,
              has_kids: preferences[0].has_kids,
              has_other_dogs: preferences[0].has_other_dogs,
              has_other_cats: preferences[0].has_other_cats,
              willing_special_needs: preferences[0].willing_special_needs,
              experience_level: preferences[0].experience_level,
              budget: preferences[0].budget,
            }
          });
        }
      }

      // Calculate matches
      const matchResults = await matchAdoptersForPet(pet, adopters);
      setMatches(matchResults);
    } catch (err) {
      setError('Failed to calculate matches. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-100 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Potential Adopters</h2>
            <p className="text-sm text-slate-600">{pet.name} - {pet.breed || pet.pet_type}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-rose-600 animate-spin mb-3" />
              <p className="text-slate-600">Finding perfect matches...</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!loading && !error && matches.length === 0 && (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No matches found yet.</p>
              <p className="text-sm text-slate-500">More adopters will appear as they set their preferences.</p>
            </div>
          )}

          {!loading && !error && matches.length > 0 && (
            <div className="space-y-4">
              <div className="text-sm text-slate-600 mb-4">
                Found <span className="font-semibold">{matches.length}</span> compatible adopter{matches.length !== 1 ? 's' : ''}
              </div>
              {matches.map((match, idx) => (
                <AdopterMatchCard key={idx} match={match} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-100">
          <Button onClick={onClose} className="flex-1 bg-rose-600 hover:bg-rose-700 rounded-xl">
            Close
          </Button>
          {!loading && matches.length > 0 && (
            <Button onClick={fetchMatches} variant="outline" className="flex-1 rounded-xl">
              Refresh Matches
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}