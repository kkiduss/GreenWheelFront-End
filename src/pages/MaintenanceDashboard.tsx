import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { bikes, maintenanceReports, stations, mockUsers } from '@/data/mockData';
import { Bike, MapPin, Search, AlertCircle, Calendar, Clock, CheckCircle, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import StationMap from '@/components/StationMap';
import { MaintenanceReport } from '@/types';
import { CustomPagination } from '@/components/ui/custom-pagination';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import SummaryDialog from '@/components/SummaryDialog';

interface MaintenanceDashboardProps {
  reportSource: 'user' | 'staff' | 'maintenance';
  initialReports?: MaintenanceReport[];
  loading?: boolean;
}

// Add new interface for issue type form
interface IssueTypeForm {
  name: string;
}

// Interface for the bike location data
interface BikeLocationInfo {
  id: string;
  name: string;
  location: { latitude: number; longitude: number } | null;
}

const MaintenanceDashboard = ({ reportSource, initialReports = [], loading = false }: MaintenanceDashboardProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [reports, setReports] = useState<MaintenanceReport[]>(initialReports);
  const [filteredReports, setFilteredReports] = useState<MaintenanceReport[]>(initialReports);
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Show 6 reports per page
  const { authState } = useAuth();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [issueTypeForm, setIssueTypeForm] = useState<IssueTypeForm>({
    name: ''
  });
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);

  useEffect(() => {
    // Fetch maintenance reports from backend
    fetch('http://127.0.0.1:8000/api/bike/maintenance', {
      credentials: 'include',
      headers: { 'Accept': 'application/json' },
    })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          console.error('Maintenance API error:', res.status, text);
          throw new Error(`Maintenance API error: ${res.status} ${text}`);
        }
        const json = await res.json();
        // Support both array and {data: array} responses
        let data = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        // Normalize status field to canonical values, prioritizing maintenance_status
        data = data.map((report: any) => ({
          ...report,
          status: normalizeStatus(report.status, report.maintenance_status),
        }));

        // Filter reports based on report source
        if (reportSource === 'user') {
          // Only show user reports
          data = data.filter((report: any) => report.role === 'user');
        } else if (reportSource === 'staff') {
          // Only show staff reports
          data = data.filter((report: any) => report.role === 'staff');
        }

        setReports(data);
        setFilteredReports(data);
      })
      .catch((err) => {
        // Don't show error toast for empty data
        if (err.message.includes('404') || err.message.includes('No maintenance reports found')) {
          setReports([]);
          setFilteredReports([]);
          return;
        }
        // Only show error toast for actual errors
        toast({
          title: 'Failed to load maintenance reports',
          description: err instanceof Error ? err.message : String(err),
          variant: 'destructive',
        });
        setReports([]);
        setFilteredReports([]);
      });
  }, [reportSource]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    applyFilters(e.target.value, statusFilter, dateFilter);
  };
  
  const applyFilters = (search: string, status: string, date: string) => {
    let filtered = [...reports];
    
    // Apply search filter
    if (search) {
      filtered = filtered.filter(report =>
        (report.reason || '').toLowerCase().includes(search.toLowerCase()) ||
        report.bikeId.toLowerCase().includes(search.toLowerCase()) ||
        report.issue.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply status filter
    if (status !== 'all') {
      filtered = filtered.filter(report => report.status === status);
    }
    
    // Apply date filter
    if (date === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(report => new Date(report.reportedAt) >= today);
    } else if (date === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(report => new Date(report.reportedAt) >= weekAgo);
    } else if (date === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(report => new Date(report.reportedAt) >= monthAgo);
    }
    
    setFilteredReports(filtered);
  };
  
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    applyFilters(searchTerm, value, dateFilter);
  };
  
  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    applyFilters(searchTerm, statusFilter, value);
  };
  
  const handleResolve = async (reportId: string) => {
    // Find the report to get the correct maintenance_id
    const report = reports.find(r => r.id === reportId);
    if (!report) {
      toast({
        title: 'Report Not Found',
        description: 'Could not find the maintenance report to resolve.',
        variant: 'destructive',
      });
      return;
    }
    const maintenanceId = report.maintenance_id;
    if (!maintenanceId) {
      toast({
        title: 'Missing maintenance_id',
        description: 'This report does not have a backend maintenance_id.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/maintenance/resolve-issue/${maintenanceId}?id=${reportId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          ...(authState.token ? { 'Authorization': `Bearer ${authState.token}` } : {}),
        },
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to resolve maintenance report');
      }
      // Update the status of the report to 'resolved'
      const updatedReports = reports.map(r =>
        r.id === reportId ? { ...r, status: 'resolved' as const, resolvedAt: new Date().toISOString() } : r
      );
      setReports(updatedReports);
      // Also update the filtered reports
      const updatedFilteredReports = filteredReports.map(r =>
        r.id === reportId ? { ...r, status: 'resolved' as const, resolvedAt: new Date().toISOString() } : r
      );
      setFilteredReports(updatedFilteredReports);
      toast({
        title: 'Issue Resolved',
        description: 'The maintenance issue has been marked as resolved and the bike is now available.',
      });
    } catch (error) {
      toast({
        title: 'Failed to Resolve',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };
  
  const handleEscalate = (reportId: string) => {
    // Update the priority of the report to 'high'
    const updatedReports = reports.map(report =>
      report.id === reportId ? { ...report, priority: 'high' as const } : report
    );
    
    setReports(updatedReports);
    
    // Also update the filtered reports
    const updatedFilteredReports = filteredReports.map(report =>
      report.id === reportId ? { ...report, priority: 'high' as const } : report
    );
    setFilteredReports(updatedFilteredReports);
    
    // Show a toast notification
    toast({
      title: 'Issue Escalated',
      description: 'The maintenance issue has been escalated to high priority.',
      variant: 'default',
    });
  };
  
  const handleDefer = (reportId: string) => {
    // Update the priority of the report to 'low'
    const updatedReports = reports.map(report =>
      report.id === reportId ? { ...report, priority: 'low' as const } : report
    );
    
    setReports(updatedReports);
    
    // Also update the filtered reports
    const updatedFilteredReports = filteredReports.map(report =>
      report.id === reportId ? { ...report, priority: 'low' as const } : report
    );
    setFilteredReports(updatedFilteredReports);
    
    // Show a toast notification
    toast({
      title: 'Issue Deferred',
      description: 'The maintenance issue has been deferred to low priority.',
    });
  };
  
  const handleStartWork = async (reportId: string) => {
    // Find the report from the backend reports array to get the correct maintenance_id
    const report = reports.find(r => r.id === reportId);
    if (!report) {
      toast({
        title: 'Report Not Found',
        description: 'Could not find the maintenance report to start work.',
        variant: 'destructive',
      });
      return;
    }
    const aproduct = report.maintenance_id; // Use the backend maintenance_id as 'aproduct'
    console.log('Starting work for aproduct (backend maintenance_id):', aproduct);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/maintenance/under-review/${aproduct}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          ...(authState.token ? { 'Authorization': `Bearer ${authState.token}` } : {}),
        },
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to start work on maintenance report');
      }
      // Update the status of the report to 'in-progress'
      const updatedReports = reports.map(r =>
        r.id === reportId ? { ...r, status: 'in-progress' as const } : r
      );
      setReports(updatedReports);
      // Also update the filtered reports
      const updatedFilteredReports = filteredReports.map(r =>
        r.id === reportId ? { ...r, status: 'in-progress' as const } : r
      );
      setFilteredReports(updatedFilteredReports);
      toast({
        title: 'Work Started',
        description: 'The maintenance issue is now being worked on.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Failed to Start Work',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };
  
  const handleBikeSelect = (bikeId: string) => {
    setSelectedBikeId(bikeId);
    setShowMap(true);
  };
  
  // Demo location for Addis Ababa
  const demoLocation = {
    id: 'demo-bike',
    name: 'Demo Bike (Addis Ababa)',
    location: {
      latitude: 9.03, // Example: Addis Ababa
      longitude: 38.74,
    },
  };

  // Add demo location to bikeLocations
  const bikeLocations: BikeLocationInfo[] = [
    demoLocation,
    ...bikes.map(bike => {
      const station = stations.find(station => station.id === bike.station_id);
      return {
        id: bike.id,
        name: bike.model,
        location: station
          ? {
              latitude: station.coordinates.lat,
              longitude: station.coordinates.lng,
            }
          : {
              latitude: 9.03, // Default to Addis Ababa if no station found
              longitude: 38.74,
            },
      };
    }),
  ];

  // Calculate pagination
  const indexOfLastReport = currentPage * itemsPerPage;
  const indexOfFirstReport = indexOfLastReport - itemsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter]);
  
  // New: Separate reports by status for tab content
  const notStartedReports = filteredReports.filter(r => r.status === 'pending');
  const inProgressReports = filteredReports.filter(r => r.status === 'in-progress');
  const unresolvedReports = filteredReports.filter(r => r.status !== 'resolved');
  const resolvedReports = filteredReports.filter(r => r.status === 'resolved');

  // New: Paginate notStartedReports, inProgressReports, resolvedReports
  const [notStartedPage, setNotStartedPage] = useState(1);
  const [inProgressPage, setInProgressPage] = useState(1);
  const [resolvedPage, setResolvedPage] = useState(1);
  const tabItemsPerPage = 6;

  const notStartedTotalPages = Math.ceil(notStartedReports.length / tabItemsPerPage);
  const inProgressTotalPages = Math.ceil(inProgressReports.length / tabItemsPerPage);
  const resolvedTotalPages = Math.ceil(resolvedReports.length / tabItemsPerPage);

  const notStartedCurrent = notStartedReports.slice(
    (notStartedPage - 1) * tabItemsPerPage,
    notStartedPage * tabItemsPerPage
  );
  const inProgressCurrent = inProgressReports.slice(
    (inProgressPage - 1) * tabItemsPerPage,
    inProgressPage * tabItemsPerPage
  );
  const resolvedCurrent = resolvedReports.slice(
    (resolvedPage - 1) * tabItemsPerPage,
    resolvedPage * tabItemsPerPage
  );

  // Reset page to 1 when filters change
  useEffect(() => {
    setNotStartedPage(1);
    setInProgressPage(1);
    setResolvedPage(1);
  }, [searchTerm, statusFilter, dateFilter]);

  // Update the header text based on role and report source
  const getHeaderText = () => {
    if (authState.role === 'staff') {
      return {
        title: 'User Reports',
        description: 'User-reported maintenance issues requiring attention'
      };
    }
    if (reportSource === 'staff') {
      return {
        title: 'Staff Reports',
        description: 'Staff-reported maintenance issues'
      };
    }
    return {
      title: 'User Reports',
      description: 'User-reported maintenance issues'
    };
  };

  const headerText = getHeaderText();

  // Add console logs to debug map state
  useEffect(() => {
    console.log('Map state:', { showMap, selectedBikeId });
  }, [showMap, selectedBikeId]);

  // Add console logs to debug bike locations
  useEffect(() => {
    console.log('Bike locations:', bikeLocations);
  }, [bikeLocations]);

  return (
    <div className="space-y-6">
      {/* Map will only show at the top when a location is clicked */}
      {showMap && selectedBikeId && (
        <Card className="mb-6 overflow-hidden relative" style={{ zIndex: 1 }}>
          <CardHeader className="bg-gray-50 dark:bg-gray-800 py-3 relative" style={{ zIndex: 2 }}>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center">
                <MapPin className="mr-2" size={18} /> 
                Bike Location: {selectedBikeId}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  console.log('Closing map');
                  setShowMap(false);
                  setSelectedBikeId(null);
                }}
              >
                Close Map
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 relative" style={{ zIndex: 1 }}>
            <div style={{ height: '400px', width: '100%', position: 'relative' }}>
              <StationMap 
                stations={bikeLocations.filter(bike => bike.id === selectedBikeId).map(bike => ({
                  id: bike.id,
                  name: bike.name,
                  location: bike.location || { latitude: 9.03, longitude: 38.74 },
                  type: 'bike'
                }))}
                selectedStation={selectedBikeId} 
                onStationSelect={() => {}} 
              />
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {bikeLocations.find(bike => bike.id === selectedBikeId)?.name || 'Unknown Location'}
                </p>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Coordinates: {
                  bikeLocations.find(bike => bike.id === selectedBikeId)?.location 
                    ? `${bikeLocations.find(bike => bike.id === selectedBikeId)?.location?.latitude.toFixed(4)}, ${bikeLocations.find(bike => bike.id === selectedBikeId)?.location?.longitude.toFixed(4)}`
                    : 'Not available'
                }
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {headerText.title}
          </h1>
          <p className="text-muted-foreground">
            {headerText.description}
          </p>
        </div>
        
        <div className="flex gap-2 mt-4 md:mt-0">
          <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-greenprimary hover:bg-greenprimary/90 text-white">
                <AlertCircle className="h-4 w-4 mr-2" />
                Add Issue Type
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Issue Type</DialogTitle>
                <DialogDescription>
                  Enter a new maintenance issue type
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Issue Type</Label>
                  <Input
                    id="name"
                    placeholder="Enter issue type"
                    value={issueTypeForm.name}
                    onChange={(e) => setIssueTypeForm({ name: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsReportDialogOpen(false);
                  setIssueTypeForm({ name: '' });
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    setIsReportDialogOpen(false);
                    setIsSummaryDialogOpen(true);
                  }}
                  disabled={!issueTypeForm.name}
                  className="bg-greenprimary hover:bg-greenprimary/90"
                >
                  Next
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <SummaryDialog
            isOpen={isSummaryDialogOpen}
            onClose={() => {
              setIsSummaryDialogOpen(false);
              setIssueTypeForm({ name: '' });
            }}
            onConfirm={async () => {
              try {
                const response = await fetch('http://127.0.0.1:8000/api/maintenance/add_issue_type', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(authState.token ? { 'Authorization': `Bearer ${authState.token}` } : {}),
                  },
                  body: JSON.stringify({
                    name: issueTypeForm.name
                  }),
                });

                if (!response.ok) {
                  throw new Error('Failed to add issue type');
                }

                toast({
                  title: "Issue Type Added",
                  description: "The new issue type has been added successfully.",
                });

                // Reset form and close dialogs
                setIssueTypeForm({ name: '' });
                setIsSummaryDialogOpen(false);

                // Refresh the reports list
                window.location.reload();

              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to add issue type. Please try again.",
                  variant: "destructive",
                });
              }
            }}
            title="Confirm New Issue Type"
            description="Please review the details before adding the new issue type:"
            type="info"
            confirmText="Add Issue Type"
            summary={[
              {
                label: "Issue Type Name",
                value: issueTypeForm.name
              },
              {
                label: "Added By",
                value: authState.user?.name || 'Staff Member'
              },
              {
                label: "Date",
                value: new Date().toLocaleDateString()
              }
            ]}
          />

          <Select value={dateFilter} onValueChange={handleDateFilterChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Date Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 shadow-sm border dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center flex-1">
            <Search className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
            <Input
              type="text"
              placeholder="Search by bike ID, issue, or description..."
              value={searchTerm}
              onChange={handleSearch}
              className="max-w-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="not-started" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="not-started">Not Started</TabsTrigger>
          <TabsTrigger value="pending-reports">In Progress</TabsTrigger>
          <TabsTrigger value="resolved-reports">Resolved</TabsTrigger>
          <TabsTrigger value="all-reports">All Reports</TabsTrigger>
        </TabsList>

        {/* Not Started Tab */}
        <TabsContent value="not-started" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notStartedCurrent.length > 0 ? notStartedCurrent.map(report => (
              <Card key={report.id} className="bg-white overflow-hidden transition-shadow hover:shadow-md dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="bg-gray-50 dark:bg-gray-800 py-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <Bike className="text-gray-500" size={16} /> 
                      <span className="font-semibold">{report.bikeId}</span> 
                      <span className="mx-1">—</span> 
                      <span className="text-gray-600 dark:text-gray-300">{report.reason || report.issue}</span>
                    </span>
                    <Badge variant="secondary">Pending</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-start space-x-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">{report.reason || ''}</p>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Reported by: {report.reported_by || report.email || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Bike className="h-4 w-4 text-gray-500" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Bike Number: {report.bike_number || report.bikeId || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Phone: {report.phone_number || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <Button 
                      variant="link" 
                      onClick={() => {
                        setSelectedBikeId(report.bikeId);
                        setShowMap(true);
                      }} 
                      className="p-0 h-auto text-xs font-normal text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                    >
                      {report.location || report.stationName || 'N/A'}
                    </Button>
                  </div>
                  {report.status === 'pending' && (
                    <div className="flex justify-end gap-2 mt-4">
                      <Button 
                        size="sm"
                        className="text-xs bg-blue-500 hover:bg-blue-600 text-white"
                        onClick={() => handleStartWork(report.id)}
                      >
                        Start Work
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-2 p-8 text-center bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="flex flex-col items-center">
                  <CheckCircle className="h-12 w-12 text-green-300 mb-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Pending Issues</h3>
                  <p className="text-gray-500 mt-1">All maintenance issues have been addressed.</p>
                </div>
              </div>
            )}
          </div>
          {notStartedReports.length > tabItemsPerPage && (
            <div className="mt-4">
              <CustomPagination
                currentPage={notStartedPage}
                totalPages={notStartedTotalPages}
                onPageChange={setNotStartedPage}
                itemsPerPage={tabItemsPerPage}
                totalItems={notStartedReports.length}
              />
            </div>
          )}
        </TabsContent>

        {/* In Progress Tab */}
        <TabsContent value="pending-reports" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inProgressCurrent.length > 0 ? inProgressCurrent.map(report => (
              <Card key={report.id} className="bg-white overflow-hidden transition-shadow hover:shadow-md dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="bg-gray-50 dark:bg-gray-800 py-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <Bike className="text-gray-500" size={16} /> 
                      <span className="font-semibold">{report.bikeId}</span> 
                      <span className="mx-1">—</span> 
                      <span className="text-gray-600 dark:text-gray-300">{report.reason || report.issue}</span>
                    </span>
                    <Badge variant="default">In Progress</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-start space-x-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">{report.reason || ''}</p>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Reported by: {report.reported_by || report.email || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Bike className="h-4 w-4 text-gray-500" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Bike Number: {report.bike_number || report.bikeId || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Phone: {report.phone_number || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <Button 
                      variant="link" 
                      onClick={() => {
                        setSelectedBikeId(report.bikeId);
                        setShowMap(true);
                      }} 
                      className="p-0 h-auto text-xs font-normal text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                    >
                      {report.location || report.stationName || 'N/A'}
                    </Button>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button 
                      size="sm" 
                      onClick={() => handleResolve(report.id)}
                      className="text-xs bg-greenprimary hover:bg-greenprimary/80"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" /> Resolve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-2 p-8 text-center bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="flex flex-col items-center">
                  <CheckCircle className="h-12 w-12 text-green-300 mb-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Active Issues</h3>
                  <p className="text-gray-500 mt-1">No maintenance issues are currently being worked on.</p>
                </div>
              </div>
            )}
          </div>
          {inProgressReports.length > tabItemsPerPage && (
            <div className="mt-4">
              <CustomPagination
                currentPage={inProgressPage}
                totalPages={inProgressTotalPages}
                onPageChange={setInProgressPage}
                itemsPerPage={tabItemsPerPage}
                totalItems={inProgressReports.length}
              />
            </div>
          )}
        </TabsContent>

        {/* Resolved Tab */}
        <TabsContent value="resolved-reports" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resolvedCurrent.length > 0 ? 
              resolvedCurrent.map(report => (
                <Card key={report.id} className="bg-white overflow-hidden transition-shadow hover:shadow-md dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader className="bg-gray-50 dark:bg-gray-800 py-3">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span className="flex items-center gap-2">
                        <Bike className="text-gray-500" size={16} /> 
                        <span className="font-semibold">{report.bikeId}</span> 
                        <span className="mx-1">—</span> 
                        <span className="text-gray-600 dark:text-gray-300">{report.reason || report.issue}</span>
                      </span>
                      <Badge variant="outline">Resolved</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-2 mb-3">
                      <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">{report.reason || ''}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Reported by: {report.reported_by || report.email || 'Unknown'}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-3">
                      <Bike className="h-4 w-4 text-gray-500" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Bike Number: {report.bike_number || report.bikeId || 'N/A'}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <Button variant="link" onClick={() => handleBikeSelect(report.bikeId)} className="p-0 h-auto text-xs font-normal">
                        View Bike Location
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <div className="col-span-2 p-8 text-center bg-white rounded-lg shadow dark:bg-gray-800">
                  <div className="flex flex-col items-center">
                    <CheckCircle className="h-12 w-12 text-green-300 mb-2" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Resolved Issues</h3>
                    <p className="text-gray-500 mt-1">No maintenance issues have been resolved yet.</p>
                  </div>
                </div>
              )}
          </div>
          
          {filteredReports.filter(report => report.status === 'resolved').length > itemsPerPage && (
            <div className="mt-4">
              <CustomPagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredReports.filter(report => report.status === 'resolved').length / itemsPerPage)}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredReports.filter(report => report.status === 'resolved').length}
              />
            </div>
          )}
        </TabsContent>

        {/* All Reports Tab */}
        <TabsContent value="all-reports" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentReports.length > 0 ? currentReports.map(report => (
              <Card key={report.id} className="bg-white overflow-hidden transition-shadow hover:shadow-md dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="bg-gray-50 dark:bg-gray-800 py-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <Bike className="text-gray-500" size={16} /> 
                      <span className="font-semibold">{report.bikeId}</span> 
                      <span className="mx-1">—</span> 
                      <span className="text-gray-600 dark:text-gray-300">{report.reason || report.issue}</span>
                    </span>
                    <Badge variant={
                      report.status === 'resolved' ? 'outline' :
                      report.status === 'pending' ? 'secondary' : 'default'
                    }>
                      {report.status === 'pending' ? 'Pending' : 
                       report.status === 'in-progress' ? 'In Progress' : 'Resolved'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-start space-x-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">{report.reason || ''}</p>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Reported by: {report.reported_by || report.email || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Bike className="h-4 w-4 text-gray-500" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Bike Number: {report.bike_number || report.bikeId || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Phone: {report.phone_number || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <Button 
                      variant="link" 
                      onClick={() => {
                        setSelectedBikeId(report.bikeId);
                        setShowMap(true);
                      }} 
                      className="p-0 h-auto text-xs font-normal text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                    >
                      {report.location || report.stationName || 'N/A'}
                    </Button>
                  </div>
                  {report.status === 'pending' && (
                    <div className="flex justify-end gap-2 mt-4">
                      <Button 
                        size="sm"
                        className="text-xs bg-blue-500 hover:bg-blue-600 text-white"
                        onClick={() => handleStartWork(report.id)}
                      >
                        Start Work
                      </Button>
                    </div>
                  )}
                  {report.status === 'in-progress' && (
                    <div className="flex justify-end gap-2 mt-4">
                      <Button 
                        size="sm" 
                        onClick={() => handleResolve(report.id)}
                        className="text-xs bg-greenprimary hover:bg-greenprimary/80"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" /> Resolve
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-2 p-8 text-center bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="flex flex-col items-center">
                  <CheckCircle className="h-12 w-12 text-green-300 mb-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Maintenance Issues</h3>
                  <p className="text-gray-500 mt-1">All bikes are currently in good condition.</p>
                </div>
              </div>
            )}
          </div>
          
          {filteredReports.length > itemsPerPage && (
            <div className="mt-4">
              <CustomPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredReports.length}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MaintenanceDashboard;
// Utility to normalize status values, prioritizing maintenance_status if present
function normalizeStatus(status: string, maintenance_status?: string): 'pending' | 'in-progress' | 'resolved' {
  // Prefer maintenance_status if present
  const s = (maintenance_status || status || '').trim().toLowerCase().replace('_', '-');
  if (s === 'pending' || s === 'not-started') return 'pending';
  if (s === 'in-progress' || s === 'in progress') return 'in-progress';
  if (s === 'resolved' || s === 'done' || s === 'completed') return 'resolved';
  return 'pending';
}

