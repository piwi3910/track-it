import { forwardRef, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './select';
import { Label } from './label';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
  group?: string;
}

interface AppSelectProps {
  // Map Mantine props to shadcn equivalents
  label?: string;
  description?: string;
  placeholder?: string;
  data: (string | SelectOption)[];
  value?: string;
  onChange?: (value: string | null) => void;
  error?: string | boolean;
  withAsterisk?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  clearable?: boolean;
  searchable?: boolean; // Note: shadcn Select doesn't have built-in search
}

export const AppSelect = forwardRef<HTMLButtonElement, AppSelectProps>(
  ({ 
    label,
    description,
    placeholder = "Select an option",
    data,
    value,
    onChange,
    error,
    withAsterisk,
    required,
    disabled,
    className,
    id,
    clearable,
    searchable,
  }, ref) => {
    const [selectId] = useState(id || `select-${Math.random().toString(36).substr(2, 9)}`);
    const hasError = !!error;

    // Normalize data to SelectOption format
    const options: SelectOption[] = data.map(item => {
      if (typeof item === 'string') {
        return { value: item, label: item };
      }
      return item;
    });

    // Group options by group property
    const groupedOptions = options.reduce((acc, option) => {
      const group = option.group || 'default';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(option);
      return acc;
    }, {} as Record<string, SelectOption[]>);

    const handleValueChange = (newValue: string) => {
      if (clearable && newValue === value) {
        onChange?.(null);
      } else {
        onChange?.(newValue);
      }
    };

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={selectId} className="text-sm font-medium">
            {label}
            {(withAsterisk || required) && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        <Select value={value} onValueChange={handleValueChange} disabled={disabled}>
          <SelectTrigger
            ref={ref}
            id={selectId}
            className={cn(
              hasError && "border-destructive focus:border-destructive",
              className
            )}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${selectId}-error` : undefined}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {searchable && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                Note: Search is not yet implemented
              </div>
            )}
            {Object.entries(groupedOptions).map(([group, groupOptions]) => (
              <SelectGroup key={group}>
                {group !== 'default' && <SelectLabel>{group}</SelectLabel>}
                {groupOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        {error && typeof error === 'string' && (
          <p id={`${selectId}-error`} className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AppSelect.displayName = 'AppSelect';