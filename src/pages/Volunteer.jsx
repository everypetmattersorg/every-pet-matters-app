import { useState, useEffect } from "react";
import { HERO_COLORS } from "@/lib/heroConfig";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, Loader2, MapPin, Calendar, Briefcase, Heart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VolunteerOpportunityCard from "@/components/volunteer/VolunteerOpportunityCard.jsx";
import VolunteerCalendar from "@/components/volunteer/VolunteerCalendar";
import VolunteerReport from "@/components/volunteer/VolunteerReport";
import VolunteerMatchFinder from "@/components/volunteer/VolunteerMatchFinder";

export default function VolunteerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    timeCommitment: "all"
  });
  const [user, setUser] = useState(null);

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

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ["volunteer-opportunities"],
    queryFn: () => base44.entities.VolunteerOpportunity.filter({ status: "open" }, "-created_date", 100)
  });

  const filteredOpportunities = opportunities.filter((opp) => {
    const searchMatch =
    opp.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.rescue_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const categoryMatch = filters.category === "all" || opp.category === filters.category;
    const timeMatch = filters.timeCommitment === "all" || opp.time_commitment === filters.timeCommitment;

    return searchMatch && categoryMatch && timeMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50">
      {/* Hero */}
      <div className="px-4 py-6" style={{ background: HERO_COLORS.background }}>
        <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden flex flex-col md:flex-row" style={{ minHeight: '300px' }}>
          {/* Left: photo */}
          <div className="md:w-1/2 w-full min-h-48 md:min-h-0 h-full relative">
            <img src="https://media.base44.com/images/public/69a0f10efc1058c9e80d1210/3a9ecd385_21684543_10104231194808784_1214169954_o.jpg"

            alt="Volunteer with pets"
            className="w-full h-full object-cover"
            style={{ display: 'block', minHeight: '340px' }} />
            <div className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
              📸 photo taken by jacqueline allison
            </div>
          </div>
          {/* Right: panel */}
          <div className="md:w-1/2 w-full flex flex-col justify-center px-10 py-10" style={{ background: HERO_COLORS.panelBg }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-5 self-start" style={{ background: HERO_COLORS.badgeBg, color: HERO_COLORS.badgeText }}>
              <Heart className="w-4 h-4" /> make a difference
            </div>
            <h1 className="text-5xl font-black mb-4 leading-tight" style={{ color: HERO_COLORS.panelText }}>volunteer opportunities</h1>
            <p className="text-lg max-w-sm leading-relaxed" style={{ color: HERO_COLORS.panelSubtext }}>join rescue organizations and help animals in need. browse open positions and apply today.</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Tabs */}
        <Tabs defaultValue="browse" className="mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-4" style={{ backgroundColor: '#b1511d' }}>
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            {user && user.role === 'rescue' && <TabsTrigger value="match">Find Volunteers</TabsTrigger>}
            {user && <TabsTrigger value="report">My Impact</TabsTrigger>}
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="space-y-4">
            {/* Search & Filters */}
            <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-300" />
            <Input
                  placeholder="Search opportunities by title, rescue, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 py-6 rounded-xl border-slate-200 bg-white" />
                
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <p className="font-semibold text-slate-800 text-sm">Filters</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="text-sm text-slate-700 mb-2 block">Category</label>
                <select
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      style={{ textTransform: 'lowercase' }}>
                      
                  <option value="all">All Categories</option>
                  <option value="animal_care">Animal Care</option>
                  <option value="event_planning">Event Planning</option>
                  <option value="fundraising">Fundraising</option>
                  <option value="social_media">Social Media</option>
                  <option value="administrative">Administrative</option>
                  <option value="transportation">Transportation</option>
                  <option value="foster_care">Foster Care</option>
                  <option value="training">Training</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Time Commitment */}
              <div>
                <label className="text-sm text-slate-700 mb-2 block">Time Commitment</label>
                <select
                      value={filters.timeCommitment}
                      onChange={(e) => setFilters({ ...filters, timeCommitment: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      style={{ textTransform: 'lowercase' }}>
                      
                  <option value="all">All Types</option>
                  <option value="flexible">Flexible</option>
                  <option value="part_time">Part Time</option>
                  <option value="full_time">Full Time</option>
                  <option value="one_time_event">One Time Event</option>
                </select>
              </div>
            </div>

            {/* Clear button */}
            {(filters.category !== "all" || filters.timeCommitment !== "all") &&
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ category: "all", timeCommitment: "all" })}
                  className="w-full sm:w-auto text-red-600 hover:text-red-700">
                  
                Clear Filters
              </Button>
                }
          </div>
        </div>

        {/* Results */}
        <div className="mb-8">
          <p className="text-slate-600 text-sm">
            {filteredOpportunities.length} {filteredOpportunities.length !== 1 ? "opportunities" : "opportunity"} found
          </p>
        </div>

            {isLoading ?
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              </div> :
            filteredOpportunities.length === 0 ?
            <div className="text-center py-20">
                <div className="text-6xl mb-4">🤝</div>
                <p className="text-slate-500 text-lg mb-4">No volunteer opportunities found.</p>
                <p className="text-slate-400 text-sm mb-6">Try adjusting your search or filters.</p>
              </div> :

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredOpportunities.map((opportunity) =>
              <VolunteerOpportunityCard key={opportunity.id} opportunity={opportunity} />
              )}
              </div>
            }
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            {isLoading ?
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              </div> :

            <VolunteerCalendar opportunities={opportunities} />
            }
          </TabsContent>

          {/* Find Volunteers Tab */}
          {user && user.role === 'rescue' &&
          <TabsContent value="match">
              <VolunteerMatchFinder rescueEmail={user.email} />
            </TabsContent>
          }

          {/* My Impact Tab */}
          {user &&
          <TabsContent value="report">
              <VolunteerReport userEmail={user.email} />
            </TabsContent>
          }
        </Tabs>
      </div>
    </div>);

}