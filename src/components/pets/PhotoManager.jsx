import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, X, Plus } from 'lucide-react';

export default function PhotoManager({ photoUrls = [], onChange }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange([...photoUrls, file_url].slice(0, 5));
    setUploading(false);
  };

  const handleRemove = (index) => {
    onChange(photoUrls.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {photoUrls.map((url, i) => (
          <div key={i} className="relative w-20 h-20">
            <img src={url} alt={`photo ${i + 1}`} className="w-full h-full object-cover rounded-lg border" />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {photoUrls.length < 5 && (
          <label className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 transition-colors">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : <Plus className="w-5 h-5 text-slate-400" />}
            <span className="text-xs text-slate-400 mt-1">{uploading ? 'Uploading' : 'Add'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        )}
      </div>
    </div>
  );
}