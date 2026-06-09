import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2 } from "lucide-react";

export default function VolunteerModal({ rescueEmail, rescueName, onClose }) {
  const [formData, setFormData] = useState({
    volunteer_name: "",
    volunteer_email: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await base44.entities.VolunteerInterest.create({
        rescue_email: rescueEmail,
        volunteer_name: formData.volunteer_name,
        volunteer_email: formData.volunteer_email,
        message: formData.message
      });
      setSubmitted(true);
      setTimeout(onClose, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Volunteer with {rescueName}</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">✓</div>
              <h3 className="font-semibold text-slate-800 mb-1">Thank you!</h3>
              <p className="text-slate-600 text-sm">We'll be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-1 block">Name</Label>
                <Input
                  required
                  placeholder="Your name"
                  value={formData.volunteer_name}
                  onChange={(e) => setFormData({...formData, volunteer_name: e.target.value})}
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-1 block">Email</Label>
                <Input
                  required
                  type="email"
                  placeholder="your@email.com"
                  value={formData.volunteer_email}
                  onChange={(e) => setFormData({...formData, volunteer_email: e.target.value})}
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-1 block">Message (optional)</Label>
                <textarea
                  placeholder="Tell us about your volunteer interests..."
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                  rows="3"
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-rose-600 hover:bg-rose-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}