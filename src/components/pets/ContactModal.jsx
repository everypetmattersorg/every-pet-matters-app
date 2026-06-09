import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, Phone, ExternalLink } from 'lucide-react';

export default function ContactModal({ pet, open, onClose }) {
  if (!pet) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Contact for {pet.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-slate-500">
            Reach out to <span className="font-medium text-slate-700">{pet.source || 'the shelter'}</span> about adopting {pet.name}.
          </p>

          {pet.contact && (
            <div className="space-y-2">
              {pet.contact.includes('@') ? (
                <a href={`mailto:${pet.contact}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Mail className="w-4 h-4" /> {pet.contact}
                </a>
              ) : (
                <a href={`tel:${pet.contact}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Phone className="w-4 h-4" /> {pet.contact}
                </a>
              )}
            </div>
          )}

          {pet.url && (
            <Button variant="outline" className="w-full gap-2" asChild>
              <a href={pet.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" /> View Full Listing
              </a>
            </Button>
          )}

          {!pet.contact && !pet.url && (
            <p className="text-sm text-slate-400 italic">No contact information available for this pet.</p>
          )}

          <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}