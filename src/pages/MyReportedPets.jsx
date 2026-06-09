import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, Edit2, Trash2, PlusCircle, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const STATUS_COLORS = {
  lost: "bg-red-100 text-red-800",
  found: "bg-green-100 text-green-800",
  reunited: "bg-blue-100 text-blue-800"
};

export default function MyReportedPets() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {}).finally(() => setLoadingUser(false));
  }, []);

  const { data: pets = [], isLoading } = useQuery({
    queryKey: ["my-reported-pets", user?.email],
    queryFn: () => {
      if (!user?.email) return [];
      return base44.entities.Pet.filter({ contact_email: user.email }, "-created_date", 100);
    },
    enabled: !!user?.email,
  });

  const handleDelete = async (petId) => {
    if (confirm("Are you sure you want to delete this pet listing?")) {
      await base44.entities.Pet.delete(petId);
      queryClient.invalidateQueries({ queryKey: ["my-reported-pets"] });
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">My Reported Pets</h1>
          <p className="text-slate-300">Manage all the lost and found pets you've reported.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-800">{pets.length} Pets Reported</h2>
          <div className="flex gap-3">
            <Link to={createPageUrl("ReportLost")}>
              <Button className="bg-red-600 hover:bg-red-700">
                <PlusCircle className="w-4 h-4 mr-2" /> Report Lost
              </Button>
            </Link>
            <Link to={createPageUrl("ReportFound")}>
              <Button className="bg-green-600 hover:bg-green-700">
                <PlusCircle className="w-4 h-4 mr-2" /> Report Found
              </Button>
            </Link>
          </div>
        </div>

        {/* Pets List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : pets.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <div className="text-6xl mb-4">🐾</div>
            <p className="text-slate-500 text-lg mb-6">You haven't reported any pets yet.</p>
            <div className="flex gap-3 justify-center">
              <Link to={createPageUrl("ReportLost")}>
                <Button className="bg-red-600 hover:bg-red-700">
                  <PlusCircle className="w-4 h-4 mr-2" /> Report Lost Pet
                </Button>
              </Link>
              <Link to={createPageUrl("ReportFound")}>
                <Button className="bg-green-600 hover:bg-green-700">
                  <PlusCircle className="w-4 h-4 mr-2" /> Report Found Pet
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map(pet => (
              <div key={pet.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all">
                {/* Image */}
                <div className="relative w-full h-48 bg-slate-100">
                  {pet.photo_url ? (
                    <img src={pet.photo_url} alt={pet.name || "Pet"} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <div className="text-4xl">🐾</div>
                    </div>
                  )}
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[pet.status]}`}>
                    {pet.status.charAt(0).toUpperCase() + pet.status.slice(1)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-slate-800 text-lg mb-1">{pet.name || "Unnamed Pet"}</h3>
                  
                  <div className="space-y-2 mb-4 text-sm text-slate-600">
                    {pet.pet_type && (
                      <p><span className="font-medium">Type:</span> {pet.pet_type.charAt(0).toUpperCase() + pet.pet_type.slice(1)}</p>
                    )}
                    {pet.breed && (
                      <p><span className="font-medium">Breed:</span> {pet.breed}</p>
                    )}
                    {pet.color && (
                      <p><span className="font-medium">Color:</span> {pet.color}</p>
                    )}
                    {pet.size && (
                      <p><span className="font-medium">Size:</span> {pet.size.charAt(0).toUpperCase() + pet.size.slice(1)}</p>
                    )}
                    {pet.description && (
                      <p className="text-slate-500 line-clamp-2">{pet.description}</p>
                    )}
                  </div>

                  {/* Location & Date */}
                  <div className="space-y-1 text-xs text-slate-500 mb-4 pb-4 border-b border-slate-100">
                    {pet.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {pet.location}
                      </div>
                    )}
                    {pet.date_lost_found && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {format(new Date(pet.date_lost_found), "MMM d, yyyy")}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.location.href = `${createPageUrl('PetDetails')}?id=${pet.id}`}
                      className="flex-1 py-2 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition border border-slate-200"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleDelete(pet.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}