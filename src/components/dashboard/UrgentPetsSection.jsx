import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Heart, Stethoscope } from "lucide-react";

const URGENCY_TYPES = [
  { id: "medical", label: "Medical Needs", icon: Stethoscope, color: "red" },
  { id: "long_stay", label: "Long-term Stay", icon: Clock, color: "orange" },
  { id: "special_needs", label: "Special Needs", icon: Heart, color: "purple" },
];

export default function UrgentPetsSection({ pets = [] }) {
  const [selectedFilter, setSelectedFilter] = useState(null);

  const daysInSystem = (createdDate) => {
    const created = new Date(createdDate);
    const today = new Date();
    return Math.floor((today - created) / (1000 * 60 * 60 * 24));
  };

  const urgentPets = pets.filter((pet) => {
    const isUrgent =
      pet.is_urgent ||
      pet.special_needs ||
      (pet.created_date && daysInSystem(pet.created_date) > 60);

    if (!selectedFilter) return isUrgent;
    if (selectedFilter === "medical") return pet.special_needs_description;
    if (selectedFilter === "special_needs") return pet.special_needs;
    if (selectedFilter === "long_stay") return daysInSystem(pet.created_date) > 60;
    return false;
  });

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <CardTitle>Pets Needing Attention</CardTitle>
            <Badge className="bg-red-100 text-red-800">{urgentPets.length}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedFilter(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedFilter === null
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All ({urgentPets.length})
          </button>
          {URGENCY_TYPES.map((type) => {
            const count = pets.filter((p) => {
              if (type.id === "medical") return p.special_needs_description;
              if (type.id === "special_needs") return p.special_needs;
              if (type.id === "long_stay") return daysInSystem(p.created_date) > 60;
              return false;
            }).length;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedFilter(type.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                  selectedFilter === type.id
                    ? `bg-${type.color}-600 text-white`
                    : `bg-${type.color}-100 text-${type.color}-700 hover:bg-${type.color}-200`
                }`}
              >
                <type.icon className="w-4 h-4" />
                {type.label} ({count})
              </button>
            );
          })}
        </div>

        {urgentPets.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>No pets requiring immediate attention</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {urgentPets.map((pet) => (
              <div
                key={pet.id}
                className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-slate-800">{pet.name}</h4>
                    <p className="text-sm text-slate-600 capitalize">
                      {pet.breed || pet.pet_type}
                    </p>
                  </div>
                  {pet.is_urgent && (
                    <Badge className="bg-red-100 text-red-800 shrink-0">Urgent</Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  {pet.special_needs_description && (
                    <div className="flex items-start gap-2 p-2 bg-red-50 rounded">
                      <Stethoscope className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span className="text-red-700">{pet.special_needs_description}</span>
                    </div>
                  )}
                  {daysInSystem(pet.created_date) > 60 && (
                    <div className="flex items-start gap-2 p-2 bg-orange-50 rounded">
                      <Clock className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                      <span className="text-orange-700">
                        In system for {daysInSystem(pet.created_date)} days
                      </span>
                    </div>
                  )}
                  {pet.special_needs && (
                    <div className="flex items-start gap-2 p-2 bg-purple-50 rounded">
                      <Heart className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <span className="text-purple-700">Special needs pet</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}