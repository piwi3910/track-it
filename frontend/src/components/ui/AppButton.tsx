import { forwardRef } from 'react';
import { Button as ShadcnButton, type ButtonProps as ShadcnButtonProps } from './button';
import { IconLoader2 } from '@tabler/icons-react';

interface AppButtonProps extends Omit<ShadcnButtonProps, 'color'> {
  // Map Mantine props to shadcn equivalents
  loading?: boolean;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  color?: 'blue' | 'red' | 'green' | 'yellow' | 'gray';
  fullWidth?: boolean;
  mt?: string | number;
  mb?: string | number;
}

// Map Mantine colors to shadcn variants
const colorToVariant = (color?: string): ShadcnButtonProps['variant'] => {
  switch (color) {
    case 'red':
      return 'destructive';
    case 'gray':
      return 'secondary';
    default:
      return 'default';
  }
};

// Convert Mantine spacing props to Tailwind classes
const getSpacingClasses = (mt?: string | number, mb?: string | number) => {
  const classes: string[] = [];
  
  if (mt) {
    if (mt === 'md') classes.push('mt-4');
    else if (mt === 'lg') classes.push('mt-6');
    else if (mt === 'xl') classes.push('mt-8');
    else if (typeof mt === 'number') classes.push(`mt-[${mt}px]`);
  }
  
  if (mb) {
    if (mb === 'md') classes.push('mb-4');
    else if (mb === 'lg') classes.push('mb-6');
    else if (mb === 'xl') classes.push('mb-8');
    else if (typeof mb === 'number') classes.push(`mb-[${mb}px]`);
  }
  
  return classes.join(' ');
};

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(
  ({ 
    loading, 
    leftSection, 
    rightSection, 
    color, 
    fullWidth,
    mt,
    mb,
    children,
    disabled,
    className = '',
    ...props 
  }, ref) => {
    const variant = colorToVariant(color);
    const spacingClasses = getSpacingClasses(mt, mb);
    const widthClass = fullWidth ? 'w-full' : '';
    
    return (
      <ShadcnButton
        ref={ref}
        variant={variant}
        disabled={disabled || loading}
        className={`${widthClass} ${spacingClasses} ${className}`.trim()}
        {...props}
      >
        {loading ? (
          <>
            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            {leftSection}
            {children}
            {rightSection}
          </>
        )}
      </ShadcnButton>
    );
  }
);

AppButton.displayName = 'AppButton';