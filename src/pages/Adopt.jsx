import { useState, useEffect } from "react";
import { HERO_COLORS } from "@/lib/heroConfig";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Loader2, Heart, Map, Grid3x3, GitCompare } from "lucide-react";
import AdoptablePetCard from "@/components/adopt/AdoptablePetCard";
import AdoptablePetDetail from "@/components/adopt/AdoptablePetDetail";
import AddAdoptablePetForm from "@/components/adopt/AddAdoptablePetForm";
import AdoptablePetsMap from "@/components/adopt/AdoptablePetsMap";
import AdoptablePetFilters from "@/components/adopt/AdoptablePetFilters";
import PetCompareModal from "@/components/adopt/PetCompareModal";

export default function Adopt() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPet, setSelectedPet] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [filters, setFilters] = useState({
    species: "",
    breed: "",
    age: "",
    size: "",
    gender: "",
    location: "",
    good_with_kids: "",
    good_with_dogs: "",
    good_with_cats: "",
    urgent: "",
    energy_level: "",
    special_needs: "",
    availableForFoster: false,
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {}).finally(() => setLoadingUser(false));
  }, []);

  const { data: adoptablePets = [], isLoading: adoptableLoading } = useQuery({
    queryKey: ["adoptable-pets"],
    queryFn: async () => {
      const all = await base44.entities.AdoptablePet.filter({ status: "available" }, "-created_date", 100);
      return all.filter(p => p.status === "available");
    }
  });

  const { data: syncedPets = [], isLoading: syncedLoading } = useQuery({
    queryKey: ["synced-adoption-pets"],
    queryFn: async () => {
      const allPets = await base44.entities.Pet.list("-created_date", 500);
      return allPets.filter(p =>
        p.adoption_status === "Available" &&
        (p.url || p.source_id)
      );
    }
  });

  const isLoading = adoptableLoading || syncedLoading;
  const pets = [...adoptablePets, ...syncedPets].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const isRescue = user?.role === "rescue" || user?.role === "shelter" || user?.role === "admin";

  // Filter pets
  const filteredPets = pets.filter((pet) => {
    const q = searchQuery.toLowerCase();
    if (q && !(
      pet.name?.toLowerCase().includes(q) ||
      pet.breed?.toLowerCase().includes(q) ||
      pet.rescue_name?.toLowerCase().includes(q) ||
      pet.description?.toLowerCase().includes(q)
    )) return false;

    if (filters.species && pet.pet_type !== filters.species) return false;
    if (filters.breed && !pet.breed?.toLowerCase().includes(filters.breed.toLowerCase())) return false;
    if (filters.gender && pet.gender !== filters.gender) return false;
    if (filters.size && pet.size?.toLowerCase() !== filters.size) return false;
    if (filters.energy_level && pet.energy_level !== filters.energy_level) return false;

    // Age bucket
    if (filters.age) {
      const yrs = pet.age_years || 0;
      if (filters.age === "baby" && yrs >= 1) return false;
      if (filters.age === "young" && (yrs < 1 || yrs >= 3)) return false;
      if (filters.age === "adult" && (yrs < 3 || yrs >= 7)) return false;
      if (filters.age === "senior" && yrs < 7) return false;
    }

    if (filters.location && !(
      pet.rescue_city?.toLowerCase().includes(filters.location.toLowerCase()) ||
      pet.rescue_state?.toLowerCase().includes(filters.location.toLowerCase()) ||
      pet.rescue_name?.toLowerCase().includes(filters.location.toLowerCase())
    )) return false;

    if (filters.good_with_kids === "yes" && pet.kid_friendly !== "yes") return false;
    if (filters.good_with_kids === "no" && pet.kid_friendly !== "no") return false;
    if (filters.good_with_dogs === "yes" && pet.dog_friendly !== "yes") return false;
    if (filters.good_with_dogs === "no" && pet.dog_friendly !== "no") return false;
    if (filters.good_with_cats === "yes" && pet.cat_friendly !== "yes") return false;
    if (filters.good_with_cats === "no" && pet.cat_friendly !== "no") return false;

    if (filters.urgent === "yes" && !pet.is_urgent) return false;
    if (filters.urgent === "no" && pet.is_urgent) return false;
    if (filters.special_needs === "yes" && !pet.special_needs) return false;
    if (filters.special_needs === "no" && pet.special_needs) return false;

    if (filters.availableForFoster && !pet.foster_url) return false;

    return true;
  });

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#D3713C' }} />
      </div>);

  }

  return (
    <div className="min-h-screen" style={{ background: '#FAF5F0' }}>
      {/* Hero */}
      <div className="px-4 py-6" style={{ background: HERO_COLORS.background }}>
        <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden flex flex-col md:flex-row" style={{ minHeight: '340px' }}>
          {/* Left: forest photo */}
          <div className="md:w-1/2 w-full min-h-48 md:min-h-0">
            <img src="https://media.base44.com/images/public/69a0f10efc1058c9e80d1210/303f4e102_IMG_9421.jpg"
            alt="Forest path"
            className="w-full h-full object-cover"
            style={{ display: 'block' }} />
          </div>
          {/* Right: panel */}
          <div className="md:w-1/2 w-full flex flex-col justify-center px-10 py-10 bg-[#d4916e]" style={{ background: HERO_COLORS.panelBg }}>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium mb-5 self-start" style={{ background: HERO_COLORS.badgeBg, color: HERO_COLORS.badgeText }}>
              find your new best friend
            </div>
            <h1 className="text-5xl font-black mb-4 leading-tight" style={{ color: HERO_COLORS.panelText }}>adoptable pets</h1>
            <p className="text-lg max-w-sm leading-relaxed" style={{ color: HERO_COLORS.panelSubtext }}>take a look at all of the pets up for adoption at your local shelter or rescue</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header with Add Button & View Toggle */}
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <h2 className="text-2xl font-bold" style={{ color: '#0F3D1F' }}>{filteredPets.length} Available</h2>
          <div className="flex gap-2">
            {compareList.length >= 2 &&
            <Button onClick={() => setShowCompare(true)} className="rounded-xl gap-2" style={{ background: '#2B5242' }}>
                <GitCompare className="w-4 h-4" /> Compare ({compareList.length})
              </Button>
            }
            <div className="flex gap-1 bg-white rounded-lg border p-1" style={{ borderColor: '#DEC0AA' }}>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded transition-colors ${viewMode === "grid" ? "" : "hover:bg-stone-50"}`}
                style={viewMode === "grid" ? { background: '#FDF0E8', color: '#D3713C' } : { color: '#2B5242' }}
                title="Grid view">
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`p-2 rounded transition-colors ${viewMode === "map" ? "" : "hover:bg-stone-50"}`}
                style={viewMode === "map" ? { background: '#FDF0E8', color: '#D3713C' } : { color: '#2B5242' }}
                title="Map view">
                <Map className="w-4 h-4" />
              </button>
            </div>
            {isRescue &&
            <Button onClick={() => setShowAddForm(true)} className="rounded-xl gap-2" style={{ background: '#A33407' }}>
                <PlusCircle className="w-4 h-4" /> List a Pet
              </Button>
            }
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-300" />
            <Input
              placeholder="Search by pet name, breed, rescue, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 rounded-xl border-slate-200 bg-white" />

          </div>

          <AdoptablePetFilters
            onFiltersChange={setFilters}
            onClear={() => setFilters({
              species: "",
              breed: "",
              age: "",
              size: "",
              gender: "",
              location: "",
              good_with_kids: "",
              good_with_dogs: "",
              good_with_cats: "",
              urgent: "",
              energy_level: "",
              special_needs: "",
              availableForFoster: false,
            })} />

        </div>

        {/* Pets Display */}
        {isLoading ?
        <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#D3713C' }} />
          </div> :
        filteredPets.length === 0 ?
        <div className="text-center py-20">
            <div className="text-6xl mb-4">🐾</div>
            <p className="text-slate-500 text-lg">No pets found matching your search.</p>

          </div> :
        viewMode === "grid" ?
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPets.map((pet) =>
          <AdoptablePetCard
            key={pet.id}
            pet={pet}
            onSelect={() => setSelectedPet(pet)}
            isComparing={compareList.some((p) => p.id === pet.id)}
            onToggleCompare={(e) => {
              e.stopPropagation();
              setCompareList((prev) =>
              prev.some((p) => p.id === pet.id) ?
              prev.filter((p) => p.id !== pet.id) :
              prev.length < 4 ? [...prev, pet] : prev
              );
            }} />

          )}
          </div> :

        <AdoptablePetsMap pets={filteredPets} onPetSelect={setSelectedPet} />
        }
      </div>

      {/* Detail Modal */}
      {selectedPet &&
      <AdoptablePetDetail
        pet={selectedPet}
        currentUserEmail={user?.email}
        onClose={() => setSelectedPet(null)}
        onStatusUpdate={(newStatus) => {
          setSelectedPet({ ...selectedPet, status: newStatus });
          queryClient.invalidateQueries({ queryKey: ["adoptable-pets"] });
        }} />

      }

      {/* Compare Modal */}
      {showCompare &&
      <PetCompareModal
        pets={compareList}
        onClose={() => setShowCompare(false)} />

      }

      {/* Add Pet Form */}
      {showAddForm &&
      <AddAdoptablePetForm
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["adoptable-pets"] });
          setShowAddForm(false);
        }}
        onClose={() => setShowAddForm(false)}
        user={user} />

      }
    </div>);

}