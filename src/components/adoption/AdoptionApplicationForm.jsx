import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, ChevronLeft, ChevronRight, CheckCircle, Plus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdoptionApplicationForm({ pet, rescue, onSubmitted, onClose }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    pet_id: pet.id,
    pet_name: pet.name,
    rescue_email: rescue.email,
    applicant_name: '',
    applicant_email: '',
    applicant_phone: '',
    living_situation: '',
    address: '',
    own_or_rent: '',
    landlord_allows_pets: false,
    other_pets: [],
    children_ages: [],
    work_schedule: '',
    pet_experience: '',
    vet_references: [],
    personal_references: [],
    adoption_expectations: '',
    commitment: '',
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const addPet = () => {
    setFormData(prev => ({
      ...prev,
      other_pets: [...prev.other_pets, { type: '', name: '', age: '', temperament: '' }]
    }));
  };

  const updatePet = (idx, field, value) => {
    setFormData(prev => {
      const updated = [...prev.other_pets];
      updated[idx][field] = value;
      return { ...prev, other_pets: updated };
    });
  };

  const removePet = (idx) => {
    setFormData(prev => ({
      ...prev,
      other_pets: prev.other_pets.filter((_, i) => i !== idx)
    }));
  };

  const addReference = (type) => {
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], { name: '', phone: '' }]
    }));
  };

  const updateReference = (type, idx, field, value) => {
    setFormData(prev => {
      const updated = [...prev[type]];
      updated[idx][field] = value;
      return { ...prev, [type]: updated };
    });
  };

  const removeReference = (type, idx) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      await base44.entities.AdoptionApplication.create(formData);
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setError('Failed to submit application. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 5;
  const canGoNext = () => {
    if (step === 1) return formData.applicant_name && formData.applicant_email && formData.applicant_phone;
    if (step === 2) return formData.living_situation && formData.address && formData.own_or_rent;
    if (step === 3) return true;
    if (step === 4) return true;
    if (step === 5) return formData.adoption_expectations && formData.commitment;
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-rose-600 to-orange-600 text-white p-6">
          <h2 className="text-2xl font-bold mb-1">Adoption Application</h2>
          <p className="text-rose-100">Step {step} of {totalSteps}</p>
          {/* Progress Bar */}
          <div className="mt-4 bg-white/20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Personal Information</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <Input
                  name="applicant_name"
                  value={formData.applicant_name}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                <Input
                  name="applicant_email"
                  type="email"
                  value={formData.applicant_email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                <Input
                  name="applicant_phone"
                  type="tel"
                  value={formData.applicant_phone}
                  onChange={handleInputChange}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Living Situation */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Living Situation</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Living Situation *</label>
                <Select value={formData.living_situation} onValueChange={(value) => setFormData(prev => ({ ...prev, living_situation: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your living situation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="farm_rural">Farm/Rural</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Main St, City, State ZIP"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Do you own or rent? *</label>
                <Select value={formData.own_or_rent} onValueChange={(value) => setFormData(prev => ({ ...prev, own_or_rent: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="own">Own</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.own_or_rent === 'rent' && (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="landlord"
                    name="landlord_allows_pets"
                    checked={formData.landlord_allows_pets}
                    onChange={handleInputChange}
                    className="w-4 h-4"
                  />
                  <label htmlFor="landlord" className="text-sm text-slate-700">Landlord allows pets</label>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Household */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Other Pets</h3>
                <div className="space-y-3">
                  {formData.other_pets.map((pet, idx) => (
                    <Card key={idx} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <Input
                          placeholder="Pet type (e.g., Dog)"
                          value={pet.type}
                          onChange={(e) => updatePet(idx, 'type', e.target.value)}
                        />
                        <Input
                          placeholder="Pet name"
                          value={pet.name}
                          onChange={(e) => updatePet(idx, 'name', e.target.value)}
                        />
                        <Input
                          placeholder="Age"
                          value={pet.age}
                          onChange={(e) => updatePet(idx, 'age', e.target.value)}
                        />
                        <Input
                          placeholder="Temperament"
                          value={pet.temperament}
                          onChange={(e) => updatePet(idx, 'temperament', e.target.value)}
                        />
                      </div>
                      <button
                        onClick={() => removePet(idx)}
                        className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    </Card>
                  ))}
                </div>
                <Button
                  onClick={addPet}
                  variant="outline"
                  className="mt-3"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Pet
                </Button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Children in Household</label>
                <p className="text-xs text-slate-600 mb-2">Enter ages separated by commas (e.g., 5, 8, 12)</p>
                <Input
                  placeholder="Ages of children"
                  value={formData.children_ages.join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    children_ages: e.target.value.split(',').map(a => a.trim()).filter(a => a)
                  }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Work Schedule & Pet Care Plans</label>
                <Textarea
                  name="work_schedule"
                  value={formData.work_schedule}
                  onChange={handleInputChange}
                  placeholder="Describe your work schedule and how you plan to care for the pet..."
                  className="min-h-24"
                />
              </div>
            </div>
          )}

          {/* Step 4: Experience & References */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pet Ownership Experience</label>
                <Textarea
                  name="pet_experience"
                  value={formData.pet_experience}
                  onChange={handleInputChange}
                  placeholder="Tell us about your experience with pets..."
                  className="min-h-24"
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Veterinary References</h3>
                <div className="space-y-3">
                  {formData.vet_references.map((ref, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        placeholder="Vet name"
                        value={ref.name}
                        onChange={(e) => updateReference('vet_references', idx, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Phone"
                        value={ref.phone}
                        onChange={(e) => updateReference('vet_references', idx, 'phone', e.target.value)}
                      />
                      <button
                        onClick={() => removeReference('vet_references', idx)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => addReference('vet_references')}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Reference
                </Button>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Personal References</h3>
                <div className="space-y-3">
                  {formData.personal_references.map((ref, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        placeholder="Reference name"
                        value={ref.name}
                        onChange={(e) => updateReference('personal_references', idx, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Phone"
                        value={ref.phone}
                        onChange={(e) => updateReference('personal_references', idx, 'phone', e.target.value)}
                      />
                      <button
                        onClick={() => removeReference('personal_references', idx)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => addReference('personal_references')}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Reference
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Commitment */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Adoption Commitment</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">What do you expect from this adoption? *</label>
                <Textarea
                  name="adoption_expectations"
                  value={formData.adoption_expectations}
                  onChange={handleInputChange}
                  placeholder="Describe your expectations and what you're looking for in a pet..."
                  className="min-h-24"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Your Commitment Statement *</label>
                <Textarea
                  name="commitment"
                  value={formData.commitment}
                  onChange={handleInputChange}
                  placeholder="Tell us why you're committed to providing a loving home for this pet..."
                  className="min-h-24"
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 flex gap-3">
          <Button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            variant="outline"
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          {step === totalSteps ? (
            <Button
              onClick={handleSubmit}
              disabled={loading || !canGoNext()}
              className="flex-1 bg-rose-600 hover:bg-rose-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" /> Submit Application
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setStep(Math.min(totalSteps, step + 1))}
              disabled={!canGoNext()}
              className="flex-1 bg-rose-600 hover:bg-rose-700"
            >
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          <Button
            onClick={onClose}
            variant="outline"
            className="px-6"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}