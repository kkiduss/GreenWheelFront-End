import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const StationAdminDashboard = () => {
  const { toast } = useToast();
  const { authState } = useAuth();
  const [timeRange, setTimeRange] = useState('week');
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stationStats, setStationStats] = useState({
    totalBikes: 0,
    availableBikes: 0,
    inUseBikes: 0,
    maintenanceBikes: 0
  });

  // Fetch station statistics
  useEffect(() => {
    const fetchStationStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const stationId = localStorage.getItem('stationId');
        console.log('Token:', token);
        console.log('Station ID:', stationId);

        if (!token) {
          throw new Error('No authentication token found');
        }

        if (!stationId) {
          console.log('No station ID in localStorage');
          throw new Error('No station ID found');
        }

        const apiUrl = `https://www.green-wheels.pro.et/api/admin/revenue/bike-summary/${stationId}`;
        console.log('Attempting to fetch from:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        console.log('Response received:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('Error response:', errorData);
          throw new Error(`Failed to fetch station statistics: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Station data received:', data);

        // Check if data is in the expected format
        if (typeof data !== 'object' || data === null) {
          console.error('Unexpected data format:', data);
          throw new Error('Invalid data format received from server');
        }

        // Use the statistics directly from the response
        setStationStats({
          totalBikes: data.total_bikes || 0,
          availableBikes: data.available_bikes || 0,
          inUseBikes: data.reserved_bikes || 0,
          maintenanceBikes: data.maintenance_bikes || 0
        });

        console.log('Set station stats:', {
          totalBikes: data.total_bikes,
          availableBikes: data.available_bikes,
          inUseBikes: data.reserved_bikes,
          maintenanceBikes: data.maintenance_bikes
        });

      } catch (error) {
        console.error('Error in fetchStationStats:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load station statistics',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    const stationId = localStorage.getItem('stationId');
    if (stationId) {
      console.log('Starting fetch with station ID:', stationId);
      fetchStationStats();
    } else {
      console.log('No station ID available in localStorage, skipping fetch');
    }
  }, [toast]);

  // Fetch revenue data
  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const stationId = localStorage.getItem('stationId');

        if (!token) {
          throw new Error('No authentication token found');
        }

        if (!stationId) {
          throw new Error('No station ID found');
        }

        console.log('Fetching revenue data for station:', stationId);

        const revenueUrl = `https://www.green-wheels.pro.et/api/admin/revenue/station/${stationId}?timeRange=${timeRange}`;
        console.log('Fetching revenue data from:', revenueUrl);

        const response = await fetch(revenueUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        console.log('Revenue response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('Revenue error response:', errorData);
          throw new Error(`Failed to fetch revenue data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Revenue data received:', data);

        if (!Array.isArray(data)) {
          console.error('Unexpected revenue data format:', data);
          throw new Error('Invalid revenue data format received from server');
        }

        setRevenueData(data);
      } catch (error) {
        console.error('Error in fetchRevenueData:', error);
        
        // Handle specific error cases
        let errorMessage = 'Failed to load revenue data';
        
        if (error instanceof Error) {
          if (error.message.includes('404')) {
            errorMessage = 'Revenue data not available for this station';
          } else if (error.message.includes('401')) {
            errorMessage = 'Please log in again to view revenue data';
          } else if (error.message.includes('403')) {
            errorMessage = 'You do not have permission to view revenue data';
          } else if (error.message.includes('No station ID found')) {
            errorMessage = 'Station information not found. Please try logging in again';
          } else if (error.message.includes('No authentication token found')) {
            errorMessage = 'Please log in to view revenue data';
          }
        }

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });

        // Set empty array to prevent undefined errors
        setRevenueData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [timeRange, toast]);

  // Calculate totals with null checks
  const totalRevenue = revenueData?.reduce((sum, item) => sum + (item.revenue || 0), 0) || 0;
  const totalRides = revenueData?.reduce((sum, item) => sum + (item.rides || 0), 0) || 0;
  const totalMaintenance = revenueData?.reduce((sum, item) => sum + (item.maintenance || 0), 0) || 0;

  // Format date to show day and month
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Station Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh Data
          </Button>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="year">Last 365 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Station Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bikes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stationStats.totalBikes}</div>
            <p className="text-xs text-muted-foreground">
              All registered bikes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Bikes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stationStats.availableBikes}</div>
            <p className="text-xs text-muted-foreground">
              Ready for use
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bikes in Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stationStats.inUseBikes}</div>
            <p className="text-xs text-muted-foreground">
              Currently rented
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stationStats.maintenanceBikes}</div>
            <p className="text-xs text-muted-foreground">
              Under repair
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Revenue for selected period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRides.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Rides completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMaintenance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Repair and maintenance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Revenue Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Revenue</th>
                  <th className="text-left py-3 px-4 font-medium">Rides</th>
                  <th className="text-left py-3 px-4 font-medium">Maintenance</th>
                  <th className="text-left py-3 px-4 font-medium">Net Profit</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      <p className="mt-2 text-sm text-muted-foreground">Loading data...</p>
                    </td>
                  </tr>
                ) : revenueData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No revenue data available for the selected period
                    </td>
                  </tr>
                ) : (
                  <>
                    {revenueData.map((item) => (
                      <tr key={item.date} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{formatDate(item.date)}</td>
                        <td className="py-3 px-4 text-green-600">${(item.revenue || 0).toLocaleString()}</td>
                        <td className="py-3 px-4">{(item.rides || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-orange-600">${(item.maintenance || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-blue-600">
                          ${((item.revenue || 0) - (item.maintenance || 0)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td className="py-3 px-4">Total</td>
                      <td className="py-3 px-4 text-green-600">${totalRevenue.toLocaleString()}</td>
                      <td className="py-3 px-4">{totalRides.toLocaleString()}</td>
                      <td className="py-3 px-4 text-orange-600">${totalMaintenance.toLocaleString()}</td>
                      <td className="py-3 px-4 text-blue-600">
                        ${(totalRevenue - totalMaintenance).toLocaleString()}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StationAdminDashboard; 