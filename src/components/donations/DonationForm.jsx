import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertCircle, CheckCircle, Heart, Gift } from 'lucide-react';

export default function DonationForm({ rescue, donationGoal, onDonationComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [availableCampaigns, setAvailableCampaigns] = useState([]);
  const [formData, setFormData] = useState({
    donor_name: '',
    donor_email: '',
    amount: '',
    donation_type: 'one_time',
    donation_target: donationGoal ? 'specific_campaign' : 'general_fund',
    selected_goal_id: donationGoal?.id || '',
    message: '',
    is_anonymous: false,
    dedication_type: 'none',
    dedication_name: '',
    dedication_message: '',
    recipient_email: '',
  });

  // Load available campaigns when donation_target is 'specific_campaign'
  React.useEffect(() => {
    if (formData.donation_target === 'specific_campaign' && rescue?.email) {
      base44.entities.DonationGoal.filter(
        { rescue_email: rescue.email, is_active: true },
        '-created_date'
      ).then(setAvailableCampaigns);
    }
  }, [formData.donation_target, rescue?.email]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Validate form
      if (!formData.donor_name || !formData.donor_email || !formData.amount) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Validate dedication fields if dedication is selected
      if (formData.dedication_type !== 'none' && !formData.dedication_name) {
        setError('Please enter a name for the dedication');
        setLoading(false);
        return;
      }

      // Create donation record
       const donationData = {
        ...formData,
        amount: parseFloat(formData.amount),
        rescue_email: rescue?.email || null,
        donation_goal_id: formData.donation_target === 'specific_campaign' ? formData.selected_goal_id : (donationGoal?.id || null),
        status: 'pending',
      };

      const donation = await base44.entities.Donation.create(donationData);

      // Call payment processing function
       const paymentResponse = await base44.functions.invoke('processDonation', {
        donation_id: donation.id,
        amount: donationData.amount,
        donation_type: donationData.donation_type,
        donor_email: donationData.donor_email,
        dedication_type: donationData.dedication_type,
        dedication_name: donationData.dedication_name,
        recipient_email: donationData.recipient_email,
      });

      if (paymentResponse.data.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onDonationComplete) onDonationComplete();
        }, 2000);
      } else {
        setError(paymentResponse.data.error || 'Payment processing failed');
      }
    } catch (err) {
      setError('Failed to process donation. Please try again.');
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
          <p className="text-sm text-green-700">Thank you for your generous donation!</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Donation Target */}
      {rescue && (
        <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
          <p className="text-sm font-medium text-rose-900">
            <Heart className="w-4 h-4 inline mr-2" />
            You are donating to <span className="font-bold">{rescue.name}</span>
          </p>
          {donationGoal && (
            <p className="text-sm text-rose-700 mt-1">{donationGoal.title}</p>
          )}
        </div>
      )}

      {/* Donation Target Option */}
      {!donationGoal && (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-800">Donation Target</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { value: 'general_fund', label: 'General Fund' },
              { value: 'specific_campaign', label: 'Specific Campaign' },
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, donation_target: option.value, selected_goal_id: '' }))}
                className={`p-3 rounded-lg border-2 font-medium transition-all ${
                  formData.donation_target === option.value
                    ? 'border-rose-600 bg-rose-50 text-rose-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Campaign Selection */}
          {formData.donation_target === 'specific_campaign' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Campaign *</label>
              <select
                value={formData.selected_goal_id}
                onChange={(e) => setFormData(prev => ({ ...prev, selected_goal_id: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                required={formData.donation_target === 'specific_campaign'}
              >
                <option value="">Choose a campaign...</option>
                {availableCampaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.title} (${campaign.current_amount || 0} / ${campaign.target_amount})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Donor Info */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800">Your Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
          <Input
            name="donor_name"
            value={formData.donor_name}
            onChange={handleInputChange}
            placeholder="John Doe"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
          <Input
            name="donor_email"
            type="email"
            value={formData.donor_email}
            onChange={handleInputChange}
            placeholder="john@example.com"
            required
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="anonymous"
            name="is_anonymous"
            checked={formData.is_anonymous}
            onChange={handleInputChange}
            className="w-4 h-4 cursor-pointer rounded"
          />
          <label htmlFor="anonymous" className="text-sm font-medium text-slate-700 cursor-pointer">
            Make this donation anonymous
          </label>
        </div>
      </div>

      {/* Donation Amount */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800">Donation Details</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Amount (USD) *</label>
          <div className="flex gap-2 mb-3">
            {[10, 25, 50, 100].map(amount => (
              <Button
                key={amount}
                type="button"
                variant={formData.amount === amount.toString() ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, amount: amount.toString() }))}
              >
                ${amount}
              </Button>
            ))}
          </div>
          <Input
            name="amount"
            type="number"
            min="1"
            step="0.01"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="Enter custom amount"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Donation Type *</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { value: 'one_time', label: 'One-Time' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'annual', label: 'Annual' },
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, donation_type: option.value }))}
                className={`p-3 rounded-lg border-2 font-medium transition-all ${
                  formData.donation_type === option.value
                    ? 'border-rose-600 bg-rose-50 text-rose-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Message */}
      <div>
       <label className="block text-sm font-medium text-slate-700 mb-1">Message (Optional)</label>
       <Textarea
         name="message"
         value={formData.message}
         onChange={handleInputChange}
         placeholder="Share why you're supporting this rescue..."
         className="min-h-24"
       />
      </div>

      {/* Give as Gift Section */}
      <div className="pt-6 border-t border-slate-200 space-y-4">
       <h3 className="font-semibold text-slate-800 flex items-center gap-2">
         <Gift className="w-5 h-5 text-rose-500" />
         Give as Gift (Optional)
       </h3>

       <div>
         <label className="block text-sm font-medium text-slate-700 mb-2">Dedication Type</label>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
           {[
             { value: 'none', label: 'No Dedication' },
             { value: 'in_honor_of', label: 'In Honor Of' },
             { value: 'in_memory_of', label: 'In Memory Of' },
           ].map(option => (
             <button
               key={option.value}
               type="button"
               onClick={() => setFormData(prev => ({ ...prev, dedication_type: option.value }))}
               className={`p-3 rounded-lg border-2 font-medium transition-all ${
                 formData.dedication_type === option.value
                   ? 'border-purple-600 bg-purple-50 text-purple-900'
                   : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
               }`}
             >
               {option.label}
             </button>
           ))}
         </div>
       </div>

       {formData.dedication_type !== 'none' && (
         <>
           <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">
               {formData.dedication_type === 'in_honor_of' ? "Person's Name" : "Person's Name"} *
             </label>
             <Input
               name="dedication_name"
               value={formData.dedication_name}
               onChange={handleInputChange}
               placeholder="Enter name"
             />
           </div>

           <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Dedication Message (Optional)</label>
             <Textarea
               name="dedication_message"
               value={formData.dedication_message}
               onChange={handleInputChange}
               placeholder="Share a personal message about this dedication..."
               className="min-h-20"
             />
           </div>

           <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Notify Recipient (Optional)</label>
             <Input
               name="recipient_email"
               type="email"
               value={formData.recipient_email}
               onChange={handleInputChange}
               placeholder="recipient@example.com"
             />
             <p className="text-xs text-slate-500 mt-1">Leave blank if you prefer not to notify anyone</p>
           </div>
         </>
       )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-rose-600 hover:bg-rose-700 rounded-xl"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Heart className="w-4 h-4 mr-2" />
            Donate ${formData.amount || '0'}
          </>
        )}
      </Button>
    </form>
  );
}