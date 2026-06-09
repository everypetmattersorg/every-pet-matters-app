import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Edit2, Trash2, Heart, TrendingUp } from 'lucide-react';
import DonationProgressCard from '@/components/donations/DonationProgressCard';

export default function DonationGoalsTab({ rescueEmail }) {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_amount: '',
    deadline: '',
    image_url: '',
  });
  const queryClient = useQueryClient();

  const { data: goals = [] } = useQuery({
    queryKey: ['donationGoals', rescueEmail],
    queryFn: () => base44.entities.DonationGoal.filter({ rescue_email: rescueEmail }, '-created_date', 50),
    enabled: !!rescueEmail,
  });

  const { data: donations = [] } = useQuery({
    queryKey: ['donations', rescueEmail],
    queryFn: () => base44.entities.Donation.filter({ rescue_email: rescueEmail, status: 'completed' }, '-created_date', 100),
    enabled: !!rescueEmail,
  });

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

      const data = {
        ...formData,
        target_amount: parseFloat(formData.target_amount),
        rescue_email: rescueEmail,
        is_active: true,
      };

      if (editingGoal) {
        await base44.entities.DonationGoal.update(editingGoal.id, data);
      } else {
        await base44.entities.DonationGoal.create(data);
      }

      queryClient.invalidateQueries({ queryKey: ['donationGoals'] });
      setShowForm(false);
      setEditingGoal(null);
      setFormData({
        title: '',
        description: '',
        target_amount: '',
        deadline: '',
        image_url: '',
      });
    } catch (err) {
      console.error('Error saving goal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      target_amount: goal.target_amount.toString(),
      deadline: goal.deadline || '',
      image_url: goal.image_url || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (goalId) => {
    if (confirm('Are you sure you want to delete this donation goal?')) {
      try {
        await base44.entities.DonationGoal.delete(goalId);
        queryClient.invalidateQueries({ queryKey: ['donationGoals'] });
      } catch (err) {
        console.error('Error deleting goal:', err);
      }
    }
  };

  const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-slate-600 font-medium">Active Goals</p>
          <p className="text-3xl font-bold text-rose-600">{goals.filter(g => g.is_active).length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-slate-600 font-medium">Total Donations</p>
          <p className="text-3xl font-bold text-slate-900">${totalDonations.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-slate-600 font-medium">Donors</p>
          <p className="text-3xl font-bold text-slate-900">{new Set(donations.map(d => d.donor_email)).size}</p>
        </div>
      </div>

      {/* Add Goal Button */}
      <div>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setEditingGoal(null);
            setFormData({
              title: '',
              description: '',
              target_amount: '',
              deadline: '',
              image_url: '',
            });
          }}
          className="bg-rose-600 hover:bg-rose-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? 'Cancel' : 'Create Donation Goal'}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            {editingGoal ? 'Edit Donation Goal' : 'Create New Donation Goal'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Goal Title *</label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Help Us Build a New Shelter"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell donors how their contributions will help..."
                className="min-h-20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Amount (USD) *</label>
                <Input
                  name="target_amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.target_amount}
                  onChange={handleInputChange}
                  placeholder="5000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deadline (Optional)</label>
                <Input
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
              <Input
                name="image_url"
                type="url"
                value={formData.image_url}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="bg-rose-600 hover:bg-rose-700 flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Goal'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingGoal(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Goals Grid */}
      {goals.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Your Donation Goals</h3>
          <div className="grid grid-cols-1 gap-6">
            {goals.map(goal => (
              <div key={goal.id} className="relative">
                <DonationProgressCard goal={goal} />
                <div className="absolute top-6 right-6 flex gap-2">
                  <button
                    onClick={() => handleEdit(goal)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition"
                  >
                    <Edit2 className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">No donation goals yet. Create one to start raising funds!</p>
        </div>
      )}
    </div>
  );
}