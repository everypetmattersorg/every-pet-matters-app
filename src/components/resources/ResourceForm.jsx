import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { X, Loader2, Upload } from "lucide-react";

const ORG_SERVICE_OPTIONS = [
  "Low-cost vet care", "Free vet care", "Pet food bank", "Pet supplies",
  "Housing assistance", "Emergency boarding", "Spay/neuter assistance", "Microchipping", "Other"
];

export default function ResourceForm({ onSaved, onClose }) {
  const [form, setForm] = useState({
    category: "article",
    title: "",
    summary: "",
    content: "",
    tags: "",
    photo_url: "",
    author_name: "",
    location: "everywhere",
    local_city: "",
    local_state: "",
    org_name: "",
    org_address: "",
    org_city: "",
    org_state: "",
    org_phone: "",
    org_website: "",
    org_services: [],
    group_platform: "",
    group_url: "",
    is_published: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const toggleService = (s) => {
    set("org_services", form.org_services.includes(s)
      ? form.org_services.filter(x => x !== s)
      : [...form.org_services, s]);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("photo_url", file_url);
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = {
      ...form,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      status: "pending",
      submitted_by_email: user?.email,
      submitted_by_name: user?.full_name || user?.email.split("@")[0],
    };
    await base44.entities.Resource.create(data);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-slate-800">Add Resource</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label>Type</Label>
            <Select value={form.category} onValueChange={v => set("category", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="article">Blog / Article</SelectItem>
                <SelectItem value="organization">Local Organization</SelectItem>
                <SelectItem value="social_group">Social Media Group</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Title *</Label>
            <Input required className="mt-1" value={form.title} onChange={e => set("title", e.target.value)} placeholder="Resource title" style={{ textTransform: 'lowercase' }} />
          </div>

          <div>
            <Label>Summary</Label>
            <Input className="mt-1" value={form.summary} onChange={e => set("summary", e.target.value)} placeholder="Short description" style={{ textTransform: 'lowercase' }} />
          </div>

          <div>
            <Label>Availability</Label>
            <Select value={form.location} onValueChange={v => set("location", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="everywhere">Available Everywhere</SelectItem>
                <SelectItem value="local">Local / Specific Area</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.location === "local" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>City</Label>
                <Input className="mt-1" value={form.local_city} onChange={e => set("local_city", e.target.value)} placeholder="e.g. Phoenix" style={{ textTransform: 'lowercase' }} />
              </div>
              <div>
                <Label>State</Label>
                <Input className="mt-1" value={form.local_state} onChange={e => set("local_state", e.target.value)} placeholder="e.g. AZ" style={{ textTransform: 'lowercase' }} />
              </div>
            </div>
          )}

          {form.category === "article" && (
            <>
              <div>
                <Label>Content</Label>
                <Textarea className="mt-1 min-h-[140px]" value={form.content} onChange={e => set("content", e.target.value)} placeholder="Full article body..." style={{ textTransform: 'lowercase' }} />
              </div>
              <div>
                <Label>Author Name</Label>
                <Input className="mt-1" value={form.author_name} onChange={e => set("author_name", e.target.value)} style={{ textTransform: 'lowercase' }} />
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input className="mt-1" value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="e.g. nutrition, housing, vet care" style={{ textTransform: 'lowercase' }} />
              </div>
            </>
          )}

          {form.category === "organization" && (
           <>
             <div>
               <Label>Organization Name</Label>
               <Input className="mt-1" value={form.org_name} onChange={e => set("org_name", e.target.value)} style={{ textTransform: 'lowercase' }} />
             </div>
             <div className="grid grid-cols-2 gap-3">
               <div>
                 <Label>Address</Label>
                 <Input className="mt-1" value={form.org_address} onChange={e => set("org_address", e.target.value)} style={{ textTransform: 'lowercase' }} />
               </div>
               <div>
                 <Label>City</Label>
                 <Input className="mt-1" value={form.org_city} onChange={e => set("org_city", e.target.value)} style={{ textTransform: 'lowercase' }} />
               </div>
               <div>
                 <Label>State</Label>
                 <Input className="mt-1" value={form.org_state} onChange={e => set("org_state", e.target.value)} style={{ textTransform: 'lowercase' }} />
               </div>
               <div>
                 <Label>Phone</Label>
                 <Input className="mt-1" value={form.org_phone} onChange={e => set("org_phone", e.target.value)} style={{ textTransform: 'lowercase' }} />
               </div>
             </div>
             <div>
               <Label>Website</Label>
               <Input className="mt-1" value={form.org_website} onChange={e => set("org_website", e.target.value)} placeholder="https://..." style={{ textTransform: 'lowercase' }} />
             </div>
             <div>
               <Label>Services Offered</Label>
               <div className="flex flex-wrap gap-2 mt-2">
                 {ORG_SERVICE_OPTIONS.map(s => (
                   <button
                     key={s} type="button"
                     onClick={() => toggleService(s)}
                     className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.org_services.includes(s) ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400"}`}
                   >{s}</button>
                 ))}
               </div>
             </div>
           </>
          )}

          {form.category === "social_group" && (
           <>
             <div>
               <Label>Group Name</Label>
               <Input className="mt-1" value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Phoenix Dog Lovers" style={{ textTransform: 'lowercase' }} />
             </div>
             <div>
               <Label>Platform</Label>
               <Select value={form.group_platform} onValueChange={v => set("group_platform", v)}>
                 <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="facebook">Facebook</SelectItem>
                   <SelectItem value="nextdoor">Nextdoor</SelectItem>
                   <SelectItem value="reddit">Reddit</SelectItem>
                   <SelectItem value="discord">Discord</SelectItem>
                   <SelectItem value="slack">Slack</SelectItem>
                   <SelectItem value="other">Other</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div>
               <Label>Group URL</Label>
               <Input className="mt-1" value={form.group_url} onChange={e => set("group_url", e.target.value)} placeholder="https://..." style={{ textTransform: 'lowercase' }} />
             </div>
           </>
          )}

          <div>
            <Label>Cover Image</Label>
            <div className="flex gap-2 mt-1">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <Upload className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">Upload Image</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            </div>
            {form.photo_url && (
              <div className="mt-2 relative w-32 h-24 rounded-lg overflow-hidden">
                <img src={form.photo_url} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => set("photo_url", "")}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded p-0.5 hover:bg-red-700">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving} style={{ backgroundColor: '#b1511d' }} className="hover:opacity-90">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Resource
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}