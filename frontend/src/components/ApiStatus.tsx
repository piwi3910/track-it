import { IconRefresh, IconCloud, IconCloudOff, IconDatabaseImport, IconDatabase, IconClock } from '@tabler/icons-react';
import { useApiStore } from '@/stores/useApiStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { useState, useMemo } from 'react';
import { TIME_CONSTANTS } from '@track-it/shared';

/**
 * ApiStatus component displays the current status of the API connection
 * and provides a refresh button to check the connection.
 */
function ApiStatusContent() {
  const { 
    apiAvailable, 
    apiError, 
    isApiLoading, 
    checkApiAvailability,
    isMockApi,
    setMockApi,
    connectionAttempts,
    maxConnectionAttempts,
    recentErrors,
    lastChecked,
    nextScheduledCheck,
    resetConnectionAttempts
  } = useApiStore();
  
  const [opened, setOpened] = useState(false);
  
  // Calculate time until next check
  const timeUntilNextCheck = useMemo(() => {
    if (!nextScheduledCheck) return null;
    
    const diff = nextScheduledCheck - Date.now();
    if (diff <= 0) return null;
    
    return Math.ceil(diff / 1000); // In seconds
  }, [nextScheduledCheck]);
  
  // Format time ago
  const formatTimeAgo = (timestamp: string | null) => {
    if (!timestamp) return 'never';
    
    const diff = Date.now() - new Date(timestamp).getTime();
    if (diff < TIME_CONSTANTS.ONE_MINUTE) return 'just now';
    if (diff < TIME_CONSTANTS.ONE_HOUR) return `${Math.floor(diff / TIME_CONSTANTS.ONE_MINUTE)}m ago`;
    return `${Math.floor(diff / TIME_CONSTANTS.ONE_HOUR)}h ago`;
  };
  
  // Don't show anything in prod mode if API is available and not using mock
  if (import.meta.env.MODE === 'production' && apiAvailable && !apiError && !isMockApi) {
    return null;
  }
  
  return (
    <Popover open={opened} onOpenChange={setOpened}>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-2">
          {isMockApi ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <IconDatabaseImport size={14} className="mr-1 inline" />
                  Mock
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom">Using mock API</TooltipContent>
            </Tooltip>
          ) : apiAvailable ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <IconCloud size={14} className="mr-1 inline" />
                  API
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom">API is connected</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive" className="text-sm">
                  <IconCloudOff size={14} className="mr-1 inline" />
                  API Down
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom">{apiError || 'API is not available'}</TooltipContent>
            </Tooltip>
          )}

          {!isMockApi && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${
                    isApiLoading ? "text-blue-600" : 
                    connectionAttempts >= maxConnectionAttempts ? "text-red-600" : 
                    !apiAvailable ? "text-yellow-600" : 
                    "text-gray-600"
                  }`}
                  disabled={isApiLoading}
                  onClick={() => {
                    checkApiAvailability(true); // Force check
                    setOpened(true);
                  }}
                >
                  <IconRefresh size={14} className={isApiLoading ? 'animate-spin' : ''} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {
                  isApiLoading ? "Checking API connection..." : 
                  connectionAttempts >= maxConnectionAttempts ? "Connection attempts exhausted" :
                  !apiAvailable && timeUntilNextCheck ? `Next check in ${timeUntilNextCheck}s` :
                  !apiAvailable ? "API unavailable" :
                  "Check API connection"
                }
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </PopoverTrigger>
      
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <h3 className="font-medium">API Connection Status</h3>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={isMockApi || apiAvailable ? 'default' : 'destructive'}
              className={isMockApi ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 
                        apiAvailable ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
            >
              {isMockApi ? 'Mock API' : apiAvailable ? 'Connected' : 'Disconnected'}
              {isMockApi ? <IconDatabase size={12} className="ml-1 inline" /> : 
               apiAvailable ? <IconCloud size={12} className="ml-1 inline" /> : 
               <IconCloudOff size={12} className="ml-1 inline" />}
            </Badge>
            
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-6 text-xs"
              onClick={() => checkApiAvailability(true)} // Force check
              disabled={isMockApi || isApiLoading}
              title="Force API check"
            >
              {isApiLoading ? 'Checking...' : 'Check'}
              {!isApiLoading && <IconRefresh size={14} className="ml-2 h-4 w-4" />}
            </Button>
          </div>
          
          {!isMockApi && !apiAvailable && (
            <>
              <p className="text-sm text-muted-foreground">
                {apiError || 'Cannot connect to API server'}
              </p>
              
              {connectionAttempts > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">Connection attempts:</span>
                    <Progress 
                      value={(connectionAttempts / maxConnectionAttempts) * 100} 
                      className={`h-2 w-24 ${connectionAttempts >= maxConnectionAttempts ? "[&>*]:bg-red-600" : "[&>*]:bg-yellow-600"}`}
                    />
                    <span className="text-xs font-medium">
                      {connectionAttempts}/{maxConnectionAttempts}
                    </span>
                  </div>
                  
                  {timeUntilNextCheck && (
                    <div className="flex items-center gap-2">
                      <IconClock size={14} />
                      <span className="text-xs">
                        Next check in {timeUntilNextCheck}s
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => resetConnectionAttempts()}
                      >
                        Reset
                      </Button>
                    </div>
                  )}
                </>
              )}
              
              {lastChecked && (
                <p className="text-xs">
                  Last checked: {formatTimeAgo(lastChecked)}
                </p>
              )}
              
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setMockApi(true)}
                >
                  Switch to Mock API
                </Button>
                
                {connectionAttempts >= maxConnectionAttempts && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => {
                      resetConnectionAttempts();
                      checkApiAvailability(true);
                    }}
                  >
                    Retry Connection
                  </Button>
                )}
              </div>
            </>
          )}
          
          {isMockApi && (
            <>
              <p className="text-sm text-muted-foreground">
                Using mock API data. No server connection required.
              </p>
              
              <Button
                variant="secondary"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  setMockApi(false);
                  resetConnectionAttempts();
                  checkApiAvailability(true);
                }}
              >
                Try Real API
              </Button>
            </>
          )}
          
          {recentErrors.length > 0 && (
            <>
              <h4 className="text-xs font-medium mt-2">Recent Errors</h4>
              {recentErrors.slice(0, 3).map((error, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  {new Date(error.timestamp).toLocaleTimeString()}: {error.message}
                </p>
              ))}
              
              {recentErrors.length > 3 && (
                <p className="text-xs text-muted-foreground italic">
                  +{recentErrors.length - 3} more errors
                </p>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ApiStatus() {
  return (
    <TooltipProvider>
      <ApiStatusContent />
    </TooltipProvider>
  );
}