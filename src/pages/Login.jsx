import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';

// Subscribe at module level so we catch PASSWORD_RECOVERY before the component mounts
let _recoveryDetected = false;
supabase.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') {
    _recoveryDetected = true;
  }
});
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'reset' | 'new-password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const returnUrl = sessionStorage.getItem('login_return_url') || '/';
  const isRecovery = useRef(false);

  useEffect(() => {
    // Check if recovery was detected before this component mounted
    if (_recoveryDetected) {
      isRecovery.current = true;
      _recoveryDetected = false;
      setMode('new-password');
    }

    // Also detect from URL: bare # means Supabase just cleared a recovery hash
    if (window.location.href.endsWith('#')) {
      isRecovery.current = true;
      setMode('new-password');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        isRecovery.current = true;
        setMode('new-password');
      } else if (event === 'SIGNED_IN' && session && !isRecovery.current) {
        sessionStorage.removeItem('login_return_url');
        window.location.href = returnUrl;
      }
    });

    return () => subscription.unsubscribe();
  }, [returnUrl]);

  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setError(error.message);
    } else {
      setMessage('Password updated! You are now signed in.');
      setTimeout(() => { window.location.href = '/'; }, 2000);
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      sessionStorage.removeItem('login_return_url');
      window.location.href = returnUrl;
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for a confirmation link, then come back to sign in.');
    }
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/Login`,
    });
    if (error) {
      setError(error.message);
    } else {
      setMessage('Password reset email sent. Check your inbox.');
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/Login` },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF5F0] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="flex items-center gap-3 mb-6">
          <img
            src="https://media.base44.com/images/public/69a0f10efc1058c9e80d1210/e47a94797_every_pet_logos__1_.png"
            alt="every pet"
            className="w-10 h-10"
          />
          <h1 className="text-2xl font-bold text-slate-800">
            {mode === 'login' ? 'sign in' : mode === 'signup' ? 'create account' : mode === 'new-password' ? 'set new password' : 'reset password'}
          </h1>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
            {error}
          </div>
        )}

        {mode === 'new-password' && (
          <form onSubmit={handleSetNewPassword} className="space-y-4">
            <div>
              <Label htmlFor="new-password">new password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="at least 6 characters"
                className="mt-1"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-xl text-slate-900 font-medium" style={{ backgroundColor: '#eab308' }}>
              {loading ? 'saving...' : 'set new password'}
            </Button>
          </form>
        )}

        {mode !== 'new-password' && <form onSubmit={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleReset} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <Label htmlFor="fullName">full name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="mt-1"
              />
            </div>
          )}
          <div>
            <Label htmlFor="email">email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          {mode !== 'reset' && (
            <div>
              <Label htmlFor="password">password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1"
              />
            </div>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl text-slate-900 font-medium"
            style={{ backgroundColor: '#eab308' }}
          >
            {loading ? 'please wait...' : mode === 'login' ? 'sign in' : mode === 'signup' ? 'create account' : 'send reset email'}
          </Button>
        </form>}


        {mode !== 'reset' && mode !== 'new-password' && (
          <>
            <div className="relative flex items-center gap-3 my-4">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">or</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>
            <Button onClick={handleGoogle} variant="outline" className="w-full rounded-xl">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              continue with Google
            </Button>
          </>
        )}

        <div className="mt-6 text-center text-sm text-slate-500 space-y-2">
          {mode === 'login' && (
            <>
              <button onClick={() => { setMode('signup'); setError(null); setMessage(null); }} className="text-violet-600 hover:underline block w-full">
                don't have an account? sign up
              </button>
              <button onClick={() => { setMode('reset'); setError(null); setMessage(null); }} className="text-slate-400 hover:text-slate-600 hover:underline block w-full">
                forgot password?
              </button>
            </>
          )}
          {mode === 'signup' && (
            <button onClick={() => { setMode('login'); setError(null); setMessage(null); }} className="text-violet-600 hover:underline">
              already have an account? sign in
            </button>
          )}
          {mode === 'reset' && (
            <button onClick={() => { setMode('login'); setError(null); setMessage(null); }} className="text-violet-600 hover:underline">
              back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
