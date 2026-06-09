import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Briefcase, Users, ChevronRight } from "lucide-react";
import VolunteerApplicationModal from "./VolunteerApplicationModal.jsx";

export default function VolunteerOpportunityCard({ opportunity }) {
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  const categoryColors = {
    animal_care: "bg-blue-100 text-blue-800",
    event_planning: "bg-purple-100 text-purple-800",
    fundraising: "bg-green-100 text-green-800",
    social_media: "bg-pink-100 text-pink-800",
    administrative: "bg-slate-100 text-slate-800",
    transportation: "bg-orange-100 text-orange-800",
    foster_care: "bg-rose-100 text-rose-800",
    training: "bg-cyan-100 text-cyan-800",
    other: "bg-gray-100 text-gray-800",
  };

  const timeCommitmentLabels = {
    flexible: "Flexible",
    part_time: "Part Time",
    full_time: "Full Time",
    one_time_event: "One-Time Event",
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <h3 className="font-bold text-lg text-slate-900">{opportunity.title}</h3>
            <p className="text-sm text-slate-600">{opportunity.rescue_name}</p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={categoryColors[opportunity.category]}>
              {opportunity.category?.replace(/_/g, " ").charAt(0).toUpperCase() + opportunity.category?.slice(1).replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline">{timeCommitmentLabels[opportunity.time_commitment]}</Badge>
            {opportunity.spots_available && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="w-3 h-3" /> {opportunity.spots_available} spots
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-slate-600 line-clamp-2">{opportunity.description}</p>

          {/* Details */}
          <div className="space-y-2 text-xs text-slate-600">
            {opportunity.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>{opportunity.location}</span>
              </div>
            )}
            {opportunity.start_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>Starts {new Date(opportunity.start_date).toLocaleDateString()}</span>
              </div>
            )}
            {opportunity.skills_required && opportunity.skills_required.length > 0 && (
              <div className="flex items-start gap-2">
                <Briefcase className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{opportunity.skills_required.join(", ")}</span>
              </div>
            )}
          </div>

          {/* Button */}
          <Button
            onClick={() => setShowApplicationModal(true)}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white mt-4"
          >
            Apply Now
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {showApplicationModal && (
        <VolunteerApplicationModal
          opportunity={opportunity}
          onClose={() => setShowApplicationModal(false)}
        />
      )}
    </>
  );
}