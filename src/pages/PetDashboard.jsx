import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, Map, LayoutGrid, Settings, Building2, UserCircle, Heart, BarChart2, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import PetFilters from '@/components/pets/PetFilters';
import UrgentPetsBanner from '@/components/pets/UrgentPetsBanner';
import PetCard from '@/components/pets/PetCard';
import PetMap from '@/components/pets/PetMap';
import PetDetailModal from '@/components/pets/PetDetailModal';
import ContactModal from '@/components/pets/ContactModal';
import SharePetModal from '@/components/pets/SharePetModal';

const DEFAULT_FILTERS = {
  species: '',
  age: '',
  location: '',
  breed: '',
  source: '',
  size: '',
  gender: '',
  minWeight: null,
  maxWeight: null,
  maxMiles: 100,
  userLat: null,
  userLng: null,
  vaccinated: '',
  spayed_neutered: '',
  dewormed: '',
  transfer_needed: '',
  rescue_needed: '',
  urgent: '',
  kid_friendly: '',
  dog_friendly: '',
  cat_friendly: ''
};

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function PetDashboard() {
  const [syncing, setSyncing] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedPet, setSelectedPet] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const { data: pets = [], isLoading, refetch } = useQuery({
    queryKey: ['pets'],
    queryFn: () => base44.entities.Pet.list('-created_date', 10000)
  });

  const { data: rescues = [] } = useQuery({
    queryKey: ['rescues-for-map'],
    queryFn: () => base44.entities.AdoptablePet.list('-created_date', 500),
  });

  const handleManualSync = async () => {
    setSyncing(true);
    await refetch();
    setSyncing(false);
  };

  const filteredPets = useMemo(() => {
    return pets.
    filter((pet) => !pet.hidden_from_public).
    filter((pet) => pet.adoption_status !== 'Adopted' && pet.adoption_status !== 'Transferred').
    map((pet) => {
      let distance = null;
      if (filters.userLat && pet._lat && pet._lng) {
        distance = haversineDistance(filters.userLat, filters.userLng, pet._lat, pet._lng);
      }
      return { pet, distance };
    }).
    filter(({ pet, distance }) => {
      if (filters.source && filters.source !== 'all' && pet.source !== filters.source) return false;
      if (filters.species && filters.species !== 'all' && pet.species?.toLowerCase() !== filters.species.toLowerCase()) return false;
      if (filters.breed && filters.breed !== 'all' && pet.breed !== filters.breed) return false;
      if (filters.age && filters.age !== 'all' && pet.age?.toLowerCase() !== filters.age.toLowerCase()) return false;
      if (filters.size && filters.size !== 'all' && pet.size !== filters.size) return false;
      if (filters.gender && filters.gender !== 'all' && pet.gender !== filters.gender) return false;
      if (filters.location && !pet.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (pet.weight) {
        if (filters.minWeight && pet.weight < filters.minWeight) return false;
        if (filters.maxWeight && pet.weight > filters.maxWeight) return false;
      }
      if (filters.userLat && distance != null && distance > filters.maxMiles) return false;
      if (filters.vaccinated === 'yes' && !pet.vaccinated) return false;
      if (filters.vaccinated === 'no' && pet.vaccinated) return false;
      if (filters.spayed_neutered === 'yes' && !pet.spayed_neutered) return false;
      if (filters.spayed_neutered === 'no' && pet.spayed_neutered) return false;
      if (filters.dewormed === 'yes' && !pet.dewormed) return false;
      if (filters.dewormed === 'no' && pet.dewormed) return false;
      if (filters.transfer_needed === 'yes' && !pet.transfer_needed) return false;
      if (filters.transfer_needed === 'no' && pet.transfer_needed) return false;
      if (filters.rescue_needed === 'yes' && !pet.rescue_needed) return false;
      if (filters.rescue_needed === 'no' && pet.rescue_needed) return false;
      if (filters.urgent === 'yes' && !pet.urgent) return false;
      if (filters.urgent === 'no' && pet.urgent) return false;
      if (filters.kid_friendly && filters.kid_friendly !== 'any' && pet.kid_friendly !== filters.kid_friendly) return false;
      if (filters.dog_friendly && filters.dog_friendly !== 'any' && pet.dog_friendly !== filters.dog_friendly) return false;
      if (filters.cat_friendly && filters.cat_friendly !== 'any' && pet.cat_friendly !== filters.cat_friendly) return false;
      return true;
    }).
    sort((a, b) => {
      if (a.distance != null && b.distance != null) return a.distance - b.distance;
      return 0;
    });
  }, [pets, filters]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-slate-900 mb-1">rescue & transfer search</h1>
            <p className="text-xs text-muted-foreground">
            {filteredPets.length} of {pets.length} pets shown
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex border rounded-md overflow-hidden">
              <Button size="sm" className="rounded-none h-8 px-2.5" style={viewMode === 'grid' ? { backgroundColor: '#b1511d', color: 'white' } : {}} onClick={() => setViewMode('grid')}>
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button size="sm" className="rounded-none h-8 px-2.5" style={viewMode === 'map' ? { backgroundColor: '#b1511d', color: 'white' } : {}} onClick={() => setViewMode('map')}>
                <Map className="w-4 h-4" />
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="px-2.5" style={{ backgroundColor: '#b1511d', color: 'white', border: 'none' }}>
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[1002]">
                <DropdownMenuItem asChild>
                  <Link to="/ShelterPortal" className="flex items-center gap-2 cursor-pointer">
                    <Building2 className="w-4 h-4" /> Rescue Center
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/UserProfile" className="flex items-center gap-2 cursor-pointer">
                    <UserCircle className="w-4 h-4" /> My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/SavedPets" className="flex items-center gap-2 cursor-pointer">
                    <Heart className="w-4 h-4" /> My Saved Pets
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/AdminAnalytics" className="flex items-center gap-2 cursor-pointer">
                    <BarChart2 className="w-4 h-4" /> Admin Analytics
                  </Link>
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={handleManualSync}
              disabled={syncing}
              size="sm"
              style={{ backgroundColor: '#b1511d', color: 'white' }}
              className="h-8 px-3 gap-2 text-xs font-medium">
              
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        <UrgentPetsBanner pets={pets} onFilterUrgent={() => setFilters((f) => ({ ...f, urgent: 'yes' }))} />
        <PetFilters filters={filters} onFilterChange={setFilters} onMapFilterChange={(map) => setFilters((f) => ({ ...f, mapFilter: map }))} />

        {viewMode === 'map' ?
        <PetMap pets={filteredPets.map(({ pet }) => pet)} rescues={rescues} filters={filters} /> :

        <div>
            {isLoading ?
          <div className="flex justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div> :
          filteredPets.length === 0 ?
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
                <span className="text-5xl">🐾</span>
                <p className="text-lg font-medium">No pets match your filters</p>
                <p className="text-sm">Try adjusting or clearing your filters</p>
              </div> :

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPets.map(({ pet, distance }) =>
            <PetCard
              key={pet.id}
              pet={pet}
              distance={distance}
              onStatusUpdate={() => refetch()}
              onOpenDetail={(p) => {setSelectedPet(p);setShowDetail(true);}}
              onOpenContact={(p) => {setSelectedPet(p);setShowContact(true);}}
              onOpenShare={(p) => {setSelectedPet(p);setShowShare(true);}} />

            )}
              </div>
          }
          </div>
        }
      </div>

      {selectedPet &&
      <>
          <PetDetailModal
          pet={selectedPet}
          open={showDetail}
          onClose={() => setShowDetail(false)}
          onContactClick={() => {setShowDetail(false);setShowContact(true);}} />
        
          <ContactModal
          pet={selectedPet}
          open={showContact}
          onClose={() => setShowContact(false)}
          onStatusUpdate={() => refetch()} />
        
          <SharePetModal
          pet={selectedPet}
          open={showShare}
          onClose={() => setShowShare(false)} />
        
        </>
      }
    </div>);

}