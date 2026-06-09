import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Upload, X } from 'lucide-react';
import AlertMapPicker from './AlertMapPicker';

export default function AlertForm({ initialData, onSubmit, isSubmitting, onCancel }) {
  const [form, setForm] = useState(initialData || {
    name: '',
    email: '',
    pet_type: 'any',
    status_filter: 'lost',
    breed: '',
    location_name: '',
    latitude: null,
    longitude: null,
    radius_miles: 25,
    is_active: true,
    photo_urls: []
  });
  const [uploading, setUploading] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = 3 - (form.photo_urls?.length || 0);
    if (remainingSlots <= 0) return;

    const filesToUpload = files.slice(0, remainingSlots);
    setUploading(true);

    try {
      const uploadedUrls = [];
      for (const file of filesToUpload) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }
      set('photo_urls', [...(form.photo_urls || []), ...uploadedUrls]);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index) => {
    set('photo_urls', (form.photo_urls || []).filter((_, i) => i !== index));
  };

  const handleLocationChange = (lat, lng) => {
    set('latitude', lat);
    set('longitude', lng);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label>Alert Name *</Label>
          <Input required value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="e.g. Lost dogs near downtown" className="h-11 rounded-xl bg-slate-50 border-0" />
        </div>
        <div className="space-y-2">
          <Label>Notification Email *</Label>
          <Input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
            placeholder="you@email.com" className="h-11 rounded-xl bg-slate-50 border-0" />
        </div>
        <div className="space-y-2">
          <Label>Pet Type</Label>
          <Select value={form.pet_type} onValueChange={v => set('pet_type', v)}>
            <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">🐾 Any</SelectItem>
              <SelectItem value="dog">🐕 Dog</SelectItem>
              <SelectItem value="cat">🐱 Cat</SelectItem>
              <SelectItem value="bird">🐦 Bird</SelectItem>
              <SelectItem value="rabbit">🐰 Rabbit</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
           <Label>Alert For</Label>
           <Select value={form.status_filter} onValueChange={v => set('status_filter', v)}>
             <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-0">
               <SelectValue />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="lost">Lost</SelectItem>
               <SelectItem value="found_no_issues">Found - No Issues</SelectItem>
               <SelectItem value="found_injured">Found - Injured / Medical Issue</SelectItem>
               <SelectItem value="trapping_help">Trapping Help Needed</SelectItem>
             </SelectContent>
           </Select>
         </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Breed (optional)</Label>
          <Input value={form.breed} onChange={e => set('breed', e.target.value)}
            placeholder="e.g. Golden Retriever — leave blank for any breed"
            className="h-11 rounded-xl bg-slate-50 border-0" />
        </div>
      </div>

      {/* Photo Upload */}
      <div className="space-y-3">
        <Label>Reference Photos (up to 3)</Label>
        <div className="flex flex-wrap gap-3">
          {form.photo_urls?.map((url, idx) => (
            <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200">
              <img src={url} alt={`Reference ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {(form.photo_urls?.length || 0) < 3 && (
            <label className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploading}
                className="hidden"
              />
              <div className="text-center">
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" />
                ) : (
                  <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                )}
                <span className="text-xs text-slate-500">Add</span>
              </div>
            </label>
          )}
        </div>
        <p className="text-xs text-slate-500">Photos help identify specific pets or characteristics</p>
      </div>

      {/* Location + radius */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Alert Area</Label>
          <span className="text-sm font-semibold text-violet-600">{form.radius_miles} miles radius</span>
        </div>
        <AlertMapPicker
          lat={form.latitude}
          lng={form.longitude}
          radiusMiles={form.radius_miles}
          onLocationChange={handleLocationChange}
        />
        <Slider
          min={1} max={100} step={1}
          value={[form.radius_miles]}
          onValueChange={([v]) => set('radius_miles', v)}
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>1 mi</span><span>50 mi</span><span>100 mi</span>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12 rounded-xl">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}
          className="flex-1 h-12 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white font-semibold">
          {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Alert'}
        </Button>
      </div>
    </form>
  );
}