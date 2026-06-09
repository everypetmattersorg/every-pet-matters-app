import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import EventWizard from "@/components/events/EventWizard";

export default function CreateEvent() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoadingUser(false));
  }, []);

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "rescue" && user.role !== "shelter")) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-4">Only shelters and rescues can create events.</p>
          <Link to={createPageUrl("Home")}>
            <Button style={{ background: '#b1511d' }}>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link to={createPageUrl("Events")}>
            <Button variant="ghost" className="mb-4 hover:bg-[#b1511d]/10 hover:text-[#b1511d]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Create New Event</h1>
          <p className="text-slate-600 mt-2">Follow the steps to create an adoption event, training class, or fundraiser.</p>
        </div>
      </div>

      {/* Wizard */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <EventWizard userEmail={user.email} />
      </div>
    </div>
  );
}