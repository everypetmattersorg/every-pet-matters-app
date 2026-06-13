import { Heart, Share2, MapPin, GitCompare } from "lucide-react";
import PetPillTags from "@/components/pets/PetPillTags";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { createPageUrl } from "@/utils";

export default function AdoptablePetCard({ pet, onSelect, isComparing, onToggleCompare }) {
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleShare = (platform) => {
    const url = `${window.location.origin}${createPageUrl(`Adopt?pet=${pet.id}`)}`;
    const text = `Check out ${pet.name} available for adoption!`;
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
      copy: null
    };
    if (platform === "copy") {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    } else {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
    }
    setShowShareMenu(false);
  };

  const ageDisplay = (() => {
    if (pet.age_years && pet.age_months) return `${pet.age_years} yr ${pet.age_months} mo`;
    if (pet.age_years) return `${pet.age_years} ${pet.age_years === 1 ? 'year' : 'years'}`;
    if (pet.age_months) return `${pet.age_months} ${pet.age_months === 1 ? 'month' : 'months'}`;
    return pet.age || null;
  })();

  const location =
    pet.rescue_city && pet.rescue_state
      ? `${pet.rescue_city}, ${pet.rescue_state}`
      : pet.rescue_city || pet.rescue_state || pet.location || null;

  return (
    <div onClick={onSelect}>
      <Card className={`overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-shadow h-full flex flex-col cursor-pointer ${isComparing ? "ring-2 ring-violet-400" : ""}`}>
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
          {pet.photo_url ? (
            <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🐾</div>
          )}

          {/* Source badge */}
          {(pet.rescue_name || pet.source) && (
            <div className="absolute bottom-3 left-3">
              <span style={{ backgroundColor: '#eab308', color: '#fff', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px' }}>
                {pet.rescue_name || pet.source}
              </span>
            </div>
          )}

          {/* Urgent badge */}
          {pet.is_urgent && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
              Urgent
            </div>
          )}

          {/* Special needs badge */}
          {pet.special_needs && (
            <div className="absolute top-3 left-3 bg-amber-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
              Special Needs
            </div>
          )}

          <PetPillTags pet={pet} source="adoptable" />

          {/* Compare button */}
          {onToggleCompare && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleCompare(e); }}
              title={isComparing ? "Remove from compare" : "Add to compare"}
              className={`absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full transition ${isComparing ? "text-violet-600" : "text-slate-400"}`}
            >
              <GitCompare className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="mb-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-base text-slate-800">{pet.name}</h3>
              {pet.shelter_status && (
                <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800 capitalize">
                  {pet.shelter_status}
                </span>
              )}
            </div>
            {pet.breed && (
              <p className="text-xs text-slate-500 mt-0.5">{pet.breed}</p>
            )}
            {location && (
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />{location}
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {pet.stipend_available && (
              <Badge className="bg-green-600 text-white text-xs">Stipend Available</Badge>
            )}
            {pet.foster_url && (
              <Badge className="bg-amber-100 text-amber-700 text-xs">Foster Available</Badge>
            )}
          </div>

          {/* Details */}
          <div className="text-xs text-slate-600 flex-1">
            <div className="flex flex-col gap-2">
              {(pet.pet_type || pet.species) && (
                <div className="bg-slate-50 rounded p-2">
                  <div className="font-medium text-slate-700 mb-0.5">Species</div>
                  <div className="text-slate-600 capitalize">{pet.species || pet.pet_type}</div>
                </div>
              )}
              {pet.breed && (
                <div className="bg-slate-50 rounded p-2">
                  <div className="font-medium text-slate-700 mb-0.5">Breed</div>
                  <div className="text-slate-600">{pet.breed}</div>
                </div>
              )}
              {ageDisplay && (
                <div className="bg-slate-50 rounded p-2">
                  <div className="font-medium text-slate-700 mb-0.5">Age</div>
                  <div className="text-slate-600">{ageDisplay}</div>
                </div>
              )}
              {pet.gender && pet.gender !== "unknown" && (
                <div className="bg-slate-50 rounded p-2">
                  <div className="font-medium text-slate-700 mb-0.5">Gender</div>
                  <div className="text-slate-600 capitalize">{pet.gender}</div>
                </div>
              )}
              {(pet.weight_lbs || pet.weight) && (
                <div className="bg-slate-50 rounded p-2">
                  <div className="font-medium text-slate-700 mb-0.5">Weight</div>
                  <div className="text-slate-600">{pet.weight_lbs || pet.weight} lbs</div>
                </div>
              )}
              {pet.color && (
                <div className="bg-slate-50 rounded p-2">
                  <div className="font-medium text-slate-700 mb-0.5">Color</div>
                  <div className="text-slate-600">{pet.color}</div>
                </div>
              )}
              {pet.size && (
                <div className="bg-slate-50 rounded p-2">
                  <div className="font-medium text-slate-700 mb-0.5">Size</div>
                  <div className="text-slate-600 capitalize">{pet.size}</div>
                </div>
              )}
              {pet.energy_level && (
                <div className="bg-slate-50 rounded p-2">
                  <div className="font-medium text-slate-700 mb-0.5">Energy</div>
                  <div className="text-slate-600 capitalize">{pet.energy_level}</div>
                </div>
              )}
              {pet.adoption_fee && (
                <div className="bg-slate-50 rounded p-2">
                  <div className="font-medium text-slate-700 mb-0.5">Fee</div>
                  <div className="text-slate-600">${pet.adoption_fee}</div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200 relative">
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-white text-xs h-8"
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
            >
              <Heart className="w-3 h-3 mr-1" />
              Adopt
            </Button>
            <button
              className="flex-1"
              onClick={(e) => { e.stopPropagation(); setShowShareMenu(!showShareMenu); }}
            >
              <Button variant="outline" className="w-full text-xs h-8">
                <Share2 className="w-3 h-3 mr-1" />
                Share
              </Button>
            </button>

            {showShareMenu && (
              <div className="absolute bottom-10 right-0 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-20 w-40">
                <button onClick={() => handleShare("facebook")} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded">Facebook</button>
                <button onClick={() => handleShare("twitter")} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded">Twitter</button>
                <button onClick={() => handleShare("whatsapp")} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded">WhatsApp</button>
                <button onClick={() => handleShare("copy")} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded">Copy Link</button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}