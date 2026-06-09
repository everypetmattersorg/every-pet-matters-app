import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import PetDetailModal from '@/components/pets/PetDetailModal';

export default function ShelterDetail() {
  const [searchParams] = useSearchParams();
  const [selectedPet, setSelectedPet] = useState(null);
  const shelterName = searchParams.get('name');
  const location = searchParams.get('location');

  const { data: connections = [] } = useQuery({
    queryKey: ['shelter-detail-connections'],
    queryFn: () => base44.entities.ShelterConnection.list('-created_date', 500),
  });

  const { data: allPets = [] } = useQuery({
    queryKey: ['shelter-detail-pets'],
    queryFn: () => base44.entities.Pet.list('-created_date', 1000),
  });

  const { data: shelterDetails } = useQuery({
    queryKey: ['shelter-details', shelterName],
    queryFn: () => base44.entities.ShelterDetails.filter({ shelter_name: shelterName }),
    enabled: !!shelterName
  });

  const { data: rescueRecords = [] } = useQuery({
    queryKey: ['rescue-record', shelterName],
    queryFn: () => base44.entities.Rescue.filter({ name: shelterName }),
    enabled: !!shelterName
  });

  const address = rescueRecords?.[0]?.address || null;

  const shelter = useMemo(() => {
    return connections.find(c => c.shelter_name === shelterName) || null;
  }, [connections, shelterName]);

  const shelterPets = useMemo(() => {
    return allPets.filter(p => p.source === shelterName && (!location || p.location === location) && p.adoption_status !== 'Adopted' && p.adoption_status !== 'Transferred');
  }, [allPets, shelterName, location]);

  const petCount = shelterPets.length;

  const getShelterSpecies = (name) => {
    const species = new Set();
    allPets.filter(p => p.source === name && p.adoption_status !== 'Adopted' && p.adoption_status !== 'Transferred').forEach(p => {
      if (p.species) species.add(p.species);
    });
    return [...species].join(', ');
  };

  const getShelterLocations = (name) => {
    const locations = new Set();
    allPets.filter(p => p.source === name && p.location).forEach(p => {
      locations.add(p.location);
    });
    return Array.from(locations);
  };

  if (!shelterName) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Shelter not found</p>
          <Link to="/ShelterDirectory">
            <Button variant="outline" className="mt-4">Back to Directory</Button>
          </Link>
        </div>
      </div>
    );
  }

  const displayTitle = location ? `${shelterName} - ${location}` : shelterName;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Banner */}
      {shelterDetails?.[0]?.banner_url && (
        <div className="relative h-48 bg-gradient-to-r from-amber-100 to-orange-100 overflow-hidden">
          <img
            src={shelterDetails[0].banner_url}
            alt="Shelter Banner"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/ShelterDirectory">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
          {shelterDetails?.[0]?.logo_url && (
            <img
              src={shelterDetails[0].logo_url}
              alt="Shelter Logo"
              className="w-12 h-12 rounded-lg object-cover"
              referrerPolicy="no-referrer"
            />
          )}
          <h1 className="text-2xl font-bold">{displayTitle}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Main Info Card */}
        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-lg shrink-0">🏠</div>
              <div className="flex-1">
                <div className="space-y-1 text-sm text-muted-foreground mt-2">
                  {shelterDetails?.[0]?.mission && <p className="text-foreground font-medium italic">"{shelterDetails[0].mission}"</p>}
                  {shelterDetails?.[0]?.description && <p className="text-foreground">{shelterDetails[0].description}</p>}
                  {shelter?.contact_name && <p>{shelter.contact_name}</p>}
                  {shelter?.contact_email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {shelter.contact_email}</p>}
                  {shelter?.contact_phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {shelter.contact_phone}</p>}
                  <p className="flex items-center gap-1 flex-wrap"><MapPin className="w-3 h-3" /> {shelterName}{address ? `, ${address}` : ''}{location ? ` (${location})` : ''}</p>
                  <p className="mt-2">🐾 {petCount} pets</p>
                  {getShelterSpecies(shelterName) && (
                    <p className="text-xs mt-1">Species: {getShelterSpecies(shelterName)}</p>
                  )}
                </div>
                {shelter?.notes && <p className="text-xs mt-2 text-muted-foreground italic">{shelter.notes}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Animals Accepted Banner */}
        {shelterDetails?.[0]?.animals_accepted && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
            <span className="text-xl">🐾</span>
            <div>
              <p className="font-semibold text-amber-900 mb-0.5">Animals We Accept</p>
              <p className="text-amber-800">{shelterDetails[0].animals_accepted}</p>
            </div>
          </div>
        )}

        {/* Contact Information Card */}
        {(shelterDetails?.[0]?.phone || shelterDetails?.[0]?.email || shelterDetails?.[0]?.address || shelterDetails?.[0]?.website || shelterDetails?.[0]?.hours || shelter?.contact_email || shelter?.contact_phone) && (
          <Card>
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm pb-5">
              {(shelterDetails?.[0]?.email || shelter?.contact_email) && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a href={`mailto:${shelterDetails?.[0]?.email || shelter?.contact_email}`} className="text-primary hover:underline">
                    {shelterDetails?.[0]?.email || shelter?.contact_email}
                  </a>
                </div>
              )}
              {(shelterDetails?.[0]?.phone || shelter?.contact_phone) && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a href={`tel:${shelterDetails?.[0]?.phone || shelter?.contact_phone}`} className="hover:underline">
                    {shelterDetails?.[0]?.phone || shelter?.contact_phone}
                  </a>
                </div>
              )}
              {address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{address}</span>
                </div>
              )}
              {shelterDetails?.[0]?.website && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">🌐</span>
                  <a href={shelterDetails[0].website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {shelterDetails[0].website}
                  </a>
                </div>
              )}
              {shelterDetails?.[0]?.hours && (
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">🕐</span>
                  <span>{shelterDetails[0].hours}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pets Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Pets Available</h2>

          {petCount === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No pets listed from this shelter yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shelterPets.map(pet => (
                <Card key={pet.id} className="overflow-hidden flex flex-col">
                  {(pet.photo_urls?.[0] || pet.photo_url) ? (
                    <img
                      src={pet.photo_urls?.[0] || pet.photo_url}
                      alt={pet.name}
                      className="w-full h-40 object-cover"
                      style={{ objectPosition: pet.photo_focal_points?.[0] || 'center' }}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-40 bg-muted flex items-center justify-center text-3xl">🐾</div>
                  )}
                  <CardContent className="pt-3 pb-4 flex-1 flex flex-col gap-2">
                    <p className="font-semibold text-base">{pet.name}</p>
                    <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                      {pet.species && <span>{pet.species}</span>}
                      {pet.age && <span>{pet.age}</span>}
                      {pet.breed && <span className="col-span-2">{pet.breed}</span>}
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-auto" onClick={() => setSelectedPet(pet)}>
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedPet && (
        <PetDetailModal
          pet={selectedPet}
          open={!!selectedPet}
          onClose={() => setSelectedPet(null)}
        />
      )}
    </div>
  );
}