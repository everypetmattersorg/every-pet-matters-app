import { useState, useRef } from 'react';
import { X, Check } from 'lucide-react';

export default function PhotoCropModal({ imageSrc, onSave, onCancel }) {
  const [saving, setSaving] = useState(false);
  const [focal, setFocal] = useState({ x: 50, y: 50 });
  const imgRef = useRef(null);

  const handlePick = (e) => {
    const rect = imgRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setFocal({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Fetch the image as a blob
      const response = await fetch(imageSrc);
      const blob = await response.blob();

      // Convert to file
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      onSave(file, focal);
    } catch (error) {
      console.error('Error:', error);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-stone-200">
          <h3 className="text-xl font-black text-stone-900">preview photo</h3>
          <button onClick={onCancel} className="text-stone-400 hover:text-stone-600" disabled={saving}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center p-6 bg-stone-100 gap-3">
          <p className="text-sm text-stone-500">click the photo to set what stays centered when cropped</p>
          <div className="relative inline-block max-w-full">
            <img
              ref={imgRef}
              src={imageSrc}
              alt="preview"
              onClick={handlePick}
              className="max-w-full max-h-64 rounded-lg cursor-crosshair"
            />
            <div
              className="absolute w-5 h-5 rounded-full border-2 border-white bg-yellow-400/80 shadow pointer-events-none -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${focal.x}%`, top: `${focal.y}%` }}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end p-6 border-t border-stone-200">
          <button
            onClick={onCancel}
            className="px-6 py-2 text-stone-700 border border-stone-300 rounded-lg font-semibold hover:bg-stone-50 transition"
            disabled={saving}>
            cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
            disabled={saving}>
            <Check className="w-4 h-4" />
            {saving ? 'saving...' : 'upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
