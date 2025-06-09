import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface InitialsAvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export function InitialsAvatar({ name, src, size = 'md', radius = 'full', className }: InitialsAvatarProps) {
  // Generate initials from name
  const initials = useMemo(() => {
    if (!name) return '?';
    
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    
    // Take first letter of first two words
    return words
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }, [name]);

  // Generate consistent background color based on name
  const backgroundColor = useMemo(() => {
    if (!name) return '#868e96';
    
    // Simple hash function to generate consistent color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate a color from the hash (avoiding too dark or too light colors)
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 55%)`;
  }, [name]);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-14 w-14 text-lg'
  };

  const radiusClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };

  return (
    <Avatar 
      className={cn(
        sizeClasses[size],
        radiusClasses[radius],
        className
      )}
    >
      <AvatarImage src={src || undefined} alt={name} />
      <AvatarFallback 
        style={{ 
          backgroundColor: backgroundColor,
          color: 'white',
          fontWeight: 600
        }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}