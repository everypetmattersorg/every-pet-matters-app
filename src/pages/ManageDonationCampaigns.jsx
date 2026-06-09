import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Edit2, Trash2, ChevronDown, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import DonationCampaignForm from '@/components/donations/DonationCampaignForm';

export default function ManageDonationCampaigns() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (!u || (u.role !== 'admin' && u.role !== 'rescue' && u.role !== 'shelter')) {
        window.location.href = '/';
      }
    });
  }, []);

  const rescueEmail = user?.email;

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['donationCampaigns', rescueEmail],
    queryFn: () =>
      base44.entities.DonationGoal.filter(
        { rescue_email: rescueEmail },
        '-created_date'
      ),
    enabled: !!rescueEmail,
  });

  const deleteMutation = useMutation({
    mutationFn: (campaignId) => base44.entities.DonationGoal.delete(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donationCampaigns'] });
    },
  });

  const handleDelete = (campaignId) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      deleteMutation.mutate(campaignId);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Donation Campaigns</h1>
              <p className="text-slate-600 mt-1">Create and manage fundraising campaigns for your rescue</p>
            </div>
            {!showForm && !editingCampaign && (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-rose-600 hover:bg-rose-700 gap-2"
              >
                <Plus className="w-4 h-4" />
                New Campaign
              </Button>
            )}
          </div>
        </div>

        {/* Form Section */}
        {(showForm || editingCampaign) && (
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8">
            <DonationCampaignForm
              campaign={editingCampaign}
              rescueEmail={rescueEmail}
              onSuccess={() => {
                setShowForm(false);
                setEditingCampaign(null);
                queryClient.invalidateQueries({ queryKey: ['donationCampaigns'] });
              }}
              onCancel={() => {
                setShowForm(false);
                setEditingCampaign(null);
              }}
            />
          </div>
        )}

        {/* Campaigns List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No campaigns yet</h2>
            <p className="text-slate-600 mb-6">Create your first fundraising campaign to start collecting donations</p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-rose-600 hover:bg-rose-700 gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Campaign
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {campaigns.map(campaign => {
              const progressPercent = (campaign.current_amount / campaign.target_amount) * 100;
              const daysLeft = campaign.deadline
                ? Math.ceil((new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24))
                : null;
              const isExpanded = expandedId === campaign.id;

              return (
                <div
                  key={campaign.id}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:border-rose-300 transition"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{campaign.title}</h3>
                        
                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-slate-700">
                              ${campaign.current_amount?.toLocaleString() || 0} / ${campaign.target_amount?.toLocaleString() || 0}
                            </span>
                            <span className="text-sm font-semibold text-rose-600">
                              {Math.min(100, Math.round(progressPercent))}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-rose-400 to-pink-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(100, progressPercent)}%` }}
                            />
                          </div>
                        </div>

                        {/* Info Row */}
                        <div className="flex flex-wrap gap-6 text-sm text-slate-600">
                          {campaign.deadline && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              campaign.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {campaign.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : campaign.id)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition"
                        >
                          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
                        {campaign.description && (
                          <div>
                            <h4 className="font-medium text-slate-900 mb-2">Description</h4>
                            <p className="text-slate-600 text-sm">{campaign.description}</p>
                          </div>
                        )}

                        {campaign.image_url && (
                          <div>
                            <h4 className="font-medium text-slate-900 mb-2">Campaign Image</h4>
                            <img src={campaign.image_url} alt={campaign.title} className="h-48 w-full object-cover rounded-lg" />
                          </div>
                        )}

                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={() => setEditingCampaign(campaign)}
                            variant="outline"
                            className="gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDelete(campaign.id)}
                            variant="outline"
                            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}