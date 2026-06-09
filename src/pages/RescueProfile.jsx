import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Globe, MapPin, Heart, ArrowLeft, Users, Calendar, Star, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import AdoptablePetCard from "@/components/adopt/AdoptablePetCard";
import { Skeleton } from "@/components/ui/skeleton";
import VolunteerModal from "@/components/rescue/VolunteerModal";
import RescueMap from "@/components/rescue/RescueMap";
import EventCard from "@/components/rescue/EventCard";
import RescueGallery from "@/components/rescue/RescueGallery";
import RescueReviewForm from "@/components/rescue/RescueReviewForm";
import RescueReviewCard from "@/components/rescue/RescueReviewCard";
import DonationProgressCard from "@/components/donations/DonationProgressCard";
import DonationForm from "@/components/donations/DonationForm";

export default function RescueProfile() {
  const [searchParams] = useSearchParams();
  const rescueEmail = searchParams.get("email");
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [petSearchQuery, setPetSearchQuery] = useState("");
  const [petFilters, setPetFilters] = useState({
    species: [],
    specialNeeds: false,
    availableForFoster: false,
  });
  
  const { data: pets = [], isLoading } = useQuery({
    queryKey: ["rescuePets", rescueEmail],
    queryFn: () => base44.entities.AdoptablePet.filter({ rescue_email: rescueEmail }, "-created_date", 100),
    enabled: !!rescueEmail,
  });

  const { data: rescue = null } = useQuery({
    queryKey: ["rescue", rescueEmail],
    queryFn: () => base44.entities.Rescue.filter({ email: rescueEmail }, "-updated_date", 1).then(results => results[0] || null),
    enabled: !!rescueEmail,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["rescueEvents", rescueEmail],
    queryFn: () => base44.entities.RescueEvent.filter({ rescue_email: rescueEmail }, "-event_date", 10),
    enabled: !!rescueEmail,
  });

  const { data: reviews = [], refetch: refetchReviews } = useQuery({
    queryKey: ["rescueReviews", rescueEmail],
    queryFn: () => base44.entities.RescueReview.filter({ rescue_email: rescueEmail }, "-created_date", 50),
    enabled: !!rescueEmail,
  });

  const { data: donationGoals = [] } = useQuery({
    queryKey: ["donationGoals", rescueEmail],
    queryFn: () => base44.entities.DonationGoal.filter({ rescue_email: rescueEmail, is_active: true }, "-created_date", 10),
    enabled: !!rescueEmail,
  });

  const [showDonationForm, setShowDonationForm] = useState(false);

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  // Filter adoptable pets
  const filteredPets = pets.filter(pet => {
    const searchMatch = 
      !petSearchQuery || 
      pet.name?.toLowerCase().includes(petSearchQuery.toLowerCase()) ||
      pet.breed?.toLowerCase().includes(petSearchQuery.toLowerCase()) ||
      pet.description?.toLowerCase().includes(petSearchQuery.toLowerCase());
    
    const speciesMatch = 
      petFilters.species.length === 0 || 
      petFilters.species.includes(pet.pet_type);
    
    const specialNeedsMatch = 
      !petFilters.specialNeeds || 
      pet.special_needs;
    
    const fosterMatch = 
      !petFilters.availableForFoster || 
      pet.foster_url;

    return searchMatch && speciesMatch && specialNeedsMatch && fosterMatch;
  });

  if (!rescueEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Rescue not found</h1>
          <Link to={createPageUrl("Adopt")}>
            <Button className="mt-4">Back to Adoptable Pets</Button>
          </Link>
        </div>
      </div>
    );
  }

  const basicRescueInfo = pets[0] ? {
    name: pets[0].rescue_name,
    email: pets[0].rescue_email,
    phone: pets[0].rescue_phone,
    website: pets[0].rescue_website,
  } : null;

  const rescueData = rescue || basicRescueInfo;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link to={createPageUrl("Adopt")}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Adoptable Pets
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : rescueData ? (
          <>
            {/* Banner */}
            {rescue?.banner_url && (
              <div className="rounded-2xl overflow-hidden mb-8 h-64 md:h-80">
                <img 
                  src={rescue.banner_url} 
                  alt={rescue.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Organization Info */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                <div className="flex-1">
                  {rescue?.logo_url && (
                    <img 
                      src={rescue.logo_url} 
                      alt={rescueData.name} 
                      className="h-16 mb-4 rounded-lg"
                    />
                  )}
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-medium mb-4">
                    <Heart className="w-4 h-4" />
                    Rescue & Shelter
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">{rescueData.name}</h1>
                  
                  <div className="space-y-4">
                    {rescueData.phone && (
                      <div className="flex items-center gap-3 text-slate-700">
                        <Phone className="w-5 h-5 text-rose-500 flex-shrink-0" />
                        <a href={`tel:${rescueData.phone}`} className="hover:text-rose-600 transition">
                          {rescueData.phone}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-slate-700">
                      <Mail className="w-5 h-5 text-rose-500 flex-shrink-0" />
                      <a href={`mailto:${rescueData.email}`} className="hover:text-rose-600 transition">
                        {rescueData.email}
                      </a>
                    </div>
                    {rescueData.website && (
                      <div className="flex items-center gap-3 text-slate-700">
                        <Globe className="w-5 h-5 text-rose-500 flex-shrink-0" />
                        <a 
                          href={rescueData.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-rose-600 transition break-all"
                        >
                          {rescueData.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl p-8 md:w-80">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-rose-600 mb-2">{pets.length}</div>
                    <div className="text-slate-700 font-medium">Pets Available for Adoption</div>
                    <div className="text-slate-500 text-sm mt-2">
                      Give a home to a pet in need
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery Section */}
            {rescue?.banner_url && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Facility</h2>
                <RescueGallery photos={[rescue.banner_url, rescue.logo_url].filter(Boolean)} />
              </div>
            )}

            {/* Mission & Services Section */}
            {(rescue?.mission_statement || rescue?.services_offered?.length > 0 || rescue?.facebook_url || rescue?.instagram_url || rescue?.twitter_url || rescue?.youtube_url) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {rescue?.mission_statement && (
                  <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl shadow-lg p-8 border border-rose-100">
                    <h3 className="text-xl font-bold text-rose-900 mb-4">Our Mission</h3>
                    <p className="text-rose-800 leading-relaxed">{rescue.mission_statement}</p>
                  </div>
                )}

                {rescue?.services_offered?.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-8 border border-blue-100">
                    <h3 className="text-xl font-bold text-blue-900 mb-4">Services We Offer</h3>
                    <div className="flex flex-wrap gap-2">
                      {rescue.services_offered.map(service => (
                        <span key={service} className="px-3 py-1.5 bg-blue-200 text-blue-900 text-sm rounded-full font-medium">
                          ✓ {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(rescue?.facebook_url || rescue?.instagram_url || rescue?.twitter_url || rescue?.youtube_url) && (
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Follow Us</h3>
                    <div className="flex flex-wrap gap-3">
                      {rescue?.facebook_url && (
                        <a href={rescue.facebook_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition font-medium">
                          f Facebook
                        </a>
                      )}
                      {rescue?.instagram_url && (
                        <a href={rescue.instagram_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-lg transition font-medium">
                          📷 Instagram
                        </a>
                      )}
                      {rescue?.twitter_url && (
                        <a href={rescue.twitter_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-lg transition font-medium">
                          𝕏 Twitter
                        </a>
                      )}
                      {rescue?.youtube_url && (
                        <a href={rescue.youtube_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition font-medium">
                          ▶ YouTube
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* About Section */}
            {rescue?.about && (
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">About Us</h2>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{rescue.about}</p>
              </div>
            )}

            {/* Photo & Video Gallery */}
            {(rescue?.gallery_photos?.length > 0 || rescue?.gallery_videos?.length > 0) && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Photo & Video Gallery</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Photos */}
                  {rescue?.gallery_photos?.map((photo, idx) => (
                    <div key={`photo-${idx}`} className="relative group">
                      <img src={photo} alt={`Gallery ${idx}`} className="w-full h-48 rounded-xl object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition" />
                    </div>
                  ))}
                  
                  {/* Videos */}
                  {rescue?.gallery_videos?.map((video, idx) => (
                    <div key={`video-${idx}`} className="relative group w-full h-48 rounded-xl overflow-hidden bg-slate-900">
                      {video.includes('youtube.com') || video.includes('youtu.be') ? (
                        <iframe
                          title={`Video ${idx}`}
                          src={`https://www.youtube.com/embed/${video.split('v=')[1]?.split('&')[0] || ''}`}
                          className="w-full h-full"
                          allowFullScreen
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-white hover:opacity-80 transition">
                          <a href={video} target="_blank" rel="noopener noreferrer" className="font-semibold">
                            Watch Video →
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location & Map */}
            {(rescue?.address || (rescue?.latitude && rescue?.longitude)) && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Location</h2>
                
                {/* Address Card */}
                {rescue?.address && (
                  <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-slate-100">
                    <div className="space-y-3">
                      {rescue.address && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-rose-500 flex-shrink-0 mt-1" />
                          <div>
                            <p className="text-sm font-medium text-slate-600">Address</p>
                            <p className="text-slate-900 font-medium">{rescue.address}</p>
                          </div>
                        </div>
                      )}
                      {(rescue.city || rescue.state || rescue.zip) && (
                        <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                          <MapPin className="w-5 h-5 text-rose-500 flex-shrink-0 mt-1" />
                          <div>
                            <p className="text-sm font-medium text-slate-600">Location</p>
                            <p className="text-slate-900 font-medium">
                              {[rescue.city, rescue.state, rescue.zip].filter(Boolean).join(", ")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Map */}
                {(rescue?.latitude && rescue?.longitude) && (
                  <RescueMap 
                    latitude={rescue.latitude} 
                    longitude={rescue.longitude}
                    rescueName={rescueData.name}
                    address={rescue.address}
                  />
                )}
              </div>
            )}

            {/* Upcoming Events */}
            {events.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-6 h-6 text-rose-500" />
                  <h2 className="text-2xl font-bold text-slate-900">Upcoming Events</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}

            {/* Donation Goals Section */}
            {donationGoals.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Support Our Mission</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {donationGoals.map(goal => (
                    <DonationProgressCard key={goal.id} goal={goal} />
                  ))}
                </div>
              </div>
            )}

            {/* General Donation Section */}
            {!donationGoals.length || showDonationForm ? (
              <div className="mb-12">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Make a Donation</h2>
                  <DonationForm 
                    rescue={rescueData} 
                    onDonationComplete={() => setShowDonationForm(false)}
                  />
                </div>
              </div>
            ) : (
              <div className="mb-12">
                <button
                  onClick={() => setShowDonationForm(true)}
                  className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold py-4 rounded-2xl transition-all text-lg"
                >
                  💝 Make a Donation
                </button>
              </div>
            )}

            {/* Volunteer Section */}
            {rescue?.accepts_volunteers && (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-8 mb-12 border border-blue-200">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-6 h-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-slate-900">Join Our Volunteer Team</h2>
                    </div>
                    {rescue.volunteer_info && (
                      <p className="text-slate-700 leading-relaxed mb-6 whitespace-pre-wrap">
                        {rescue.volunteer_info}
                      </p>
                    )}
                  </div>
                  <Button 
                    onClick={() => setShowVolunteerModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                  >
                    Express Interest
                  </Button>
                </div>
              </div>
            )}

            {/* Adoptable Pets */}
            <div className="mb-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">Available Pets</h2>
                <p className="text-slate-600 mt-2">
                  {pets.length === 0 
                    ? "No pets currently available for adoption." 
                    : `${pets.length} ${pets.length === 1 ? 'pet is' : 'pets are'} waiting for their forever home`}
                </p>
              </div>

              {pets.length > 0 && (
                <div className="space-y-4 mb-8">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-slate-300" />
                    <Input
                      placeholder="Search pets by name, breed, or description..."
                      value={petSearchQuery}
                      onChange={(e) => setPetSearchQuery(e.target.value)}
                      className="pl-10 py-2 rounded-lg border-slate-200"
                    />
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={petFilters.species.includes("dog") ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPetFilters(prev => ({
                        ...prev,
                        species: prev.species.includes("dog")
                          ? prev.species.filter(s => s !== "dog")
                          : [...prev.species, "dog"]
                      }))}
                    >
                      🐕 Dogs
                    </Button>
                    <Button
                      variant={petFilters.species.includes("cat") ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPetFilters(prev => ({
                        ...prev,
                        species: prev.species.includes("cat")
                          ? prev.species.filter(s => s !== "cat")
                          : [...prev.species, "cat"]
                      }))}
                    >
                      🐈 Cats
                    </Button>
                    <Button
                      variant={petFilters.specialNeeds ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPetFilters(prev => ({
                        ...prev,
                        specialNeeds: !prev.specialNeeds
                      }))}
                    >
                      Special Needs
                    </Button>
                    <Button
                      variant={petFilters.availableForFoster ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPetFilters(prev => ({
                        ...prev,
                        availableForFoster: !prev.availableForFoster
                      }))}
                    >
                      Foster Available
                    </Button>
                    {(petSearchQuery || petFilters.species.length > 0 || petFilters.specialNeeds || petFilters.availableForFoster) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPetSearchQuery("");
                          setPetFilters({ species: [], specialNeeds: false, availableForFoster: false });
                        }}
                        className="text-red-600"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {pets.length > 0 ? (
                <>
                  {filteredPets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredPets.map(pet => (
                        <AdoptablePetCard key={pet.id} pet={pet} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-lg">
                      <p className="text-slate-600">No pets match your filters.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🐾</div>
                  <p className="text-slate-600">No pets currently available</p>
                </div>
              )}
            </div>

            {/* Sponsors Section */}
            {rescue?.sponsors?.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Sponsors</h2>
                <div className="flex flex-wrap gap-6 items-center">
                  {rescue.sponsors.map((sponsor, idx) => (
                    <a
                      key={idx}
                      href={sponsor.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 group p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition min-w-[100px]"
                    >
                      {sponsor.photo_url ? (
                        <img src={sponsor.photo_url} alt={sponsor.name} className="h-14 max-w-[120px] object-contain" />
                      ) : (
                        <div className="h-14 w-24 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">No logo</div>
                      )}
                      {sponsor.name && (
                        <span className="text-sm font-semibold text-slate-700 group-hover:text-rose-600 transition text-center">{sponsor.name}</span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Sponsors Section */}
            {rescue?.sponsors?.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Sponsors</h2>
                <div className="flex flex-wrap gap-6 items-center">
                  {rescue.sponsors.map((sponsor, idx) => (
                    <a
                      key={idx}
                      href={sponsor.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 group p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition min-w-[100px]"
                    >
                      {sponsor.photo_url ? (
                        <img src={sponsor.photo_url} alt={sponsor.name} className="h-14 max-w-[120px] object-contain" />
                      ) : (
                        <div className="h-14 w-24 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">No logo</div>
                      )}
                      {sponsor.name && (
                        <span className="text-sm font-semibold text-slate-700 group-hover:text-rose-600 transition text-center">{sponsor.name}</span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-slate-900">Community Reviews</h2>
                    {avgRating && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 rounded-lg">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.round(avgRating)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-slate-700 ml-1">{avgRating}</span>
                        <span className="text-xs text-slate-600">({reviews.length})</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {showReviewForm ? "Cancel" : "Leave a Review"}
                </Button>
              </div>

              {showReviewForm && (
                <div className="mb-6">
                  <RescueReviewForm
                    rescue={rescueData}
                    onReviewAdded={() => {
                      setShowReviewForm(false);
                      refetchReviews();
                    }}
                    onCancel={() => setShowReviewForm(false)}
                  />
                </div>
              )}

              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <RescueReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-lg p-8 text-center">
                  <p className="text-slate-600">No reviews yet. Be the first to share your experience!</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-slate-800">No rescue information found</h2>
            <Link to={createPageUrl("Adopt")}>
              <Button className="mt-4">Browse Other Rescues</Button>
            </Link>
          </div>
        )}

        {/* Volunteer Modal */}
        {showVolunteerModal && (
          <VolunteerModal
            rescueEmail={rescueEmail}
            rescueName={rescueData?.name}
            onClose={() => setShowVolunteerModal(false)}
          />
        )}
      </div>
    </div>
  );
}