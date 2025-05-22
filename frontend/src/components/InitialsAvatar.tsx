import { Avatar, AvatarProps } from '@mantine/core';
import { useMemo } from 'react';

interface InitialsAvatarProps extends Omit<AvatarProps, 'children'> {
  name: string;
  src?: string | null;
}

export function InitialsAvatar({ name, src, ...props }: InitialsAvatarProps) {
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

  return (
    <Avatar
      src={src}
      {...props}
      style={{
        backgroundColor: src ? undefined : backgroundColor,
        color: 'white',
        fontWeight: 600,
        ...props.style,
      }}
    >
      {!src && initials}
    </Avatar>
  );
}