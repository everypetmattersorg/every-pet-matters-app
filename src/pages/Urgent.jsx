import { useState } from "react";
import { HERO_COLORS } from "@/lib/heroConfig";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { AlertCircle, Search, Calendar } from "lucide-react";
import AdoptablePetCard from "@/components/adopt/AdoptablePetCard";
import { Skeleton } from "@/components/ui/skeleton";
import AdoptablePetFilters from "@/components/adopt/AdoptablePetFilters";
import { format, differenceInDays, isPast, isToday, parseISO } from "date-fns";

const DEFAULT_FILTERS = {
  species: "", breed: "", age: "", size: "", gender: "", location: "",
  good_with_kids: "", good_with_dogs: "", good_with_cats: "",
  urgent: "", energy_level: "", special_needs: "", availableForFoster: false,
};

export default function Urgent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const { data: urgentPets = [], isLoading } = useQuery({
    queryKey: ["urgent-pets"],
    queryFn: () => base44.entities.AdoptablePet.filter({ is_urgent: true }, "-created_date", 100)
  });

  const filteredAndSorted = urgentPets
    .filter((pet) => {
    const q = searchTerm.toLowerCase();
    if (q && !(pet.name?.toLowerCase().includes(q) || pet.rescue_name?.toLowerCase().includes(q))) return false;
    if (filters.species && pet.pet_type !== filters.species) return false;
    if (filters.breed && !pet.breed?.toLowerCase().includes(filters.breed.toLowerCase())) return false;
    if (filters.gender && pet.gender !== filters.gender) return false;
    if (filters.size && pet.size?.toLowerCase() !== filters.size) return false;
    if (filters.energy_level && pet.energy_level !== filters.energy_level) return false;
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
    if (filters.good_with_kids === "yes" && !pet.good_with_kids) return false;
    if (filters.good_with_kids === "no" && pet.good_with_kids) return false;
    if (filters.good_with_dogs === "yes" && !pet.good_with_dogs) return false;
    if (filters.good_with_dogs === "no" && pet.good_with_dogs) return false;
    if (filters.good_with_cats === "yes" && !pet.good_with_cats) return false;
    if (filters.good_with_cats === "no" && pet.good_with_cats) return false;
    if (filters.special_needs === "yes" && !pet.special_needs) return false;
    if (filters.special_needs === "no" && pet.special_needs) return false;
      if (filters.availableForFoster && !pet.foster_url) return false;
      return true;
    })
    .sort((a, b) => {
      // Pets with e_list_date come first, sorted by soonest deadline
      if (a.e_list_date && !b.e_list_date) return -1;
      if (!a.e_list_date && b.e_list_date) return 1;
      if (a.e_list_date && b.e_list_date) {
        return new Date(a.e_list_date) - new Date(b.e_list_date);
      }
      return 0;
    });

  const filteredPets = filteredAndSorted;

  const getEListBadge = (dateStr) => {
    if (!dateStr) return null;
    const date = parseISO(dateStr);
    const days = differenceInDays(date, new Date());
    if (isPast(date) && !isToday(date)) return { label: `e-list passed ${format(date, "MMM d")}`, color: "bg-gray-800 text-white" };
    if (isToday(date)) return { label: "e-list: TODAY", color: "bg-red-700 text-white animate-pulse" };
    if (days <= 2) return { label: `e-list: ${format(date, "MMM d")} (${days}d)`, color: "bg-red-600 text-white" };
    if (days <= 7) return { label: `e-list: ${format(date, "MMM d")} (${days}d)`, color: "bg-orange-500 text-white" };
    return { label: `e-list: ${format(date, "MMM d")}`, color: "bg-amber-500 text-white" };
  };

  return (
    <div className="min-h-screen" style={{ background: '#FAF5F0' }}>
      {/* Hero */}
      <div className="px-4 py-6" style={{ background: HERO_COLORS.background }}>
        <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden flex flex-col md:flex-row" style={{ minHeight: '340px' }}>
          {/* Left: photo */}
          <div className="md:w-1/2 w-full min-h-48 md:min-h-0">
            <img src="https://media.base44.com/images/public/69a0f10efc1058c9e80d1210/40349e25e_yarddogs-219.JPG"
            alt="Dog looking urgent"
            className="w-full h-full object-cover"
            style={{ display: 'block' }} />
          </div>
          {/* Right: panel */}
          <div className="md:w-1/2 w-full flex flex-col justify-center px-10 py-10" style={{ background: HERO_COLORS.panelBg }}>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium mb-5 self-start" style={{ background: HERO_COLORS.badgeBg, color: HERO_COLORS.badgeText }}>
              urgent cases
            </div>
            <h1 className="text-5xl font-black mb-4 leading-tight" style={{ color: HERO_COLORS.panelText }}>pets that need you now</h1>
            <p className="text-lg max-w-sm leading-relaxed" style={{ color: HERO_COLORS.panelSubtext }}>these pets need immediate fostering or adoption. every second counts — please help if you can.</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-300" />
            <Input
              placeholder="Search by pet name or rescue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-6 rounded-xl border-slate-200 bg-white" />
          </div>
          <AdoptablePetFilters
            onFiltersChange={setFilters}
            onClear={() => setFilters(DEFAULT_FILTERS)} />
        </div>

        {/* Stats */}
        {!isLoading &&
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8 border-l-4 border-red-600">
            <p className="text-slate-800">
              <span className="font-bold text-lg text-[#a23307]">{filteredPets.length}</span>
              {" "}
              <span className="text-slate-600">urgent case{filteredPets.length !== 1 ? "s" : ""} need your help right now</span>
            </p>
          </div>
        }

        {/* Pets Grid */}
        {isLoading ?
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) =>
          <Skeleton key={i} className="h-96 rounded-2xl" />
          )}
          </div> :
        filteredPets.length > 0 ?
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPets.map((pet) => {
              const eListBadge = getEListBadge(pet.e_list_date);
              return (
                <div key={pet.id} className="relative">
                  <div className="absolute -top-3 -left-1 z-10 flex flex-col gap-1 items-start">
                    <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      URGENT
                    </div>
                    {eListBadge && (
                      <div className={`${eListBadge.color} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
                        <Calendar className="w-3 h-3" />
                        {eListBadge.label}
                      </div>
                    )}
                  </div>
                  <AdoptablePetCard pet={pet} />
                </div>
              );
            })}
          </div> :

        <div className="text-center py-16">
            <div className="text-6xl mb-4">✓</div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">All Safe!</h3>
            <p className="text-slate-600">
              There are currently no urgent cases. Check back soon or browse our regular adoption listings.
            </p>
          </div>
        }
      </div>
    </div>);

}