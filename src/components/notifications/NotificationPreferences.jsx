import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NotificationPreferences({ userEmail, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email_on_applications: true,
    email_on_appointments: true,
    email_on_medication: true,
    email_on_events: true,
    in_app_notifications: true,
    notification_frequency: "immediate",
    quiet_hours_enabled: false,
    quiet_hours_start: "22:00",
    quiet_hours_end: "08:00",
  });

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["notification-preferences", userEmail],
    queryFn: async () => {
      const prefs = await base44.entities.NotificationPreference.filter(
        { user_email: userEmail },
        undefined,
        1
      );
      return prefs?.[0] || null;
    },
    enabled: !!userEmail,
  });

  useEffect(() => {
    if (preferences) {
      setFormData(preferences);
    }
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences?.id) {
        await base44.entities.NotificationPreference.update(preferences.id, data);
      } else {
        await base44.entities.NotificationPreference.create({
          ...data,
          user_email: userEmail,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast.success("Preferences saved!");
      onClose();
    },
  });

  const handleToggle = (key) => {
    setFormData((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800 text-sm">Email Notifications</h3>

        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-700">New Applications</label>
          <Switch
            checked={formData.email_on_applications}
            onCheckedChange={() => handleToggle("email_on_applications")}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-700">Upcoming Appointments</label>
          <Switch
            checked={formData.email_on_appointments}
            onCheckedChange={() => handleToggle("email_on_appointments")}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-700">Medication & Vaccination Reminders</label>
          <Switch
            checked={formData.email_on_medication}
            onCheckedChange={() => handleToggle("email_on_medication")}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-700">Event Updates</label>
          <Switch
            checked={formData.email_on_events}
            onCheckedChange={() => handleToggle("email_on_events")}
          />
        </div>
      </div>

      {/* In-App Notifications */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <h3 className="font-semibold text-slate-800 text-sm">In-App Notifications</h3>

        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-700">Show in-app notifications</label>
          <Switch
            checked={formData.in_app_notifications}
            onCheckedChange={() => handleToggle("in_app_notifications")}
          />
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-2">Frequency</label>
          <select
            name="notification_frequency"
            value={formData.notification_frequency}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="immediate">Immediate</option>
            <option value="daily">Daily Digest</option>
            <option value="weekly">Weekly Digest</option>
          </select>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-700">Enable quiet hours</label>
          <Switch
            checked={formData.quiet_hours_enabled}
            onCheckedChange={() => handleToggle("quiet_hours_enabled")}
          />
        </div>

        {formData.quiet_hours_enabled && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Start time</label>
              <Input
                type="time"
                name="quiet_hours_start"
                value={formData.quiet_hours_start}
                onChange={handleInputChange}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">End time</label>
              <Input
                type="time"
                name="quiet_hours_end"
                value={formData.quiet_hours_end}
                onChange={handleInputChange}
                className="text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex gap-2 pt-4 border-t border-slate-200">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={() => saveMutation.mutate(formData)}
          disabled={saveMutation.isPending}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </div>
    </div>
  );
}