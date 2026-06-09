import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * FocalPointPicker – supports multiple photos.
 * Clicking the image immediately saves the focal point.
 *
 * Multi-photo props:
 *   photoUrls: string[]
 *   focalPoints: string[]
 *   onChange: ({ photo_urls: string[], photo_focal_points: string[] }) => void
 *
 * Legacy single-image props:
 *   imageUrl: string
 *   initialPoint?: string
 *   onSave: (point: string) => void
 *   onCancel?: () => void
 */
export default function FocalPointPicker({ photoUrls, focalPoints, onChange, imageUrl, initialPoint, onSave }) {
  const isLegacy = !photoUrls && imageUrl;
  const urls = isLegacy ? [imageUrl] : (photoUrls || []);
  const initPoints = isLegacy ? [initialPoint || '50% 50%'] : (focalPoints || []);

  const parsePoint = (p) => {
    if (!p) return { x: 50, y: 50 };
    const [x, y] = p.split(' ').map(v => parseFloat(v));
    return { x: isNaN(x) ? 50 : x, y: isNaN(y) ? 50 : y };
  };

  const [activeIndex, setActiveIndex] = useState(0);
  const [points, setPoints] = useState(() => urls.map((_, i) => parsePoint(initPoints[i])));
  const [saved, setSaved] = useState(false);

  if (urls.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No photos available to set focal points.</p>;
  }

  const currentPoint = points[activeIndex] || { x: 50, y: 50 };

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    const updated = points.map((p, i) => i === activeIndex ? { x, y } : p);
    setPoints(updated);
    // Immediately fire onChange so the parent form state is kept in sync
    const newFocalPoints = updated.map(p => `${p.x}% ${p.y}%`);
    if (isLegacy) {
      onSave(newFocalPoints[0]);
    } else {
      onChange?.({ photo_urls: urls, photo_focal_points: newFocalPoints });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="space-y-3">
      {/* Thumbnail strip */}
      {urls.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {urls.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${activeIndex === i ? 'border-primary shadow-md scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'}`}
            >
              <img src={url} alt={`photo ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              {points[i] && (
                <div
                  className="absolute w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: `${points[i].x}%`, top: `${points[i].y}%` }}
                >
                  <div className="w-full h-full rounded-full border border-white bg-primary/80" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {urls.length > 1 ? `Photo ${activeIndex + 1} of ${urls.length} — click` : 'Click'} to set the focal point for cropped views.
        </p>
        {saved && (
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <Check className="w-3 h-3" /> Focal point set
          </span>
        )}
      </div>

      {/* Main picker area */}
      <div
        className="relative w-full rounded-lg overflow-hidden border cursor-crosshair select-none bg-black"
        style={{ aspectRatio: '16/9' }}
        onClick={handleClick}
      >
        <img
          src={urls[activeIndex]}
          alt="focal point"
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
          referrerPolicy="no-referrer"
        />
        {/* Focal point dot */}
        <div
          className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${currentPoint.x}%`, top: `${currentPoint.y}%` }}
        >
          <div className="w-full h-full rounded-full border-2 border-white shadow-lg bg-primary/70 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-px w-10 h-px bg-white/60 -ml-5" />
          <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-px h-10 w-px bg-white/60 -mt-5" />
        </div>
      </div>

      {/* Navigation arrows for multi-photo */}
      {urls.length > 1 && (
        <div className="flex items-center justify-between">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setActiveIndex(i => Math.max(0, i - 1))}
            disabled={activeIndex === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-3 h-3" /> Prev
          </Button>
          <span className="text-xs text-muted-foreground">{activeIndex + 1} / {urls.length}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setActiveIndex(i => Math.min(urls.length - 1, i + 1))}
            disabled={activeIndex === urls.length - 1}
            className="gap-1"
          >
            Next <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground italic">Focal points are saved when you click "Save Changes" above.</p>
    </div>
  );
}