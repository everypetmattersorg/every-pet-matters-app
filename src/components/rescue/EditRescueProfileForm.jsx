import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, AlertCircle, CheckCircle, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import RescueGalleryManager from './RescueGalleryManager';
import SponsorsEditor from './SponsorsEditor';

export default function EditRescueProfileForm({ rescue, userEmail, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(rescue || {
    name: '',
    email: userEmail || '',
    org_type: 'rescue',
    phone: '',
    website: '',
    address: '',
    about: '',
    mission_statement: '',
    services_offered: [],
    gallery_photos: [],
    gallery_videos: [],
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    youtube_url: '',
    logo_url: '',
    banner_url: '',
    accepts_volunteers: false,
    volunteer_info: '',
    fosters_needed: false,
    sponsors: [],
    foster_network_size: '',
    transport_available: false,
    shelter_capacity: '',
    current_occupancy: '',
    intake_types: [],
    open_hours: '',
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, [field]: file_url }));
    } catch (err) {
      setError('Failed to upload image');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (rescue?.id) {
        await base44.entities.Rescue.update(rescue.id, formData);
      } else {
        await base44.entities.Rescue.create({ ...formData, email: formData.email || userEmail });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      if (onSaved) onSaved();
    } catch (err) {
      setError('Failed to save profile. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Messages */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-700">Profile updated successfully!</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Org Type Selector */}
      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-2">Organization Type</label>
        <div className="flex gap-3">
          {[{ value: 'rescue', label: '🐾 Rescue', desc: 'Foster-based, no physical shelter' }, { value: 'shelter', label: '🏠 Shelter', desc: 'Physical facility with housed animals' }].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, org_type: opt.value }))}
              className={`flex-1 p-4 rounded-xl border-2 text-left transition ${formData.org_type === opt.value ? 'border-rose-500 bg-rose-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="font-semibold text-slate-800">{opt.label}</div>
              <div className="text-xs text-slate-500 mt-1">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-2">{formData.org_type === 'shelter' ? 'Shelter' : 'Rescue'} Logo</label>
        <div className="flex gap-4">
          {formData.logo_url && (
            <img src={formData.logo_url} alt="Logo" className="w-24 h-24 rounded-lg object-cover" />
          )}
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'logo_url')}
              className="hidden"
              id="logo-input"
              disabled={loading}
            />
            <label
              htmlFor="logo-input"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition"
            >
              <Upload className="w-4 h-4" />
              Upload Logo
            </label>
          </div>
        </div>
      </div>

      {/* Banner Upload */}
      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-2">Rescue Banner</label>
        {formData.banner_url && (
          <img src={formData.banner_url} alt="Banner" className="w-full h-48 rounded-lg object-cover mb-3" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload(e, 'banner_url')}
          className="hidden"
          id="banner-input"
          disabled={loading}
        />
        <label
          htmlFor="banner-input"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition"
        >
          <Upload className="w-4 h-4" />
          Upload Banner
        </label>
      </div>

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800">Basic Information</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name</label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Happy Paws Rescue"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <Input
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
            <Input
              name="website"
              type="url"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Street Address</label>
          <Input
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="123 Main St"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
            <Input
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="New York"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
            <Input
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              placeholder="NY"
              maxLength="2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ZIP Code</label>
            <Input
              name="zip"
              value={formData.zip}
              onChange={handleInputChange}
              placeholder="10001"
            />
          </div>
        </div>
      </div>

      {/* Mission & About */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800">Mission & Services</h3>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mission Statement</label>
          <Input
            name="mission_statement"
            value={formData.mission_statement}
            onChange={handleInputChange}
            placeholder="e.g., To provide safe haven for abandoned animals..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Services Offered</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {['Spay/Neuter', 'Microchipping', 'Rehabilitation', 'Vaccination', 'Behavioral Training', 'Adoption Counseling', 'Emergency Care', 'Foster Program'].map(service => (
              <button
                key={service}
                type="button"
                onClick={() => {
                  const services = formData.services_offered || [];
                  const updated = services.includes(service)
                    ? services.filter(s => s !== service)
                    : [...services, service];
                  setFormData(prev => ({ ...prev, services_offered: updated }));
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  (formData.services_offered || []).includes(service)
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {service}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">About & History</label>
          <Textarea
            name="about"
            value={formData.about}
            onChange={handleInputChange}
            placeholder="Tell us about your rescue's mission, history, and impact..."
            className="min-h-24"
          />
        </div>
      </div>

      {/* Gallery */}
      <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
        <h3 className="font-semibold text-slate-800">Media Gallery</h3>
        <RescueGalleryManager
          photos={formData.gallery_photos || []}
          videos={formData.gallery_videos || []}
          onPhotosChange={(photos) => setFormData(prev => ({ ...prev, gallery_photos: photos }))}
          onVideosChange={(videos) => setFormData(prev => ({ ...prev, gallery_videos: videos }))}
        />
      </div>

      {/* Social Media */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800">Social Media Profiles</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
              <Facebook className="w-4 h-4" /> Facebook
            </label>
            <Input
              name="facebook_url"
              type="url"
              value={formData.facebook_url}
              onChange={handleInputChange}
              placeholder="https://facebook.com/yourpage"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
              <Instagram className="w-4 h-4" /> Instagram
            </label>
            <Input
              name="instagram_url"
              type="url"
              value={formData.instagram_url}
              onChange={handleInputChange}
              placeholder="https://instagram.com/yourhandle"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
              <Twitter className="w-4 h-4" /> Twitter/X
            </label>
            <Input
              name="twitter_url"
              type="url"
              value={formData.twitter_url}
              onChange={handleInputChange}
              placeholder="https://twitter.com/yourhandle"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
              <Youtube className="w-4 h-4" /> YouTube
            </label>
            <Input
              name="youtube_url"
              type="url"
              value={formData.youtube_url}
              onChange={handleInputChange}
              placeholder="https://youtube.com/yourchannel"
            />
          </div>
        </div>
      </div>

      {/* Rescue-specific fields */}
      {formData.org_type === 'rescue' && (
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-slate-800">Rescue Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Active Foster Homes</label>
              <Input
                name="foster_network_size"
                type="number"
                value={formData.foster_network_size}
                onChange={handleInputChange}
                placeholder="e.g. 30"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="transport"
                name="transport_available"
                checked={formData.transport_available}
                onChange={handleInputChange}
                className="w-4 h-4 cursor-pointer"
              />
              <label htmlFor="transport" className="text-sm font-medium text-slate-800 cursor-pointer">Transport available for pets</label>
            </div>
          </div>
        </div>
      )}

      {/* Shelter-specific fields */}
      {formData.org_type === 'shelter' && (
        <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
          <h3 className="font-semibold text-slate-800">Shelter Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total Capacity</label>
              <Input
                name="shelter_capacity"
                type="number"
                value={formData.shelter_capacity}
                onChange={handleInputChange}
                placeholder="e.g. 150"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Occupancy</label>
              <Input
                name="current_occupancy"
                type="number"
                value={formData.current_occupancy}
                onChange={handleInputChange}
                placeholder="e.g. 95"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Public Hours</label>
            <Input
              name="open_hours"
              value={formData.open_hours}
              onChange={handleInputChange}
              placeholder="e.g. Mon–Sat 10am–5pm, Sun 12–4pm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Intake Types Accepted</label>
            <div className="flex flex-wrap gap-2">
              {['Stray', 'Owner Surrender', 'Transfer', 'Cruelty/Neglect', 'Wildlife'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    const current = formData.intake_types || [];
                    const updated = current.includes(type)
                      ? current.filter(t => t !== type)
                      : [...current, type];
                    setFormData(prev => ({ ...prev, intake_types: updated }));
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    (formData.intake_types || []).includes(type)
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Volunteer Info */}
      <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="volunteers"
            name="accepts_volunteers"
            checked={formData.accepts_volunteers}
            onChange={handleInputChange}
            className="w-4 h-4 cursor-pointer"
          />
          <label htmlFor="volunteers" className="text-sm font-medium text-slate-800 cursor-pointer">
            We accept volunteers
          </label>
        </div>

        {formData.accepts_volunteers && (
          <>
            <div className="flex items-center gap-3 pl-7">
              <input
                type="checkbox"
                id="fosters"
                name="fosters_needed"
                checked={formData.fosters_needed}
                onChange={handleInputChange}
                className="w-4 h-4 cursor-pointer"
              />
              <label htmlFor="fosters" className="text-sm font-medium text-slate-800 cursor-pointer">
                Fosters needed
              </label>
            </div>

            <Textarea
              name="volunteer_info"
              value={formData.volunteer_info}
              onChange={handleInputChange}
              placeholder="Describe your volunteer opportunities and how people can get involved..."
              className="min-h-24"
            />
          </>
        )}
      </div>

      {/* Sponsors */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800">Sponsors</h3>
        <p className="text-sm text-slate-500">Add sponsors with their logo and website link.</p>
        <SponsorsEditor
          sponsors={formData.sponsors || []}
          onChange={(sponsors) => setFormData(prev => ({ ...prev, sponsors }))}
        />
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-rose-600 hover:bg-rose-700 rounded-xl"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Profile'
          )}
        </Button>
      </div>
    </form>
  );
}