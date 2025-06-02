import { useState, useEffect } from 'react';
import { TeamMember } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Search, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CustomPagination } from '@/components/ui/custom-pagination';
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Mail, Phone, Shield, Calendar } from 'lucide-react';

const UserManagement = () => {
  const { toast } = useToast();
  const { authState } = useAuth();
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<TeamMember[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'edit' | 'delete'>('edit');
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'staff' as 'admin' | 'staff' | 'maintenance',
    station_id: 0,
    national_id_number: ''
  });

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      if (!authState.token) {
        console.log('No token available');
        return;
      }

      setIsLoading(true);
      
      try {
        console.log('Fetching team members...');
        const response = await fetch('http://127.0.0.1:8000/api/superadmin/all_teams', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authState.token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw API Response:', data);

        // Get the team array from the response
        const usersArray = data.team || [];
        console.log('Users Array:', usersArray);
        
        // Map the users to our format
        const mappedUsers = usersArray
          .filter((user: any) => user.id !== undefined && user.id !== null && user.id !== '')
          .map((user: any) => {
            // Only include users with a valid backend id
            return {
              id: user.id.toString(),
              first_name: user.first_name || '',
              last_name: user.last_name || '',
              email: user.email || 'N/A',
              phone: user.phone || 'N/A',
              role: user.role || 'Unknown',
              station_id: user.station_id,
              station_name: user.station_name || 'N/A',
              national_id_number: user.national_id_number || 'N/A'
            };
          });

        console.log('Final mapped users:', mappedUsers);

        // Filter based on role if needed
        let finalUsers = mappedUsers;
        if (authState.role === 'admin' && authState.user?.stationId) {
          finalUsers = mappedUsers.filter(user => 
            (user.role === 'staff' || user.role === 'maintenance') &&
            user.station_id === authState.user?.stationId
          );
        }

        console.log('Setting users:', finalUsers);
        setUsers(finalUsers);
        setFilteredUsers(finalUsers);

      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error',
          description: 'Failed to load users',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [authState.token, authState.role, authState.user?.stationId, toast]);

  useEffect(() => {
    // Apply both search and role filters
    let results = users;

    if (searchTerm) {
      results = results.filter(user =>
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.national_id_number && user.national_id_number.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (roleFilter !== 'all') {
      results = results.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(results);
    setCurrentPage(1); // Reset to first page when filters change

  }, [searchTerm, roleFilter, users]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Handler functions
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === currentUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(currentUsers.map(user => user.id));
    }
  };

  const showEditConfirmation = () => {
    if (selectedUsers.length !== 1) {
      toast({
        title: 'Warning',
        description: 'Please select exactly one user to edit.',
        variant: 'default',
      });
      return;
    }
    const userToEdit = users.find(user => user.id === selectedUsers[0]);
    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({
        first_name: userToEdit.first_name || '',
        last_name: userToEdit.last_name || '',
        email: userToEdit.email || '',
        phone: userToEdit.phone || '',
        role: userToEdit.role,
        station_id: userToEdit.station_id || 0,
        national_id_number: userToEdit.national_id_number || ''
      });
      setShowEditForm(true);
    }
  };

  const showDeleteConfirmation = () => {
    if (selectedUsers.length === 0) {
      toast({
        title: 'Warning',
        description: 'Please select users to delete.',
        variant: 'default',
      });
      return;
    }
    setConfirmAction('delete');
    setShowConfirmDialog(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'station_id' ? parseInt(value) || 0 : value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/superadmin/team/${editingUser.id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: 'Success',
        description: 'User profile updated successfully.',
      });

      // Refresh the users list
      const updatedUsers = users.map(user => 
        user.id === editingUser.id 
          ? {
              ...user,
              first_name: formData.first_name,
              last_name: formData.last_name,
              email: formData.email,
              phone: formData.phone,
              role: formData.role,
              station_id: formData.station_id,
              national_id_number: formData.national_id_number
            }
          : user
      );
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
      setShowEditForm(false);
      setEditingUser(null);
      setSelectedUsers([]);

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user profile.',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmAction = async () => {
    setShowConfirmDialog(false);
    if (confirmAction === 'edit') {
      // Navigate to edit profile page with the selected user's ID
      const userId = selectedUsers[0];
      window.location.href = `/edit-profile/${userId}`;
    } else if (confirmAction === 'delete') {
      try {
        // Delete each selected user one by one
        for (const userId of selectedUsers) {
          const response = await fetch(`http://127.0.0.1:8000/api/admin/delete_account/${userId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authState.token}`,
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }

        toast({
          title: 'Success',
          description: 'Selected users deleted successfully.',
        });

        // Refresh users
        const fetchUsers = async () => {
          if (!authState.token) {
            console.log('No token available');
            return;
          }

          setIsLoading(true);
          
          try {
            const response = await fetch('http://127.0.0.1:8000/api/superadmin/all_teams', {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authState.token}`,
              },
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            // Get the team array from the response
            const usersArray = data.team || [];
            
            // Map the users to our format
            const mappedUsers = usersArray
              .filter((user: any) => user.id !== undefined && user.id !== null && user.id !== '')
              .map((user: any) => {
                // Only include users with a valid backend id
                return {
                  id: user.id.toString(),
                  first_name: user.first_name || '',
                  last_name: user.last_name || '',
                  email: user.email || 'N/A',
                  phone: user.phone || 'N/A',
                  role: user.role || 'Unknown',
                  station_id: user.station_id,
                  station_name: user.station_name || 'N/A',
                  national_id_number: user.national_id_number || 'N/A'
                } as TeamMember;
              });

            console.log('Mapped Users:', mappedUsers);

            // Filter based on role if needed
            let finalUsers = mappedUsers;
            if (authState.role === 'admin' && authState.user?.stationId) {
              finalUsers = mappedUsers.filter(user => 
                (user.role === 'staff' || user.role === 'maintenance') &&
                user.station_id === authState.user?.stationId
              );
            }

            setUsers(finalUsers);
            setFilteredUsers(finalUsers);

          } catch (error) {
            console.error('Error fetching users:', error);
            toast({
              title: 'Error',
              description: 'Failed to load users',
              variant: 'destructive',
            });
          } finally {
            setIsLoading(false);
          }
        };
    
        fetchUsers();

        setSelectedUsers([]);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete users.',
          variant: 'destructive',
        });
      }
    }
  };

  const cancelConfirmation = () => {
    setShowConfirmDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">User Management</h1>
          <p className="text-muted-foreground dark:text-gray-400">Manage all users in the GreenWheels system</p>
        </div>
        {/* Add User Dialog (if needed for staff/admin) */}
      </div>

      <div className="flex flex-col space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-graydark/60 dark:text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full text-graydark dark:text-white dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={usersPerPage}
              onChange={(e) => setUsersPerPage(Number(e.target.value))}
              className="px-3 py-2 rounded-md border border-input bg-background text-graydark dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
            <select
              className="border rounded px-4 py-2 dark:bg-gray-700 dark:text-white"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={showEditConfirmation}
            className="flex-1 sm:flex-none items-center"
          >
            <UserCheck size={16} className="mr-1" />
            Edit Profile
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={showDeleteConfirmation}
            disabled={selectedUsers.length === 0}
            className="flex-1 sm:flex-none items-center"
          >
            <UserX size={16} className="mr-1" />
            Delete Selected
          </Button>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>
                A list of all users in your account.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === currentUsers.length && currentUsers.length > 0}
                      onChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>National ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="w-[50px]">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                      />
                    </TableCell>
                    <TableCell>{user.first_name} {user.last_name}</TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500 dark:text-gray-300 flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500 dark:text-gray-300 flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {user.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500 dark:text-gray-300 flex items-center">
                        <Shield className="h-4 w-4 mr-2 text-gray-400" />
                        {user.national_id_number}
                      </div>
                    </TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.station_name}</TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500 dark:text-gray-300 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {new Date().toLocaleDateString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {currentUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">No users found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {filteredUsers.length > usersPerPage && (
          <div className="flex justify-between items-center mt-4 px-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Action</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete selected user(s)?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={cancelConfirmation}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmAction}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Form Dialog (if needed) */}
      {showEditForm && editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Edit User Profile
              </h3>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">National ID</label>
                    <input
                      type="text"
                      name="national_id_number"
                      value={formData.national_id_number}
                      onChange={handleFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingUser(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="default">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
