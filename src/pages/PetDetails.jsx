import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, MapPin, Calendar, Mail, User, 
  CheckCircle2, Tag, Heart, Share2, AlertTriangle, Stethoscope, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import PetPillTags from '@/components/pets/PetPillTags';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const petTypeIcons = {
  dog: '🐕',
  cat: '🐱',
  bird: '🐦',
  rabbit: '🐰',
  other: '🐾'
};

const statusColors = {
  lost: 'bg-rose-100 text-rose-700 border-rose-200',
  found: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  reunited: 'bg-violet-100 text-violet-700 border-violet-200'
};

const statusBgColors = {
  lost: 'from-rose-500 to-rose-600',
  found: 'from-emerald-500 to-emerald-600',
  reunited: 'from-violet-500 to-violet-600'
};

export default function PetDetails() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const petId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const { data: pet, isLoading } = useQuery({
    queryKey: ['pet', petId],
    queryFn: async () => {
      const pets = await base44.entities.Pet.filter({ id: petId });
      return pets[0];
    },
    enabled: !!petId
  });

  useEffect(() => {
    const checkFavorite = async () => {
      if (user && pet) {
        try {
          const favorites = await base44.entities.Favorite.filter({
            user_email: user.email,
            pet_id: petId,
            pet_type: 'lost_found'
          });
          setIsFavorited(favorites.length > 0);
        } catch {
          setIsFavorited(false);
        }
      }
    };
    checkFavorite();
  }, [user, pet, petId]);

  const markReunitedMutation = useMutation({
    mutationFn: () => base44.entities.Pet.update(petId, { status: 'reunited' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['pet', petId]);
      toast.success('Pet marked as reunited! 🎉');
    }
  });

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorited) {
        const favorites = await base44.entities.Favorite.filter({
          user_email: user.email,
          pet_id: petId,
          pet_type: 'lost_found'
        });
        if (favorites.length > 0) {
          await base44.entities.Favorite.delete(favorites[0].id);
        }
      } else {
        await base44.entities.Favorite.create({
          user_email: user.email,
          pet_id: petId,
          pet_type: 'lost_found'
        });
      }
    },
    onSuccess: () => {
      setIsFavorited(!isFavorited);
      toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites!');
    }
  });

  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleShare = () => {
    navigator.share?.({
      title: `${pet.status === 'lost' ? 'Lost' : 'Found'} Pet: ${pet.name || pet.pet_type}`,
      text: pet.description,
      url: window.location.href
    }).catch(() => {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-80 rounded-2xl mb-6" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🐾</div>
          <h1 className="text-2xl font-bold text-slate-700 mb-2">Pet not found</h1>
          <Link to={createPageUrl('Home')}>
            <Button>Back to listings</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className={`bg-gradient-to-r ${statusBgColors[pet.status]} text-white`}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Button 
            variant="outline"
            className="text-white border-white hover:bg-white/20"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go back
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-12 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Photo */}
            <Card className="overflow-hidden border-0 shadow-xl">
              <div className="aspect-square bg-slate-100 relative">
                {pet.photo_url ? (
                  <img 
                    src={pet.photo_url} 
                    alt={pet.name || 'Pet'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-9xl">
                    {petTypeIcons[pet.pet_type]}
                  </div>
                )}
                <PetPillTags pet={pet} source="pet" />
                <div className="absolute top-4 left-4">
                  <Badge className={`${statusColors[pet.status]} border font-semibold px-4 py-2 text-sm uppercase tracking-wide`}>
                    {pet.status}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Details */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl md:text-3xl font-bold text-slate-800">
                      {pet.name || `${pet.pet_type.charAt(0).toUpperCase() + pet.pet_type.slice(1)}`}
                    </CardTitle>
                    <p className="text-slate-500 mt-1 capitalize">
                      {pet.breed || pet.pet_type} • {pet.color} • {pet.size} • {pet.gender}
                    </p>
                  </div>
                  <span className="text-5xl">{petTypeIcons[pet.pet_type]}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Location</p>
                      <p className="font-medium text-slate-700">{pet.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">
                        {pet.status === 'lost' ? 'Lost On' : 'Found On'}
                      </p>
                      <p className="font-medium text-slate-700">
                        {pet.date_lost_found ? format(new Date(pet.date_lost_found), 'MMMM d, yyyy') : 'Date not available'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Description</h3>
                  <p className="text-slate-600 leading-relaxed">{pet.description}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {pet.has_collar && (
                    <Badge variant="outline" className="px-3 py-1.5">
                      <Tag className="w-3 h-3 mr-1" />
                      Has Collar/Tags
                    </Badge>
                  )}
                  {pet.is_microchipped && (
                    <Badge variant="outline" className="px-3 py-1.5">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Microchipped
                    </Badge>
                  )}
                </div>

                {pet.special_notes && (
                   <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                     <h3 className="font-semibold text-amber-800 mb-1">Special Notes</h3>
                     <p className="text-amber-700">{pet.special_notes}</p>
                   </div>
                 )}

                {/* Medical History Section */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-t-lg">
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                      <Stethoscope className="w-5 h-5 text-blue-600" />
                      Medical History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {pet.vaccinations ? (
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-2">Vaccinations</h4>
                        <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-lg">{pet.vaccinations}</p>
                      </div>
                    ) : (
                      <div className="text-slate-500 text-sm">No vaccination records available</div>
                    )}

                    {pet.allergies ? (
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          Allergies
                        </h4>
                        <p className="text-slate-600 text-sm bg-amber-50 p-3 rounded-lg border border-amber-200">{pet.allergies}</p>
                      </div>
                    ) : (
                      <div className="text-slate-500 text-sm">No known allergies</div>
                    )}

                    {pet.special_needs ? (
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-2">Special Needs</h4>
                        <p className="text-slate-600 text-sm bg-rose-50 p-3 rounded-lg border border-rose-200">{pet.special_needs}</p>
                      </div>
                    ) : (
                      <div className="text-slate-500 text-sm">No special needs noted</div>
                    )}
                  </CardContent>
                </Card>
                </CardContent>
                </Card>

            {/* Map */}
            {pet.latitude && pet.longitude && (
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-rose-500" />
                    {pet.status === 'lost' ? 'Last Known Location' : 'Found Location'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-64 w-full">
                    <MapContainer
                      center={[pet.latitude, pet.longitude]}
                      zoom={14}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[pet.latitude, pet.longitude]}>
                        <Popup>
                          {pet.status === 'lost' ? 'Last seen here' : 'Found here'}<br />
                          {pet.location}
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Card */}
            <Card className="border-0 shadow-lg sticky top-6">
              <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-xl">
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-slate-100 rounded-lg">
                     <User className="w-5 h-5 text-slate-600" />
                   </div>
                   <div>
                     <p className="text-xs text-slate-400">Contact Person</p>
                     <p className="font-semibold text-slate-800">{pet.contact_name}</p>
                   </div>
                 </div>

                 {pet.contact_email && (
                  <a href={`mailto:${pet.contact_email}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Email</p>
                      <p className="font-semibold text-slate-800 break-all">{pet.contact_email}</p>
                    </div>
                  </a>
                )}

                <div className="pt-4 space-y-3">
                   <div className="grid grid-cols-2 gap-2">
                     <div className="relative">
                       <Button
                         onClick={() => setShowShareMenu(!showShareMenu)}
                         variant="outline"
                         className="h-12 rounded-xl w-full"
                       >
                         <Share2 className="w-4 h-4 mr-1" />
                         <span className="hidden sm:inline">Share</span>
                       </Button>

                       {showShareMenu && (
                         <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-50 w-56">
                           <button onClick={handleShare} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded">Share Link</button>
                           <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Copied!'); }} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded">Copy Link</button>
                           {(pet.social_media_graphics?.instagram || pet.social_media_graphics?.facebook) && (
                             <div className="border-t border-slate-200 my-1"></div>
                           )}
                           {pet.social_media_graphics?.instagram && (
                             <a href={pet.social_media_graphics.instagram} download="instagram-graphic.png" className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded block">📷 Instagram</a>
                           )}
                           {pet.social_media_graphics?.facebook && (
                             <a href={pet.social_media_graphics.facebook} download="facebook-graphic.png" className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded block">📘 Facebook</a>
                           )}
                         </div>
                       )}
                     </div>

                     {user && (
                       <Button 
                         onClick={() => favoriteMutation.mutate()}
                         disabled={favoriteMutation.isPending}
                         variant={isFavorited ? "default" : "outline"}
                         className={`h-12 rounded-xl ${isFavorited ? 'bg-primary hover:bg-primary/90 text-white' : ''}`}
                       >
                         <Heart className={`w-4 h-4 mr-1 ${isFavorited ? 'fill-current' : ''}`} />
                         <span className="hidden sm:inline">{isFavorited ? 'Favorited' : 'Favorite'}</span>
                       </Button>
                     )}
                   </div>

                 </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}