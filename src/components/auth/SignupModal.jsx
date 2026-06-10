import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/api/supabaseClient";

export default function SignupModal({ onClose }) {
  const handleGoogle = async () => {
    sessionStorage.setItem('login_return_url', window.location.href);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/Login` },
    });
  };

  const handleEmail = () => {
    sessionStorage.setItem('login_return_url', window.location.href);
    window.location.href = '/Login';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img src="https://media.base44.com/images/public/69a0f10efc1058c9e80d1210/e47a94797_every_pet_logos__1_.png" alt="every pet logo" className="w-10 h-10" />
            <h2 className="text-2xl font-bold text-slate-800">join every pet</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-slate-600 text-sm">
            join our community to adopt pets, report lost & found animals, and connect with rescues.
          </p>
          <Button
            type="button"
            className="w-full rounded-xl text-slate-900 font-medium py-2"
            style={{ backgroundColor: '#eab308' }}
            onClick={handleEmail}
          >
            sign up / sign in with email
          </Button>
          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t border-slate-200" />
            <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">or continue with</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>
          <button type="button" onClick={handleGoogle} className="w-full flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition text-sm font-medium text-slate-700">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            continue with Google
          </button>
          <p className="text-xs text-slate-500 text-center">
            by signing up, you agree to our{" "}
            <a href="/TermsAndConditions" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:text-violet-700 underline">
              terms & conditions
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
