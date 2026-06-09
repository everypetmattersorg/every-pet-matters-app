import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, Home, Dog, Baby, Heart } from "lucide-react";

const PET_TYPES = ["Dog", "Cat", "Puppy", "Kitten", "Bird", "Rabbit", "Other"];

export default function FosterApplicationForm({ rescue, pet, onSuccess, onCancel }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    applicant_name: "",
    applicant_phone: "",
    home_type: "",
    has_yard: false,
    has_other_pets: false,
    other_pets_description: "",
    has_children: false,
    children_ages: "",
    experience_level: "",
    can_foster_special_needs: false,
    preferred_pet_types: [],
    availability_start: "",
    max_duration_weeks: "",
    motivation: "",
  });

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const togglePetType = (type) => {
    set("preferred_pet_types", form.preferred_pet_types.includes(type)
      ? form.preferred_pet_types.filter(t => t !== type)
      : [...form.preferred_pet_types, type]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me().catch(() => null);
      await base44.entities.FosterApplication.create({
        ...form,
        applicant_email: user?.email || "",
        rescue_email: rescue.email,
        rescue_name: rescue.name,
        pet_id: pet?.id || "",
        pet_name: pet?.name || "",
        status: "pending",
        messages: [],
      });
      setSubmitted(true);
      if (onSuccess) onSuccess();
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800 mb-2">Application Submitted!</h3>
        <p className="text-slate-500 mb-6">
          {rescue.name} will review your application and reach out soon.
        </p>
        <Button onClick={onCancel} variant="outline">Close</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex gap-2 mb-2">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? "bg-rose-500" : "bg-slate-200"}`} />
        ))}
      </div>
      <p className="text-xs text-slate-500">Step {step} of 3</p>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><Home className="w-4 h-4" /> Your Home & Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Full Name *</label>
              <Input value={form.applicant_name} onChange={e => set("applicant_name", e.target.value)} placeholder="Jane Doe" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Phone Number</label>
              <Input value={form.applicant_phone} onChange={e => set("applicant_phone", e.target.value)} placeholder="(555) 123-4567" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Home Type</label>
            <div className="flex flex-wrap gap-2">
              {["house", "apartment", "condo", "other"].map(type => (
                <button key={type} type="button" onClick={() => set("home_type", type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${form.home_type === type ? "bg-rose-500 text-white border-rose-500" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.has_yard} onChange={e => set("has_yard", e.target.checked)} className="w-4 h-4" />
              <span className="text-sm text-slate-700">Yard / outdoor space</span>
            </label>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><Dog className="w-4 h-4" /> Your Household</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.has_other_pets} onChange={e => set("has_other_pets", e.target.checked)} className="w-4 h-4" />
              <span className="text-sm text-slate-700">I have other pets</span>
            </label>
            {form.has_other_pets && (
              <Textarea value={form.other_pets_description} onChange={e => set("other_pets_description", e.target.value)}
                placeholder="Describe your pets (species, breed, age, temperament)..." className="min-h-20" />
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.has_children} onChange={e => set("has_children", e.target.checked)} className="w-4 h-4" />
              <span className="text-sm text-slate-700">Children in home</span>
            </label>
            {form.has_children && (
              <Input value={form.children_ages} onChange={e => set("children_ages", e.target.value)} placeholder="Ages of children (e.g. 4, 8, 12)" />
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Foster Experience</label>
            <div className="flex gap-2 flex-wrap">
              {[{ v: "none", l: "No experience" }, { v: "some", l: "Some experience" }, { v: "experienced", l: "Very experienced" }].map(opt => (
                <button key={opt.v} type="button" onClick={() => set("experience_level", opt.v)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${form.experience_level === opt.v ? "bg-rose-500 text-white border-rose-500" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.can_foster_special_needs} onChange={e => set("can_foster_special_needs", e.target.checked)} className="w-4 h-4" />
            <span className="text-sm text-slate-700">Open to special needs animals</span>
          </label>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><Heart className="w-4 h-4" /> Availability & Motivation</h3>
          {!pet && (
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Preferred Pet Types</label>
              <div className="flex flex-wrap gap-2">
                {PET_TYPES.map(type => (
                  <button key={type} type="button" onClick={() => togglePetType(type)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${form.preferred_pet_types.includes(type) ? "bg-rose-500 text-white border-rose-500" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Available From</label>
              <Input type="date" value={form.availability_start} onChange={e => set("availability_start", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Max Duration (weeks)</label>
              <Input type="number" value={form.max_duration_weeks} onChange={e => set("max_duration_weeks", e.target.value)} placeholder="e.g. 8" min="1" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Why do you want to foster? *</label>
            <Textarea value={form.motivation} onChange={e => set("motivation", e.target.value)}
              placeholder="Tell us a bit about why you'd like to foster..." className="min-h-28" />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-3 pt-2">
        <Button type="button" variant="outline" onClick={step === 1 ? onCancel : () => setStep(s => s - 1)}>
          {step === 1 ? "Cancel" : "Back"}
        </Button>
        {step < 3 ? (
          <Button type="button" className="bg-rose-500 hover:bg-rose-600"
            disabled={step === 1 && !form.applicant_name}
            onClick={() => setStep(s => s + 1)}>
            Next
          </Button>
        ) : (
          <Button type="button" className="bg-rose-500 hover:bg-rose-600"
            disabled={loading || !form.motivation}
            onClick={handleSubmit}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Application"}
          </Button>
        )}
      </div>
    </div>
  );
}