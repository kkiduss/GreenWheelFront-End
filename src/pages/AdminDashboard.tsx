import { useEffect, useState } from 'react';
import { Bike, MapPin, Users, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '@/components/ui/dashboard-card';
import BikeStatusBadge from '@/components/ui/bike-status-badge';
import { useAuth } from '@/contexts/AuthContext';
import { bikes, mockUsers, stations, getBikeSummary, getStationSummary, getMaintenanceSummary, getActiveBikes } from '@/data/mockData';
import { Bike as BikeType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { MaintenanceReport } from '@/types';

const AdminDashboard = () => {
  const { authState } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [bikeSummary, setBikeSummary] = useState({
    totalBikes: 0,
    availableBikes: 0,
    inUseBikes: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    activeTrips: 0,
    reservedBikes: 0
  });
  const [stationSummary, setStationSummary] = useState(getStationSummary());
  const [maintenanceSummary, setMaintenanceSummary] = useState(getMaintenanceSummary());
  
  // Limit the bike list to 100 bikes
  const reducedBikes = bikes.slice(0, 100);
  const [bikeList, setBikeList] = useState<BikeType[]>(reducedBikes);
  const [filteredBikes, setFilteredBikes] = useState<BikeType[]>(reducedBikes);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [recentReports, setRecentReports] = useState<MaintenanceReport[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<any[]>([]);

  const itemsPerPage = 10;

  // Fetch maintenance reports
  useEffect(() => {
    const fetchMaintenanceReports = async () => {
      try {
        setLoading(true);
        console.log('Fetching maintenance reports...');
        const response = await fetch('http://127.0.0.1:8000/api/bike/maintenance', {
          headers: {
            'Authorization': `Bearer ${authState.token}`,
            'Accept': 'application/json',
          },
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Raw maintenance data:', data);

        // Transform the API response to match our MaintenanceReport type
        const reports = Array.isArray(data) ? data : data.reports || data.data || [];
        console.log('Extracted reports:', reports);

        const transformedReports = reports.map((report: any) => {
          console.log('Processing report:', report);
          return {
            id: report.id?.toString() || Math.random().toString(),
            bikeId: report.bike_id || report.bikeId || 'Unknown Bike',
            stationId: report.station_id || report.stationId,
            stationName: report.station_name || report.stationName || 'Unknown Station',
            issue: report.issue || report.description || 'No issue description',
            priority: report.priority || 'medium',
            status: report.status || 'pending',
            reportedAt: report.reported_at || report.reportedAt || new Date().toISOString(),
            resolvedAt: report.resolved_at || report.resolvedAt,
            notes: report.notes || '',
            bike_number: report.bike_number || '',
            reason: report.reason || '',
            description: report.description || '',
            reported_by: report.reported_by || '',
            phone_number: report.phone_number || '',
            maintenance_status: report.maintenance_status || 'pending',
            role: report.role || 'staff'
          };
        });

        console.log('Transformed reports:', transformedReports);

        // Sort by priority first (high to low), then by reported date (most recent first)
        transformedReports.sort((a: MaintenanceReport, b: MaintenanceReport) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          const priorityDiff = (priorityOrder[a.priority as keyof typeof priorityOrder] || 1) - 
                             (priorityOrder[b.priority as keyof typeof priorityOrder] || 1);
          
          if (priorityDiff !== 0) return priorityDiff;
          
          return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
        });

        console.log('Sorted reports:', transformedReports);
        setRecentReports(transformedReports);
      } catch (error) {
        console.error('Error fetching maintenance reports:', error);
        toast({
          title: 'Error',
          description: 'Failed to load maintenance reports',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchMaintenanceReports();

    // Set up interval for live updates every 30 seconds
    const intervalId = setInterval(fetchMaintenanceReports, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [authState.token, toast]);

  // Fetch bike summary data
  useEffect(() => {
    const fetchBikeSummary = async () => {
      try {
        setLoading(true);
        console.log('Fetching bike summary...');
        const response = await fetch('http://127.0.0.1:8000/api/superadmin/revenue/bike-summary', {
          headers: {
            'Authorization': `Bearer ${authState.token}`,
            'Accept': 'application/json',
          },
        });

        console.log('Bike summary response status:', response.status);
        const data = await response.json();
        console.log('Bike summary data:', data);

        if (response.ok) {
          // Get active bikes from both API and mock data
          const activeBikes = getActiveBikes();
          const apiActiveBikes = data.active_bikes || 0;
          console.log('Active bikes from mock:', activeBikes.length);
          console.log('Active bikes from API:', apiActiveBikes);

          setBikeSummary({
            totalBikes: data.total_bikes || 0,
            availableBikes: data.available_bikes || 0,
            inUseBikes: apiActiveBikes || activeBikes.length || 0,
            totalRevenue: data.total_revenue || 0,
            todayRevenue: data.today_revenue || 0,
            activeTrips: apiActiveBikes || activeBikes.length || 0,
            reservedBikes: data.reserved_bikes || 0
          });
        } else {
          throw new Error(data.message || 'Failed to fetch bike summary');
        }
      } catch (error) {
        console.error('Error fetching bike summary:', error);
        toast({
          title: 'Error',
          description: 'Failed to load bike summary data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchBikeSummary();

    // Set up interval for live updates every 30 seconds
    const intervalId = setInterval(fetchBikeSummary, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [authState.token, toast]);

  // Filter bikes based on search and status filter
  useEffect(() => {
    let results = reducedBikes;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      results = results.filter(bike => bike.status === statusFilter);
    }
    
    // Apply search term filter
    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      results = results.filter(
        bike => 
          bike.id.toLowerCase().includes(lowercasedFilter) ||
          bike.model.toLowerCase().includes(lowercasedFilter)
      );
    }
    
    setFilteredBikes(results);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter]);

  // Paginate bikes
  const indexOfLastBike = currentPage * itemsPerPage;
  const indexOfFirstBike = indexOfLastBike - itemsPerPage;
  const currentBikes = filteredBikes.slice(indexOfFirstBike, indexOfLastBike);
  const totalPages = Math.ceil(filteredBikes.length / itemsPerPage);

  // Fetch reservations
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        console.log('Fetching reservations...');
        const response = await fetch('http://127.0.0.1:8000/api/bike/reserved', {
          headers: {
            'Authorization': `Bearer ${authState.token}`,
            'Accept': 'application/json',
          },
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Raw reservations data:', data);

        const reservationsData = Array.isArray(data) ? data : data.reservations || data.data || [];
        console.log('Processed reservations:', reservationsData);

        setReservations(reservationsData);
        setFilteredReservations(reservationsData);
      } catch (error) {
        console.error('Error fetching reservations:', error);
        toast({
          title: 'Error',
          description: 'Failed to load reservations',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchReservations();

    // Set up interval for live updates every 30 seconds
    const intervalId = setInterval(fetchReservations, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [authState.token, toast]);

  // Filter reservations based on search and status
  useEffect(() => {
    let results = reservations;
    
    if (statusFilter !== 'all') {
      results = results.filter(reservation => reservation.status === statusFilter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(reservation => 
        reservation.bike_id?.toLowerCase().includes(term) ||
        reservation.user_id?.toLowerCase().includes(term) ||
        reservation.station_id?.toLowerCase().includes(term)
      );
    }
    
    setFilteredReservations(results);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, reservations]);

  // Paginate reservations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReservations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPagesReservations = Math.ceil(filteredReservations.length / itemsPerPage);

  // Paginate maintenance issues
  const indexOfLastReport = currentPage * itemsPerPage;
  const indexOfFirstReport = indexOfLastReport - itemsPerPage;
  const currentReports = recentReports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPagesReports = Math.ceil(recentReports.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Handle card clicks - navigate to detail pages
  const handleCardClick = (type: string) => {
    switch (type) {
      case 'allBikes':
        navigate('/bike-fleet');
        break;
      case 'inUseBikes':
        navigate('/active-rides');
        break;
      case 'availableBikes':
        navigate('/available-bikes');
        break;
      case 'stations':
        navigate('/station-management');
        break;
      case 'reservedBikes':
        navigate('/reserved-bikes');
        break;
      default:
        break;
    }
  };

  // Handle export to CSV
  const handleExportCSV = () => {
    toast({
      title: 'Report Exported',
      description: 'CSV file downloaded successfully',
      variant: 'default',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-graydark">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {authState.user?.name}!
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div onClick={() => handleCardClick('allBikes')} className="cursor-pointer hover:scale-105 transition-transform">
          <DashboardCard 
            title="Total Bikes" 
            value={bikeSummary.totalBikes} 
            icon={<Bike size={24} className="text-greenprimary" />}
            color="var(--greenprimary)"
            loading={loading}
          />
        </div>
        <div onClick={() => handleCardClick('inUseBikes')} className="cursor-pointer hover:scale-105 transition-transform">
          <DashboardCard 
            title="Active Trips" 
            value={bikeSummary.activeTrips}
            trend={`${bikeSummary.inUseBikes} bikes in use`}
            icon={<Bike size={24} className="text-greenaccent" />}
            color="var(--greenaccent)"
            loading={loading}
          />
        </div>
        <div onClick={() => handleCardClick('availableBikes')} className="cursor-pointer hover:scale-105 transition-transform">
          <DashboardCard 
            title="Available Bikes" 
            value={bikeSummary.availableBikes}
            trend={`${Math.round((bikeSummary.availableBikes / bikeSummary.totalBikes) * 100)}% of fleet`}
            icon={<Bike size={24} className="text-greenprimary" />}
            color="var(--greenprimary)"
            loading={loading}
          />
        </div>
        <div onClick={() => handleCardClick('reservedBikes')} className="cursor-pointer hover:scale-105 transition-transform">
          <DashboardCard 
            title="Reserved Bikes" 
            value={bikeSummary.reservedBikes}
            trend={`${Math.round((bikeSummary.reservedBikes / bikeSummary.totalBikes) * 100)}% of fleet`}
            icon={<Bike size={24} className="text-blue-500" />}
            color="var(--blue-500)"
            loading={loading}
          />
        </div>
        <div className="cursor-pointer hover:scale-105 transition-transform">
          <DashboardCard 
            title="Today's Revenue" 
            value={`ETB ${bikeSummary.todayRevenue.toFixed(2)}`}
            trend={`Total: ETB ${bikeSummary.totalRevenue.toFixed(2)}`}
            icon={<FileText size={24} className="text-graydark" />}
            color="var(--graydark)"
            loading={loading}
          />
        </div>
      </div>

      {/* Replace Bike Inventory Table with Reservations Table */}
      <div className="bg-white rounded-lg shadow p-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-xl font-semibold text-graydark">Active Reservations</h2>
          <div className="mt-3 md:mt-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Input
              type="text"
              placeholder="Search reservations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-48 text-graydark"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-input bg-background text-graydark"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                  Reservation ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                  Bike ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-graydark">
                    {reservation.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark">
                    {reservation.bike_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark">
                    {reservation.user_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark">
                    {new Date(reservation.start_time).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${reservation.status === 'active' ? 'bg-green-100 text-green-800' : 
                        reservation.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                        'bg-red-100 text-red-800'}`}
                    >
                      {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
              {currentItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No reservations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination for reservations */}
        {totalPagesReservations > 1 && (
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-graydark">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredReservations.length)} of {filteredReservations.length} reservations
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                &#8592;
              </Button>
              {Array.from({ length: totalPagesReservations }, (_, i) => i + 1).map((pageNumber) => (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNumber)}
                  className={currentPage === pageNumber ? 'bg-greenprimary text-white' : 'bg-white text-graydark'}
                >
                  {pageNumber}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPagesReservations))}
                disabled={currentPage === totalPagesReservations}
              >
                &#8594;
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Recent Maintenance Issues */}
      <div className="bg-white rounded-lg shadow p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-graydark">Recent Maintenance Issues</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                  Bike Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                  Reported By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                  Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-graydark uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark">
                    {report.bike_number || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark">
                    <div>{report.reported_by || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{report.role || 'staff'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark">
                    {report.phone_number || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-graydark">
                    <div className="font-medium">{report.reason || 'No reason provided'}</div>
                    <div className="text-xs text-gray-500 mt-1">{report.description || 'No description'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${report.maintenance_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        report.maintenance_status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                        'bg-green-100 text-green-800'}`}
                    >
                      {report.maintenance_status.charAt(0).toUpperCase() + report.maintenance_status.slice(1).replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
              {currentReports.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No maintenance issues found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination for maintenance issues */}
        {totalPagesReports > 1 && (
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-graydark">
              Showing {indexOfFirstReport + 1} to {Math.min(indexOfLastReport, recentReports.length)} of {recentReports.length} issues
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                &#8592;
              </Button>
              {Array.from({ length: totalPagesReports }, (_, i) => {
                const pageNumber = i + 1;
                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={currentPage === pageNumber ? 'bg-greenprimary text-white' : 'bg-white text-graydark'}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPagesReports))}
                disabled={currentPage === totalPagesReports}
              >
                &#8594;
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
