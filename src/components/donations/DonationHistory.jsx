import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Heart, Calendar, DollarSign, User, Loader2, Gift } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DonationHistory({ userEmail }) {
  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['donationHistory', userEmail],
    queryFn: () => base44.entities.Donation.filter(
      { donor_email: userEmail, status: 'completed' },
      '-created_date',
      100
    ),
    enabled: !!userEmail,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);
  const rescueCount = new Set(donations.map(d => d.rescue_email)).size;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg p-4 border border-rose-100">
          <p className="text-sm text-rose-700 font-medium">Total Donated</p>
          <p className="text-3xl font-bold text-rose-600 mt-2">
            ${totalDonated.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-100">
          <p className="text-sm text-blue-700 font-medium">Donations Made</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{donations.length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-100">
          <p className="text-sm text-purple-700 font-medium">Rescues Supported</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{rescueCount}</p>
        </div>
      </div>

      {/* Donations List */}
      {donations.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900">Your Donations</h3>
          <div className="space-y-3">
            {donations.map(donation => (
              <div key={donation.id} className="bg-white rounded-lg border border-slate-200 p-4 hover:border-rose-300 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-4 h-4 text-rose-500" />
                      <p className="font-semibold text-slate-900">
                        {donation.rescue_email ? 'Donation to Rescue' : 'General Fund Donation'}
                      </p>
                    </div>
                    
                    {donation.message && (
                      <p className="text-sm text-slate-600 mb-2 italic">"{donation.message}"</p>
                    )}

                    {donation.dedication_type && donation.dedication_type !== 'none' && (
                      <div className="flex items-start gap-2 mb-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                        <Gift className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-purple-900">
                            {donation.dedication_type === 'in_honor_of' ? 'In Honor Of' : 'In Memory Of'} {donation.dedication_name}
                          </p>
                          {donation.dedication_message && (
                            <p className="text-xs text-purple-700 mt-1 italic">"{donation.dedication_message}"</p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1 text-slate-600">
                        <DollarSign className="w-4 h-4 text-slate-400" />
                        ${donation.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </div>
                      <div className="flex items-center gap-1 text-slate-600">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs font-medium">
                          {donation.donation_type === 'one_time' ? 'One-Time' : donation.donation_type === 'monthly' ? 'Monthly' : 'Annual'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(donation.completed_date || donation.created_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      donation.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {donation.status === 'completed' ? '✓ Completed' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">You haven't made any donations yet.</p>
          <p className="text-sm text-slate-500 mt-1">Start supporting rescues today!</p>
        </div>
      )}
    </div>
  );
}