import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, RefreshCw, Loader2, Check, Mail, History } from 'lucide-react';
import { toast } from 'sonner';

export default function CloakedEmailManager({ userEmail }) {
  const [cloakedEmail, setCloakedEmail] = useState(null);
  const [historicalEmails, setHistoricalEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [switching, setSwitching] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (userEmail) fetchCloakedEmails();
  }, [userEmail]);

  const fetchCloakedEmails = async () => {
    try {
      setLoading(true);
      const allEmails = await base44.entities.CloakedEmail.filter(
        { user_email: userEmail },
        '-created_at',
        100
      );
      const active = allEmails.find(e => e.is_active);
      const historical = allEmails.filter(e => !e.is_active);
      
      setCloakedEmail(active || null);
      setHistoricalEmails(historical);
    } catch (error) {
      console.error('Error fetching cloaked emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateEmail = async () => {
    try {
      setGenerating(true);
      const response = await base44.functions.invoke('generateCloakedEmail', {});
      setCloakedEmail({
        ...response.data,
        email_count: 0
      });
      await fetchCloakedEmails();
      toast.success('New cloaked email generated!');
    } catch (error) {
      toast.error('Failed to generate cloaked email');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const handleReactivateEmail = async (emailId) => {
    try {
      setSwitching(emailId);
      // Deactivate current active email
      if (cloakedEmail) {
        await base44.asServiceRole.entities.CloakedEmail.update(cloakedEmail.id, {
          is_active: false
        });
      }
      // Activate selected email
      await base44.asServiceRole.entities.CloakedEmail.update(emailId, {
        is_active: true
      });
      await fetchCloakedEmails();
      toast.success('Switched to historical email!');
    } catch (error) {
      toast.error('Failed to switch email');
      console.error(error);
    } finally {
      setSwitching(null);
    }
  };

  const handleCopyEmail = () => {
    if (cloakedEmail?.cloaked_email) {
      navigator.clipboard.writeText(cloakedEmail.cloaked_email);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Cloaked Email Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Cloaked Email Address
        </CardTitle>
        <p className="text-sm text-slate-500 mt-2">
          Protect your privacy by using a cloaked email that forwards to your account email. Share this address when you report lost & found pets instead of your real email.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {cloakedEmail ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Your Current Cloaked Email</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={cloakedEmail.cloaked_email}
                  readOnly
                  className="h-12 rounded-xl bg-slate-50 border-0"
                />
                <Button
                  onClick={handleCopyEmail}
                  variant="outline"
                  className="px-3"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase font-semibold">Created</p>
                <p className="text-sm font-medium">
                  {new Date(cloakedEmail.created_date).toLocaleDateString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase font-semibold">Emails Received</p>
                <p className="text-sm font-medium text-primary">
                  {cloakedEmail.email_count || 0}
                </p>
              </div>
            </div>

            <Button
              onClick={handleGenerateEmail}
              disabled={generating}
              variant="outline"
              className="w-full gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Generate New Email
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              You haven't generated a cloaked email yet. Create one to start protecting your privacy!
            </p>
            <Button
              onClick={handleGenerateEmail}
              disabled={generating}
              className="w-full gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Generate Cloaked Email
                </>
              )}
            </Button>
          </div>
        )}

        {/* Historical Emails */}
        {historicalEmails.length > 0 && (
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-700">Historical Emails</h3>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                {historicalEmails.length}
              </span>
            </div>
            <div className="space-y-2">
              {historicalEmails.map((email) => (
                <div
                  key={email.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-slate-700 truncate">
                      {email.cloaked_email}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {email.email_count} emails received • {new Date(email.created_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleReactivateEmail(email.id)}
                    disabled={switching === email.id}
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:bg-primary/10"
                  >
                    {switching === email.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Reuse'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}