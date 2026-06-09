import { useState } from 'react';
import { X, Check } from 'lucide-react';

export default function PhotoCropModal({ imageSrc, onSave, onCancel }) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Fetch the image as a blob
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      
      // Convert to file
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      onSave(file);
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

        <div className="flex items-center justify-center p-6 bg-stone-100">
          <img src={imageSrc} alt="preview" className="max-w-full max-h-64 rounded-lg" />
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