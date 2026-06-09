import { Card, CardContent } from '@/components/ui/card';

// Placeholder — wire up to real analytics data when available
export default function DailyNewUsersChart() {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm font-semibold mb-1">Daily New Users</p>
        <p className="text-xs text-muted-foreground mb-4">Connect analytics data source to populate this chart.</p>
        <div className="h-40 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <p className="text-xs text-muted-foreground">No data available</p>
        </div>
      </CardContent>
    </Card>
  );
}