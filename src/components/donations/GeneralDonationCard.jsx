import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import DonationForm from './DonationForm';

export default function GeneralDonationCard() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl shadow-lg p-8 border border-rose-200">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <Heart className="w-6 h-6 text-rose-600" />
            <h2 className="text-2xl font-bold text-slate-900">Support All Rescues</h2>
          </div>
          <p className="text-slate-700 mb-6">
            Your donation goes directly to our general fund, helping all rescue organizations in our network provide care for animals in need.
          </p>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-rose-600 hover:bg-rose-700"
          >
            {showForm ? 'Cancel' : 'Make a Donation'}
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="mt-8 pt-8 border-t border-rose-200">
          <DonationForm onDonationComplete={() => setShowForm(false)} />
        </div>
      )}
    </div>
  );
}