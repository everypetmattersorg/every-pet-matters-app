import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, MapPin, Mail, Phone, Weight, Calendar, Ruler, X, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';

const AGE_LABELS = {
  'Baby': '0–5 months',
  'Young': '6 months–2 years',
  'Adult': '2–8 years',
  'Senior': '8+ years'
};

export default function PetDetailModal({ pet, open, onClose, onContactClick }) {
  const navigate = useNavigate();
  const [photoIdx, setPhotoIdx] = useState(0);

  // Reset photo index when pet changes
  useEffect(() => { setPhotoIdx(0); }, [pet?.id]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!pet) return null;

  const photos = pet.photo_urls?.length ? pet.photo_urls : (pet.photo_url ? [pet.photo_url] : []);
  const focalPoints = pet.photo_focal_points || [];
  const hasMultiple = photos.length > 1;

  const handlePrintPDF = () => {
    const photo = photos[photoIdx] || '';
    const agLabel = AGE_LABELS[pet.age] || pet.age || '';
    const details = [
      pet.species && `<div class="detail"><span class="label">Species</span><span>${pet.species}</span></div>`,
      pet.breed && `<div class="detail"><span class="label">Breed</span><span>${pet.breed}</span></div>`,
      agLabel && `<div class="detail"><span class="label">Age</span><span>${agLabel}</span></div>`,
      pet.gender && `<div class="detail"><span class="label">Gender</span><span>${pet.gender}</span></div>`,
      pet.size && `<div class="detail"><span class="label">Size</span><span>${pet.size}</span></div>`,
      pet.weight && `<div class="detail"><span class="label">Weight</span><span>${pet.weight} lbs</span></div>`,
      pet.location && `<div class="detail"><span class="label">Location</span><span>${pet.location}</span></div>`,
    ].filter(Boolean).join('');

    const badges = [
      pet.vaccinated && `<span class="badge">✓ Vaccinated</span>`,
      pet.spayed_neutered && `<span class="badge">✓ Spayed / Neutered</span>`,
      pet.urgent && `<span class="badge urgent">🚨 Urgent</span>`,
      pet.rescue_needed && `<span class="badge urgent">🆘 Rescue Needed</span>`,
      pet.stipend_available && `<span class="badge green">💰 Stipend Available</span>`,
    ].filter(Boolean).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${pet.name} – Adoption Profile</title>
    <style>
      body { font-family: Georgia, serif; margin: 0; padding: 32px; color: #1a1a1a; max-width: 680px; margin: 0 auto; }
      h1 { font-size: 2rem; margin: 0 0 4px; }
      .source { font-size: 0.9rem; color: #666; margin-bottom: 20px; }
      img { width: 100%; max-height: 340px; object-fit: cover; border-radius: 8px; margin-bottom: 20px; }
      .details { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
      .detail { background: #f5f5f5; border-radius: 6px; padding: 10px 14px; }
      .label { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 2px; }
      .about-title { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 8px; }
      .about { background: #f9f9f9; border-left: 4px solid #ccc; padding: 14px 16px; border-radius: 4px; font-size: 0.9rem; line-height: 1.7; white-space: pre-line; margin-bottom: 20px; }
      .badges { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
      .badge { padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; }
      .badge.urgent { background: #fdecea; color: #c62828; border-color: #ef9a9a; }
      .badge.green { background: #e8f5e9; color: #2e7d32; border-color: #a5d6a7; }
      .contact { font-size: 0.85rem; color: #555; border-top: 1px solid #eee; padding-top: 14px; }
      @media print { body { padding: 16px; } }
    </style></head><body>
    <h1>${pet.name}</h1>
    <div class="source">${pet.source || ''}${pet.location ? ' · ' + pet.location : ''}</div>
    ${photo ? `<img src="${photo}" crossorigin="anonymous" />` : ''}
    <div class="details">${details}</div>
    ${badges ? `<div class="badges">${badges}</div>` : ''}
    ${pet.description ? `<p class="about-title">About ${pet.name}</p><div class="about">${pet.description}</div>` : ''}
    ${pet.contact ? `<div class="contact">Contact: ${pet.contact}</div>` : ''}
    <script>window.onload = () => { window.print(); }<\/script>
    </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  };

  const handleShelterClick = (e) => {
    e.stopPropagation();
    navigate(`/ShelterDetail?name=${encodeURIComponent(pet.source)}`);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}
      >
        {/* Photo */}
        <div className="relative w-full h-56 bg-muted shrink-0">
          {photos.length > 0 ? (
            <img
              src={photos[photoIdx]}
              alt={`${pet.name} photo ${photoIdx + 1}`}
              className="w-full h-full object-cover"
              style={{ objectPosition: focalPoints[photoIdx] || 'center' }}
              referrerPolicy="no-referrer"
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🐾</div>
          )}

          {/* Prev/Next buttons */}
          {hasMultiple && (
            <>
              <button
                onClick={() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPhotoIdx(i => (i + 1) % photos.length)}
                className="absolute right-12 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === photoIdx ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title + shelter badge */}
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-2xl font-bold">{pet.name}</h2>
            <Badge
              className="shrink-0 text-sm px-3 py-1 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleShelterClick}
            >
              {pet.source} →
            </Badge>
          </div>

          {/* Attributes grid */}
          <div className="grid grid-cols-2 gap-3">
            {pet.species && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Species</p>
                <p className="font-medium text-sm">{pet.species}</p>
              </div>
            )}
            {pet.breed && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Breed</p>
                <p className="font-medium text-sm">{pet.breed}</p>
              </div>
            )}
            {pet.age && (
              <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Age</p>
                  <p className="font-medium text-sm">{AGE_LABELS[pet.age] || pet.age}</p>
                </div>
              </div>
            )}
            {pet.gender && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Gender</p>
                <p className="font-medium text-sm">{pet.gender}</p>
              </div>
            )}
            {pet.size && (
              <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
                <Ruler className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Size</p>
                  <p className="font-medium text-sm">{pet.size}</p>
                </div>
              </div>
            )}
            {pet.weight && (
              <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
                <Weight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Weight</p>
                  <p className="font-medium text-sm">{pet.weight} lbs</p>
                </div>
              </div>
            )}
          </div>

          {pet.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{pet.location}</span>
            </div>
          )}

          {pet.description && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">About {pet.name}</h3>
              <div className="bg-muted/40 rounded-lg p-4 border-l-4 border-primary/30">
                <p className="text-sm leading-relaxed whitespace-pre-line">{pet.description}</p>
              </div>
            </div>
          )}

          {pet.contact && (
            <div className="flex items-center gap-2 text-sm">
              {pet.contact.includes('@') ? (
                <>
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a href={`mailto:${pet.contact}`} className="text-primary hover:underline">{pet.contact}</a>
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a href={`tel:${pet.contact}`} className="text-primary hover:underline">{pet.contact}</a>
                </>
              )}
            </div>
          )}

          {pet.outreach_status && (
            <Badge variant="outline" className="text-sm">{pet.outreach_status}</Badge>
          )}
        </div>

        {/* Fixed footer actions */}
        <div className="border-t p-4 flex gap-3 shrink-0">
          <Button className="gap-2 flex-1" onClick={() => { onClose(); onContactClick?.(); }}>
            <Mail className="w-4 h-4" /> Contact Shelter
          </Button>
          <Button variant="outline" size="icon" onClick={handlePrintPDF} title="Print / Save PDF">
            <Printer className="w-4 h-4" />
          </Button>
          {pet.url && (
            <a href={pet.url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="w-4 h-4" /> View
              </Button>
            </a>
          )}
        </div>
      </div>
    </>
  );
}