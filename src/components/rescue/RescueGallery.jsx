import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";

export default function RescueGallery({ photos }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) return null;

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev - 1 + photos.length) % photos.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % photos.length);
  };

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {photos.map((photo, idx) => (
          <button
            key={idx}
            onClick={() => {
              setSelectedPhoto(photo);
              setCurrentIndex(idx);
            }}
            className="relative overflow-hidden rounded-lg aspect-square group cursor-pointer"
          >
            <img
              src={photo}
              alt={`Facility photo ${idx + 1}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-8 h-8 text-white" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl max-h-[80vh]">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 transition"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Image */}
            <img
              src={photos[currentIndex]}
              alt="Full size"
              className="w-full h-full object-contain rounded-lg"
            />

            {/* Navigation */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                  {currentIndex + 1} / {photos.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}