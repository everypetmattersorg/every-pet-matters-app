import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Upload, ExternalLink } from "lucide-react";

export default function SponsorsEditor({ sponsors = [], onChange }) {
  const [uploading, setUploading] = useState(null);

  const addSponsor = () => {
    onChange([...sponsors, { name: "", url: "", photo_url: "" }]);
  };

  const updateSponsor = (idx, field, value) => {
    const updated = sponsors.map((s, i) => i === idx ? { ...s, [field]: value } : s);
    onChange(updated);
  };

  const removeSponsor = (idx) => {
    onChange(sponsors.filter((_, i) => i !== idx));
  };

  const handlePhotoUpload = async (e, idx) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(idx);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    updateSponsor(idx, "photo_url", file_url);
    setUploading(null);
  };

  return (
    <div className="space-y-4">
      {sponsors.map((sponsor, idx) => (
        <div key={idx} className="flex flex-col sm:flex-row gap-3 p-4 bg-white border border-slate-200 rounded-xl">
          {/* Photo */}
          <div className="flex flex-col items-center gap-2">
            {sponsor.photo_url ? (
              <img src={sponsor.photo_url} alt={sponsor.name} className="w-16 h-16 rounded-lg object-contain border border-slate-100" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs text-center">Logo</div>
            )}
            <label className="cursor-pointer text-xs text-blue-600 hover:underline flex items-center gap-1">
              <Upload className="w-3 h-3" />
              {uploading === idx ? "Uploading..." : "Upload"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, idx)} disabled={uploading === idx} />
            </label>
          </div>

          {/* Fields */}
          <div className="flex-1 space-y-2">
            <Input
              placeholder="Sponsor name"
              value={sponsor.name}
              onChange={(e) => updateSponsor(idx, "name", e.target.value)}
            />
            <Input
              placeholder="https://sponsor-website.com"
              value={sponsor.url}
              onChange={(e) => updateSponsor(idx, "url", e.target.value)}
            />
          </div>

          <Button type="button" variant="ghost" size="icon" onClick={() => removeSponsor(idx)} className="text-red-400 hover:text-red-600 self-start">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addSponsor} className="w-full">
        <Plus className="w-4 h-4 mr-2" /> Add Sponsor
      </Button>
    </div>
  );
}