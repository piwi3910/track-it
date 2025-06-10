import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { IconCalendar } from '@tabler/icons-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskRecurrence {
  pattern: string;
  interval?: number;
  endDate?: string | null;
  daysOfWeek?: number[];
  dayOfMonth?: number;
}

interface TaskRecurrenceTabProps {
  isRecurring: boolean;
  recurrence?: TaskRecurrence;
  onChange: (isRecurring: boolean, recurrence?: TaskRecurrence) => void;
}

const daysOfWeek = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export function TaskRecurrenceTab({ isRecurring, recurrence, onChange }: TaskRecurrenceTabProps) {
  const handleRecurrenceChange = (updates: Partial<TaskRecurrence>) => {
    onChange(isRecurring, { ...recurrence, ...updates } as TaskRecurrence);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="recurring"
          checked={isRecurring}
          onCheckedChange={(checked) => {
            onChange(checked, checked ? { pattern: 'daily', interval: 1 } : undefined);
          }}
        />
        <Label htmlFor="recurring">Enable recurring task</Label>
      </div>

      {isRecurring && recurrence && (
        <>
          <div>
            <Label htmlFor="pattern">Recurrence Pattern</Label>
            <Select
              value={recurrence.pattern}
              onValueChange={(value) => handleRecurrenceChange({ pattern: value })}
            >
              <SelectTrigger id="pattern">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="interval">
              Repeat every {recurrence.pattern === 'daily' ? 'day' : recurrence.pattern.slice(0, -2)}(s)
            </Label>
            <Input
              id="interval"
              type="number"
              min="1"
              value={recurrence.interval || 1}
              onChange={(e) => handleRecurrenceChange({ interval: parseInt(e.target.value) || 1 })}
            />
          </div>

          {recurrence.pattern === 'weekly' && (
            <div>
              <Label>Repeat on</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {daysOfWeek.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={recurrence.daysOfWeek?.includes(day.value) || false}
                      onCheckedChange={(checked) => {
                        const days = recurrence.daysOfWeek || [];
                        const newDays = checked
                          ? [...days, day.value]
                          : days.filter(d => d !== day.value);
                        handleRecurrenceChange({ daysOfWeek: newDays });
                      }}
                    />
                    <Label htmlFor={`day-${day.value}`} className="text-sm font-normal">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recurrence.pattern === 'monthly' && (
            <div>
              <Label htmlFor="dayOfMonth">Day of month</Label>
              <Input
                id="dayOfMonth"
                type="number"
                min="1"
                max="31"
                value={recurrence.dayOfMonth || 1}
                onChange={(e) => handleRecurrenceChange({ dayOfMonth: parseInt(e.target.value) || 1 })}
              />
            </div>
          )}

          <div>
            <Label htmlFor="endDate">End Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="endDate"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !recurrence.endDate && "text-muted-foreground"
                  )}
                >
                  <IconCalendar className="mr-2 h-4 w-4" />
                  {recurrence.endDate ? format(new Date(recurrence.endDate), 'PPP') : 'No end date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={recurrence.endDate ? new Date(recurrence.endDate) : undefined}
                  onSelect={(date) => handleRecurrenceChange({ endDate: date?.toISOString() || null })}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}
    </div>
  );
}