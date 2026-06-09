import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Upload, Loader2 } from "lucide-react";

export default function AddAdoptablePetForm({ onSaved, onClose, user, petToEdit }) {
  const [currentUser, setCurrentUser] = useState(user);
  const isAuthorizedForUrgent = currentUser?.role && ["admin", "shelter", "rescue"].includes(currentUser.role);

  useEffect(() => {
    if (!currentUser) {
      base44.auth.me().then(setCurrentUser).catch(() => {});
    }
  }, [currentUser]);
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  
  const initialFormData = {
    name: "",
    pet_type: "",
    breed: "",
    age_years: "",
    age_months: "",
    gender: "unknown",
    weight_lbs: "",
    color: "",
    description: "",
    photo_url: "",
    extra_photos: [],
    rescue_name: user?.profile_data?.rescue_shelter_name || "",
    rescue_email: user?.email || "",
    rescue_phone: user?.profile_data?.phone || "",
    rescue_website: "",
    rescue_city: user?.profile_data?.city || "",
    rescue_state: user?.profile_data?.state || "",
    foster_url: "",
    is_urgent: false,
    urgency_reason: "",
    e_list_date: "",
    good_with_kids: false,
    good_with_dogs: false,
    good_with_cats: false,
    energy_level: "medium",
    special_needs: false,
    special_needs_description: "",
    adoption_fee: "",
  };

  const [formData, setFormData] = useState(() => {
    if (petToEdit) {
      return {
        ...initialFormData,
        name: petToEdit.name || "",
        pet_type: petToEdit.pet_type || "",
        breed: petToEdit.breed || "",
        age_years: petToEdit.age_years ? String(petToEdit.age_years) : "",
        age_months: petToEdit.age_months ? String(petToEdit.age_months) : "",
        gender: petToEdit.gender || "unknown",
        weight_lbs: petToEdit.weight_lbs ? String(petToEdit.weight_lbs) : "",
        color: petToEdit.color || "",
        description: petToEdit.description || "",
        photo_url: petToEdit.photo_url || "",
        extra_photos: petToEdit.extra_photos || [],
        rescue_name: petToEdit.rescue_name || user?.profile_data?.rescue_shelter_name || "",
        rescue_email: petToEdit.rescue_email || user?.email || "",
        rescue_phone: petToEdit.rescue_phone || user?.profile_data?.phone || "",
        rescue_website: petToEdit.rescue_website || "",
        rescue_city: petToEdit.rescue_city || user?.profile_data?.city || "",
        rescue_state: petToEdit.rescue_state || user?.profile_data?.state || "",
        foster_url: petToEdit.foster_url || "",
        is_urgent: petToEdit.is_urgent || false,
        urgency_reason: petToEdit.urgency_reason || "",
        e_list_date: petToEdit.e_list_date || "",
        good_with_kids: petToEdit.good_with_kids || false,
        good_with_dogs: petToEdit.good_with_dogs || false,
        good_with_cats: petToEdit.good_with_cats || false,
        energy_level: petToEdit.energy_level || "medium",
        special_needs: petToEdit.special_needs || false,
        special_needs_description: petToEdit.special_needs_description || "",
        adoption_fee: petToEdit.adoption_fee ? String(petToEdit.adoption_fee) : "",
      };
    }
    return initialFormData;
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handlePhotoUpload = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setPhotoLoading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      if (index === 0) {
        handleInputChange("photo_url", file_url);
      } else {
        const newExtraPhotos = [...formData.extra_photos];
        newExtraPhotos[index - 1] = file_url;
        handleInputChange("extra_photos", newExtraPhotos);
      }
    } finally {
      setPhotoLoading(false);
    }
  };

  const removePhoto = (index) => {
    if (index === 0) {
      handleInputChange("photo_url", "");
    } else {
      const newExtraPhotos = formData.extra_photos.filter((_, i) => i !== index - 1);
      handleInputChange("extra_photos", newExtraPhotos);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.pet_type || !formData.rescue_name) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const submitData = {
        ...formData,
        age_years: formData.age_years ? parseInt(formData.age_years) : null,
        age_months: formData.age_months ? parseInt(formData.age_months) : null,
        weight_lbs: formData.weight_lbs ? parseFloat(formData.weight_lbs) : null,
        adoption_fee: formData.adoption_fee ? parseFloat(formData.adoption_fee) : null,
      };

      if (petToEdit) {
        await base44.entities.AdoptablePet.update(petToEdit.id, submitData);
      } else {
        await base44.entities.AdoptablePet.create({
          ...submitData,
          status: "available",
        });
      }
      onSaved();
    } finally {
      setLoading(false);
    }
  };

  const hasAffiliatedOrg = currentUser?.affiliated_organization || formData.rescue_name;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-100 bg-white">
          <h2 className="text-2xl font-bold text-slate-800">{petToEdit ? 'Edit Pet' : 'List a Pet for Adoption'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Missing Affiliated Organization Banner */}
        {!hasAffiliatedOrg && !petToEdit && (
          <div className="mx-6 mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-900 mb-3">
              <strong>⚠️ Set up your organization first:</strong> Please add your shelter or rescue name to your profile before listing pets.
            </p>
            <a 
              href="/UserProfile" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
            >
              Go to Profile Settings →
            </a>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">Pet Information</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-1 block">Pet Name *</Label>
                <Input
                  placeholder="e.g. Max"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <Label className="text-sm font-medium text-slate-700 mb-1 block">Species *</Label>
                   <Select value={formData.pet_type} onValueChange={(value) => handleInputChange("pet_type", value)}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="dog">Dog</SelectItem>
                       <SelectItem value="cat">Cat</SelectItem>
                       <SelectItem value="bird">Bird</SelectItem>
                       <SelectItem value="rabbit">Rabbit</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1 block">Breed</Label>
                  <Input
                    placeholder="e.g. Golden Retriever"
                    value={formData.breed}
                    onChange={(e) => handleInputChange("breed", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1 block">Age (years)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.age_years}
                    onChange={(e) => handleInputChange("age_years", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1 block">Age (months)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.age_months}
                    onChange={(e) => handleInputChange("age_months", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1 block">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1 block">Weight (lbs)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 45"
                    value={formData.weight_lbs}
                    onChange={(e) => handleInputChange("weight_lbs", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-1 block">Color/Markings</Label>
                <Input
                  placeholder="e.g. Golden with white chest"
                  value={formData.color}
                  onChange={(e) => handleInputChange("color", e.target.value)}
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-1 block">Description</Label>
                <Textarea
                  placeholder="Tell us about this pet's personality, background, and temperament..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="h-24"
                />
              </div>
            </div>
          </div>

          {/* Photos */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">Photos (up to 4)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((index) => {
                const photoUrl = index === 0 ? formData.photo_url : formData.extra_photos[index - 1];
                const isPrimary = index === 0;
                
                return (
                  <div key={index} className="relative">
                    {photoUrl ? (
                      <div className="relative group">
                        <img
                          src={photoUrl}
                          alt={`Pet ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        {isPrimary && (
                          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                            Primary
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center w-full aspect-square border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 transition bg-slate-50">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, index)}
                          className="hidden"
                          disabled={photoLoading}
                        />
                        <div className="text-center">
                          <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                          <span className="text-xs text-slate-600 font-medium">{isPrimary ? "Primary" : `Photo ${index + 1}`}</span>
                        </div>
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Temperament */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">Temperament & Compatibility</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-1 block">Energy Level</Label>
                <Select value={formData.energy_level} onValueChange={(value) => handleInputChange("energy_level", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Relaxed & calm</SelectItem>
                    <SelectItem value="medium">Medium - Moderate activity</SelectItem>
                    <SelectItem value="high">High - Very energetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.good_with_kids}
                    onCheckedChange={() => handleCheckboxChange("good_with_kids")}
                  />
                  <span className="text-sm text-slate-700">Good with children</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.good_with_dogs}
                    onCheckedChange={() => handleCheckboxChange("good_with_dogs")}
                  />
                  <span className="text-sm text-slate-700">Good with other dogs</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.good_with_cats}
                    onCheckedChange={() => handleCheckboxChange("good_with_cats")}
                  />
                  <span className="text-sm text-slate-700">Good with cats</span>
                </label>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.special_needs}
                    onCheckedChange={() => handleCheckboxChange("special_needs")}
                  />
                  <span className="text-sm text-slate-700">Special needs pet</span>
                </label>
                {formData.special_needs && (
                  <Input
                    placeholder="Describe special needs..."
                    value={formData.special_needs_description}
                    onChange={(e) => handleInputChange("special_needs_description", e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Adoption Fee */}
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-1 block">Adoption Fee ($)</Label>
            <Input
              type="number"
              placeholder="e.g. 100"
              value={formData.adoption_fee}
              onChange={(e) => handleInputChange("adoption_fee", e.target.value)}
            />
          </div>

          {/* Status Note */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900"><strong>Pet Status:</strong> You'll be able to update the status (Available, Pending, Adopted) after the pet is listed, only your rescue/shelter can change it.</p>
          </div>

          {/* Rescue Info */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">Your Rescue/Shelter Info</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-1 block">Rescue/Shelter Name *</Label>
                <Input
                  value={formData.rescue_name}
                  onChange={(e) => handleInputChange("rescue_name", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1 block">Email *</Label>
                  <Input
                    type="email"
                    value={formData.rescue_email}
                    onChange={(e) => handleInputChange("rescue_email", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1 block">Phone</Label>
                  <Input
                    type="tel"
                    value={formData.rescue_phone}
                    onChange={(e) => handleInputChange("rescue_phone", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-1 block">Website</Label>
                <Input
                  type="url"
                  placeholder="https://yourrescue.org"
                  value={formData.rescue_website}
                  onChange={(e) => handleInputChange("rescue_website", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1 block">City</Label>
                  <Input
                    placeholder="e.g. San Francisco"
                    value={formData.rescue_city}
                    onChange={(e) => handleInputChange("rescue_city", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1 block">State</Label>
                  <Input
                    placeholder="e.g. CA"
                    value={formData.rescue_state}
                    onChange={(e) => handleInputChange("rescue_state", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-1 block">Foster Application URL</Label>
                <Input
                  type="url"
                  placeholder="https://yourrescue.org/foster"
                  value={formData.foster_url}
                  onChange={(e) => handleInputChange("foster_url", e.target.value)}
                />
              </div>
              </div>

              {isAuthorizedForUrgent && (
                <div className="border-t pt-6 mt-6">
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="text-red-600">⚠</span> Urgent Case
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_urgent}
                        onChange={(e) => handleInputChange("is_urgent", e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-700">Mark as urgent (needs immediate foster/adoption)</span>
                    </label>

                    {formData.is_urgent && (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-slate-700 mb-1 block">E-List Date (euthanasia deadline)</Label>
                          <Input
                            type="date"
                            value={formData.e_list_date || ""}
                            onChange={(e) => handleInputChange("e_list_date", e.target.value)}
                          />
                          <p className="text-xs text-slate-500 mt-1">The date by which this pet must be rescued. Urgent cases will be sorted by this date.</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-slate-700 mb-1 block">Urgency Reason</Label>
                          <textarea
                            placeholder="e.g., Shelter euthanasia deadline"
                            value={formData.urgency_reason}
                            onChange={(e) => handleInputChange("urgency_reason", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                            rows="2"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-rose-600 hover:bg-rose-700 rounded-xl"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {petToEdit ? 'Update Pet' : 'List Pet'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}