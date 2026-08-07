import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, Camera, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PetForm({ initialData, onSubmit, isSubmitting, formType }) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    status: formType === 'lost' ? 'lost' : 'found',
    pet_type: '',
    breed: '',
    color: '',
    size: '',
    gender: 'unknown',
    description: '',
    photo_urls: [],
    city: '',
    state: '',
    location_description: '',
    date_lost_found: new Date().toISOString().split('T')[0],
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    has_collar: false,
    is_microchipped: false,
    special_notes: '',
    allow_email_contact: false
  });
  
  const [uploading, setUploading] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [emailOptions, setEmailOptions] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(true);

  useEffect(() => {
    fetchEmailOptions();
  }, []);

  const fetchEmailOptions = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) return;
      
      const options = [{ label: user.email, value: user.email }];
      
      const cloaked = await base44.entities.CloakedEmail.filter(
        { user_email: user.email, is_active: true },
        '-created_at',
        1
      );
      
      if (cloaked.length > 0) {
        options.push({ label: cloaked[0].cloaked_email, value: cloaked[0].cloaked_email });
      }
      
      setEmailOptions(options);
      if (!formData.contact_email && options.length > 0) {
        handleChange('contact_email', options[0].value);
      }
    } catch (error) {
      console.error('Error fetching email options:', error);
    } finally {
      setLoadingEmails(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, photo_urls: [...prev.photo_urls, file_url] }));

      // Only auto-identify on first photo
      if (formData.photo_urls.length === 0) {
        setIdentifying(true);
        try {
          const res = await fetch('/api/invoke-llm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: `Look at this pet photo and identify the breed. Return only a JSON object with fields: pet_type (one of: dog, cat, bird, rabbit, other), breed (specific breed name or mix), color (primary color/markings). Be concise.`,
              file_urls: [file_url],
              response_json_schema: { type: 'object', properties: { pet_type: { type: 'string' }, breed: { type: 'string' }, color: { type: 'string' } } }
            })
          });
          const data = await res.json();
          const result = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          if (result) {
            setFormData(prev => ({
              ...prev,
              pet_type: result.pet_type || prev.pet_type,
              breed: result.breed || prev.breed,
              color: result.color || prev.color
            }));
          }
        } catch {
          // auto-identify failed silently, user can fill in manually
        }
        setIdentifying(false);
      }
    } catch (err) {
      console.error('Photo upload failed:', err);
      alert('Photo upload failed. Please try again.');
    }
    setUploading(false);
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photo_urls: prev.photo_urls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Geocode the location using Nominatim
    let geoData = {};
    const locationQuery = `${formData.city}, ${formData.state}`;
    if (locationQuery.trim() !== ',') {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery)}&format=json&limit=1`
      );
      const results = await res.json();
      if (results.length > 0) {
        geoData = { latitude: parseFloat(results[0].lat), longitude: parseFloat(results[0].lon) };
      }
    }
    onSubmit({ ...formData, ...geoData });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Photo Upload */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">Pet Photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!identifying && <p className="text-sm text-slate-500">a clear photo helps identify the pet you've found -- we will do our best to match these photos with any lost pet listings we have in our database. you can upload multiple photos.</p>}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {formData.photo_urls.map((url, index) => (
              <div key={index} className="relative group">
                <img src={url} alt={`Pet ${index + 1}`} className="w-full h-32 object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => document.getElementById('photo-upload').click()}
              disabled={uploading}
              className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center h-32 hover:border-slate-400 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-slate-400" />
              )}
            </button>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
            id="photo-upload"
            multiple
          />
          {identifying && (
            <p className="text-sm text-violet-600 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Identifying breed with AI...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pet Details */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">Pet Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Pet Name (if known)</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter pet's name"
                className="h-12 rounded-xl bg-slate-50 border-0"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Pet Type *</Label>
              <Select value={formData.pet_type} onValueChange={(v) => handleChange('pet_type', v)}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-0">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dog">🐕 Dog</SelectItem>
                  <SelectItem value="cat">🐱 Cat</SelectItem>
                  <SelectItem value="bird">🐦 Bird</SelectItem>
                  <SelectItem value="rabbit">🐰 Rabbit</SelectItem>
                  <SelectItem value="other">🐾 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Breed</Label>
              <Input
                value={formData.breed}
                onChange={(e) => handleChange('breed', e.target.value)}
                placeholder="e.g., Golden Retriever"
                className="h-12 rounded-xl bg-slate-50 border-0"
              />
            </div>

            <div className="space-y-2">
              <Label>Color/Markings</Label>
              <Input
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                placeholder="e.g., Brown with white spots"
                className="h-12 rounded-xl bg-slate-50 border-0"
              />
            </div>

            <div className="space-y-2">
              <Label>Size</Label>
              <Select value={formData.size} onValueChange={(v) => handleChange('size', v)}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-0">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (under 20 lbs)</SelectItem>
                  <SelectItem value="medium">Medium (20-50 lbs)</SelectItem>
                  <SelectItem value="large">Large (over 50 lbs)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-0">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the pet in detail - any unique features, personality traits, etc."
              className="min-h-24 rounded-xl bg-slate-50 border-0"
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.has_collar}
                onCheckedChange={(v) => handleChange('has_collar', v)}
              />
              <Label>Has collar/tags</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_microchipped}
                onCheckedChange={(v) => handleChange('is_microchipped', v)}
              />
              <Label>Microchipped</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location & Date */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">
            {formType === 'lost' ? 'Last Seen' : 'Found Location'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>City *</Label>
              <Input
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="e.g., Phoenix"
                className="h-12 rounded-xl bg-slate-50 border-0"
              />
            </div>
            <div className="space-y-2">
              <Label>State *</Label>
              <Input
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                placeholder="e.g., AZ"
                className="h-12 rounded-xl bg-slate-50 border-0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Describe the Location</Label>
            <Textarea
              value={formData.location_description}
              onChange={(e) => handleChange('location_description', e.target.value)}
              placeholder="Cross streets, park name, neighborhood, nearby landmarks, etc."
              className="min-h-20 rounded-xl bg-slate-50 border-0"
            />
          </div>

          <div className="space-y-2">
            <Label>{formType === 'lost' ? 'Date Last Seen' : 'Date Found'} *</Label>
            <Input
              type="date"
              value={formData.date_lost_found}
              onChange={(e) => handleChange('date_lost_found', e.target.value)}
              className="h-12 rounded-xl bg-slate-50 border-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">Contact Information</CardTitle>
          <p className="text-sm text-slate-500 mt-1">This information will be cloaked until you approve of a message connection in your account through the notifications tab.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Your Name *</Label>
              <Input
                value={formData.contact_name}
                onChange={(e) => handleChange('contact_name', e.target.value)}
                placeholder="Your first name"
                className="h-12 rounded-xl bg-slate-50 border-0"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={formData.contact_phone}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                placeholder="(555) 123-4567"
                className="h-12 rounded-xl bg-slate-50 border-0"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              {loadingEmails ? (
                <div className="h-12 rounded-xl bg-slate-50 border-0 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </div>
              ) : (
                <Select value={formData.contact_email} onValueChange={(v) => handleChange('contact_email', v)}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-0">
                    <SelectValue placeholder="Select email" />
                  </SelectTrigger>
                  <SelectContent>
                    {emailOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Special Notes</Label>
            <Textarea
              value={formData.special_notes}
              onChange={(e) => handleChange('special_notes', e.target.value)}
              placeholder="Medical conditions, behavioral notes, or reward information"
              className="min-h-20 rounded-xl bg-slate-50 border-0"
            />
          </div>

          <div className="flex items-start gap-3 pt-4 border-t border-slate-200">
            <Switch
              checked={formData.allow_email_contact}
              onCheckedChange={(v) => handleChange('allow_email_contact', v)}
            />
            <Label className="text-sm leading-relaxed">I allow other users to reach out to me via email (which will be cloaked and forwarded to my email address) in order to help reunite this pet with its owner.</Label>
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-14 text-lg font-semibold rounded-xl text-white"
        style={{ background: '#b1511d' }}
        onMouseEnter={(e) => e.target.style.background = '#8f3f15'}
        onMouseLeave={(e) => e.target.style.background = '#b1511d'}
      >
        {isSubmitting ? (
          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</>
        ) : (
          `Report ${formType === 'lost' ? 'Lost' : 'Found'} Pet`
        )}
      </Button>
    </form>
  );
}