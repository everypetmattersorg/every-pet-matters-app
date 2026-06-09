import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Bell, Plus, Trash2, MapPin, Edit2, ScanSearch } from 'lucide-react';
import AlertForm from '../components/alerts/AlertForm';
import PhotoMatchHistory from '../components/alerts/PhotoMatchHistory';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const petTypeIcons = { any: '🐾', dog: '🐕', cat: '🐱', bird: '🐦', rabbit: '🐰', other: '🐾' };

export default function Alerts() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.Alert.list('-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Alert.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['alerts']); setShowForm(false); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Alert.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['alerts']); setEditingAlert(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Alert.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['alerts'])
  });

  const toggleActive = (alert) => {
    updateMutation.mutate({ id: alert.id, data: { is_active: !alert.is_active } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-violet-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Bell className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Pet Alerts</h1>
              <p className="text-violet-200 mt-1">Get notified when a matching pet is reported</p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-white text-violet-700 hover:bg-violet-50 font-semibold h-12 px-6 rounded-xl shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Alert
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Create Alert Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Create Pet Alert</DialogTitle>
            </DialogHeader>
            <AlertForm
              onSubmit={(data) => createMutation.mutate(data)}
              isSubmitting={createMutation.isPending}
              onCancel={() => setShowForm(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Alert Dialog */}
        <Dialog open={!!editingAlert} onOpenChange={() => setEditingAlert(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Edit Alert</DialogTitle>
            </DialogHeader>
            {editingAlert && (
              <AlertForm
                initialData={editingAlert}
                onSubmit={(data) => updateMutation.mutate({ id: editingAlert.id, data })}
                isSubmitting={updateMutation.isPending}
                onCancel={() => setEditingAlert(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="text-center py-20 text-slate-400">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No alerts yet</h3>
            <p className="text-slate-400 mb-6">Create an alert to get notified when a matching pet is reported.</p>
            <Button onClick={() => setShowForm(true)} className="bg-violet-600 hover:bg-violet-700 rounded-xl h-12 px-6">
              <Plus className="w-4 h-4 mr-2" /> Create First Alert
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map(alert => (
              <Card key={alert.id} className={`border-0 shadow-md transition-opacity ${!alert.is_active ? 'opacity-60' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="text-3xl mt-1 shrink-0">{petTypeIcons[alert.pet_type]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="font-semibold text-slate-800 text-lg">{alert.name}</h3>
                          <Badge className={alert.is_active
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'}>
                            {alert.is_active ? 'Active' : 'Paused'}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">
                            {alert.pet_type === 'any' ? 'Any pet' : alert.pet_type}
                            {alert.breed ? ` · ${alert.breed}` : ''}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {alert.status_filter === 'both' ? 'Lost & Found' : `${alert.status_filter} only`}
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
                      <Switch checked={!!alert.is_active} onCheckedChange={() => toggleActive(alert)} />
                      <Button size="icon" variant="ghost" onClick={() => setEditingAlert(alert)}
                        className="text-slate-400 hover:text-violet-600">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(alert.id)}
                        className="text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Photo Match Search History */}
      {user && (
        <div className="max-w-4xl mx-auto px-4 pb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-violet-100 rounded-xl">
                <ScanSearch className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">Photo Match History</h2>
                <p className="text-xs text-slate-400">Your recent AI photo searches</p>
              </div>
            </div>
            <PhotoMatchHistory userEmail={user.email} />
          </div>
        </div>
      )}
    </div>
  );
}