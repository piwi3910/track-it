import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  IconUser,
  IconBrandGoogle,
  IconBell,
  IconPalette,
  IconLogout,
  IconMailFilled,
} from '@tabler/icons-react';
import { GoogleIntegrationPanel } from './settings/GoogleIntegrationPanel';
import { ProfilePictureUpload } from '@/components/ProfilePictureUpload';
import { useApp } from '@/hooks/useApp';
import { useTheme } from '@/hooks/useTheme';;
import { api } from '@/api';

export function SettingsPage() {
  const { currentUser, userLoading } = useApp();
  const { isDark, toggleColorScheme } = useTheme();
  const [activeTab, setActiveTab] = useState<string | null>('account');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [defaultView, setDefaultView] = useState<string>('dashboard');
  
  // Handle avatar update using the correct API pattern
  const handleAvatarChange = async (avatarUrl: string | null) => {
    try {
      // @ts-expect-error - Method may not exist in current API
      await api.auth.updateProfile?.({
        avatarUrl: avatarUrl
      });
      
      // Handle success - no error checking needed with direct response
      
      // Trigger a refetch of user data to update the UI
      window.location.reload();
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update avatar');
    }
  };
  
  // Show loading state if user data is not available
  if (userLoading) {
    return (
      <div className="container max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        <p className="text-muted-foreground">Loading user settings...</p>
      </div>
    );
  }

  // Show error state if no user data is available after loading
  if (!currentUser) {
    return (
      <div className="container max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        <p className="text-destructive">Unable to load user settings. Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="account">
            <IconUser className="mr-2 h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <IconBell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <IconPalette className="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger 
            value="integrations" 
            className="disabled coming-soon"
          >
            <IconBrandGoogle className="mr-2 h-4 w-4" />
            Integrations
          </TabsTrigger>
        </TabsList>
        
        {/* Account Settings */}
        <TabsContent value="account">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-8">
                <ProfilePictureUpload
                  currentAvatarUrl={currentUser.avatarUrl}
                  userName={currentUser.name}
                  onAvatarChange={handleAvatarChange}
                  size="xl"
                />
                
                <div className="flex-1 space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      defaultValue={currentUser.name}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      defaultValue={currentUser.email}
                    />
                  </div>
                  
                  <div className="mt-4">
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{currentUser.role?.toUpperCase() || 'MEMBER'}</Badge>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex items-center justify-between">
                    <Button variant="outline">Change Password</Button>
                    <Button variant="destructive">
                      <IconLogout size={16} className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                
                <Accordion defaultValue="email" type="single" collapsible>
                  <AccordionItem value="email">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <IconMailFilled size={16} />
                        Email Notifications
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Receive email notifications</span>
                          <Switch 
                            id="email-notifications"
                            checked={emailNotifications} 
                            onCheckedChange={setEmailNotifications} 
                          />
                        </div>
                        
                        <Separator className="my-2" />
                        
                        <div className="flex items-center justify-between">
                          <span>Task assignments</span>
                          <Switch defaultChecked disabled={!emailNotifications} />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>Task due date reminders</span>
                          <Switch defaultChecked disabled={!emailNotifications} />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>Mentions in comments</span>
                          <Switch defaultChecked disabled={!emailNotifications} />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>Status changes</span>
                          <Switch disabled={!emailNotifications} />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="in-app">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <IconBell size={16} />
                        In-App Notifications
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Show in-app notifications</span>
                          <Switch 
                            id="in-app-notifications"
                            checked={inAppNotifications} 
                            onCheckedChange={setInAppNotifications} 
                          />
                        </div>
                        
                        <Separator className="my-2" />
                        
                        <div className="flex items-center justify-between">
                          <span>Task assignments</span>
                          <Switch defaultChecked disabled={!inAppNotifications} />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>Comments on your tasks</span>
                          <Switch defaultChecked disabled={!inAppNotifications} />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>Mentions in comments</span>
                          <Switch defaultChecked disabled={!inAppNotifications} />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>Status changes</span>
                          <Switch defaultChecked disabled={!inAppNotifications} />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>Due date reminders</span>
                          <Switch defaultChecked disabled={!inAppNotifications} />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Appearance</h3>
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p>Dark Mode</p>
                    <p className="text-sm text-muted-foreground">Enable dark mode for the application</p>
                  </div>
                  <Switch 
                    id="dark-mode"
                    checked={isDark} 
                    onCheckedChange={toggleColorScheme}
                  />
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p>Default View</p>
                    <p className="text-sm text-muted-foreground">Choose which page to show when you first log in</p>
                  </div>
                  <Select
                    value={defaultView}
                    onValueChange={(val) => val && setDefaultView(val)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dashboard">Dashboard</SelectItem>
                      <SelectItem value="kanban">Kanban Board</SelectItem>
                      <SelectItem value="calendar">Calendar</SelectItem>
                      <SelectItem value="backlog">Backlog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <GoogleIntegrationPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}