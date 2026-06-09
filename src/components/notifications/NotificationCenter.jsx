import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Trash2, Settings, AlertCircle, Calendar, Pill, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import NotificationPreferences from "./NotificationPreferences";
import OrganizationTagNotifications from "./OrganizationTagNotifications";

const NOTIFICATION_ICONS = {
  application: Heart,
  appointment: Calendar,
  vaccination: Pill,
  medication: Pill,
  event: Calendar,
  system: AlertCircle,
};

const NOTIFICATION_COLORS = {
  application: "text-rose-600 bg-rose-50",
  appointment: "text-blue-600 bg-blue-50",
  vaccination: "text-amber-600 bg-amber-50",
  medication: "text-orange-600 bg-orange-50",
  event: "text-purple-600 bg-purple-50",
  system: "text-slate-600 bg-slate-50",
};

export default function NotificationCenter({ userEmail, userRole }) {
  const [showPreferences, setShowPreferences] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", userEmail],
    queryFn: () =>
      base44.entities.Notification.filter(
        { user_email: userEmail },
        "-created_date",
        50
      ),
    enabled: !!userEmail,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) =>
      base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userEmail] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter((n) => !n.is_read);
      await Promise.all(
        unread.map((n) => base44.entities.Notification.update(n.id, { is_read: true }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userEmail] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userEmail] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-4">
      {/* Organization Tag Notifications */}
      {(userRole === 'rescue' || userRole === 'shelter') && (
        <OrganizationTagNotifications userEmail={userEmail} userRole={userRole} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-slate-700" />
          <h2 className="text-lg font-bold text-slate-800">Notifications</h2>
          {unreadCount > 0 && (
            <Badge className="bg-rose-100 text-rose-800">{unreadCount}</Badge>
          )}
        </div>
        <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Preferences
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Notification Preferences</DialogTitle>
            </DialogHeader>
            <NotificationPreferences userEmail={userEmail} onClose={() => setShowPreferences(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Actions */}
      {unreadCount > 0 && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => markAllAsReadMutation.mutate()}
          className="w-full"
        >
          Mark all as read
        </Button>
      )}

      {/* Notifications List */}
      {isLoading ? (
        <div className="text-center py-8 text-slate-500">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = NOTIFICATION_ICONS[notification.type];
            const colorClass = NOTIFICATION_COLORS[notification.type];

            return (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-all ${
                  notification.is_read
                    ? "bg-white border-slate-200"
                    : "bg-slate-50 border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(notification.created_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3 ml-11">
                  {notification.action_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => (window.location.href = notification.action_url)}
                    >
                      View
                    </Button>
                  )}
                  {!notification.is_read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => markAsReadMutation.mutate(notification.id)}
                    >
                      <Check className="w-3 h-3 mr-1" /> Mark as read
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-red-600 hover:text-red-700"
                    onClick={() => deleteNotificationMutation.mutate(notification.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}