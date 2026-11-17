import { useState, useEffect, useCallback } from "react";
import { base44 } from '@/api/supabaseClient';
import { X, Phone, Mail, Globe, CheckCircle2, AlertCircle, Users, Zap, Edit, Share2, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddAdoptablePetForm from "./AddAdoptablePetForm";
import PetSocialCaption from "./PetSocialCaption";
import SharePetModal from "./SharePetModal";

// ── Media gallery ─────────────────────────────────────────────────────────────
// media items: { type: 'photo'|'video', src }
function MediaGallery({ media, petName }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const total = media.length;

  const prev = useCallback(() => setActiveIdx((i) => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setActiveIdx((i) => (i + 1) % total), [total]);

  useEffect(() => {
    if (total <= 1) return;
    const handler = (e) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next, total]);

  if (total === 0) {
    return (
      <div className="w-full bg-slate-100 flex items-center justify-center text-7xl" style={{ height: 'clamp(220px, 40vw, 420px)' }}>🐾</div>
    );
  }

  const active = media[activeIdx];

  return (
    <div>
      {/* Main viewer */}
      <div className="relative w-full bg-black overflow-hidden" style={{ height: 'clamp(220px, 40vw, 420px)' }}>
        {active.type === 'video' ? (
          <video
            key={active.src}
            src={active.src}
            controls
            className="w-full h-full object-contain"
          />
        ) : (
          <img
            src={active.src}
            alt={`${petName} ${activeIdx + 1}`}
            className="w-full h-full object-contain"
          />
        )}

        {total > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition backdrop-blur-sm"
              aria-label="Previous">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition backdrop-blur-sm"
              aria-label="Next">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm">
              {activeIdx + 1} / {total}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="flex gap-2 overflow-x-auto px-3 py-2 bg-slate-900 scrollbar-thin" style={{ scrollbarWidth: 'none' }}>
          {media.map((item, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`relative shrink-0 rounded overflow-hidden border-2 transition-all ${i === activeIdx ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}`}
              style={{ width: 72, height: 54 }}>
              {item.type === 'video' ? (
                <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              ) : (
                <img src={item.src} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdoptablePetDetail({ pet, allPets = [], shelterLocMap = {}, onClose, onNavigate, onStatusUpdate, currentUserEmail }) {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(pet.status || "available");
  const [isEditing, setIsEditing] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // Look up shelter info from the map, falling back to fields on the pet record
  const shelterKey = (pet.rescue_name || pet.source || '').toLowerCase();
  const shelterInfo = shelterLocMap[shelterKey] || {};

  const isOwnPet = currentUserEmail === pet.rescue_email;
  const contact_name = pet.rescue_name || pet.contact_name || shelterInfo.name;
  const contact_phone = pet.rescue_phone || pet.contact_phone || shelterInfo.phone;
  const contact_email = pet.rescue_email || pet.contact_email || shelterInfo.email;
  const contact_website = pet.rescue_website || pet.url || shelterInfo.website;
  const shelterName = pet.rescue_name || pet.source || shelterInfo.name;
  const shelterLocation = [
    pet.rescue_city || shelterInfo.city,
    pet.rescue_state || shelterInfo.state,
  ].filter(Boolean).join(', ');
  const petType = pet.pet_type || pet.species;

  // Build combined media array: photos first, then video
  const mainPhoto = pet.photo_url || pet.photo_urls?.[0];
  const extraPhotos = pet.extra_photos || pet.photo_urls?.slice(1) || [];
  const allPhotos = [mainPhoto, ...extraPhotos].filter(Boolean);
  const allMedia = [
    ...allPhotos.map(src => ({ type: 'photo', src })),
    ...(pet.video_url ? [{ type: 'video', src: pet.video_url }] : []),
  ];

  const currentIdx = allPets.findIndex((p) => p.id === pet.id);
  const prevPet = currentIdx > 0 ? allPets[currentIdx - 1] : null;
  const nextPet = currentIdx < allPets.length - 1 ? allPets[currentIdx + 1] : null;

  // Keyboard navigation between pets
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Reset status when pet changes
  useEffect(() => {
    setCurrentStatus(pet.status || "available");
    setIsEditing(false);
  }, [pet.id]);

  const energyLabel = {
    low: "Low — Relaxed & calm",
    medium: "Medium — Moderate activity",
    high: "High — Very energetic"
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
      <div className="fixed inset-0 z-[10001] bg-white overflow-y-auto">
        <AddAdoptablePetForm
          petToEdit={pet}
          onSaved={() => { setIsEditing(false); onClose(); }}
          onClose={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[10001] bg-white flex flex-col overflow-hidden">

      {/* ── Sticky top bar ── */}
      <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 bg-white/90 backdrop-blur-sm">
        {/* Back */}
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">All pets</span>
        </button>

        {/* Pet name */}
        <h1 className="text-lg font-bold text-slate-900 truncate flex-1 text-center px-2">{pet.name}</h1>

        {/* Prev / Next pet */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => prevPet && onNavigate(prevPet)}
            disabled={!prevPet}
            className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Previous pet">
            <ChevronLeft className="w-5 h-5" />
          </button>
          {allPets.length > 0 && (
            <span className="text-xs text-slate-400 tabular-nums w-14 text-center">
              {currentIdx + 1} of {allPets.length}
            </span>
          )}
          <button
            onClick={() => nextPet && onNavigate(nextPet)}
            disabled={!nextPet}
            className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Next pet">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Media gallery (photos + video) */}
        <MediaGallery media={allMedia} petName={pet.name} />

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

          {/* Name + status badge */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">{pet.name}</h2>
              {shelterLocation && <p className="text-sm text-slate-500 mt-0.5">{shelterLocation}</p>}
            </div>
            <span className={`text-sm px-3 py-1 rounded-full font-medium pointer-events-none ${statusColors[currentStatus]}`}>
              {statusLabels[currentStatus]}
            </span>
          </div>

          {/* Shelter */}
          {shelterName && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <span className="text-2xl">🏠</span>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{shelterName}</p>
                {shelterLocation && <p className="text-xs text-slate-500">{shelterLocation}</p>}
              </div>
              {pet.shelter_status && (
                <span className="ml-auto text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800 capitalize shrink-0">
                  {pet.shelter_status}
                </span>
              )}
            </div>
          )}

          {/* Basic info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Species', value: petType },
              { label: 'Age', value: ageDisplay },
              { label: 'Gender', value: pet.gender },
              { label: 'Weight', value: (pet.weight_lbs || pet.weight) ? `${pet.weight_lbs || pet.weight} lbs` : null },
              { label: 'Breed', value: pet.breed },
              { label: 'Color', value: pet.color },
            ].filter((f) => f.value).map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                <p className="font-semibold text-slate-800 capitalize text-sm">{value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {pet.description && (
            <div>
              <h3 className="font-semibold text-slate-700 mb-2">About {pet.name}</h3>
              <p className="text-slate-600 leading-relaxed">{pet.description}</p>
            </div>
          )}

          {/* Notes */}
          {pet.notes && (
            <div>
              <h3 className="font-semibold text-slate-700 mb-2">Notes</h3>
              <p className="text-slate-600 leading-relaxed">{pet.notes}</p>
            </div>
          )}

          {/* Temperament & Compatibility */}
          {(pet.energy_level || pet.kid_friendly || pet.dog_friendly || pet.cat_friendly ||
            pet.house_trained != null || pet.vaccinated != null || pet.spayed_neutered != null || pet.special_needs) && (
            <div>
              <h3 className="font-semibold text-slate-700 mb-3">Temperament & Compatibility</h3>
              <div className="space-y-2">
                {pet.energy_level && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Energy Level</p>
                      <p className="text-xs text-slate-500">{energyLabel[pet.energy_level] || pet.energy_level}</p>
                    </div>
                  </div>
                )}
                {[
                  pet.kid_friendly && { icon: <Users className="w-4 h-4 shrink-0" />, yes: 'Good with children', no: 'Not ideal for young children', maybe: 'May be okay with children', val: pet.kid_friendly },
                  pet.dog_friendly && { icon: <CheckCircle2 className="w-4 h-4 shrink-0" />, yes: 'Good with other dogs', no: 'Prefers to be only dog', maybe: 'May be okay with dogs', val: pet.dog_friendly },
                  pet.cat_friendly && { icon: <CheckCircle2 className="w-4 h-4 shrink-0" />, yes: 'Good with cats', no: 'Not suitable with cats', maybe: 'May be okay with cats', val: pet.cat_friendly },
                ].filter(Boolean).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <span style={{ color: item.val === 'yes' ? '#059669' : item.val === 'no' ? '#dc2626' : '#d97706' }}>{item.icon}</span>
                    <p className="text-sm text-slate-800">
                      {item.val === 'yes' ? `✓ ${item.yes}` : item.val === 'no' ? `✗ ${item.no}` : `~ ${item.maybe}`}
                    </p>
                  </div>
                ))}
                {pet.house_trained != null && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: pet.house_trained ? "#059669" : "#dc2626" }} />
                    <p className="text-sm text-slate-800">{pet.house_trained ? "✓ House trained" : "✗ Not yet house trained"}</p>
                  </div>
                )}
                {pet.vaccinated != null && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: pet.vaccinated ? "#059669" : "#dc2626" }} />
                    <p className="text-sm text-slate-800">{pet.vaccinated ? "✓ Vaccinated" : "✗ Not yet vaccinated"}</p>
                  </div>
                )}
                {pet.spayed_neutered != null && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: pet.spayed_neutered ? "#059669" : "#dc2626" }} />
                    <p className="text-sm text-slate-800">{pet.spayed_neutered ? "✓ Spayed / Neutered" : "✗ Not yet spayed / neutered"}</p>
                  </div>
                )}
                {pet.special_needs && (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">Special Needs</p>
                      {pet.special_needs_description && <p className="text-xs text-amber-700 mt-0.5">{pet.special_needs_description}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Adoption Fee */}
          {pet.adoption_fee != null && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
              <p className="text-sm text-slate-600 font-medium">Adoption Fee</p>
              <p className="text-2xl font-bold" style={{ color: '#A33407' }}>${pet.adoption_fee}</p>
            </div>
          )}

          {/* Status editor (own pet) */}
          {isOwnPet && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-500 font-medium">Listing Status</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium pointer-events-none ${statusColors[currentStatus]}`}>{statusLabels[currentStatus]}</span>
              </div>
              <Select value={currentStatus} onValueChange={handleStatusChange} disabled={loading}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="pending">Pending Adoption</SelectItem>
                  <SelectItem value="adopted">Adopted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Rescue contact */}
          {(contact_name || contact_phone || contact_email || contact_website) && (
            <div>
              <h3 className="font-semibold text-slate-700 mb-2">Rescue Contact</h3>
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                {contact_name && <p className="font-medium text-slate-800">{contact_name}</p>}
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

          {/* Social caption */}
          <PetSocialCaption pet={pet} />

          {/* Bottom spacing for action bar */}
          <div className="h-4" />
        </div>
      </div>

      {/* ── Sticky action bar ── */}
      <div className="shrink-0 flex gap-2 px-4 py-3 border-t border-slate-100 bg-white/90 backdrop-blur-sm">
        {isOwnPet ? (
          <Button onClick={() => setIsEditing(true)} className="flex-1 rounded-xl gap-1.5 text-white font-semibold" style={{ background: '#A33407' }}>
            <Edit className="w-4 h-4" /> Edit Listing
          </Button>
        ) : contact_email ? (
          <a
            href={`mailto:${contact_email}?subject=${encodeURIComponent(`Interested in adopting ${pet.name}`)}&body=${encodeURIComponent(`Hi,\n\nI'm interested in adopting ${pet.name}. Could you please share more information about the adoption process?\n\nThank you!`)}`}
            className="flex-1">
            <Button className="w-full rounded-xl gap-1.5 text-white font-semibold" style={{ background: '#A33407' }}>
              <Mail className="w-4 h-4" /> Adopt {pet.name}
            </Button>
          </a>
        ) : contact_website ? (
          <a href={contact_website} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button className="w-full rounded-xl gap-1.5 text-white font-semibold" style={{ background: '#A33407' }}>
              <Globe className="w-4 h-4" /> Contact Shelter
            </Button>
          </a>
        ) : (
          <Button disabled className="flex-1 rounded-xl gap-1.5 font-semibold" variant="outline">
            <Mail className="w-4 h-4" /> Contact info unavailable
          </Button>
        )}
        <Button onClick={() => setShowShare(true)} variant="outline" className="rounded-xl gap-1.5 font-semibold px-5">
          <Share2 className="w-4 h-4" /> Share
        </Button>
      </div>

      <SharePetModal pet={pet} open={showShare} onClose={() => setShowShare(false)} />
    </div>
  );
}
