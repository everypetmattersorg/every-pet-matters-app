import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Heart } from "lucide-react";
import PreferencesForm from "@/components/preferences/PreferencesForm";
import CloakedEmailManager from "@/components/preferences/CloakedEmailManager";
import { createPageUrl } from "@/utils";

export default function Preferences() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.auth.me().
    then(setUser).
    finally(() => setLoading(false));
  }, []);

  const handleSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>);

  }

  return (
    <div className="min-h-screen from-blue-50 to-indigo-50 py-12 bg-[hsl(var(--background))]">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[hsl(var(--chart-4))]">
              <Heart className="w-6 h-6 text-[hsl(var(--muted))]" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Your Pet Preferences</h1>
          </div>
          <p className="text-slate-600">
            Help us find your perfect pet match! Tell us about your lifestyle and what you're looking for.
          </p>
        </div>

        {/* Success Message */}
        {saved &&
        <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-800 rounded-lg">
            ✓ Preferences saved! Check out <a href={createPageUrl("Recommendations")} className="font-semibold underline">pet recommendations</a>.
          </div>
        }

        {/* Form Container */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <PreferencesForm
              preferences={user?.preferences}
              onSaved={handleSaved} />
            

            {/* Link to Recommendations */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-slate-600 mb-3">Already set your preferences?</p>
              <Link to="/Recommendations">
                <Button className="w-full rounded-xl bg-primary hover:bg-primary/90">
                  View Pet Recommendations
                </Button>
              </Link>
            </div>
          </div>

          {/* Cloaked Email Manager */}
          <CloakedEmailManager />
        </div>
      </div>
    </div>);

}