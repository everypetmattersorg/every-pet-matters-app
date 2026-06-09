import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, MapPin, AlertCircle, Edit2, Eye, EyeOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import AlertForm from '@/components/alerts/AlertForm';

export default function MyAlerts({ userEmail }) {
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['myAlerts', userEmail],
    queryFn: () =>
      base44.entities.Alert.filter(
        { email: userEmail },
        '-created_date'
      ),
    enabled: !!userEmail,
  });

  const deleteMutation = useMutation({
    mutationFn: (alertId) => base44.entities.Alert.delete(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (alert) =>
      base44.entities.Alert.update(alert.id, { is_active: !alert.is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
    },
  });

  const handleDelete = (alertId) => {
    if (confirm('Are you sure you want to delete this alert?')) {
      deleteMutation.mutate(alertId);
    }
  };

  const handleToggle = (alert) => {
    toggleMutation.mutate(alert);
  };

  const petTypeEmoji = {
    dog: '🐕',
    cat: '🐱',
    bird: '🦜',
    rabbit: '🐰',
    any: '🐾',
    other: '🐾',
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-4">
            <Skeleton className="h-6 w-1/3 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">
          {alerts.length === 0 ? 'No Alerts' : `${alerts.length} Alert${alerts.length !== 1 ? 's' : ''}`}
        </h2>
        {!showForm && !editingAlert && (
          <Button onClick={() => setShowForm(true)} className="gap-2 bg-rose-600 hover:bg-rose-700">
            <Plus className="w-4 h-4" />
            Create Alert
          </Button>
        )}
      </div>

      {(showForm || editingAlert) && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
          <AlertForm
            initialData={editingAlert}
            onSubmit={async (alertData) => {
              if (editingAlert) {
                await base44.entities.Alert.update(editingAlert.id, alertData);
              } else {
                await base44.entities.Alert.create(alertData);
              }
              queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
              setShowForm(false);
              setEditingAlert(null);
            }}
            isSubmitting={false}
            onCancel={() => {
              setShowForm(false);
              setEditingAlert(null);
            }}
          />
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 mb-4">You don't have any alerts yet</p>
          <Button onClick={() => setShowForm(true)} className="bg-rose-600 hover:bg-rose-700">
            Create Your First Alert
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 transition ${
                alert.is_active
                  ? 'bg-white border-slate-200 hover:border-rose-200'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex gap-4">
                {/* Pet Type Icon */}
                <div className="text-3xl flex-shrink-0 flex items-center">
                  {petTypeEmoji[alert.pet_type] || '🐾'}
                </div>

                {/* Alert Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-slate-900">{alert.name}</h3>
                    <Badge className={alert.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                      {alert.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm text-slate-600">
                    <p className="capitalize">Watching for: {alert.pet_type}</p>
                    {alert.breed && <p>Breed: {alert.breed}</p>}
                    {alert.location_name && (
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {alert.location_name} • {alert.radius_miles} miles
                      </p>
                    )}
                    <p className="text-xs">Status filter: {alert.status_filter}</p>
                  </div>

                  {/* Photos Preview */}
                  {alert.photo_urls && alert.photo_urls.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {alert.photo_urls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Alert reference ${idx + 1}`}
                          className="w-16 h-16 rounded object-cover border border-slate-200"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0 flex-col">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle(alert)}
                    disabled={toggleMutation.isPending}
                    title={alert.is_active ? 'Disable alert' : 'Enable alert'}
                    className="text-slate-600 hover:text-slate-700"
                  >
                    {alert.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingAlert(alert)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(alert.id)}
                    disabled={deleteMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}