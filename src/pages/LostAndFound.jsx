import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HERO_COLORS } from '@/lib/heroConfig';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Heart, Upload, Scan, MapPin, ArrowRight, X, Camera, Bell, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import PetCard from '../components/pets/PetCard';
import PetFilters from '../components/pets/PetFilters';
import AlertForm from '../components/alerts/AlertForm';
import { Skeleton } from "@/components/ui/skeleton";

const statusColors = {
  lost: 'bg-rose-100 text-rose-700',
  found: 'bg-emerald-100 text-emerald-700',
  reunited: 'bg-violet-100 text-violet-700'
};

const confidenceColor = {
  high: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-600'
};

export default function LostAndFound() {
   const [searchParams] = useSearchParams();
   const [activeTab, setActiveTab] = useState(() => {
     const tab = searchParams.get('tab');
     return tab === 'photo-match' ? 'photo-match' : 'listings';
   });

   const [filters, setFilters] = useState({
    status: 'all',
    pet_type: 'all',
    size: 'all',
    search: '',
    breed: '',
    color: '',
    date_from: '',
    date_to: ''
  });

  const [mapFilter, setMapFilter] = useState({
    center: null,
    radiusMiles: 10,
    active: false
  });

  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertSaved, setAlertSaved] = useState(false);
  const [savingAlert, setSavingAlert] = useState(false);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3958.8;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const { data: pets = [], isLoading } = useQuery({
    queryKey: ['lostFoundPets'],
    queryFn: () => base44.entities.LostFoundPet.list('-created_date', 100)
  });

  const activePets = pets.filter((p) => !p.is_resolved);

  const filteredPets = activePets.filter((pet) => {
    if (filters.status !== 'all' && pet.status !== filters.status) return false;
    if (filters.pet_type !== 'all' && pet.pet_type !== filters.pet_type) return false;
    if (filters.size !== 'all' && pet.size !== filters.size) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
      pet.location?.toLowerCase().includes(searchLower) ||
      pet.breed?.toLowerCase().includes(searchLower) ||
      pet.description?.toLowerCase().includes(searchLower) ||
      pet.name?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    if (filters.breed) {
      if (!pet.breed?.toLowerCase().includes(filters.breed.toLowerCase())) return false;
    }
    if (filters.color) {
      if (!pet.color?.toLowerCase().includes(filters.color.toLowerCase())) return false;
    }
    if (filters.date_from) {
      if (!pet.date_lost_found || pet.date_lost_found < filters.date_from) return false;
    }
    if (filters.date_to) {
      if (!pet.date_lost_found || pet.date_lost_found > filters.date_to) return false;
    }
    if (mapFilter.active && mapFilter.center) {
      if (!pet.latitude || !pet.longitude) return false;
      const dist = haversineDistance(
        mapFilter.center.lat, mapFilter.center.lng,
        pet.latitude, pet.longitude
      );
      if (dist > mapFilter.radiusMiles) return false;
    }
    return true;
  });

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResults(null);
    setAlertSaved(false);
    setUploading(true);
    const localUrl = URL.createObjectURL(file);
    setUploadedImage({ url: localUrl, file });
    setUploading(false);
  };

  const handleAnalyze = async () => {
    if (!uploadedImage) return;
    setAnalyzing(true);
    setResults(null);
    setAlertSaved(false);

    const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadedImage.file });

    const petsContext = activePets.map((p) =>
    `ID:${p.id} | ${p.status.toUpperCase()} | ${p.pet_type} | ${p.breed || 'unknown breed'} | ${p.color || 'unknown color'} | ${p.location} | ${p.name || 'unnamed'} | desc: ${p.description}`
    ).join('\n');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a pet identification expert helping reunite lost pets with their owners.

Analyze the uploaded photo and identify the pet's key visual characteristics (species, breed, coat color/pattern, size, distinctive markings).

Then, compare these characteristics against the following list of reported lost/found pets and identify the top matches (up to 5), ranked by similarity. Only include pets that are a reasonable match.

Active lost/found pet listings:
${petsContext || 'No active listings yet.'}

Return a JSON object with:
- "pet_description": a brief 1-2 sentence visual description of the pet in the photo
- "species": the animal species (dog, cat, bird, rabbit, other)
- "breed_guess": best guess at breed
- "color": coat color/pattern
- "matches": array of objects with { "id": pet_id, "reason": "brief reason why it matches", "confidence": "high/medium/low" }

