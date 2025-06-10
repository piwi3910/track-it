import { Outlet, NavLink } from 'react-router-dom';
import { useState } from 'react';
import {
  IconDashboard,
  IconLayoutKanban,
  IconCalendar,
  IconList,
  IconSettings,
  IconMoon,
  IconSun,
  IconLogout,
  IconTemplate,
  IconUsers,
  IconMenu2
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GlobalSearch } from '@/components/GlobalSearch';
import { NotificationMenu } from '@/components/NotificationMenu';
import { ApiStatus } from '@/components/ApiStatus';
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { useStore } from '@/hooks/useStore';
import { useApp } from '@/hooks/useApp';
import { isAdmin } from '@track-it/shared';

export function AppLayout() {
  const [opened, setOpened] = useState(false);
  const { theme, auth } = useStore();
  const { currentUser } = useApp();

  // Use current user from AppContext, with fallback
  const user = currentUser || auth.user || {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?u=john-doe',
    role: 'member'
  };

  // Check if user is admin
  const hasAdminAccess = isAdmin(user);

  // Navigation items
  const navItems = [
    { icon: <IconDashboard size={16} />, label: 'Dashboard', to: '/dashboard' },
    { icon: <IconLayoutKanban size={16} />, label: 'Kanban', to: '/kanban' },
    { icon: <IconCalendar size={16} />, label: 'Calendar', to: '/calendar' },
    { icon: <IconList size={16} />, label: 'Backlog', to: '/backlog' },
    { icon: <IconTemplate size={16} />, label: 'Templates', to: '/templates', disabled: true },
  ];

  // Admin navigation items (only visible to admin users)
  const adminNavItems = hasAdminAccess ? [
    { icon: <IconUsers size={16} />, label: 'Admin', to: '/admin' },
  ] : [];

  const NavContent = () => (
    <>
      <div className="space-y-2">
        {navItems.map((item) => (
          item.disabled ? (
            <div
              key={item.to}
              className="flex items-center gap-2 p-2 rounded-md text-muted-foreground cursor-not-allowed opacity-50"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                {item.icon}
              </div>
              <span className="text-sm">{item.label}</span>
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 
                `flex items-center gap-2 p-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground ${
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                }`
              }
              onClick={() => setOpened(false)}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                {item.icon}
              </div>
              <span className="text-sm">{item.label}</span>
            </NavLink>
          )
        ))}

        {/* Admin section - only visible to admin users */}
        {isAdmin && adminNavItems.length > 0 && (
          <>
            <Separator className="my-2" />
            {adminNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => 
                  `flex items-center gap-2 p-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground ${
                    isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                  }`
                }
                onClick={() => setOpened(false)}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-orange-100 dark:bg-orange-900">
                  {item.icon}
                </div>
                <span className="text-sm text-orange-600 dark:text-orange-400">{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </div>

      <div className="mt-auto">
        <NavLink
          to="/settings"
          className={({ isActive }) => 
            `flex items-center gap-2 p-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground ${
              isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
            }`
          }
          onClick={() => setOpened(false)}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
            <IconSettings size={16} />
          </div>
          <span className="text-sm">Settings</span>
        </NavLink>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile menu */}
            <Sheet open={opened} onOpenChange={setOpened}>
              <SheetTrigger asChild className="sm:hidden">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <IconMenu2 className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex flex-col h-full p-4">
                  <img 
                    src="/logo.png" 
                    alt="Track-It Logo" 
                    className="h-8 w-auto mb-6"
                  />
                  <NavContent />
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <img 
              src="/logo.png" 
              alt="Track-It Logo" 
              className="h-8 w-auto"
            />

            {/* Global search */}
            <div className="flex-1 max-w-md mx-auto">
              <GlobalSearch />
            </div>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-2">
            {/* API status indicator */}
            <ApiStatus />

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={theme.toggleColorScheme}
              title={theme.isDark ? 'Light mode' : 'Dark mode'}
            >
              {theme.isDark ? <IconSun className="h-5 w-5" /> : <IconMoon className="h-5 w-5" />}
            </Button>

            {/* Notification menu */}
            <NotificationMenu />

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-2">
                  <div className="flex items-center gap-2">
                    <InitialsAvatar 
                      name={user.name} 
                      src={user.avatarUrl} 
                      radius="full" 
                      size="sm" 
                    />
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <NavLink to="/settings" className="flex items-center">
                    <IconSettings className="mr-2 h-4 w-4" />
                    Settings
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 dark:text-red-400"
                  onClick={auth.logout}
                >
                  <IconLogout className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex">
        {/* Desktop sidebar */}
        <aside className="hidden sm:flex w-64 border-r bg-background">
          <div className="flex flex-col w-full p-4">
            <NavContent />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}