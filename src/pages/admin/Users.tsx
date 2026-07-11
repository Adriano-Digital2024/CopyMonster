import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, UserPlus, Edit, Trash2, MoreHorizontal, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserProfile {
  id: string;
  first_name: string;
  email: string;
  subscription_status: string;
  credits: number;
  created_at: string;
  internal_role: string | null;
}

const INTERNAL_ROLES = [
  'board',
  'product',
  'marketing',
  'sales',
  'customerSuccess',
  'support',
  'finance',
  'legal',
  'operations',
  'data',
] as const;

const Users = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newCredits, setNewCredits] = useState('');
  const [saving, setSaving] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    firstName: '',
    password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, email, subscription_status, credits, created_at, internal_role')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers((data || []) as { id: string; first_name: string | null; email: string | null; subscription_status: string; credits: number; created_at: string; internal_role: string | null }[]);
    } catch (error: any) {
      toast({
        title: t('admin.users.errors.loadError', 'Error loading users'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = filterPlan === 'all' || user.subscription_status === filterPlan;
    const matchesRole = filterRole === 'all' || 
                        (filterRole === 'none' ? !user.internal_role : user.internal_role === filterRole);
    return matchesSearch && matchesPlan && matchesRole;
  });

  const handleEditCredits = (user: UserProfile) => {
    setSelectedUser(user);
    setNewCredits(user.credits.toString());
    setEditDialogOpen(true);
  };

  const handleSaveCredits = async () => {
    if (!selectedUser) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ credits: parseInt(newCredits) })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({
        title: t('admin.users.errors.creditsUpdated', 'Credits updated'),
        description: t('admin.users.errors.creditsUpdatedDesc', { name: selectedUser.first_name, credits: newCredits, defaultValue: `${selectedUser.first_name} now has ${newCredits} credits` }),
      });

      setEditDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: t('admin.users.errors.creditsError', 'Error updating credits'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = (user: UserProfile) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleAddUser = async () => {
    if (!newUserData.email || !newUserData.firstName || !newUserData.password) {
      toast({
        title: t('admin.users.errors.requiredFields', 'Required fields'),
        description: t('admin.users.errors.fillAllFields', 'Please fill in all fields'),
        variant: "destructive"
      });
      return;
    }

    if (newUserData.password.length < 8) {
      toast({
        title: t('admin.users.errors.passwordTooShort', 'Password too short'),
        description: t('admin.users.errors.passwordMinLength', 'Password must be at least 8 characters'),
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `https://bcatupltfvgwelhzeznk.supabase.co/functions/v1/admin-users?action=create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            email: newUserData.email,
            password: newUserData.password,
            firstName: newUserData.firstName
          })
        }
      );

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to create user');
      }

      toast({
        title: t('admin.users.errors.userCreated', 'User created'),
        description: t('admin.users.errors.userCreatedDesc', { name: newUserData.firstName, defaultValue: `${newUserData.firstName} was added successfully` }),
      });

      setAddUserDialogOpen(false);
      setNewUserData({ email: '', firstName: '', password: '' });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: t('admin.users.errors.createError', 'Error creating user'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    
    setSaving(true);
    try {
      const response = await fetch(
        `https://bcatupltfvgwelhzeznk.supabase.co/functions/v1/admin-users?action=delete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ userId: selectedUser.id })
        }
      );

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to delete user');
      }

      toast({
        title: t('admin.users.errors.userDeleted', 'User deleted'),
        description: t('admin.users.errors.userDeletedDesc', { name: selectedUser.first_name, defaultValue: `${selectedUser.first_name} was removed successfully` }),
      });

      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: t('admin.users.errors.deleteError', 'Error deleting user'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInternalRoleChange = async (userId: string, role: string) => {
    const newRole = role === 'none' ? null : role;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ internal_role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, internal_role: newRole } : u));

      toast({
        title: t('admin.users.internalRoleUpdated', 'Role updated'),
        description: t('admin.users.internalRoleUpdatedDesc', 'Internal role has been updated successfully.'),
      });
    } catch (error: any) {
      toast({
        title: t('admin.users.internalRoleError', 'Error updating role'),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'legend': return 'default';
      case 'pro': return 'secondary';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.users.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('admin.users.subtitle')}</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>{t('admin.users.allUsers')}</CardTitle>
                <CardDescription>{filteredUsers.length} {t('admin.users.manageUsers')}</CardDescription>
              </div>
              <Button onClick={() => setAddUserDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                {t('admin.users.addUser')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('admin.users.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterPlan} onValueChange={setFilterPlan}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder={t('admin.users.filterByPlan')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.users.allPlans')}</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="legend">Legend</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-full md:w-[220px]">
                  <SelectValue placeholder={t('admin.users.filterByRole', 'Filter by role')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.users.allRoles', 'All Roles')}</SelectItem>
                  <SelectItem value="none">{t('admin.users.noRole', 'No Role')}</SelectItem>
                  {INTERNAL_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {t(`admin.users.roles.${role}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.users.name')}</TableHead>
                    <TableHead>{t('admin.users.email')}</TableHead>
                    <TableHead>{t('admin.users.plan')}</TableHead>
                    <TableHead>{t('admin.users.internalRoleLabel', 'Internal Role')}</TableHead>
                    <TableHead>{t('admin.users.credits')}</TableHead>
                    <TableHead>{t('admin.users.joined')}</TableHead>
                    <TableHead className="text-right">{t('admin.users.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {t('admin.users.errors.noUsersFound', 'No users found')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.first_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getPlanBadgeVariant(user.subscription_status)}>
                            {user.subscription_status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.internal_role || 'none'}
                            onValueChange={(value) => handleInternalRoleChange(user.id, value)}
                          >
                            <SelectTrigger className="w-[180px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">{t('admin.users.noRole', 'No Role')}</SelectItem>
                              {INTERNAL_ROLES.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {t(`admin.users.roles.${role}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{user.credits}</TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditCredits(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('admin.users.editCredits')}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteUser(user)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('admin.users.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Credits Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.users.editCreditsTitle')}</DialogTitle>
            <DialogDescription>
              {t('admin.users.editCreditsDescription', { name: selectedUser?.first_name })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="credits">{t('admin.users.newCredits')}</Label>
              <Input
                id="credits"
                type="number"
                value={newCredits}
                onChange={(e) => setNewCredits(e.target.value)}
                placeholder="100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveCredits} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.users.deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('admin.users.deleteDescription', { name: selectedUser?.first_name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.users.addUser')}</DialogTitle>
            <DialogDescription>
              {t('admin.users.errors.addUserDesc', 'Create a new user in the system')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-firstname">{t('admin.users.name')}</Label>
              <Input
                id="new-firstname"
                placeholder="João Silva"
                value={newUserData.firstName}
                onChange={(e) => setNewUserData({...newUserData, firstName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">{t('admin.users.email')}</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="joao@exemplo.com"
                value={newUserData.email}
                onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">{t('admin.users.errors.tempPassword', 'Temporary Password')}</Label>
              <Input
                id="new-password"
                type="password"
                placeholder={t('admin.users.errors.passwordMinLength', 'At least 8 characters')}
                value={newUserData.password}
                onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddUser} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('admin.users.addUser')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Users;
