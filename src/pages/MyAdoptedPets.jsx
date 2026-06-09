import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Heart, MapPin, Loader2, Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdoptedPetCard from "@/components/adoption/AdoptedPetCard";
import AdoptedPetUpdateForm from "@/components/adoption/AdoptedPetUpdateForm";
import PostAdoptionResources from "@/components/adoption/PostAdoptionResources";

export default function MyAdoptedPets() {
  const [user, setUser] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showResources, setShowResources] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: adoptedPets = [], isLoading: petsLoading } = useQuery({
    queryKey: ["adoptedPets", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const pets = await base44.entities.AdoptablePet.filter({
        status: "adopted",
        created_by: user.email
      }, "-created_date");
      return pets;
    },
    enabled: !!user?.email,
  });

  const { data: updates = {} } = useQuery({
    queryKey: ["adoptedPetUpdates", user?.email],
    queryFn: async () => {
      if (!user?.email) return {};
      const allUpdates = await base44.entities.AdoptedPetUpdate.filter({
        adopter_email: user.email
      }, "-created_date", 100);
      
      const updatesByPet = {};
      allUpdates.forEach(update => {
        if (!updatesByPet[update.adopted_pet_id]) {
          updatesByPet[update.adopted_pet_id] = [];
        }
        updatesByPet[update.adopted_pet_id].push(update);
      });
      return updatesByPet;
    },
    enabled: !!user?.email,
  });

  if (!user) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-100 rounded-lg">
              <Heart className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Adopted Pets</h1>
              <p className="text-slate-500">Track your pet's progress and share updates</p>
            </div>
          </div>
          <Button
            onClick={() => setShowResources(!showResources)}
            variant="outline"
            className="gap-2 rounded-xl"
          >
            <BookOpen className="w-4 h-4" />
            Resources
          </Button>
        </div>

        {/* Resources Section */}
        {showResources && (
          <div className="mb-8">
            <PostAdoptionResources />
          </div>
        )}

        {/* Adopted Pets */}
        {petsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : adoptedPets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <Heart className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 mb-4">No adopted pets yet</p>
            <p className="text-slate-400 text-sm">When you adopt a pet through Good Dogs Here, it will appear here!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {adoptedPets.map((pet) => (
              <div key={pet.id} className="space-y-4">
                <AdoptedPetCard
                  pet={pet}
                  updates={updates[pet.id] || []}
                  onAddUpdate={() => {
                    setSelectedPet(pet);
                    setShowUpdateForm(true);
                  }}
                  onViewUpdates={() => setSelectedPet(pet)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Update Form Modal */}
      {showUpdateForm && selectedPet && (
        <AdoptedPetUpdateForm
          pet={selectedPet}
          rescue_email={selectedPet.rescue_email}
          onClose={() => {
            setShowUpdateForm(false);
            setSelectedPet(null);
          }}
          onSuccess={() => {
            setShowUpdateForm(false);
          }}
        />
      )}
    </div>
  );
}