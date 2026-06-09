import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, MapPin, Users } from "lucide-react";
import { toast } from "sonner";

const OPPORTUNITY_CATEGORIES = [
  "animal_care", "event_planning", "fundraising", "social_media",
  "administrative", "transportation", "foster_care", "training", "other"
];

export default function VolunteerMatchFinder({ rescueEmail }) {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sendingEmail, setSendingEmail] = useState(null);

  // Fetch all volunteer applications/interests
  const { data: volunteerInterests = [], isLoading } = useQuery({
    queryKey: ["volunteer-interests"],
    queryFn: () => base44.entities.VolunteerInterest.list("-created_date", 200)
  });

  // Filter volunteers by selected categories
  const matchedVolunteers = useMemo(() => {
    if (selectedCategories.length === 0) return [];

    return volunteerInterests.filter((vi) => {
      const interests = vi.interested_categories || [];
      return selectedCategories.some(cat => interests.includes(cat));
    });
  }, [volunteerInterests, selectedCategories]);

  const toggleCategory = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleContactVolunteer = async (volunteer) => {
    setSendingEmail(volunteer.id);
    try {
      await base44.functions.invoke('sendVolunteerContactEmail', {
        volunteer_email: volunteer.email,
        volunteer_name: volunteer.name,
        rescue_email: rescueEmail
      });
      toast.success(`Email sent to ${volunteer.name}!`);
    } catch (err) {
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>Find volunteers by interests:</strong> Select the volunteer opportunity categories you're looking to fill, and we'll show you volunteers interested in those areas.
        </p>
      </div>

      {/* Category Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">What volunteer opportunities are you looking to fill?</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {OPPORTUNITY_CATEGORIES.map(cat => (
            <div key={cat} className="flex items-center gap-2">
              <Checkbox
                id={cat}
                checked={selectedCategories.includes(cat)}
                onCheckedChange={() => toggleCategory(cat)}
              />
              <Label htmlFor={cat} className="capitalize cursor-pointer">
                {cat.replace(/_/g, ' ')}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : selectedCategories.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Select categories to find matching volunteers</p>
        </div>
      ) : matchedVolunteers.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No volunteers found for these categories</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-600 font-medium">
            {matchedVolunteers.length} volunteer{matchedVolunteers.length !== 1 ? 's' : ''} interested in your opportunities
          </p>
          <div className="grid gap-3">
            {matchedVolunteers.map((volunteer) => (
              <div key={volunteer.id} className="bg-white rounded-lg border border-slate-200 p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{volunteer.name}</p>
                  <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                    <Mail className="w-4 h-4" />
                    {volunteer.email}
                  </p>
                  {volunteer.location && (
                    <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4" />
                      {volunteer.location}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(volunteer.interested_categories || [])
                      .filter(cat => selectedCategories.includes(cat))
                      .map(cat => (
                        <span key={cat} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full capitalize">
                          {cat.replace(/_/g, ' ')}
                        </span>
                      ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleContactVolunteer(volunteer)}
                  disabled={sendingEmail === volunteer.id}
                >
                  {sendingEmail === volunteer.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-1" />
                      Contact
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}