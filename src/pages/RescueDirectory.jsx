import { useState, useEffect } from "react";
import { HERO_COLORS } from "@/lib/heroConfig";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Search, Loader2, Heart, MapPin, Users, Star, Calendar, PawPrint, Grid3x3, Map } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import RescueDirectoryMap from "@/components/rescue/RescueDirectoryMap";

export default function RescueDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [orgTypeFilter, setOrgTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [filters, setFilters] = useState({
    acceptsVolunteers: false,
    fostersNeeded: false,
    hasEvents: false,
    location: ""
  });

  const { data: rescues = [], isLoading } = useQuery({
    queryKey: ["rescues"],
    queryFn: () => base44.entities.Rescue.list("-updated_date", 100)
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["rescue-reviews"],
    queryFn: () => base44.entities.RescueReview.list("-created_date", 500)
  });

  const { data: events = [] } = useQuery({
    queryKey: ["rescue-events"],
    queryFn: () => base44.entities.RescueEvent.list("-event_date", 500)
  });

  // Calculate events per rescue
  const eventsMap = {};
  events.forEach((event) => {
    if (!eventsMap[event.rescue_email]) {
      eventsMap[event.rescue_email] = [];
    }
    eventsMap[event.rescue_email].push(event);
  });

  const getEventCount = (rescueEmail) => {
    return eventsMap[rescueEmail]?.length || 0;
  };

  // Calculate average ratings per rescue
  const ratingsMap = {};
  reviews.forEach((review) => {
    if (!ratingsMap[review.rescue_email]) {
      ratingsMap[review.rescue_email] = [];
    }
    ratingsMap[review.rescue_email].push(review.rating);
  });

  const getAverageRating = (rescueEmail) => {
    const ratings = ratingsMap[rescueEmail];
    if (!ratings || ratings.length === 0) return null;
    return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
  };

  const getRatingCount = (rescueEmail) => {
    return ratingsMap[rescueEmail]?.length || 0;
  };

  const filteredRescues = rescues.filter((rescue) => {
    // Only show publicly listed rescues
    if (!rescue.public_listing) return false;

    if (orgTypeFilter !== "all" && rescue.org_type !== orgTypeFilter) return false;
    // Search match
    const searchMatch =
    rescue.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rescue.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rescue.about?.toLowerCase().includes(searchQuery.toLowerCase());

    // Volunteers filter
    const volunteersMatch =
    !filters.acceptsVolunteers || rescue.accepts_volunteers;

    // Fosters filter
    const fostersMatch = !filters.fostersNeeded || rescue.fosters_needed;

    // Events filter
    const eventsMatch = !filters.hasEvents || getEventCount(rescue.email) > 0;

    // Location filter
    const locationMatch =
    !filters.location ||
    rescue.address?.toLowerCase().includes(filters.location.toLowerCase());

    return searchMatch && volunteersMatch && fostersMatch && eventsMatch && locationMatch;
  });

  return (
    <div className="min-h-screen" style={{ background: '#FAF5F0' }}>
      {/* Hero */}
      <div className="px-4 py-6" style={{ background: HERO_COLORS.background }}>
        <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden flex flex-col md:flex-row" style={{ minHeight: '340px' }}>
          {/* Left: photo */}
          <div className="md:w-1/2 w-full min-h-48 md:min-h-0">
            <img src="https://media.base44.com/images/public/69a0f10efc1058c9e80d1210/ee8f5f691_IMG_2258.JPG"

            alt="Rescues and Shelters"
            className="w-full h-full object-cover"
            style={{ display: 'block' }} />
            
          </div>
          {/* Right: panel */}
          <div className="md:w-1/2 w-full flex flex-col justify-center px-10 py-10" style={{ background: HERO_COLORS.panelBg }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-5 self-start" style={{ background: HERO_COLORS.badgeBg, color: HERO_COLORS.badgeText }}>
              <PawPrint className="w-4 h-4" /> find a rescue near you
            </div>
            <h1 className="text-5xl font-black mb-4 leading-tight" style={{ color: HERO_COLORS.panelText }}>rescues & shelters</h1>
            <p className="text-lg max-w-sm leading-relaxed" style={{ color: HERO_COLORS.panelSubtext }}>discover rescue organizations and shelters dedicated to animal welfare in your area.</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Org Type Tabs + View Toggle */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-2">
          {[{ value: "all", label: "All" }, { value: "rescue", label: "🐾 Rescues" }, { value: "shelter", label: "🏠 Shelters" }].map((tab) =>
            <button
              key={tab.value}
              onClick={() => setOrgTypeFilter(tab.value)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition ${orgTypeFilter === tab.value ? "text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              style={orgTypeFilter === tab.value ? { backgroundColor: '#b1511d' } : {}}>
              
              {tab.label}
            </button>
            )}
        </div>
        <div className="flex gap-1 bg-white rounded-lg border border-slate-200 p-1">
          <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors ${viewMode === "grid" ? "text-white" : "text-slate-500 hover:bg-slate-50"}`}
              style={viewMode === "grid" ? { backgroundColor: '#b1511d' } : {}}
              title="Grid view">
              
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
              onClick={() => setViewMode("map")}
              className={`p-2 rounded transition-colors ${viewMode === "map" ? "text-white" : "text-slate-500 hover:bg-slate-50"}`}
              style={viewMode === "map" ? { backgroundColor: '#b1511d' } : {}}
              title="Map view">
              
            <Map className="w-4 h-4" />
          </button>
        </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-300" />
            <Input
              placeholder="Search rescues by name, location, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 rounded-xl border-slate-200 bg-white" />
            
          </div>

          {/* Filter Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <p className="font-semibold text-slate-800 text-sm">Filters</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Volunteers */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="volunteers"
                  checked={filters.acceptsVolunteers}
                  onCheckedChange={(checked) =>
                  setFilters({ ...filters, acceptsVolunteers: checked })
                  } />
                
                <label
                  htmlFor="volunteers"
                  className="text-sm text-slate-700 cursor-pointer">
                  
                  Accepts Volunteers
                </label>
              </div>

              {/* Fosters */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="fosters"
                  checked={filters.fostersNeeded}
                  onCheckedChange={(checked) =>
                  setFilters({ ...filters, fostersNeeded: checked })
                  } />
                
                <label
                  htmlFor="fosters"
                  className="text-sm text-slate-700 cursor-pointer">
                  
                  Needs Fosters
                </label>
              </div>

              {/* Events */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="events"
                  checked={filters.hasEvents}
                  onCheckedChange={(checked) =>
                  setFilters({ ...filters, hasEvents: checked })
                  } />
                
                <label
                  htmlFor="events"
                  className="text-sm text-slate-700 cursor-pointer">
                  
                  Has Upcoming Events
                </label>
              </div>

              {/* Location */}
              <div>
                <Input
                  placeholder="City or State"
                  value={filters.location}
                  onChange={(e) =>
                  setFilters({ ...filters, location: e.target.value })
                  }
                  className="text-sm" />
                
              </div>
            </div>

            {/* Clear button */}
            {(filters.acceptsVolunteers || filters.fostersNeeded || filters.hasEvents || filters.location) &&
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
              setFilters({
                acceptsVolunteers: false,
                fostersNeeded: false,
                hasEvents: false,
                location: ""
              })
              }
              className="w-full sm:w-auto"
              className="text-red-600 hover:text-red-700">
              
                Clear Filters
              </Button>
            }
          </div>
        </div>

        {/* Results */}
        <div className="mb-8">
          <p className="text-slate-600 text-sm">
            {filteredRescues.length} organization{filteredRescues.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {isLoading ?
        <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div> :
        viewMode === "map" ?
        <RescueDirectoryMap rescues={filteredRescues} /> :
        filteredRescues.length === 0 ?
        <div className="text-center py-20">
            <div className="text-6xl mb-4">🏢</div>
            <p className="text-slate-500 text-lg">No rescue organizations found.</p>
          </div> :

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRescues.map((rescue) => {
            const avgRating = getAverageRating(rescue.email);
            const ratingCount = getRatingCount(rescue.email);

            return (
              <Link key={rescue.id} to={`${createPageUrl("RescueProfile")}?email=${rescue.email}`}>
                  <div className="h-full bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    {/* Logo/Image */}
                    {rescue.logo_url &&
                  <div className="h-32 bg-gradient-to-br from-blue-100 to-cyan-100 overflow-hidden">
                        <img
                      src={rescue.logo_url}
                      alt={rescue.name}
                      className="w-full h-full object-cover" />
                    
                      </div>
                  }

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-slate-900">{rescue.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rescue.org_type === 'shelter' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {rescue.org_type === 'shelter' ? '🏠 Shelter' : '🐾 Rescue'}
                          </span>
                        </div>

                        {/* Rating */}
                        {avgRating &&
                      <div className="flex items-center gap-2 mb-2">
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) =>
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                            i < Math.round(avgRating) ?
                            "fill-amber-400 text-amber-400" :
                            "text-slate-300"}`
                            } />

                          )}
                            </div>
                            <span className="text-xs font-semibold text-slate-700">
                              {avgRating} ({ratingCount})
                            </span>
                          </div>
                      }
                      </div>

                      {/* Location */}
                      {rescue.address &&
                    <div className="flex items-start gap-2 text-xs text-slate-600">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{rescue.address}</span>
                        </div>
                    }

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        {rescue.accepts_volunteers &&
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            <Users className="w-3 h-3" /> Volunteers
                          </span>
                      }
                        {rescue.fosters_needed &&
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            <Heart className="w-3 h-3" /> Fosters Needed
                          </span>
                      }
                        {getEventCount(rescue.email) > 0 &&
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            <Calendar className="w-3 h-3" /> {getEventCount(rescue.email)} Events
                          </span>
                      }
                      </div>

                      {/* Description */}
                      {rescue.about &&
                    <p className="text-sm text-slate-600 line-clamp-2">
                          {rescue.about}
                        </p>
                    }

                      <Button className="w-full text-white" style={{ backgroundColor: '#b1511d' }}>
                        View {rescue.org_type === 'shelter' ? 'Shelter' : 'Rescue'}
                      </Button>
                    </div>
                  </div>
                </Link>);

          })}
          </div>
        }
      </div>
    </div>);

}