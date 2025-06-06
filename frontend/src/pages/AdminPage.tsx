import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Paper,
  Group,
  Text,
  TextInput,
  Select,
  PasswordInput,
  Table,
  ActionIcon,
  Stack,
  Loader,
  Center
} from '@mantine/core';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppModal } from '@/components/ui/AppModal';
import { AppTabs } from '@/components/ui/AppTabs';
import { AppAlert } from '@/components/ui/AppAlert';
import {
  IconUsers,
  IconUserPlus,
  IconEdit,
  IconTrash,
  IconKey,
  IconShield,
  IconAlertCircle,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@/components/ui/notifications';
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { useApp } from '@/hooks/useApp';
import { User, UserRole } from '@track-it/shared';
import { api } from '@/api';

interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
}

interface PasswordResetData {
  userId: string;
  newPassword: string;
  confirmPassword: string;
}

interface DeletionStats {
  user: {
    id: string;
    name: string;
    email: string;
  };
  stats: {
    createdTasks: number;
    assignedTasks: number;
    comments: number;
    notifications: number;
  };
  consequences: {
    willDelete: string[];
    willUpdate: string[];
  };
}

export function AdminPage() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<string | null>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deletionStats, setDeletionStats] = useState<DeletionStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Modal states
  const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
  const [passwordModalOpened, { open: openPasswordModal, close: closePasswordModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

  // Form states
  const [createForm, setCreateForm] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'member',
    password: ''
  });
  const [editForm, setEditForm] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'member'
  });
  const [passwordForm, setPasswordForm] = useState<PasswordResetData>({
    userId: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin';

  // Load users data from API
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getAllUsers();
      setUsers(data as unknown as User[]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load users';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        icon: <IconX size={16} />
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  // Handle create user
  const handleCreateUser = async () => {
    try {
      await api.admin.createUser({
        name: createForm.name,
        email: createForm.email,
        // password: createForm.password || '', // Remove if not supported
        role: createForm.role
      });
      
      // Handle success - no error checking needed with direct response
      // if (error) {
      //   throw new Error(error);
      // }
      
      notifications.show({
        title: 'Success',
        message: 'User created successfully',
        color: 'green',
        icon: <IconCheck size={16} />
      });
      
      closeCreateModal();
      setCreateForm({ name: '', email: '', role: 'member', password: '' });
      
      // Refresh users list
      await loadUsers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  };

  // Handle edit user
  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    try {
      // Convert role case for API compatibility
      const updateData = {
        ...editForm,
        role: editForm.role?.toUpperCase() as unknown
      };
      await api.admin.updateUser(selectedUser.id, updateData as Record<string, unknown>);
      
      notifications.show({
        title: 'Success',
        message: 'User updated successfully',
        color: 'green',
        icon: <IconCheck size={16} />
      });
      
      closeEditModal();
      setSelectedUser(null);
      
      // Refresh users list
      await loadUsers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notifications.show({
        title: 'Error',
        message: 'Passwords do not match',
        color: 'red',
        icon: <IconX size={16} />
      });
      return;
    }

    try {
      await api.admin.resetUserPassword(passwordForm.userId, passwordForm.newPassword);
      
      notifications.show({
        title: 'Success',
        message: 'Password reset successfully',
        color: 'green',
        icon: <IconCheck size={16} />
      });
      
      closePasswordModal();
      setPasswordForm({ userId: '', newPassword: '', confirmPassword: '' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await api.admin.deleteUser(selectedUser.id);
      
      notifications.show({
        title: 'Success',
        message: 'User deleted successfully',
        color: 'green',
        icon: <IconCheck size={16} />
      });
      
      closeDeleteModal();
      setSelectedUser(null);
      setDeletionStats(null);
      
      // Refresh users list
      await loadUsers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  };

  // Open edit modal with user data
  const openEditUserModal = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role || 'member'
    });
    openEditModal();
  };

  // Open password reset modal
  const openPasswordResetModal = (user: User) => {
    setPasswordForm({
      userId: user.id,
      newPassword: '',
      confirmPassword: ''
    });
    setSelectedUser(user);
    openPasswordModal();
  };

  // Open delete modal with statistics
  const openDeleteUserModal = async (user: User) => {
    setSelectedUser(user);
    setLoadingStats(true);
    openDeleteModal();
    
    try {
      const data = await api.admin.getUserDeletionStats(user.id);
      
      // Handle success - no error checking needed with direct response
      // if (error) {
      //   throw new Error(error);
      // }
      
      setDeletionStats((data || null) as unknown as DeletionStats | null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load deletion statistics';
      notifications.show({
        title: 'Warning',
        message: errorMessage,
        color: 'orange',
        icon: <IconAlertCircle size={16} />
      });
    } finally {
      setLoadingStats(false);
    }
  };

  // Get role badge className
  const getRoleBadgeClassName = (role: UserRole) => {
    switch (role) {
      case 'admin': return '';
      case 'member': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'guest': return '';
      default: return '';
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'destructive' as const;
      case 'member': return 'secondary' as const;
      case 'guest': return 'secondary' as const;
      default: return 'secondary' as const;
    }
  };

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <Container size="xl">
        <AppAlert
          icon={<IconAlertCircle size={16} />}
          title="Access Denied"
          color="red"
        >
          You don't have permission to access this page. Admin privileges are required.
        </AppAlert>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Title mb="xl">Admin Panel</Title>
      
      <AppTabs value={activeTab} onChange={setActiveTab}>
        <AppTabs.List mb="xl">
          <AppTabs.Tab value="users" leftSection={<IconUsers size={16} />}>
            User Management
          </AppTabs.Tab>
          <AppTabs.Tab value="settings" leftSection={<IconShield size={16} />}>
            System Settings
          </AppTabs.Tab>
        </AppTabs.List>
        
        {/* User Management Tab */}
        {activeTab === 'users' && (
          <Paper withBorder p="xl">
            <Group justify="space-between" mb="lg">
              <Title order={3}>Users ({users.length})</Title>
              <Button
                onClick={openCreateModal}
              >
                <IconUserPlus size={16} className="mr-2 h-4 w-4" />
                Create User
              </Button>
            </Group>

            {loading ? (
              <Center h={200}>
                <Loader size="lg" />
              </Center>
            ) : (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>User</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Role</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {users.map((user) => (
                    <Table.Tr key={user.id}>
                      <Table.Td>
                        <Group gap="sm">
                          <InitialsAvatar
                            name={user.name}
                            src={user.avatarUrl}
                            size="sm"
                          />
                          <Text fw={500}>{user.name}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text c="dimmed">{user.email}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge 
                          variant={getRoleBadgeVariant(user.role || 'member')}
                          className={getRoleBadgeClassName(user.role || 'member')}>
                          {(user.role || 'member').toUpperCase()}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => openEditUserModal(user)}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="yellow"
                            onClick={() => openPasswordResetModal(user)}
                          >
                            <IconKey size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => openDeleteUserModal(user)}
                            disabled={user.id === currentUser?.id}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Paper>
        )}
        
        {/* System Settings Tab */}
        {activeTab === 'settings' && (
          <Paper withBorder p="xl">
            <Title order={3} mb="md">System Settings</Title>
            <Text c="dimmed">System configuration options will be available here.</Text>
          </Paper>
        )}
      </AppTabs>

      {/* Create User Modal */}
      <AppModal
        opened={createModalOpened}
        onClose={closeCreateModal}
        title="Create New User"
        centered
        size="md"
      >
        <Stack>
          <TextInput
            label="Name"
            placeholder="Enter user's full name"
            required
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
          />
          <TextInput
            label="Email"
            placeholder="Enter user's email"
            type="email"
            required
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
          />
          <Select
            label="Role"
            placeholder="Select user role"
            required
            value={createForm.role}
            onChange={(value) => setCreateForm({ ...createForm, role: value as UserRole })}
            data={[
              { value: 'guest', label: 'Guest' },
              { value: 'member', label: 'Member' },
              { value: 'admin', label: 'Admin' }
            ]}
          />
          <PasswordInput
            label="Password"
            placeholder="Enter password"
            required
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={closeCreateModal}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser}>
              Create User
            </Button>
          </Group>
        </Stack>
      </AppModal>

      {/* Edit User Modal */}
      <AppModal
        opened={editModalOpened}
        onClose={closeEditModal}
        title="Edit User"
        centered
        size="md"
      >
        <Stack>
          <TextInput
            label="Name"
            placeholder="Enter user's full name"
            required
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <TextInput
            label="Email"
            placeholder="Enter user's email"
            type="email"
            required
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
          />
          <Select
            label="Role"
            placeholder="Select user role"
            required
            value={editForm.role}
            onChange={(value) => setEditForm({ ...editForm, role: value as UserRole })}
            data={[
              { value: 'guest', label: 'Guest' },
              { value: 'member', label: 'Member' },
              { value: 'admin', label: 'Admin' }
            ]}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button onClick={handleEditUser}>
              Update User
            </Button>
          </Group>
        </Stack>
      </AppModal>

      {/* Password Reset Modal */}
      <AppModal
        opened={passwordModalOpened}
        onClose={closePasswordModal}
        title={`Reset Password for ${selectedUser?.name}`}
        centered
        size="md"
      >
        <Stack>
          <PasswordInput
            label="New Password"
            placeholder="Enter new password"
            required
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
          />
          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm new password"
            required
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={closePasswordModal}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handlePasswordReset}>
              Reset Password
            </Button>
          </Group>
        </Stack>
      </AppModal>

      {/* Delete User Modal */}
      <AppModal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete User - Impact Assessment"
        centered
        size="lg"
      >
        <Stack>
          <AppAlert
            icon={<IconAlertCircle size={16} />}
            color="red"
            title="Warning: This action cannot be undone"
          >
            You are about to permanently delete <strong>{selectedUser?.name}</strong> and all associated data.
          </AppAlert>

          {loadingStats ? (
            <Center py="xl">
              <Loader size="sm" />
              <Text ml="sm">Loading impact assessment...</Text>
            </Center>
          ) : deletionStats ? (
            <Stack gap="md">
              <Text fw={500}>Deletion Impact:</Text>
              
              {deletionStats.consequences.willDelete.length > 0 && (
                <AppAlert color="red" icon={<IconX size={16} />} title="Will be permanently deleted:">
                  <Stack gap="xs">
                    {deletionStats.consequences.willDelete.map((item, index) => (
                      <Text key={index} size="sm">• {item}</Text>
                    ))}
                  </Stack>
                </AppAlert>
              )}

              {deletionStats.consequences.willUpdate.length > 0 && (
                <AppAlert color="orange" icon={<IconAlertCircle size={16} />} title="Will be updated:">
                  <Stack gap="xs">
                    {deletionStats.consequences.willUpdate.map((item, index) => (
                      <Text key={index} size="sm">• {item}</Text>
                    ))}
                  </Stack>
                </AppAlert>
              )}

              {deletionStats.stats.createdTasks === 0 && 
               deletionStats.stats.comments === 0 && 
               deletionStats.stats.assignedTasks === 0 ? (
                <AppAlert color="green" icon={<IconCheck size={16} />}>
                  This user has no associated tasks or comments. Deletion will be clean.
                </AppAlert>
              ) : null}
            </Stack>
          ) : (
            <AppAlert color="orange" icon={<IconAlertCircle size={16} />}>
              Unable to load deletion statistics. Proceeding may have unexpected consequences.
            </AppAlert>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
              disabled={loadingStats}
            >
              {loadingStats ? <Loader size="xs" /> : 'Delete User'}
            </Button>
          </Group>
        </Stack>
      </AppModal>
    </Container>
  );
}