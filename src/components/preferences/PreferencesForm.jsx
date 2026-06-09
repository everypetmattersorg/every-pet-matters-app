import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

export default function PreferencesForm({ preferences, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(preferences || {
    living_situation: "apartment",
    household_size: 1,
    have_kids: false,
    have_pets: false,
    experience_level: "beginner",
    activity_level: "moderate",
    time_availability: "moderate",
    preferred_pet_types: [],
    preferred_age: "any",
    preferred_size: [],
    allergies: false,
    lifestyle_notes: ""
  });

  const petTypes = ["dog", "cat", "bird", "rabbit", "other"];
  const sizes = ["small", "medium", "large"];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field) => {
    setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handlePetTypeToggle = (type) => {
    const updated = formData.preferred_pet_types.includes(type) ?
    formData.preferred_pet_types.filter((t) => t !== type) :
    [...formData.preferred_pet_types, type];
    handleInputChange("preferred_pet_types", updated);
  };

  const handleSizeToggle = (size) => {
    const updated = formData.preferred_size.includes(size) ?
    formData.preferred_size.filter((s) => s !== size) :
    [...formData.preferred_size, size];
    handleInputChange("preferred_size", updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await base44.auth.updateMe({
        preferences: formData
      });
      onSaved?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Living Situation */}
      <div>
        <h3 className="font-semibold text-slate-800 mb-4">describe your living situation</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-1 block">Home Type</Label>
            <select
              value={formData.living_situation}
              onChange={(e) => handleInputChange("living_situation", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              
              <option value="apartment">Apartment</option>
              <option value="house_small">Small House</option>
              <option value="house_large">Large House</option>
              <option value="farm">Farm/Rural</option>
            </select>
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700 mb-1 block">Household Size</Label>
            <Input
              type="number"
              min="1"
              value={formData.household_size}
              onChange={(e) => handleInputChange("household_size", parseInt(e.target.value))}
              placeholder="Number of people" />
            
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={formData.have_kids}
              onCheckedChange={() => handleCheckboxChange("have_kids")} />
            
            <span className="text-sm text-slate-700">I have children</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={formData.have_pets}
              onCheckedChange={() => handleCheckboxChange("have_pets")} />
            
            <span className="text-sm text-slate-700">I have other pets</span>
          </label>
        </div>
      </div>

      {/* Experience & Activity */}
      <div className="border-t pt-6">
        <h3 className="font-semibold text-slate-800 mb-4">Experience & Lifestyle</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-1 block">Pet Experience</Label>
            <select
              value={formData.experience_level}
              onChange={(e) => handleInputChange("experience_level", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              
              <option value="beginner">First-time pet owner</option>
              <option value="intermediate">Some experience</option>
              <option value="experienced">Very experienced</option>
            </select>
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700 mb-1 block">Activity Level</Label>
            <select
              value={formData.activity_level}
              onChange={(e) => handleInputChange("activity_level", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              
              <option value="low">Low - Prefer quiet home</option>
              <option value="moderate">Moderate - Regular outdoor activities</option>
              <option value="high">High - Very active lifestyle</option>
            </select>
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700 mb-1 block">Time Availability</Label>
            <select
              value={formData.time_availability}
              onChange={(e) => handleInputChange("time_availability", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              
              <option value="low">Limited - Busy schedule</option>
              <option value="moderate">Moderate - Some time daily</option>
              <option value="high">High - Lots of free time</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={formData.allergies}
              onCheckedChange={() => handleCheckboxChange("allergies")} />
            
            <span className="text-sm text-slate-700">I have pet allergies</span>
          </label>
        </div>
      </div>

      {/* Pet Preferences */}
      <div className="border-t pt-6">
        <h3 className="font-semibold text-slate-800 mb-4">Pet Preferences</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-3 block">Pet Types (Select all that interest you)</Label>
            <div className="space-y-2">
              {petTypes.map((type) =>
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                  checked={formData.preferred_pet_types.includes(type)}
                  onCheckedChange={() => handlePetTypeToggle(type)} />
                
                  <span className="text-sm text-slate-700">{type}</span>
                </label>
              )}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700 mb-1 block">Preferred Age</Label>
            <select
              value={formData.preferred_age}
              onChange={(e) => handleInputChange("preferred_age", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              
              <option value="any">Any age</option>
              <option value="kitten_puppy">Young (kitten/puppy)</option>
              <option value="young_adult">Young Adult (1-3 years)</option>
              <option value="adult">Adult (3-7 years)</option>
              <option value="senior">Senior (7+ years)</option>
            </select>
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700 mb-3 block">Preferred Size</Label>
            <div className="space-y-2">
              {sizes.map((size) =>
              <label key={size} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                  checked={formData.preferred_size.includes(size)}
                  onCheckedChange={() => handleSizeToggle(size)} />
                
                  <span className="text-sm text-slate-700">{size}</span>
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="border-t pt-6">
        <Label className="text-sm font-medium text-slate-700 mb-2 block">Anything else we should know?</Label>
        <Textarea
          placeholder="Tell us about your lifestyle, what you're looking for in a pet, any special requirements, etc."
          value={formData.lifestyle_notes}
          onChange={(e) => handleInputChange("lifestyle_notes", e.target.value)}
          className="h-20" />
        
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-primary hover:bg-primary/90">
        
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Save Preferences
      </Button>
    </form>);

}