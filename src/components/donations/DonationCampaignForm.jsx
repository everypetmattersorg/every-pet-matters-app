import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function DonationCampaignForm({ campaign, rescueEmail, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: campaign?.title || '',
    description: campaign?.description || '',
    target_amount: campaign?.target_amount || '',
    deadline: campaign?.deadline || '',
    image_url: campaign?.image_url || '',
    is_active: campaign?.is_active !== false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: file_url }));
    } catch (err) {
      setError('Failed to upload image');
      console.error(err);
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate
      if (!formData.title || !formData.target_amount) {
        setError('Please fill in required fields');
        setLoading(false);
        return;
      }

      const campaignData = {
        rescue_email: rescueEmail,
        title: formData.title,
        description: formData.description,
        target_amount: parseFloat(formData.target_amount),
        deadline: formData.deadline || null,
        image_url: formData.image_url || null,
        is_active: formData.is_active,
        current_amount: campaign?.current_amount || 0,
      };

      if (campaign?.id) {
        // Update existing
        await base44.entities.DonationGoal.update(campaign.id, campaignData);
      } else {
        // Create new
        await base44.entities.DonationGoal.create(campaignData);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to save campaign');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-700">Campaign {campaign ? 'updated' : 'created'} successfully!</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Title *</label>
          <Input
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g., New Shelter Expansion Fund"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Target Amount (USD) *</label>
          <Input
            name="target_amount"
            type="number"
            min="1"
            step="0.01"
            value={formData.target_amount}
            onChange={handleInputChange}
            placeholder="10000"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <Textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Explain why you're raising funds and how the money will be used..."
          className="min-h-24"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
          <Input
            name="deadline"
            type="date"
            value={formData.deadline}
            onChange={handleInputChange}
          />
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-medium text-slate-700">Active Campaign</span>
          </label>
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">Campaign Image</label>
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-rose-400 transition">
          {formData.image_url ? (
            <div>
              <img src={formData.image_url} alt="Campaign" className="h-40 w-full object-cover rounded-lg mb-3" />
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 cursor-pointer transition font-medium">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Uploading...' : 'Change Image'}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
          ) : (
            <label className="cursor-pointer">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700 mb-1">Upload campaign image</p>
              <p className="text-xs text-slate-500">JPG, PNG up to 5MB</p>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading || uploading}
          className="flex-1 bg-rose-600 hover:bg-rose-700 gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              {campaign ? 'Update' : 'Create'} Campaign
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading || uploading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}