import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Loader2, Users, ShieldAlert, ShieldCheck, ShieldOff, Trash2, PawPrint, ClipboardList } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RescueSetupStatus from '@/components/admin/RescueSetupStatus';
import { toast } from 'sonner';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const { data: currentUser, isLoading: loadingMe } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: currentUser?.role === 'admin',
  });

  const handleRoleChange = async (user, newRole) => {
    setUpdatingId(user.id);
    try {
      await base44.entities.User.update(user.id, { role: newRole });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success(`${user.full_name || user.email} is now ${newRole}`);
    } catch (err) {
      toast.error('Failed to update role');
    }
    setUpdatingId(null);
  };

  const handleDelete = async (user) => {
    if (!confirm(`Are you sure you want to delete ${user.full_name || user.email}? This cannot be undone.`)) return;
    setDeletingId(user.id);
    try {
      await base44.entities.User.delete(user.id);
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success(`${user.full_name || user.email} has been deleted`);
    } catch (err) {
      toast.error('Failed to delete user');
    }
    setDeletingId(null);
  };

  if (loadingMe) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );

  if (currentUser?.role !== 'admin') return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
      <ShieldAlert className="w-16 h-16 text-red-400" />
      <h1 className="text-2xl font-bold">Access Denied</h1>
      <p className="text-muted-foreground">This page is restricted to administrators only.</p>
      <Link to="/PetDashboard">
        <Button variant="outline">Go Back</Button>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link to="/PetDashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <Users className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-xl font-bold">User Management</h1>
            <Badge variant="secondary" className="text-xs">Admin Only</Badge>
          </div>
          <Link to="/AdminPetUpload">
            <Button size="sm" className="gap-1.5 bg-[#708238] hover:bg-[#5a6a2c] text-white">
              <PawPrint className="w-4 h-4" /> Add Pet
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="users">
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="gap-1.5"><Users className="w-4 h-4" /> All Users</TabsTrigger>
            <TabsTrigger value="rescue-setup" className="gap-1.5"><ClipboardList className="w-4 h-4" /> Rescue Setup</TabsTrigger>
          </TabsList>

          <TabsContent value="rescue-setup">
            <RescueSetupStatus />
          </TabsContent>

          <TabsContent value="users">
        {loadingUsers ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
            <div className="grid gap-4">
              {users.map((user) => {
                const initials = user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
                return (
                  <Card key={user.id}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-4 flex-wrap">
                        <Avatar className="w-12 h-12 shrink-0">
                          <AvatarImage src={user.photo_url} />
                          <AvatarFallback className="bg-primary/10 text-lg">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{user.full_name || 'No name'}</p>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                              {user.role || 'user'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          {user.title && <p className="text-xs text-muted-foreground mt-0.5">{user.title}</p>}
                          {user.affiliated_organization && (
                            <p className="text-xs text-muted-foreground mt-0.5">🏠 {user.affiliated_organization}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {user.id !== currentUser?.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50"
                              disabled={deletingId === user.id}
                              onClick={() => handleDelete(user)}
                            >
                              {deletingId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                              Delete
                            </Button>
                          )}
                          <div className="text-right text-xs text-muted-foreground">
                            <p>Joined {new Date(user.created_date).toLocaleDateString()}</p>
                          </div>
                          {user.id !== currentUser?.id && (
                            user.role === 'admin' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-xs"
                                disabled={updatingId === user.id}
                                onClick={() => handleRoleChange(user, 'user')}
                              >
                                {updatingId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldOff className="w-3 h-3" />}
                                Downgrade to User
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="gap-1 text-xs bg-[#708238] hover:bg-[#5a6a2c] text-white"
                                disabled={updatingId === user.id}
                                onClick={() => handleRoleChange(user, 'admin')}
                              >
                                {updatingId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                                Upgrade to Admin
                              </Button>
                            )
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}