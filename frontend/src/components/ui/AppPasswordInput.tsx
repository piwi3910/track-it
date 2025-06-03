import { forwardRef, useState } from 'react';
import { Input } from './input';
import { Label } from './label';
import { cn } from '@/lib/utils';
import { IconEye, IconEyeOff } from '@tabler/icons-react';

interface AppPasswordInputProps extends Omit<React.ComponentPropsWithoutRef<'input'>, 'type'> {
  // Map Mantine props to shadcn equivalents
  label?: string;
  description?: string;
  error?: string | boolean;
  leftSection?: React.ReactNode;
  withAsterisk?: boolean;
  radius?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  visibilityToggleIcon?: ({ reveal }: { reveal: boolean }) => React.ReactNode;
}

export const AppPasswordInput = forwardRef<HTMLInputElement, AppPasswordInputProps>(
  ({ 
    label,
    description,
    error,
    leftSection,
    withAsterisk,
    required,
    className,
    id,
    visibilityToggleIcon,
    ...props 
  }, ref) => {
    const [inputId] = useState(id || `password-${Math.random().toString(36).substr(2, 9)}`);
    const [showPassword, setShowPassword] = useState(false);
    const hasError = !!error;

    const ToggleIcon = visibilityToggleIcon 
      ? visibilityToggleIcon({ reveal: showPassword })
      : (showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />);

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
          {leftSection && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <div className="h-4 w-4">{leftSection}</div>
            </div>
          )}
          <Input
            ref={ref}
            id={inputId}
            type={showPassword ? "text" : "password"}
            className={cn(
              leftSection && "pl-10",
              "pr-10", // Always have right padding for toggle button
              hasError && "border-destructive focus-visible:border-destructive",
              className
            )}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${inputId}-error` : undefined}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {ToggleIcon}
          </button>
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

AppPasswordInput.displayName = 'AppPasswordInput';