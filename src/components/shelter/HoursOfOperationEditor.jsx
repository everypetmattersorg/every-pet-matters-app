import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function HoursOfOperationEditor({ value, onChange }) {
  const [hours, setHours] = useState({
    Monday: { open: true, openTime: '09:00', closeTime: '17:00' },
    Tuesday: { open: true, openTime: '09:00', closeTime: '17:00' },
    Wednesday: { open: true, openTime: '09:00', closeTime: '17:00' },
    Thursday: { open: true, openTime: '09:00', closeTime: '17:00' },
    Friday: { open: true, openTime: '09:00', closeTime: '17:00' },
    Saturday: { open: true, openTime: '09:00', closeTime: '17:00' },
    Sunday: { open: false, openTime: '', closeTime: '' }
  });

  useEffect(() => {
    if (value && typeof value === 'object') {
      setHours(value);
    }
  }, []);

  const handleDayChange = (day, field, val) => {
    const updated = {
      ...hours,
      [day]: { ...hours[day], [field]: val }
    };
    setHours(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Hours of Operation</Label>
      <div className="space-y-2">
        {DAYS.map(day => {
          const dayHours = hours[day] || { open: true, openTime: '09:00', closeTime: '17:00' };
          return (
          <div key={day} className="flex items-end gap-3">
            <div className="w-24">
              <p className="text-sm font-medium text-slate-700">{day}</p>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Select
                value={dayHours.open ? 'open' : 'closed'}
                onValueChange={val => handleDayChange(day, 'open', val === 'open')}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              {dayHours.open && (
                <>
                  <Input
                    type="time"
                    value={dayHours.openTime}
                    onChange={e => handleDayChange(day, 'openTime', e.target.value)}
                    className="w-24"
                  />
                  <span className="text-slate-600 text-sm">to</span>
                  <Input
                    type="time"
                    value={dayHours.closeTime}
                    onChange={e => handleDayChange(day, 'closeTime', e.target.value)}
                    className="w-24"
                  />
                </>
              )}
              </div>
              </div>
              );
              })}
      </div>
    </div>
  );
}