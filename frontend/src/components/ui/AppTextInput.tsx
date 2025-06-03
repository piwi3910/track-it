import { forwardRef, useState } from 'react';
import { Input } from './input';
import { Label } from './label';
import { cn } from '@/lib/utils';

interface AppTextInputProps extends Omit<React.ComponentPropsWithoutRef<'input'>, 'type'> {
  // Map Mantine props to shadcn equivalents
  label?: string;
  description?: string;
  error?: string | boolean;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  icon?: React.ReactNode; // Alias for leftSection
  withAsterisk?: boolean;
  radius?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const AppTextInput = forwardRef<HTMLInputElement, AppTextInputProps>(
  ({ 
    label,
    description,
    error,
    leftSection,
    rightSection,
    icon,
    withAsterisk,
    required,
    className,
    id,
    ...props 
  }, ref) => {
    const [inputId] = useState(id || `input-${Math.random().toString(36).substr(2, 9)}`);
    const hasError = !!error;
    const leftIcon = leftSection || icon;

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={inputId} className="text-sm font-medium">
            {label}
            {(withAsterisk || required) && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <div className="h-4 w-4">{leftIcon}</div>
            </div>
          )}
          <Input
            ref={ref}
            id={inputId}
            className={cn(
              leftIcon && "pl-10",
              rightSection && "pr-10",
              hasError && "border-destructive focus-visible:border-destructive",
              className
            )}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${inputId}-error` : undefined}
            {...props}
          />
          {rightSection && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <div className="h-4 w-4">{rightSection}</div>
            </div>
          )}
        </div>
        {error && typeof error === 'string' && (
          <p id={`${inputId}-error`} className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AppTextInput.displayName = 'AppTextInput';