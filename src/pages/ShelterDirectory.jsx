import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Mail, Phone, Loader2, ChevronRight, MapPin, ArrowLeft, Handshake } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate, Link } from 'react-router-dom';
import ShelterMap from '@/components/shelters/ShelterMap';

export default function ShelterDirectory() {
  const navigate = useNavigate();
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterShelterName, setFilterShelterName] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('');
  const [partnershipForm, setPartnershipForm] = useState({ notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const { data: connections = [], isLoading: sheltersLoading } = useQuery({
    queryKey: ['directory-connections'],
    queryFn: () => base44.entities.ShelterConnection.list('-created_date', 500)
  });

  const { data: allPets = [] } = useQuery({
    queryKey: ['directory-pets'],
    queryFn: () => base44.entities.Pet.list('-created_date', 1000)
  });

  const { data: user } = useQuery({
    queryKey: ['directory-user'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const { data: allShelterDetails = [] } = useQuery({
    queryKey: ['directory-shelter-details'],
    queryFn: () => base44.entities.ShelterDetails.list('-created_date', 500)
  });

  const shelterNames = useMemo(() => {
    const fromPets = [...new Set(allPets.map(p => p.source).filter(Boolean))];
    const fromDetails = allShelterDetails.map(d => d.shelter_name);
    return [...new Set([...fromPets, ...fromDetails])].sort();
  }, [allPets, allShelterDetails]);

  const shelterLocations = useMemo(() => {
    return [...new Set(allPets.map(p => p.location).filter(Boolean))].sort();
  }, [allPets]);

  const shelterSpecies = useMemo(() => {
    return [...new Set(allPets.map(p => p.species).filter(Boolean))].sort();
  }, [allPets]);

  const mergeShelterData = (name) => {
    const connection = connections.find(c => c.shelter_name === name);
    const details = allShelterDetails.find(d => d.shelter_name === name);
    return { ...connection, ...details, shelter_name: name };
  };

  const filteredShelters = useMemo(() => {
    return shelterNames.map(name => mergeShelterData(name)).filter(shelter => {
      const matchesSearch = !searchTerm || shelter.shelter_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesName = !filterShelterName || shelter.shelter_name === filterShelterName;
      let matchesLocation = true;
      let matchesSpecies = true;
      if (filterLocation || filterSpecies) {
        const shelterPets = allPets.filter(p => p.source === shelter.shelter_name && p.adoption_status !== 'Adopted' && p.adoption_status !== 'Transferred');
        if (filterLocation) matchesLocation = shelterPets.some(p => p.location === filterLocation);
        if (filterSpecies) matchesSpecies = shelterPets.some(p => p.species === filterSpecies);
      }
      return matchesSearch && matchesName && matchesLocation && matchesSpecies;
    });
  }, [shelterNames, allPets, allShelterDetails, searchTerm, filterShelterName, filterLocation, filterSpecies]);

  const handlePartnershipRequest = async () => {
    setSubmitting(true);
    try {
      const initiatorInfo = user
        ? { initiator_shelter_id: user.id, initiator_shelter_name: user.affiliated_organization || user.full_name, initiator_email: user.email }
        : { initiator_shelter_id: 'guest', initiator_shelter_name: 'Guest', initiator_email: 'inquiry@petpawtner.com' };

      const partnership = await base44.entities.ShelterPartnership.create({
        ...initiatorInfo,
        partner_shelter_id: selectedShelter.id || 'unknown',
        partner_shelter_name: selectedShelter.shelter_name,
        partner_email: selectedShelter.contact_email || 'info@shelter.com',
        status: 'pending',
        notes: partnershipForm.notes
      });

      await base44.functions.invoke('handlePartnershipNotification', {
        partnership_id: partnership.id,
        event_type: 'request_sent',
        recipient_email: selectedShelter.contact_email || 'info@shelter.com',
        sender_name: initiatorInfo.initiator_shelter_name,
        message: `${initiatorInfo.initiator_shelter_name} has sent you a partnership request${partnershipForm.notes ? ':\n\n' + partnershipForm.notes : '.'}`
      });

      toast.success('Partnership request sent and notification delivered!');
      setSelectedShelter(null);
      setPartnershipForm({ notes: '' });
    } catch (err) {
      toast.error('Failed to send partnership request');
    }
    setSubmitting(false);
  };

  const getPetCount = (shelterName, location) =>
    allPets.filter(p => p.source === shelterName && (!location || p.location === location) && p.adoption_status !== 'Adopted' && p.adoption_status !== 'Transferred').length;

  const getShelterSpecies = (shelterName) => {
    const species = new Set();
    allPets.filter(p => p.source === shelterName && p.adoption_status !== 'Adopted' && p.adoption_status !== 'Transferred').forEach(p => {
      if (p.species) species.add(p.species);
    });
    return [...species].join(', ');
  };

  const getShelterLocations = (shelterName) => {
    const locations = new Set();
    allPets.filter(p => p.source === shelterName && p.location).forEach(p => locations.add(p.location));
    return Array.from(locations);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterShelterName('');
    setFilterLocation('');
    setFilterSpecies('');
  };

  const hasFilters = searchTerm || filterShelterName || filterLocation || filterSpecies;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative border-b overflow-hidden" style={{ height: '400px' }}>
        <img
          src="https://media.base44.com/images/public/69b8651cb1058d2b7fcf68e5/898f608d2_wade-austin-ellis-FtuJIuBbUhI-unsplash.jpg"
          alt="Shelter Directory Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="px-4 py-24 absolute inset-0 flex flex-col justify-end">
          <div className="mx-auto text-center max-w-6xl w-full flex flex-col items-center">
            <div className="space-y-1 mb-4">
              <h1 className="text-3xl font-bold text-white">Directory</h1>
              <p className="text-white text-sm">Find and connect with shelters</p>
            </div>
            <Link to="/ShelterPortal">
              <Button size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-end">
          <div className="flex border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-white hover:bg-muted'}`}
            >Grid</button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-2 text-sm font-medium transition-colors border-l ${viewMode === 'map' ? 'bg-primary text-primary-foreground' : 'bg-white hover:bg-muted'}`}
            >Map</button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Search shelters or rescues..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          {searchTerm && (
            <Button size="sm" onClick={() => setSearchTerm('')} className="shrink-0">
              Clear
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Shelter or Rescue</Label>
                <Select value={filterShelterName} onValueChange={setFilterShelterName}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="All shelters" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All shelters</SelectItem>
                    {shelterNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Location</Label>
                <Select value={filterLocation} onValueChange={setFilterLocation}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="All locations" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All locations</SelectItem>
                    {shelterLocations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Pet Type</Label>
                <Select value={filterSpecies} onValueChange={setFilterSpecies}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="All types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All types</SelectItem>
                    {shelterSpecies.map(species => <SelectItem key={species} value={species}>{species}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {filteredShelters.length} shelter{filteredShelters.length !== 1 ? 's' : ''} found
              </p>
              {hasFilters && (
                <Button size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {sheltersLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === 'map' ? (
          <ShelterMap shelters={filteredShelters} pets={allPets} />
        ) : filteredShelters.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground text-lg">No shelters found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredShelters.flatMap(shelter => {
              const locations = getShelterLocations(shelter.shelter_name);
              return locations.length > 0
                ? locations.map(location => ({ ...shelter, selectedLocation: location }))
                : [shelter];
            }).map((shelter, idx) => (
              <Card
                key={`${shelter.shelter_name}-${shelter.selectedLocation || idx}`}
                className="flex flex-col cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/ShelterDetail?name=${encodeURIComponent(shelter.shelter_name)}${shelter.selectedLocation ? `&location=${encodeURIComponent(shelter.selectedLocation)}` : ''}`)}
              >
                <CardContent className="pt-6 pb-4 flex-1">
                  <div className="flex items-start gap-4">
                    {shelter.logo_url ? (
                      <img src={shelter.logo_url} alt={shelter.shelter_name} className="w-12 h-12 rounded-lg object-cover shrink-0" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-lg shrink-0">🏠</div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{shelter.shelter_name}</h3>
                      <div className="space-y-1 text-sm text-muted-foreground mt-2">
                        {shelter.mission && <p className="text-foreground font-medium italic">"{shelter.mission}"</p>}
                        {shelter.contact_name && <p>{shelter.contact_name}</p>}
                        {shelter.contact_email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {shelter.contact_email}</p>}
                        {shelter.contact_phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {shelter.contact_phone}</p>}
                        {shelter.software_platform && <p>Platform: {shelter.software_platform}</p>}
                        {shelter.selectedLocation && <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {shelter.selectedLocation}</p>}
                        <p className="mt-2">{getPetCount(shelter.shelter_name, shelter.selectedLocation)} pets</p>
                        {getShelterSpecies(shelter.shelter_name) && (
                          <p className="text-xs mt-1">Species: {getShelterSpecies(shelter.shelter_name)}</p>
                        )}
                      </div>
                      {shelter.notes && <p className="text-xs mt-2 text-muted-foreground italic">{shelter.notes}</p>}
                    </div>
                  </div>
                </CardContent>
                {user && (
                  <div className="border-t p-4" onClick={e => e.stopPropagation()}>
                    <Button
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => setSelectedShelter(shelter)}
                    >
                      Learn More <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedShelter && (
        <Dialog open={!!selectedShelter} onOpenChange={() => setSelectedShelter(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Partner with {selectedShelter.shelter_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="p-3 rounded-lg bg-muted space-y-2">
                <p className="font-semibold text-sm">{selectedShelter.shelter_name}</p>
                {selectedShelter.contact_email && (
                  <a href={`mailto:${selectedShelter.contact_email}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {selectedShelter.contact_email}
                  </a>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="partnership-notes" className="text-xs">Tell them about your organization</Label>
                <Textarea
                  id="partnership-notes"
                  value={partnershipForm.notes}
                  onChange={e => setPartnershipForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Describe partnership goals..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                {selectedShelter.contact_email && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${selectedShelter.contact_email}`} className="flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email
                    </a>
                  </Button>
                )}
                <Button onClick={handlePartnershipRequest} disabled={submitting} className="flex-1">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Handshake className="w-4 h-4 mr-2" />}
                  Send
                </Button>
                <Button variant="outline" onClick={() => setSelectedShelter(null)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}