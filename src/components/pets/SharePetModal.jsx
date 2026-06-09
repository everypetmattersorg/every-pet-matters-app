import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check } from 'lucide-react';

export default function SharePetModal({ pet, open, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!pet) return null;

  const shareUrl = pet.url || window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share {pet.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-slate-500">Share this pet's listing with others to help find them a home.</p>

          <div className="flex gap-2">
            <Input value={shareUrl} readOnly className="text-xs" />
            <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0 gap-1">
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              asChild
            >
              <a
                href={`https://twitter.com/intent/tweet?text=Help ${pet.name} find a home!&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Share on X
              </a>
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              asChild
            >
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Share on Facebook
              </a>
            </Button>
          </div>

          <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}