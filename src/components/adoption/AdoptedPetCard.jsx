import { Heart, Plus, MessageCircle, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdoptedPetCard({ pet, updates = [], onAddUpdate }) {
  const getUpdateColor = (type) => {
    const colors = {
      milestone: "bg-blue-100 text-blue-800",
      health: "bg-green-100 text-green-800",
      behavior: "bg-purple-100 text-purple-800",
      story: "bg-amber-100 text-amber-800",
      photo: "bg-pink-100 text-pink-800",
    };
    return colors[type] || "bg-slate-100 text-slate-800";
  };

  const recentUpdates = updates.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row gap-6 p-6">
        {/* Pet Image */}
        <div className="flex-shrink-0">
          <div className="w-48 h-48 rounded-xl overflow-hidden bg-slate-100">
            {pet.photo_url ? (
              <img
                src={pet.photo_url}
                alt={pet.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Heart className="w-12 h-12 text-slate-300" />
              </div>
            )}
          </div>
        </div>

        {/* Pet Info */}
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{pet.name}</h2>
            <p className="text-slate-500 text-sm">
              {pet.breed} • {pet.age_years ? `${pet.age_years} year${pet.age_years !== 1 ? 's' : ''}` : 'Age unknown'}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {pet.energy_level && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Energy:</span>
                <Badge variant="outline" className="capitalize">
                  {pet.energy_level}
                </Badge>
              </div>
            )}
            {pet.good_with_kids !== undefined && (
              <div className="text-slate-600">
                Good with kids: {pet.good_with_kids ? "✓" : "✗"}
              </div>
            )}
            {pet.good_with_dogs !== undefined && (
              <div className="text-slate-600">
                Good with dogs: {pet.good_with_dogs ? "✓" : "✗"}
              </div>
            )}
            {pet.good_with_cats !== undefined && (
              <div className="text-slate-600">
                Good with cats: {pet.good_with_cats ? "✓" : "✗"}
              </div>
            )}
          </div>

          {/* Rescue Info */}
          <div className="bg-slate-50 rounded-lg p-3 text-sm">
            <p className="text-slate-600 font-medium">{pet.rescue_name}</p>
            <p className="text-slate-500 text-xs flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {pet.rescue_city}, {pet.rescue_state}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={onAddUpdate}
              className="bg-rose-600 hover:bg-rose-700 rounded-lg gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Update
            </Button>
            {updates.length > 0 && (
              <Button
                variant="outline"
                className="rounded-lg gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                {updates.length} Update{updates.length !== 1 ? 's' : ''}
              </Button>
            )}
          </div>

          {/* Recent Updates */}
          {recentUpdates.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-600">RECENT UPDATES</p>
              <div className="space-y-2">
                {recentUpdates.map((update) => (
                  <div key={update.id} className="flex items-start gap-2">
                    <Badge className={`${getUpdateColor(update.update_type)} text-xs flex-shrink-0`}>
                      {update.update_type}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {update.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(update.created_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}