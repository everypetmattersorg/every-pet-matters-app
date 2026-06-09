import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import NotificationCenter from "./NotificationCenter";

export default function NotificationBell({ userEmail, userRole }) {
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", userEmail],
    queryFn: () =>
    base44.entities.Notification.filter(
      { user_email: userEmail },
      "-created_date",
      50
    ),
    enabled: !!userEmail,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative p-2 hover:bg-slate-100 rounded-lg transition">
          <Bell className="w-5 h-5 text-[#faf5f0]" />
          {unreadCount > 0 &&
          <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-rose-500 text-white text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          }
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-96 p-0">
        <div className="h-full overflow-y-auto">
          <div className="p-4">
            <NotificationCenter userEmail={userEmail} userRole={userRole} />
          </div>
        </div>
      </SheetContent>
    </Sheet>);

}