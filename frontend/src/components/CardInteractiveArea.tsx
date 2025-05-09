import React from 'react';

interface CardInteractiveAreaProps {
  children: React.ReactNode;
}

/**
 * A component that prevents click events from bubbling up to parent components
 * Used to isolate interactive areas in cards
 */
export function CardInteractiveArea({ children }: CardInteractiveAreaProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <div 
      onClick={handleClick} 
      onMouseDown={handleClick}
      data-no-propagation="true"
      style={{ cursor: 'default' }}
    >
      {children}
    </div>
  );
}