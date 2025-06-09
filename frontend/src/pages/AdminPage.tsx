import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  IconUsers,
  IconUserPlus,
  IconEdit,
  IconTrash,
  IconKey,
  IconShield,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconEye,
  IconEyeOff
} from '@tabler/icons-react';
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
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [passwordModalOpened, setPasswordModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Modal control functions
  const openCreateModal = () => setCreateModalOpened(true);
  const closeCreateModal = () => setCreateModalOpened(false);
  const openEditModal = () => setEditModalOpened(true);
  const closeEditModal = () => setEditModalOpened(false);
  const openPasswordModal = () => setPasswordModalOpened(true);
  const closePasswordModal = () => setPasswordModalOpened(false);
  const openDeleteModal = () => setDeleteModalOpened(true);
  const closeDeleteModal = () => setDeleteModalOpened(false);

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
      <div className="container max-w-7xl mx-auto p-8">
        <Alert variant="destructive">
          <IconAlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access this page. Admin privileges are required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="users">
            <IconUsers className="mr-2 h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="settings">
            <IconShield className="mr-2 h-4 w-4" />
            System Settings
          </TabsTrigger>
        </TabsList>
        
        {/* User Management Tab */}
        <TabsContent value="users">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Users ({users.length})</h3>
                <Button
                  onClick={openCreateModal}
                >
                  <IconUserPlus size={16} className="mr-2 h-4 w-4" />
                  Create User
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-[200px]">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <InitialsAvatar
                                name={user.name}
                                src={user.avatarUrl}
                                size="sm"
                              />
                              <span className="font-medium">{user.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground">{user.email}</span>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={getRoleBadgeVariant(user.role || 'member')}
                              className={getRoleBadgeClassName(user.role || 'member')}>
                              {(user.role || 'member').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditUserModal(user)}
                              >
                                <IconEdit size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openPasswordResetModal(user)}
                              >
                                <IconKey size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => openDeleteUserModal(user)}
                                disabled={user.id === currentUser?.id}
                              >
                                <IconTrash size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* System Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">System Settings</h3>
              <p className="text-muted-foreground">System configuration options will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Modal */}
      <Dialog open={createModalOpened} onOpenChange={(open) => !open && closeCreateModal()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                placeholder="Enter user's full name"
                required
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                placeholder="Enter user's email"
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="create-role">Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(value) => setCreateForm({ ...createForm, role: value as UserRole })}
              >
                <SelectTrigger id="create-role">
                  <SelectValue placeholder="Select user role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guest">Guest</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="create-password">Password</Label>
              <div className="relative">
                <Input
                  id="create-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  required
                  value={createForm.password || ''}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={closeCreateModal}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser}>
                Create User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editModalOpened} onOpenChange={(open) => !open && closeEditModal()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                placeholder="Enter user's full name"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                placeholder="Enter user's email"
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(value) => setEditForm({ ...editForm, role: value as UserRole })}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Select user role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guest">Guest</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={closeEditModal}>
                Cancel
              </Button>
              <Button onClick={handleEditUser}>
                Update User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Reset Modal */}
      <Dialog open={passwordModalOpened} onOpenChange={(open) => !open && closePasswordModal()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Password for {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={closePasswordModal}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={handlePasswordReset}>
                Reset Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Modal */}
      <Dialog open={deleteModalOpened} onOpenChange={(open) => !open && closeDeleteModal()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Delete User - Impact Assessment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <IconAlertCircle className="h-4 w-4" />
              <AlertTitle>Warning: This action cannot be undone</AlertTitle>
              <AlertDescription>
                You are about to permanently delete <strong>{selectedUser?.name}</strong> and all associated data.
              </AlertDescription>
            </Alert>

            {loadingStats ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary mr-2"></div>
                <span className="text-sm">Loading impact assessment...</span>
              </div>
            ) : deletionStats ? (
              <div className="space-y-4">
                <p className="font-medium">Deletion Impact:</p>
              
              {deletionStats.consequences.willDelete.length > 0 && (
                <Alert variant="destructive">
                  <IconX className="h-4 w-4" />
                  <AlertTitle>Will be permanently deleted:</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-1">
                      {deletionStats.consequences.willDelete.map((item, index) => (
                        <p key={index} className="text-sm">• {item}</p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {deletionStats.consequences.willUpdate.length > 0 && (
                <Alert className="border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-100">
                  <IconAlertCircle className="h-4 w-4" />
                  <AlertTitle>Will be updated:</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-1">
                      {deletionStats.consequences.willUpdate.map((item, index) => (
                        <p key={index} className="text-sm">• {item}</p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {deletionStats.stats.createdTasks === 0 && 
               deletionStats.stats.comments === 0 && 
               deletionStats.stats.assignedTasks === 0 ? (
                <Alert className="border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100">
                  <IconCheck className="h-4 w-4" />
                  <AlertDescription>
                    This user has no associated tasks or comments. Deletion will be clean.
                  </AlertDescription>
                </Alert>
              ) : null}
              </div>
            ) : (
            <Alert className="border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-100">
              <IconAlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to load deletion statistics. Proceeding may have unexpected consequences.
              </AlertDescription>
            </Alert>
          )}

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={closeDeleteModal}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteUser}
                disabled={loadingStats}
              >
                {loadingStats ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                ) : (
                  'Delete User'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}