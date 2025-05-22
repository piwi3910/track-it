import { Outlet, NavLink } from 'react-router-dom';
import {
  AppShell,
  Burger,
  Group,
  UnstyledButton,
  Text,
  ThemeIcon,
  Stack,
  Menu,
  ActionIcon,
  Divider,
  rem
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
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
  IconUsers
} from '@tabler/icons-react';
import { GlobalSearch } from '@/components/GlobalSearch';
import { NotificationMenu } from '@/components/NotificationMenu';
import { ApiStatus } from '@/components/ApiStatus';
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { useStore } from '@/hooks/useStore';
import { useApp } from '@/hooks/useApp';

export function AppLayout() {
  const [opened, { toggle }] = useDisclosure();
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
  const isAdmin = user.role === 'admin';

  // Navigation items
  const navItems = [
    { icon: <IconDashboard size={16} />, label: 'Dashboard', to: '/dashboard' },
    { icon: <IconLayoutKanban size={16} />, label: 'Kanban', to: '/kanban' },
    { icon: <IconCalendar size={16} />, label: 'Calendar', to: '/calendar' },
    { icon: <IconList size={16} />, label: 'Backlog', to: '/backlog' },
    { icon: <IconTemplate size={16} />, label: 'Templates', to: '/templates', disabled: true },
  ];

  // Admin navigation items (only visible to admin users)
  const adminNavItems = isAdmin ? [
    { icon: <IconUsers size={16} />, label: 'Admin', to: '/admin' },
  ] : [];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 200, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <img 
              src="/logo.png" 
              alt="Track-It Logo" 
              className="app-logo"
            />
          </Group>

          {/* Global search */}
          <GlobalSearch />

          {/* Header actions */}
          <Group>
            {/* API status indicator (only visible in dev or when there's an issue) */}
            <ApiStatus />

            <ActionIcon
              variant="light"
              onClick={theme.toggleColorScheme}
              title={theme.isDark ? 'Light mode' : 'Dark mode'}
            >
              {theme.isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>

            {/* Notification menu */}
            <NotificationMenu />

            <Menu position="bottom-end" shadow="md">
              <Menu.Target>
                <UnstyledButton>
                  <Group gap="xs">
                    <InitialsAvatar 
                      name={user.name} 
                      src={user.avatarUrl} 
                      radius="xl" 
                      size="sm" 
                    />
                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={500} lineClamp={1}>
                        {user.name}
                      </Text>
                    </div>
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item leftSection={<IconSettings size={14} />} component={NavLink} to="/settings">Settings</Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconLogout size={14} />}
                  color="red"
                  onClick={auth.logout}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack justify="space-between" h="100%">
          <Stack gap={8}>
            {navItems.map((item) => (
              item.disabled ? (
                <div
                  key={item.to}
                  className="nav-link disabled coming-soon"
                  style={{
                    borderRadius: '8px',
                    textDecoration: 'none',
                  }}
                >
                  <UnstyledButton className="nav-item-button">
                    <Group gap="xs">
                      <ThemeIcon variant="light" size="sm" className="nav-icon">
                        {item.icon}
                      </ThemeIcon>
                      <Text className="nav-text">{item.label}</Text>
                    </Group>
                  </UnstyledButton>
                </div>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => isActive ? 'active-nav-link' : 'nav-link'}
                  style={{
                    borderRadius: '8px',
                    textDecoration: 'none',
                  }}
                >
                  <UnstyledButton className="nav-item-button">
                    <Group gap="xs">
                      <ThemeIcon variant="light" size="sm" className="nav-icon">
                        {item.icon}
                      </ThemeIcon>
                      <Text className="nav-text">{item.label}</Text>
                    </Group>
                  </UnstyledButton>
                </NavLink>
              )
            ))}

            {/* Admin section - only visible to admin users */}
            {isAdmin && adminNavItems.length > 0 && (
              <>
                <Divider my="sm" />
                {adminNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => isActive ? 'active-nav-link' : 'nav-link'}
                    style={{
                      borderRadius: '8px',
                      textDecoration: 'none',
                    }}
                  >
                    <UnstyledButton className="nav-item-button">
                      <Group gap="xs">
                        <ThemeIcon variant="light" size="sm" className="nav-icon" color="orange">
                          {item.icon}
                        </ThemeIcon>
                        <Text className="nav-text" c="orange.6">{item.label}</Text>
                      </Group>
                    </UnstyledButton>
                  </NavLink>
                ))}
              </>
            )}
          </Stack>

          {/* Footer navigation items */}
          <NavLink
            to="/settings"
            className={({ isActive }) => isActive ? 'active-nav-link' : 'nav-link'}
            style={{
              borderRadius: '8px',
              textDecoration: 'none',
              marginBottom: rem(8),
            }}
          >
            <UnstyledButton className="nav-item-button">
              <Group gap="xs">
                <ThemeIcon variant="light" size="sm" className="nav-icon">
                  <IconSettings size={16} />
                </ThemeIcon>
                <Text className="nav-text">Settings</Text>
              </Group>
            </UnstyledButton>
          </NavLink>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet /> {/* This is where routed page components will be rendered */}
      </AppShell.Main>
    </AppShell>
  );
}