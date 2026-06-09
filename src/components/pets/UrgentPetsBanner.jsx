import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UrgentPetsBanner({ pets = [], onFilterUrgent }) {
  const urgentCount = pets.filter(p => p.urgent && p.adoption_status !== 'Adopted').length;
  if (urgentCount === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-red-800">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <p className="text-sm font-medium">
          {urgentCount} urgent pet{urgentCount !== 1 ? 's' : ''} need immediate help
        </p>
      </div>
      <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100 shrink-0" onClick={onFilterUrgent}>
        View Urgent
      </Button>
    </div>
  );
}