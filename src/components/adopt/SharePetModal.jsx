import { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Share2, Copy, Check, Download } from 'lucide-react';
import { toast } from 'sonner';
import SocialCardGenerator from './SocialCardGenerator';

const CAPTION_TYPES = [
  { id: 'rescue', label: '🚨 Needs Rescue' },
  { id: 'adoption', label: '🏠 Adoption' },
];

export default function SharePetModal({ pet, open, onClose }) {
  const [copied, setCopied] = useState(false);
  const [captionType, setCaptionType] = useState(pet?.rescue_needed ? 'rescue' : 'adoption');
  const [customMessage, setCustomMessage] = useState('');
  const canvasRef = useRef(null);

  const petUrl = `${window.location.origin}/PetDashboard`;
  const adoptionMessage = `Help ${pet.name} find a loving home! 🏠🐾\n\n${pet.species || 'A pet'}${pet.breed ? ` (${pet.breed})` : ''}${pet.location ? ` in ${pet.location}` : ''} is looking for their forever family.\n\n💛 Adopt don't shop — visit us at: ${petUrl}\n\n#AdoptDontShop #PetAdoption #AdoptAPet`;
  const rescueMessage = `🚨 URGENT: ${pet.name} needs a rescue NOW! 🚨\n\n${pet.species || 'A pet'}${pet.breed ? ` (${pet.breed})` : ''}${pet.location ? ` in ${pet.location}` : ''} is at risk and needs immediate help — a foster, rescue pull, or transport partner.\n\nTime is critical. Can you help? 👉 ${petUrl}\n\n#RescueMe #UrgentRescue #FosterSaveLife`;
  const defaultMessage = captionType === 'rescue' ? rescueMessage : adoptionMessage;
  const fullMessage = customMessage || defaultMessage;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  const downloadCard = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.href = canvasRef.current.toDataURL('image/png');
    link.download = `${pet.name}-adoption-card.png`;
    link.click();
    toast.success('Card downloaded! Share it on social media.');
  };

  const handleShare = (platform) => {
    const encoded = encodeURIComponent(fullMessage);
    const urls = {
      instagram: `https://www.instagram.com/`,
      facebook: `https://www.facebook.com/sharer/sharer.php?quote=${encoded}&hashtag=%23AdoptDontShop`,
      email: `mailto:?subject=Help adopt ${pet.name}&body=${encoded}`,
    };
    if (platform === 'instagram') {
      navigator.clipboard.writeText(fullMessage);
      downloadCard();
      toast.success('Card downloaded! Open Instagram and upload the image.');
      window.open(urls.instagram, '_blank');
    } else if (urls[platform]) {
      window.open(urls[platform], '_blank');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Share {pet.name}
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <SocialCardGenerator pet={pet} canvasRef={canvasRef} />

          <div className="rounded-lg overflow-hidden border w-full bg-muted/30">
            <canvas ref={canvasRef} className="w-full h-auto" />
          </div>

          <div className="space-y-2">
            <Label>Pet Dashboard Link</Label>
            <div className="flex gap-2">
              <Input value={petUrl} disabled className="bg-muted/50 text-xs" />
              <Button size="sm" variant="outline" onClick={handleCopy} className="gap-2">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Caption Type</Label>
            <div className="flex gap-2">
              {CAPTION_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setCaptionType(t.id); setCustomMessage(''); }}
                  className={`flex-1 py-1.5 px-3 rounded-md border text-sm font-medium transition-colors ${
                    captionType === t.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-white hover:bg-muted border-border'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Social Post</Label>
            <Textarea
              id="message"
              value={customMessage || defaultMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              placeholder="Customize your post message..."
            />
            <p className="text-xs text-muted-foreground">Characters: {fullMessage.length}</p>
          </div>

          <div className="space-y-2">
            <Label>Share To</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" onClick={downloadCard} className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Download className="w-3 h-3" /> Download Card
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleShare('instagram')} className="gap-2">
                📸 Instagram
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleShare('facebook')} className="gap-2">
                f Facebook
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleShare('email')} className="gap-2">
                ✉️ Email
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Button onClick={handleCopy} variant="default" className="flex-1 gap-2">
              <Copy className="w-3 h-3" /> Copy Post
            </Button>
            <Button onClick={onClose} variant="outline">Done</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}