import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2, Download, DollarSign, Users, TrendingUp, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const COLORS = ['#f43f5e', '#06b6d4', '#a855f7', '#fbbf24', '#34d399'];

export default function DonationReportTab({ rescueEmail }) {
  const { data: donations = [], isLoading: loadingDonations } = useQuery({
    queryKey: ['rescueDonations', rescueEmail],
    queryFn: () => base44.entities.Donation.filter(
      { rescue_email: rescueEmail, status: 'completed' },
      '-created_date',
      200
    ),
    enabled: !!rescueEmail,
  });

  const { data: goals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ['rescueDonationGoals', rescueEmail],
    queryFn: () => base44.entities.DonationGoal.filter(
      { rescue_email: rescueEmail },
      '-created_date',
      50
    ),
    enabled: !!rescueEmail,
  });

  const isLoading = loadingDonations || loadingGoals;

  // Calculate stats
  const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);
  const totalDonors = new Set(donations.map(d => d.donor_email)).size;
  const recurringDonations = donations.filter(d => d.donation_type !== 'one_time').length;
  const averageDonation = donations.length > 0 ? totalDonated / donations.length : 0;

  // Donations by type
  const donationsByType = [
    { name: 'One-Time', value: donations.filter(d => d.donation_type === 'one_time').length },
    { name: 'Monthly', value: donations.filter(d => d.donation_type === 'monthly').length },
    { name: 'Annual', value: donations.filter(d => d.donation_type === 'annual').length },
  ].filter(d => d.value > 0);

  // Revenue trend (by month)
  const monthlyData = {};
  donations.forEach(d => {
    const month = new Date(d.completed_date || d.created_date).toLocaleDateString('en-US', { month: 'short' });
    monthlyData[month] = (monthlyData[month] || 0) + d.amount;
  });
  const revenueTrend = Object.entries(monthlyData).map(([month, amount]) => ({ month, amount }));

  // Goals progress
  const goalsProgress = goals.map(g => ({
    name: g.title,
    target: g.target_amount,
    raised: g.current_amount || 0,
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  const handleExportReport = () => {
    const reportData = `
Donation Report for ${rescueEmail}
Generated: ${new Date().toLocaleDateString()}

SUMMARY STATS
=============
Total Donated: $${totalDonated.toLocaleString('en-US', { maximumFractionDigits: 2 })}
Total Donors: ${totalDonors}
Number of Donations: ${donations.length}
Average Donation: $${averageDonation.toLocaleString('en-US', { maximumFractionDigits: 2 })}
Recurring Donations: ${recurringDonations}

DONATIONS BREAKDOWN
====================
${donations.map(d => `${d.donor_email} - $${d.amount} (${d.donation_type}) - ${d.completed_date || d.created_date}`).join('\n')}

FUNDRAISING GOALS
=================
${goals.map(g => `${g.title}: $${g.current_amount || 0} / $${g.target_amount}`).join('\n')}
    `.trim();

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportData));
    element.setAttribute('download', `donation-report-${new Date().getTime()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-8">
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Donation Reports</h2>
        <Button onClick={handleExportReport} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg p-4 border border-rose-100">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-rose-600" />
            <p className="text-sm text-rose-700 font-medium">Total Raised</p>
          </div>
          <p className="text-3xl font-bold text-rose-600">
            ${totalDonated.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-700 font-medium">Unique Donors</p>
          </div>
          <p className="text-3xl font-bold text-blue-600">{totalDonors}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <p className="text-sm text-purple-700 font-medium">Total Donations</p>
          </div>
          <p className="text-3xl font-bold text-purple-600">{donations.length}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-amber-600" />
            <p className="text-sm text-amber-700 font-medium">Avg Donation</p>
          </div>
          <p className="text-3xl font-bold text-amber-600">
            ${averageDonation.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        {revenueTrend.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="amount" stroke="#f43f5e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Donation Types */}
        {donationsByType.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Donation Types</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={donationsByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} (${value})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {donationsByType.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Goals Progress */}
      {goalsProgress.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Fundraising Goals Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={goalsProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="target" fill="#cbd5e1" name="Target" />
              <Bar dataKey="raised" fill="#f43f5e" name="Raised" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Donations Table */}
      {donations.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Recent Donations</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Donor</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {donations.slice(0, 10).map(d => (
                  <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-3 text-sm text-slate-700">
                      {d.is_anonymous ? 'Anonymous' : d.donor_name}
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold text-slate-900">
                      ${d.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                        {d.donation_type === 'one_time' ? 'One-Time' : d.donation_type === 'monthly' ? 'Monthly' : 'Annual'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {new Date(d.completed_date || d.created_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        d.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {d.status === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}