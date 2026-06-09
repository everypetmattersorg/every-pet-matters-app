import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Heart, AlertCircle, Bell } from 'lucide-react';
import OwnedPetsTab from '@/components/mypets/OwnedPetsTab';
import ReportedPetsTab from '@/components/mypets/ReportedPetsTab';
import AdoptedPetsTab from '@/components/mypets/AdoptedPetsTab';
import AlertsTab from '@/components/mypets/AlertsTab';

export default function MyPetsHub() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    base44.auth
      .me()
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoadingUser(false));
  }, []);

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">My Pets</h1>
          <p className="text-slate-600">Manage all your pets in one place</p>
        </div>

        <Tabs defaultValue="owned" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="owned" className="gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">My Pets</span>
            </TabsTrigger>
            <TabsTrigger value="reported" className="gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Reported</span>
            </TabsTrigger>
            <TabsTrigger value="adopted" className="gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Adopted</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="owned">
            <OwnedPetsTab userEmail={user.email} />
          </TabsContent>

          <TabsContent value="reported">
            <ReportedPetsTab userEmail={user.email} />
          </TabsContent>

          <TabsContent value="adopted">
            <AdoptedPetsTab userEmail={user.email} />
          </TabsContent>

          <TabsContent value="alerts">
            <AlertsTab userEmail={user.email} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}