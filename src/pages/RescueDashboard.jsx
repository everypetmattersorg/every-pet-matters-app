import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Plus, Heart, FileText, Home } from "lucide-react";
import FosterApplicationsTab from "@/components/dashboard/FosterApplicationsTab";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AdoptionChart from "@/components/dashboard/AdoptionChart";
import EventAttendanceChart from "@/components/dashboard/EventAttendanceChart";
import EngagementOverview from "@/components/dashboard/EngagementOverview";
import VolunteerMetrics from "@/components/dashboard/VolunteerMetrics";
import RescueMatchesTab from "@/components/dashboard/RescueMatchesTab";
import EnhancedApplicationsTab from "@/components/dashboard/EnhancedApplicationsTab";
import PerformanceMetrics from "@/components/dashboard/PerformanceMetrics";
import UrgentPetsSection from "@/components/dashboard/UrgentPetsSection";
import DonationGoalsTab from "@/components/dashboard/DonationGoalsTab";
import DonationReportTab from "@/components/donations/DonationReportTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RescueDashboard() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoadingUser(false));
  }, []);

  const rescueEmail = user?.email;

  // Fetch all relevant data
  const { data: pets = [] } = useQuery({
    queryKey: ["dashboardPets", rescueEmail],
    queryFn: () => base44.entities.AdoptablePet.filter({ rescue_email: rescueEmail }, "-created_date", 100),
    enabled: !!rescueEmail,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["dashboardEvents", rescueEmail],
    queryFn: () => base44.entities.RescueEvent.filter({ rescue_email: rescueEmail }, "-event_date", 50),
    enabled: !!rescueEmail,
  });

  const { data: rsvps = [] } = useQuery({
    queryKey: ["dashboardRsvps"],
    queryFn: () => base44.entities.EventRSVP.list(),
    enabled: !!rescueEmail,
  });

  const { data: volunteers = [] } = useQuery({
    queryKey: ["dashboardVolunteers", rescueEmail],
    queryFn: () => base44.entities.VolunteerInterest.filter({ rescue_email: rescueEmail }, "-created_date", 100),
    enabled: !!rescueEmail,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["dashboardReviews", rescueEmail],
    queryFn: () => base44.entities.RescueReview.filter({ rescue_email: rescueEmail }, "-created_date", 100),
    enabled: !!rescueEmail,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["dashboardApplications", rescueEmail],
    queryFn: async () => {
      const apps = await base44.entities.AdoptionApplication.filter(
        { rescue_email: rescueEmail },
        "-created_date",
        200
      );
      return apps;
    },
    enabled: !!rescueEmail,
  });

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "rescue" && user.role !== "shelter")) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-4">Only shelters and rescues can access this dashboard.</p>
          <Link to={createPageUrl("Home")}>
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link to={createPageUrl("Home")}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
            <p className="text-slate-600 mt-2">Track your rescue's performance and engagement metrics.</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs Navigation */}
        <Tabs defaultValue="analytics" className="mb-8">
          <TabsList className="grid w-full max-w-3xl grid-cols-6">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Applications</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Campaigns</span>
            </TabsTrigger>
            <TabsTrigger value="donations" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Potential</span>
            </TabsTrigger>
            <TabsTrigger value="foster" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Fosters</span>
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-8">
            {/* Performance Metrics */}
            <PerformanceMetrics
              pets={pets}
              applications={applications}
              events={events}
              reviews={reviews}
            />

            {/* Urgent Pets Section */}
            <UrgentPetsSection pets={pets} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdoptionChart pets={pets} />
              <EventAttendanceChart events={events} rsvps={rsvps} />
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VolunteerMetrics volunteers={volunteers} />
              <EngagementOverview pets={pets} events={events} volunteers={volunteers} reviews={reviews} />
            </div>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <EnhancedApplicationsTab rescueEmail={rescueEmail} />
          </TabsContent>

          {/* Fundraising Campaigns Tab */}
          <TabsContent value="campaigns">
            <DonationGoalsTab rescueEmail={rescueEmail} />
          </TabsContent>

          {/* Donation Reports Tab */}
          <TabsContent value="donations">
            <DonationReportTab rescueEmail={rescueEmail} />
          </TabsContent>

          {/* Adopter Matches Tab */}
          <TabsContent value="matches">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <RescueMatchesTab rescueEmail={rescueEmail} />
            </div>
          </TabsContent>

          {/* Foster Applications Tab */}
          <TabsContent value="foster">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <FosterApplicationsTab rescueEmail={rescueEmail} currentUser={user} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}