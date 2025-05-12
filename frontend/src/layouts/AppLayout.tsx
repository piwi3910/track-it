import { Outlet, NavLink } from 'react-router-dom';
import {
  AppShell,
  Burger,
  Group,
  Title,
  UnstyledButton,
  Text,
  ThemeIcon,
  Stack,
  Avatar,
  Menu,
  ActionIcon,
  rem
} from '@mantine/core';
import { useTheme } from '@/context/ThemeContext';
import { useDisclosure } from '@mantine/hooks';
import {
  IconDashboard,
  IconLayoutKanban,
  IconCalendar,
  IconList,
  IconSettings,
  IconMoon,
  IconSun,
  IconUser,
  IconLogout,
  IconTemplate
} from '@tabler/icons-react';
import { GlobalSearch } from '@/components/GlobalSearch';
import { NotificationMenu } from '@/components/NotificationMenu';
import { useApp } from '@/hooks/useApp';
// Optional: Import from your context if you've implemented it
// import { useAppContext } from '@/context/useAppContext';

// Get user from AppContext now instead of mock
// This will be replaced by the real user data from the context

export function AppLayout() {
  const [opened, { toggle }] = useDisclosure();
  const { toggleColorScheme, isDark } = useTheme();
  const { currentUser } = useApp();

  // Fallback user data while loading
  const user = currentUser || {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?u=john-doe'
  };

  // Navigation items
  const navItems = [
    { icon: <IconDashboard size={16} />, label: 'Dashboard', to: '/dashboard' },
    { icon: <IconLayoutKanban size={16} />, label: 'Kanban', to: '/kanban' },
    { icon: <IconCalendar size={16} />, label: 'Calendar', to: '/calendar' },
    { icon: <IconList size={16} />, label: 'Backlog', to: '/backlog' },
    { icon: <IconTemplate size={16} />, label: 'Templates', to: '/templates' },
  ];

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
            <Title order={3}>Track-It</Title>
          </Group>

          {/* Global search */}
          <GlobalSearch />

          {/* Header actions */}
          <Group>
            <ActionIcon
              variant="light"
              onClick={toggleColorScheme}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>

            {/* Notification menu */}
            <NotificationMenu />

            <Menu position="bottom-end" shadow="md">
              <Menu.Target>
                <UnstyledButton>
                  <Group gap="xs">
                    <Avatar src={user.avatarUrl} radius="xl" size="sm" />
                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={500} lineClamp={1}>
                        {user.name}
                      </Text>
                    </div>
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item leftSection={<IconUser size={14} />}>Profile</Menu.Item>
                <Menu.Item leftSection={<IconSettings size={14} />}>Settings</Menu.Item>
                <Menu.Divider />
                <Menu.Item leftSection={<IconLogout size={14} />} color="red">
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
            ))}
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