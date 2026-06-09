import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, AlertCircle, CheckCircle2, Home } from "lucide-react";

export default function FosterToAdoptWidget({ rescueEmail }) {
  const { data: fosterPets = [], isLoading } = useQuery({
    queryKey: ["foster-to-adopt", rescueEmail],
    queryFn: () =>
      base44.entities.FosterToAdoptPet.filter(
        { rescue_email: rescueEmail, status: "fostering" },
        "-foster_start_date",
        10
      ),
    enabled: !!rescueEmail,
  });

  const { data: readyForAdoption = [] } = useQuery({
    queryKey: ["foster-ready", rescueEmail],
    queryFn: () =>
      base44.entities.FosterToAdoptPet.filter(
        { rescue_email: rescueEmail, status: "ready_for_adoption" },
        undefined,
        10
      ),
    enabled: !!rescueEmail,
  });

  const { data: adopted = [] } = useQuery({
    queryKey: ["foster-adopted", rescueEmail],
    queryFn: () =>
      base44.entities.FosterToAdoptPet.filter(
        { rescue_email: rescueEmail, status: "adopted" },
        "-created_date",
        5
      ),
    enabled: !!rescueEmail,
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "fostering":
        return "bg-blue-100 text-blue-800";
      case "ready_for_adoption":
        return "bg-amber-100 text-amber-800";
      case "adopted":
        return "bg-green-100 text-green-800";
      case "returned":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getDaysInFoster = (startDate) => {
    const start = new Date(startDate);
    const today = new Date();
    return Math.floor((today - start) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-600" />
            Foster-to-Adopt Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">{fosterPets.length}</p>
              <p className="text-xs text-slate-600">Fostering</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-amber-600">{readyForAdoption.length}</p>
              <p className="text-xs text-slate-600">Ready</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{adopted.length}</p>
              <p className="text-xs text-slate-600">Adopted</p>
            </div>
          </div>

          {/* Currently Fostering */}
          {fosterPets.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-slate-800 mb-2">
                <Home className="w-4 h-4 inline mr-1" />
                Currently Fostering
              </h4>
              <div className="space-y-2">
                {fosterPets.map((pet) => (
                  <div
                    key={pet.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm text-slate-800">
                          {pet.pet_name}
                        </p>
                        <p className="text-xs text-slate-600">
                          Foster: {pet.foster_email}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {getDaysInFoster(pet.foster_start_date)} days in foster
                        </p>
                      </div>
                      {pet.is_emergency_foster && (
                        <Badge className="bg-red-100 text-red-800 text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Emergency
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ready for Adoption */}
          {readyForAdoption.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-slate-800 mb-2">
                <CheckCircle2 className="w-4 h-4 inline mr-1 text-amber-600" />
                Ready for Adoption
              </h4>
              <div className="space-y-2">
                {readyForAdoption.map((pet) => (
                  <div
                    key={pet.id}
                    className="p-3 bg-amber-50 rounded-lg border border-amber-200"
                  >
                    <p className="font-semibold text-sm text-slate-800">
                      {pet.pet_name}
                    </p>
                    <p className="text-xs text-slate-600">
                      Ready since {new Date(pet.foster_end_date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {fosterPets.length === 0 && readyForAdoption.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Heart className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No pets currently in foster-to-adopt program</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}