Only return matches with at least low confidence. If no matches, return empty array.`,
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          pet_description: { type: 'string' },
          species: { type: 'string' },
          breed_guess: { type: 'string' },
          color: { type: 'string' },
          matches: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                reason: { type: 'string' },
                confidence: { type: 'string' }
              }
            }
          }
        }
      }
    });

    const matchedPets = (result.matches || []).
    map((m) => {
      const pet = activePets.find((p) => p.id === m.id);
      return pet ? { ...m, pet } : null;
    }).
    filter(Boolean);

    const finalResult = { ...result, matchedPets, uploaded_url: file_url };
    setResults(finalResult);

    const user = await base44.auth.me().catch(() => null);
    if (user) {
      await base44.entities.PhotoMatchSearch.create({
        user_email: user.email,
        photo_url: file_url,
        pet_description: result.pet_description || '',
        species: result.species || '',
        breed_guess: result.breed_guess || '',
        color: result.color || '',
        match_count: matchedPets.length
      });
      queryClient.invalidateQueries(['photo-match-searches']);
    }

    setAnalyzing(false);
  };

  const handleCreateAlert = async (alertData) => {
    setSavingAlert(true);
    await base44.entities.Alert.create(alertData);
    queryClient.invalidateQueries(['alerts']);
    setSavingAlert(false);
    setShowAlertDialog(false);
    setAlertSaved(true);
  };

  const alertInitialData = results ? {
    name: `Photo Match Alert - ${results.breed_guess || results.species || 'Pet'}`,
    email: '',
    pet_type: results.species || 'any',
    status_filter: 'both',
    breed: results.breed_guess || '',
    location_name: '',
    latitude: null,
    longitude: null,
    radius_miles: 25,
    is_active: true
  } : null;

  return (
    <div className="min-h-screen" style={{ background: '#FAF5F0' }}>
      {/* Hero */}
      <div className="px-4 py-6" style={{ background: HERO_COLORS.background }}>
        <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden flex flex-col md:flex-row" style={{ minHeight: '340px' }}>
          {/* Left: photo */}
          <div className="md:w-1/2 w-full min-h-48 md:min-h-0">
            <img src="https://media.base44.com/images/public/69a0f10efc1058c9e80d1210/2a2c5cb58_havasupai-325.JPG"

            alt="Lost and found pets"
            className="w-full h-full object-cover"
            style={{ display: 'block' }} />
            
          </div>
          {/* Right: panel */}
          <div className="md:w-1/2 w-full flex flex-col justify-center px-10 py-10" style={{ background: HERO_COLORS.panelBg }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-5 self-start" style={{ background: HERO_COLORS.badgeBg, color: HERO_COLORS.badgeText }}>
              <Heart className="w-4 h-4" /> help reunite pets & families
            </div>
            <h1 className="text-5xl font-black mb-4 leading-tight" style={{ color: HERO_COLORS.panelText }}>lost & found pets</h1>
            <p className="text-lg max-w-sm leading-relaxed mb-6" style={{ color: HERO_COLORS.panelSubtext }}>browse lost and found listings or use photo matching to find potential matches instantly.</p>
            <div className="flex flex-wrap gap-3">
              <Link to={createPageUrl('ReportLost')}>
                <Button size="lg" className="h-11 px-6 font-semibold rounded-xl bg-[#af501d] hover:bg-[#8f3f15] text-white">
                  report lost pet
                </Button>
              </Link>
              <Link to={createPageUrl('ReportFound')}>
                <Button size="lg" className="h-11 px-6 font-semibold rounded-xl bg-[#2B5242] hover:bg-[#1e3a2e] text-white">
                  report found pet
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8" style={{ backgroundColor: '#b1511d' }}>
            <TabsTrigger value="listings">Lost & Found Listings</TabsTrigger>
            <TabsTrigger value="photo-match" className="text-[hsl(var(--background))]">Photo Match</TabsTrigger>
          </TabsList>

          {/* Listings Tab */}
          <TabsContent value="listings" className="space-y-6">
            <PetFilters
              filters={filters}
              onFilterChange={setFilters}
              mapFilter={mapFilter}
              onMapFilterChange={setMapFilter}
              hiddenFilters={['urgent', 'rescue_needed', 'vaccinated', 'kid_friendly', 'dog_friendly', 'cat_friendly']} />
            

            <div>
              {isLoading ?
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) =>
                <div key={i} className="bg-white rounded-2xl overflow-hidden">
                      <Skeleton className="aspect-[4/3]" />
                      <div className="p-5 space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                )}
                </div> :
              filteredPets.length > 0 ?
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredPets.map((pet) =>
                <PetCard key={pet.id} pet={pet} />
                )}
                </div> :

              <div className="text-center py-20">
                  <div className="text-6xl mb-4">🐾</div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">No pets found</h3>
                  <p className="text-slate-500">
                    {mapFilter.active ?
                  `No pets reported within ${mapFilter.radiusMiles} miles of the selected location. Try expanding the radius.` :
                  'Try adjusting your filters or check back later'}
                  </p>
                </div>
              }
            </div>
          </TabsContent>

          {/* Photo Match Tab */}
          <TabsContent value="photo-match" className="space-y-8">
            {/* Upload Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              <h2 className="font-semibold text-slate-800 text-lg mb-1">Upload Pet Photo</h2>
              <p className="text-sm text-slate-500 mb-4">upload a photo of your lost or found pet to match with any of our listings to help them be reunited.</p>

              {!uploadedImage ?
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded-xl p-12 text-center hover:border-rose-400 hover:bg-rose-50 transition-colors group">
                
                  <Upload className="w-10 h-10 text-slate-300 group-hover:text-rose-400 mx-auto mb-3 transition-colors" />
                  <p className="font-medium text-slate-600 group-hover:text-rose-600">Click to upload a photo</p>
                  <p className="text-sm text-slate-400 mt-1">JPG, PNG or WEBP supported</p>
                </button> :

              <div className="relative">
                  <img
                  src={uploadedImage.url}
                  alt="Uploaded pet"
                  className="w-full max-h-80 object-contain rounded-xl bg-slate-50" />
                
                  <button
                  onClick={() => {setUploadedImage(null);setResults(null);setAlertSaved(false);}}
                  className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-1.5 shadow transition-colors">
                  
                    <X className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              }

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

              {uploadedImage &&
              <Button
                onClick={handleAnalyze}
                disabled={analyzing || uploading}
                className="w-full mt-4 h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold">
                
                  {analyzing ?
                <><Scan className="w-5 h-5 mr-2 animate-pulse" /> Analyzing photo...</> :

                <><Scan className="w-5 h-5 mr-2" /> Find Matches</>
                }
                </Button>
              }
            </div>

            {/* Results */}
            {results &&
            <div className="space-y-6">
                {/* AI Description */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h2 className="font-semibold text-slate-800 mb-3">AI Analysis</h2>
                  <p className="text-slate-600 text-sm leading-relaxed">{results.pet_description}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {results.species && <Badge className="bg-rose-100 text-rose-700 capitalize">{results.species}</Badge>}
                    {results.breed_guess && <Badge className="bg-blue-100 text-blue-700">{results.breed_guess}</Badge>}
                    {results.color && <Badge className="bg-amber-100 text-amber-700">{results.color}</Badge>}
                  </div>

                  {/* Create Alert CTA */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                    <p className="text-sm text-slate-500">Get notified if a matching pet is reported</p>
                    {alertSaved ?
                  <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Alert created!
                      </div> :

                  <Button
                    size="sm"
                    onClick={() => setShowAlertDialog(true)}
                    className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl">
                    
                        <Bell className="w-4 h-4 mr-1.5" /> Create Alert
                      </Button>
                  }
                  </div>
                </div>

                {/* Matches */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h2 className="font-semibold text-slate-800 mb-4">
                    {results.matchedPets.length > 0 ?
                  `${results.matchedPets.length} Potential Match${results.matchedPets.length > 1 ? 'es' : ''} Found` :
                  'No Matches Found'}
                  </h2>

                  {results.matchedPets.length === 0 ?
                <div className="text-center py-8">
                      <div className="text-4xl mb-3">🔍</div>
                      <p className="text-slate-500 text-sm">No similar pets found in current listings. The pet may not have been reported yet.</p>
                      <div className="flex gap-3 justify-center mt-4">
                        <Link to={createPageUrl('ReportLost')}>
                          <Button size="sm" variant="outline" className="rounded-xl">Report as Lost</Button>
                        </Link>
                        <Link to={createPageUrl('ReportFound')}>
                          <Button size="sm" variant="outline" className="rounded-xl">Report as Found</Button>
                        </Link>
                      </div>
                    </div> :

                <div className="space-y-4">
                      {results.matchedPets.map(({ pet, reason, confidence }) =>
                  <div
                    key={pet.id}
                    className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50 transition-colors group cursor-pointer">
                    
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                            {pet.photo_url ?
                      <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" /> :

                      <div className="w-full h-full flex items-center justify-center text-3xl">
                                {pet.pet_type === 'dog' ? '🐕' : pet.pet_type === 'cat' ? '🐱' : '🐾'}
                              </div>
                      }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-slate-800">{pet.name || pet.pet_type}</span>
                              <Badge className={`text-xs capitalize ${statusColors[pet.status]}`}>{pet.status}</Badge>
                              <Badge className={`text-xs capitalize ${confidenceColor[confidence]}`}>{confidence} match</Badge>
                            </div>
                            <p className="text-xs text-slate-500 mb-1">{pet.breed} · {pet.color}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mb-1.5">
                              <MapPin className="w-3 h-3" /> {pet.location}
                            </p>
                            <p className="text-xs text-slate-400 italic line-clamp-2">{reason}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-rose-500 self-center flex-shrink-0 transition-colors" />
                          </div>
                  )}
                    </div>
                }
                </div>
              </div>
            }
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Alert Dialog */}
      <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create Alert for This Pet</DialogTitle>
          </DialogHeader>
          {alertInitialData &&
          <AlertForm
            initialData={alertInitialData}
            onSubmit={handleCreateAlert}
            isSubmitting={savingAlert}
            onCancel={() => setShowAlertDialog(false)} />

          }
        </DialogContent>
      </Dialog>
    </div>);

}