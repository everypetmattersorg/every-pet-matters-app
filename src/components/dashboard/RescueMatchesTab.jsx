import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Heart, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdopterMatchCard from '../matching/AdopterMatchCard';
import { matchAdoptersForPet } from '../matching/matchingAlgorithm';

export default function RescueMatchesTab({ rescueEmail }) {
  const [adoptablePets, setAdoptablePets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [petMatches, setPetMatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchPets();
  }, [rescueEmail]);

  useEffect(() => {
    if (selectedPetId && !petMatches[selectedPetId]) {
      calculateMatches(selectedPetId);
    }
  }, [selectedPetId]);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const pets = await base44.entities.AdoptablePet.filter(
        { rescue_email: rescueEmail },
        '-created_date'
      );
      setAdoptablePets(pets || []);
      if (pets && pets.length > 0) {
        setSelectedPetId(pets[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch pets:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateMatches = async (petId) => {
    try {
      setCalculating(true);
      const pet = adoptablePets.find(p => p.id === petId);
      if (!pet) return;

      // Fetch all users with preferences
      const allUsers = await base44.entities.User.list();
      const adopters = [];

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

      const matches = await matchAdoptersForPet(pet, adopters);
      setPetMatches(prev => ({ ...prev, [petId]: matches }));
    } catch (err) {
      console.error('Failed to calculate matches:', err);
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin mr-2" />
        <p className="text-slate-600">Loading pets...</p>
      </div>
    );
  }

  if (adoptablePets.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600">No adoptable pets yet</p>
        <p className="text-sm text-slate-500">Add pets to see potential adopters</p>
      </div>
    );
  }

  const selectedPet = adoptablePets.find(p => p.id === selectedPetId);
  const currentMatches = selectedPetId ? petMatches[selectedPetId] : [];

  return (
    <div className="space-y-6">
      <Tabs defaultValue={selectedPetId} onValueChange={setSelectedPetId} className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 h-auto p-2 bg-slate-50">
          {adoptablePets.map(pet => (
            <TabsTrigger
              key={pet.id}
              value={pet.id}
              className="flex flex-col items-center gap-1 py-2"
            >
              <div className="text-sm font-medium">{pet.name}</div>
              <div className="text-xs text-slate-500">{pet.pet_type}</div>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedPetId} className="space-y-4">
          {selectedPet && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-800">{selectedPet.name}</h3>
              <p className="text-sm text-slate-600">
                {selectedPet.breed} • {selectedPet.gender} • {selectedPet.weight_lbs} lbs
              </p>
            </div>
          )}

          {calculating ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-rose-600 animate-spin mr-2" />
              <p className="text-slate-600">Calculating matches...</p>
            </div>
          ) : currentMatches && currentMatches.length > 0 ? (
            <div className="space-y-4">
              <div className="text-sm text-slate-600">
                Found <span className="font-semibold">{currentMatches.length}</span> compatible adopter{currentMatches.length !== 1 ? 's' : ''}
              </div>
              {currentMatches.map((match, idx) => (
                <AdopterMatchCard key={idx} match={match} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No matches found yet</p>
              <p className="text-sm text-slate-500">Matches will appear as adopters set their preferences</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}