import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import EditRescueProfileForm from '@/components/rescue/EditRescueProfileForm';
import APIIntegrationSettings from '@/components/rescue/APIIntegrationSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap } from 'lucide-react';

export default function RescueProfileSettings() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {}).finally(() => setLoadingUser(false));
  }, []);

  const { data: rescue, isLoading } = useQuery({
    queryKey: ['rescue-profile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const rescues = await base44.entities.Rescue.filter({ email: user.email }, undefined, 1);
      return rescues?.[0] || null;
    },
    enabled: !!user?.email,
  });

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
      </div>
    );
  }

  const isRescue = user?.role === 'rescue' || user?.role === 'shelter' || user?.role === 'admin';

  if (!isRescue) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-4">Only rescues and shelters can manage profiles.</p>
          <Link to={createPageUrl('Home')}>
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link to={createPageUrl('RescueDashboard')}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Manage Your Profile</h1>
          <p className="text-slate-600 mt-2">Update your organization's information, mission, and photos.</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Tabs defaultValue="profile" className="mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="profile">Profile Settings</TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Integrations</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
                </div>
              ) : (
                <EditRescueProfileForm
                  rescue={rescue}
                  onSaved={() => {
                    queryClient.invalidateQueries({ queryKey: ['rescue-profile'] });
                  }}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="integrations">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              {user && <APIIntegrationSettings rescueEmail={user.email} />}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}