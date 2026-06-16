import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/lib/AuthContext';

export default function TermsGateModal() {
  const { acceptTerms } = useAuth();
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleContinue = async () => {
    setSaving(true);
    setError(null);
    const { error } = await acceptTerms();
    if (error) setError('Something went wrong — please try again.');
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10050] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🐾</span>
          <h2 className="text-xl font-bold text-slate-900">welcome to every pet matters</h2>
        </div>
        <p className="text-slate-600 text-sm mb-4">
          before you get started, please review and accept our terms & conditions.
        </p>
        <a
          href="/TermsAndConditions"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm text-violet-600 hover:text-violet-700 underline mb-5"
        >
          read the full terms & conditions
        </a>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex items-start gap-3 mb-6">
          <Checkbox
            id="terms-check"
            checked={checked}
            onCheckedChange={setChecked}
            className="mt-0.5"
          />
          <label htmlFor="terms-check" className="text-sm text-slate-700 cursor-pointer">
            I have read and agree to the terms & conditions.
          </label>
        </div>

        <Button
          onClick={handleContinue}
          disabled={!checked || saving}
          className="w-full rounded-xl text-slate-900 font-medium"
          style={{ backgroundColor: '#eab308' }}
        >
          {saving ? 'saving...' : 'continue'}
        </Button>
      </div>
    </div>
  );
}
