import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { bikes } from '@/data/mockData';
import { Bike } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Wrench, Filter, Search, Plus, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { CustomPagination } from '@/components/ui/custom-pagination';

const MaintenanceIssues = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewIssueDialog, setShowNewIssueDialog] = useState(false);
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [issueTypes, setIssueTypes] = useState<{ id: string; name: string; category: string }[]>([]);
  const [maintenanceReports, setMaintenanceReports] = useState<any[]>([]);
  const [showNewIssueTypeDialog, setShowNewIssueTypeDialog] = useState(false);
  const issueTypeForm = useForm({
    defaultValues: {
      name: ''
    }
  });

  const availableBikes = bikes.filter(bike => bike.status !== 'maintenance');

  // Add token handling
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // Update fetch maintenance reports
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/bike/maintenance', {
      credentials: 'include',
      headers: getAuthHeaders(),
    })
      .then(async res => {
        if (res.status === 401) {
          toast({
            title: 'Authentication Error',
            description: 'Please log in again to continue',
            variant: 'destructive',
          });
          return;
        }
        if (!res.ok) {
          throw new Error('Failed to fetch maintenance reports');
        }
        const json = await res.json();
        const reports = Array.isArray(json.data) ? json.data : json;
        setMaintenanceReports(reports || []); // Set empty array without showing error
      })
      .catch((error) => {
        // Only show error notification for actual errors (network issues, server problems)
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          toast({
            title: 'Connection Error',
            description: 'Unable to connect to the server. Please check your internet connection.',
            variant: 'destructive',
          });
        } else if (error instanceof Error && error.message !== 'No maintenance issues found') {
          console.error('Error fetching maintenance reports:', error);
          toast({
            title: 'Error',
            description: 'Failed to fetch maintenance reports. Please try again later.',
            variant: 'destructive',
          });
        }
        setMaintenanceReports([]); // Set empty array without showing error
      });
  }, [toast]);

  const filteredReports = useMemo(() => {
    let results = maintenanceReports;
    
    if (statusFilter !== 'all') {
      results = results.filter(report => (report.maintenance_status || report.status) === statusFilter);
    }
    
    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      results = results.filter(
        report => 
          (report.bike_number || report.bikeId || '').toLowerCase().includes(lowercasedFilter) ||
          (report.reason || report.issue || '').toLowerCase().includes(lowercasedFilter) ||
          (report.description || '').toLowerCase().includes(lowercasedFilter)
      );
    }
    
    return results;
  }, [maintenanceReports, searchTerm, statusFilter]);

  const indexOfLastReport = currentPage * itemsPerPage;
  const indexOfFirstReport = indexOfLastReport - itemsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  const form = useForm({
    defaultValues: {
      bike_number: '',
      issue_type_id: '',
      issue_description: ''
    }
  });

  // Update fetch maintenance issue types
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/maintenance_type', {
      credentials: 'include',
      headers: getAuthHeaders(),
    })
      .then(async res => {
        if (res.status === 401) {
          toast({
            title: 'Authentication Error',
            description: 'Please log in again to continue',
            variant: 'destructive',
          });
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch issue types');
        const json = await res.json();
        setIssueTypes(Array.isArray(json.data) ? json.data : json);
      })
      .catch((error) => {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to fetch issue types',
          variant: 'destructive',
        });
        setIssueTypes([]);
      });
  }, [toast]);

  const handleNewIssue = async (data: any) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/staff/report-issue', {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          bike_number: data.bike_number,
          issue_type_id: data.issue_type_id,
          issue_description: data.issue_description
        }),
      });

      if (response.status === 401) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in again to continue',
          variant: 'destructive',
        });
        return;
      }

      if (!response.ok) {
        if (response.status === 403) {
          toast({
            title: 'Permission Denied',
            description: 'You do not have permission to report a maintenance issue. Please check your login or contact an admin.',
            variant: 'destructive',
          });
          return;
        }
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to report maintenance issue');
      }

      toast({
        title: 'Maintenance Issue Reported',
        description: `Issue reported for bike ${data.bike_number}`
      });
      setShowNewIssueDialog(false);
      form.reset();

      // Refresh the maintenance reports after successful submission
      const updatedResponse = await fetch('http://127.0.0.1:8000/api/bike/maintenance', {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      if (updatedResponse.ok) {
        const json = await updatedResponse.json();
        setMaintenanceReports(Array.isArray(json.data) ? json.data : json);
      }
    } catch (error) {
      toast({
        title: 'Failed to Report Issue',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = (id: string, newStatus: 'pending' | 'in-progress' | 'resolved') => {
    toast({
      title: 'Status Updated',
      description: `Report ${id} has been marked as ${newStatus}`
    });
  };

  // Update the button click handler
  const handleAddIssueTypeClick = () => {
    setShowNewIssueTypeDialog(true);
  };

  const handleNewIssueType = async (data: any) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/maintenance/add_issue_type', {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: data.name }),
      });
      
      if (response.status === 401) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in again to continue',
          variant: 'destructive',
        });
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to add issue type');
      }

      // Refresh issue types
      const updatedResponse = await fetch('http://127.0.0.1:8000/api/maintenance_type', {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      if (updatedResponse.ok) {
        const json = await updatedResponse.json();
        setIssueTypes(Array.isArray(json.data) ? json.data : json);
      }

      toast({
        title: 'Issue Type Added',
        description: 'New maintenance issue type has been added successfully'
      });
      setShowNewIssueTypeDialog(false);
      issueTypeForm.reset();
    } catch (error) {
      toast({
        title: 'Failed to Add Issue Type',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-graydark">Maintenance Management</h1>
          <p className="text-muted-foreground">Track and manage bike maintenance issues</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleAddIssueTypeClick}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Add Issue Type
          </Button>
          <Button 
            onClick={() => setShowNewIssueDialog(true)}
            className="bg-greenprimary hover:bg-greenprimary/80"
          >
            <Plus className="mr-1" size={16} /> Report Issue
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search by bike ID, issue or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={18} className="text-graydark" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded p-2 focus:outline-none focus:ring-2"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-graylight">
          <h2 className="text-lg font-semibold flex items-center">
            <Wrench className="mr-2" size={18} />
            Maintenance Issues {filteredReports.length > 0 && `(${filteredReports.length} total)`}
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          {filteredReports.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-2">No maintenance issues found</p>
              <p className="text-sm text-gray-400">When maintenance issues are reported, they will appear here.</p>
            </div>
          ) : (
            ['staff', 'admin', 'other'].map((role) => (
              <div key={role} className="mb-8">
                <h3 className="text-md font-semibold mb-2 capitalize text-gray-700">{role} Reports</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-graylight">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">Bike Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">Reported By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">Phone Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">Role</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentReports.filter((report) => (report.role || 'other') === role).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-gray-400 py-4">
                          No reports for {role} role
                        </td>
                      </tr>
                    ) : (
                      currentReports.filter((report) => (report.role || 'other') === role).map((report) => (
                        <tr key={report.maintenance_id || report.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-medium text-graydark">{report.bike_number}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark">{report.reason}</td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-graydark line-clamp-2">{report.description}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold
                              ${report.maintenance_status === 'pending' ? 'bg-gray-100 text-gray-600' : 
                                report.maintenance_status === 'in-progress' ? 'bg-greenaccent/30 text-graydark' : 
                                report.maintenance_status === 'resolved' ? 'bg-greenprimary/20 text-greenprimary' :
                                'bg-gray-100 text-gray-600'}`}
                            >
                              {(report.maintenance_status || '').charAt(0).toUpperCase() + (report.maintenance_status || '').slice(1).replace('-', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark">{report.reported_by}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark">{report.phone_number}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark">{report.role}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
        
        {filteredReports.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredReports.length}
            />
          </div>
        )}
      </div>

      <Dialog open={showNewIssueDialog} onOpenChange={setShowNewIssueDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Report New Maintenance Issue</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(handleNewIssue)}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="bike_number" className="text-right text-sm font-medium">
                  Bike Number
                </label>
                <Input
                  id="bike_number"
                  className="col-span-3 p-2 border rounded"
                  placeholder="Enter bike number"
                  {...form.register('bike_number')}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="issue_type_id" className="text-right text-sm font-medium">
                  Issue Type
                </label>
                <select
                  id="issue_type_id"
                  className="col-span-3 p-2 border rounded"
                  {...form.register('issue_type_id')}
                >
                  <option value="">Select an issue</option>
                  {issueTypes.map((issue) => (
                    <option key={issue.id} value={issue.id}>
                      {issue.name} ({issue.category})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <label htmlFor="issue_description" className="text-right text-sm font-medium pt-2">
                  Description (Please provide a detailed explanation of the maintenance issue)
                </label>
                <div className="col-span-3">
                  <Textarea
                    id="issue_description"
                    rows={4}
                    className="w-full"
                    placeholder="Provide details about the issue..."
                    {...form.register('issue_description')}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewIssueDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit Report</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewIssueTypeDialog} onOpenChange={setShowNewIssueTypeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Issue Type</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={issueTypeForm.handleSubmit(handleNewIssueType)}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right text-sm font-medium">
                  Name
                </label>
                <Input
                  id="name"
                  className="col-span-3"
                  placeholder="Enter issue type name"
                  {...issueTypeForm.register('name', { required: true })}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewIssueTypeDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Issue Type</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaintenanceIssues;
