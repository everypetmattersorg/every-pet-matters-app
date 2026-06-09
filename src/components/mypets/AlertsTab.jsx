import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle, Loader2, Bell, Edit2, Trash2, MapPin } from 'lucide-react';
import AlertForm from '@/components/alerts/AlertForm';
import PhotoMatchHistory from '@/components/alerts/PhotoMatchHistory';

export default function AlertsTab({ userEmail }) {
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts', userEmail],
    queryFn: () => base44.entities.Alert.list('-created_date', 50),
    enabled: !!userEmail,
  });

  const createAlertMutation = useMutation({
    mutationFn: (data) => base44.entities.Alert.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setShowAlertForm(false);
    },
  });

  const updateAlertMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Alert.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setEditingAlert(null);
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id) => base44.entities.Alert.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const toggleAlertActive = (alert) => {
    updateAlertMutation.mutate({ id: alert.id, data: { is_active: !alert.is_active } });
  };

  const petEmojis = {
    any: '🐾',
    dog: '🐕',
    cat: '🐱',
    bird: '🐦',
    rabbit: '🐰',
    other: '🐾',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Pet Alerts</h2>
        <Button
          onClick={() => setShowAlertForm(true)}
          className="gap-2"
          style={{ background: '#b1511d' }}
        >
          <PlusCircle className="w-4 h-4" /> Create Alert
        </Button>
      </div>

      <Dialog open={showAlertForm} onOpenChange={setShowAlertForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create Pet Alert</DialogTitle>
          </DialogHeader>
          <AlertForm
            onSubmit={(data) => createAlertMutation.mutate(data)}
            isSubmitting={createAlertMutation.isPending}
            onCancel={() => setShowAlertForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingAlert} onOpenChange={() => setEditingAlert(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Alert</DialogTitle>
          </DialogHeader>
          {editingAlert && (
            <AlertForm
              initialData={editingAlert}
              onSubmit={(data) => updateAlertMutation.mutate({ id: editingAlert.id, data })}
              isSubmitting={updateAlertMutation.isPending}
              onCancel={() => setEditingAlert(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No alerts yet</h3>
          <p className="text-slate-500 mb-6">Create an alert to get notified when a matching pet is reported</p>
          <Button onClick={() => setShowAlertForm(true)} style={{ background: '#b1511d' }}>
            <PlusCircle className="w-4 h-4 mr-2" /> Create First Alert
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              className={`border-0 shadow-md transition-opacity ${
                !alert.is_active ? 'opacity-60' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="text-3xl mt-1 shrink-0">{petEmojis[alert.pet_type]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="font-semibold text-slate-800 text-lg">{alert.name}</h3>
                        <Badge
                          className={
                            alert.is_active
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }
                        >
                          {alert.is_active ? 'Active' : 'Paused'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {alert.pet_type === 'any' ? 'Any pet' : alert.pet_type}
                          {alert.breed ? ` · ${alert.breed}` : ''}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {alert.status_filter === 'both'
                            ? 'Lost & Found'
                            : `${alert.status_filter} only`}
                        </Badge>
                        {alert.latitude && alert.longitude && (
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="w-3 h-3 mr-1" />
                            {alert.radius_miles} mile radius
                            {alert.location_name ? ` · ${alert.location_name}` : ''}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-slate-500">Notifications → {alert.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Switch
                      checked={!!alert.is_active}
                      onCheckedChange={() => toggleAlertActive(alert)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingAlert(alert)}
                      className="text-slate-400 hover:text-violet-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteAlertMutation.mutate(alert.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {userEmail && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mt-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-violet-100 rounded-xl">
              <Bell className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Photo Match History</h3>
              <p className="text-xs text-slate-400">Your recent AI photo searches</p>
            </div>
          </div>
          <PhotoMatchHistory userEmail={userEmail} />
        </div>
      )}
    </div>
  );
}