import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function RescueGalleryManager({ photos = [], videos = [], onPhotosChange, onVideosChange }) {
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onPhotosChange([...photos, file_url]);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  const addVideoUrl = (url) => {
    if (url.trim()) {
      onVideosChange([...videos, url]);
    }
  };

  const removeVideo = (index) => {
    onVideosChange(videos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Photo Gallery */}
      <div>
        <h4 className="font-semibold text-slate-800 mb-3">📷 Photo Gallery</h4>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {photos.map((photo, idx) => (
            <div key={idx} className="relative group">
              <img src={photo} alt={`Gallery ${idx}`} className="w-full h-32 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
          id="photo-upload"
          disabled={uploading}
        />
        <label
          htmlFor="photo-upload"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition disabled:opacity-50"
        >
          {uploading ? '⏳' : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </label>
      </div>

      {/* Video Gallery */}
      <div>
        <h4 className="font-semibold text-slate-800 mb-3">🎬 Video Gallery</h4>
        
        <div className="space-y-2 mb-4">
          {videos.map((video, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600 truncate">{video}</span>
              <button
                type="button"
                onClick={() => removeVideo(idx)}
                className="text-red-600 hover:text-red-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Paste video URL (YouTube, Vimeo, etc.)"
            id="video-input"
            className="flex-1"
          />
          <Button
            type="button"
            onClick={() => {
              const input = document.getElementById('video-input');
              if (input?.value) {
                addVideoUrl(input.value);
                input.value = '';
              }
            }}
            variant="outline"
            size="icon"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}