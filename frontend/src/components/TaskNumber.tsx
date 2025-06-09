import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TaskNumberProps {
  taskNumber: number;
}

/**
 * Displays the task number in a circular badge with copy-to-clipboard functionality
 */
export function TaskNumber({ taskNumber }: TaskNumberProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    navigator.clipboard.writeText(taskNumber.toString());
    
    // Apply temporary visual feedback
    const element = e.currentTarget as HTMLDivElement;
    element.style.opacity = '0.6';
    setTimeout(() => {
      element.style.opacity = '1';
    }, 150);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const element = e.currentTarget as HTMLDivElement;
    element.style.transform = 'scale(1.05)';
    element.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const element = e.currentTarget as HTMLDivElement;
    element.style.transform = 'scale(1)';
    element.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.12)';
  };

  return (
    <div className="task-card-corner-top-left" style={{
      position: 'absolute',
      top: '8px',
      left: '8px',
      zIndex: 25
    }}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'hsl(var(--primary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              color: 'white',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
              transition: 'all 0.2s ease'
            }}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {taskNumber}
          </div>
        </TooltipTrigger>
        <TooltipContent>{`Task #${taskNumber} - Click to copy`}</TooltipContent>
      </Tooltip>
    </div>
  );
}