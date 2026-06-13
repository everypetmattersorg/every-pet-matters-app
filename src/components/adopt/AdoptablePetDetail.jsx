import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Phone, Mail, Globe, CheckCircle2, AlertCircle, Users, Zap, Edit, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddAdoptablePetForm from "./AddAdoptablePetForm";
import PetSocialCaption from "./PetSocialCaption";
import SharePetModal from "./SharePetModal";

export default function AdoptablePetDetail({ pet, onClose, onStatusUpdate, currentUserEmail }) {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(pet.status || "available");
  const [isEditing, setIsEditing] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const isOwnPet = currentUserEmail === pet.rescue_email;
  const contact_name = pet.rescue_name || pet.contact_name;
  const contact_phone = pet.rescue_phone || pet.contact_phone;
  const contact_email = pet.rescue_email || pet.contact_email;
  const contact_website = pet.rescue_website || pet.url;
  const shelterName = pet.rescue_name || pet.source;
  const shelterLocation = [pet.rescue_city, pet.rescue_state].filter(Boolean).join(', ');
  const petType = pet.pet_type || pet.species;
  const mainPhoto = pet.photo_url || pet.photo_urls?.[0];
  const extraPhotos = pet.extra_photos || pet.photo_urls?.slice(1) || [];

  const energyLabel = {
    low: "Low - Relaxed & calm",
    medium: "Medium - Moderate activity",
    high: "High - Very energetic"
  };

  const statusLabels = { available: "Available", pending: "Pending Adoption", adopted: "Adopted" };
  const statusColors = {
    available: "bg-green-100 text-green-800",
    pending: "bg-amber-100 text-amber-800",
    adopted: "bg-slate-100 text-slate-800"
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setLoading(true);
      await base44.entities.AdoptablePet.update(pet.id, { status: newStatus });
      setCurrentStatus(newStatus);
      onStatusUpdate?.(newStatus);
    } finally {
      setLoading(false);
    }
  };

  const ageDisplay = pet.age_years
    ? `${pet.age_years} yr${pet.age_years !== 1 ? "s" : ""}${pet.age_months ? ` ${pet.age_months} mo` : ""}`
    : pet.age || (pet.age_months ? `${pet.age_months} mo` : "Age unknown");

  if (isEditing) {
    return (
      <AddAdoptablePetForm
        petToEdit={pet}
        onSaved={() => { setIsEditing(false); onClose(); }}
        onClose={() => setIsEditing(false)}
      />
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-[10001]" onClick={onClose} />

      {/* Slide-in panel */}
      <div className="fixed top-0 right-0 h-screen w-11/12 sm:w-[480px] max-w-[90vw] bg-white z-[10002] shadow-2xl flex flex-col">

        {/* Header — always visible at top */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white shrink-0">
          <h2 className="text-2xl font-bold text-slate-900 truncate pr-2">{pet.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition shrink-0">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto min-h-0">

          {/* Photo - full bleed */}
          {mainPhoto && (
            <div className="w-full">
              <img src={mainPhoto} alt={pet.name} className="w-full h-64 object-cover" />
              {extraPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-1 p-1">
                  {extraPhotos.slice(0, 3).map((photo, i) => (
                    <img key={i} src={photo} alt={`${pet.name} ${i + 1}`} className="w-full h-20 object-cover rounded" />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All info */}
          <div className="p-5 space-y-5">

            {/* Shelter Location */}
            {(shelterName || shelterLocation) && (
              <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                <div>
                  {shelterName && <p className="font-semibold text-slate-800 text-sm">{shelterName}</p>}
                  {shelterLocation && <p className="text-xs text-slate-500 mt-0.5">{shelterLocation}</p>}
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Species</p>
                <p className="font-semibold text-slate-800 capitalize">{petType || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Age</p>
                <p className="font-semibold text-slate-800">{ageDisplay}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Gender</p>
                <p className="font-semibold text-slate-800 capitalize">{pet.gender || "Unknown"}</p>
              </div>
              {(pet.weight_lbs || pet.weight) && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Weight</p>
                  <p className="font-semibold text-slate-800">{pet.weight_lbs ? `${pet.weight_lbs} lbs` : `${pet.weight} lbs`}</p>
                </div>
              )}
              {(pet.breed) && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 mb-0.5">Breed</p>
                  <p className="font-semibold text-slate-800">{pet.breed}</p>
                </div>
              )}
            </div>

            {/* Description / Bio */}
            {pet.description && (
              <div>
                <h3 className="font-semibold text-slate-700 mb-1.5 text-sm">About {pet.name}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{pet.description}</p>
              </div>
            )}

            {/* Notes */}
            {pet.notes && (
              <div>
                <h3 className="font-semibold text-slate-700 mb-1.5 text-sm">Notes</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{pet.notes}</p>
              </div>
            )}

            {/* Temperament & Compatibility */}
            {(pet.energy_level || pet.good_with_kids != null || pet.good_with_dogs != null || pet.good_with_cats != null || pet.house_trained != null || pet.special_needs) && (
              <div>
                <h3 className="font-semibold text-slate-700 mb-2 text-sm">Temperament & Compatibility</h3>
                <div className="space-y-2">
                  {pet.energy_level && (
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">Energy Level</p>
                        <p className="text-xs text-slate-600">{energyLabel[pet.energy_level] || pet.energy_level}</p>
                      </div>
                    </div>
                  )}
                  {pet.good_with_kids != null && (
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <Users className="w-4 h-4 shrink-0" style={{ color: pet.good_with_kids ? "#059669" : "#dc2626" }} />
                      <p className="text-sm text-slate-800">{pet.good_with_kids ? "✓ Good with children" : "✗ Not ideal for young children"}</p>
                    </div>
                  )}
                  {pet.good_with_dogs != null && (
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: pet.good_with_dogs ? "#059669" : "#dc2626" }} />
                      <p className="text-sm text-slate-800">{pet.good_with_dogs ? "✓ Good with other dogs" : "✗ Prefers to be only dog"}</p>
                    </div>
                  )}
                  {pet.good_with_cats != null && (
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: pet.good_with_cats ? "#059669" : "#dc2626" }} />
                      <p className="text-sm text-slate-800">{pet.good_with_cats ? "✓ Good with cats" : "✗ Not suitable with cats"}</p>
                    </div>
                  )}
                  {pet.house_trained != null && (
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: pet.house_trained ? "#059669" : "#dc2626" }} />
                      <p className="text-sm text-slate-800">{pet.house_trained ? "✓ House trained" : "✗ Not yet house trained"}</p>
                    </div>
                  )}
                  {pet.special_needs && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-900">Special Needs</p>
                        {pet.special_needs_description && <p className="text-xs text-amber-800 mt-0.5">{pet.special_needs_description}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Adoption Fee */}
            {pet.adoption_fee != null && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1">Adoption Fee</p>
                <p className="text-2xl font-bold" style={{ color: '#A33407' }}>${pet.adoption_fee}</p>
              </div>
            )}

            {/* Status (own pet only) */}
            {isOwnPet && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-500 font-medium">Status</p>
                  <Badge className={statusColors[currentStatus]}>{statusLabels[currentStatus]}</Badge>
                </div>
                <Select value={currentStatus} onValueChange={handleStatusChange} disabled={loading}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="pending">Pending Adoption</SelectItem>
                    <SelectItem value="adopted">Adopted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Rescue Contact */}
            {(contact_name || contact_phone || contact_email || contact_website) && (
              <div>
                <h3 className="font-semibold text-slate-700 mb-2 text-sm">Rescue Contact</h3>
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  {contact_name && <p className="font-medium text-slate-800 text-sm">{contact_name}</p>}
                  {contact_phone && (
                    <a href={`tel:${contact_phone}`} className="flex items-center gap-2 text-sm" style={{ color: '#A33407' }}>
                      <Phone className="w-4 h-4" /> {contact_phone}
                    </a>
                  )}
                  {contact_email && (
                    <a href={`mailto:${contact_email}`} className="flex items-center gap-2 text-sm" style={{ color: '#A33407' }}>
                      <Mail className="w-4 h-4" /> {contact_email}
                    </a>
                  )}
                  {contact_website && (
                    <a href={contact_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm" style={{ color: '#A33407' }}>
                      <Globe className="w-4 h-4" /> Visit Website
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Social Caption */}
            <PetSocialCaption pet={pet} />

          </div>
        </div>

        {/* Action buttons — fixed at bottom */}
        <div className="flex gap-2 px-5 py-4 border-t border-slate-100 bg-white shrink-0">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-lg">
            Close
          </Button>
          {!isOwnPet && contact_email && (
            <a
              href={`mailto:${contact_email}?subject=${encodeURIComponent(`Interested in adopting ${pet.name}`)}&body=${encodeURIComponent(`Hi,\n\nI'm interested in adopting ${pet.name}. Could you please share more information about the adoption process?\n\nThank you!`)}`}
              className="flex-1"
            >
              <Button className="w-full rounded-lg gap-1 text-white" style={{ background: '#A33407' }}>
                <Mail className="w-4 h-4" /> Adopt
              </Button>
            </a>
          )}
          {isOwnPet && (
            <Button onClick={() => setIsEditing(true)} className="flex-1 rounded-lg gap-1 text-white" style={{ background: '#A33407' }}>
              <Edit className="w-4 h-4" /> Edit
            </Button>
          )}
          <Button onClick={() => setShowShare(true)} className="flex-1 rounded-lg gap-1 text-white" style={{ background: '#2B5242' }}>
            <Share2 className="w-4 h-4" /> Share
          </Button>
        </div>

      </div>

      <SharePetModal pet={pet} open={showShare} onClose={() => setShowShare(false)} />
    </>
  );
}