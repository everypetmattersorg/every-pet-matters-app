import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, Upload, Loader2 } from "lucide-react";

export default function AdoptedPetUpdateForm({ pet, rescue_email, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    update_type: "story",
    title: "",
    description: "",
    photo_url: "",
    share_with_rescue: true,
    public: false,
  });
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.AdoptedPetUpdate.create({
        adopted_pet_id: pet.id,
        adopter_email: user.email,
        rescue_email: rescue_email,
        pet_name: pet.name,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adoptedPetUpdates"] });
      onSuccess();
    },
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData({ ...formData, photo_url: file_url });
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const updateTypeLabels = {
    milestone: "Milestone (birthday, adoption anniversary, etc)",
    health: "Health Update",
    behavior: "Behavior & Training",
    story: "Success Story",
    photo: "Photo Update",
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Update on {pet.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Update Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              Update Type
            </label>
            <select
              value={formData.update_type}
              onChange={(e) => setFormData({ ...formData, update_type: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {Object.entries(updateTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., First Vet Visit Success!"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell us about this update..."
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
            />
          </div>

          {/* Photo */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              Photo (Optional)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 cursor-pointer">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                  {uploading ? (
                    <Loader2 className="w-5 h-5 mx-auto animate-spin text-slate-400" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mx-auto mb-2 text-slate-400" />
                      <p className="text-sm text-slate-600">Click to upload</p>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </div>
              </label>
              {formData.photo_url && (
                <div className="w-24 h-24 rounded-lg overflow-hidden">
                  <img
                    src={formData.photo_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Share Settings */}
          <div className="space-y-3 bg-slate-50 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.share_with_rescue}
                onChange={(e) => setFormData({ ...formData, share_with_rescue: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-sm text-slate-900">Share update with rescue organization</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.public}
                onChange={(e) => setFormData({ ...formData, public: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-sm text-slate-900">Make this update public on rescue profile</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-rose-600 hover:bg-rose-700 rounded-lg"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sharing...
                </>
              ) : (
                "Share Update"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}