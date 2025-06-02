import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, TrendingUp, Building } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface StationRevenue {
  station_id: number;
  station_name: string;
  total_revenue: number;
  total_trips: number;
  average_trip_duration: number;
  revenue_by_hour: { [key: string]: number };
}

const StationRevenue = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stationRevenues, setStationRevenues] = useState<StationRevenue[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8000/api/station-revenue', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch station revenue data');
      }

      const data = await response.json();
      setStationRevenues(data);
      setTotalRevenue(data.reduce((sum: number, station: StationRevenue) => sum + station.total_revenue, 0));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch station revenue data',
        variant: 'destructive',
      });
      // Set mock data for demonstration
      const mockData: StationRevenue[] = [
        {
          station_id: 1,
          station_name: 'Central Station',
          total_revenue: 2500.50,
          total_trips: 125,
          average_trip_duration: 20,
          revenue_by_hour: {}
        },
        {
          station_id: 2,
          station_name: 'University Station',
          total_revenue: 1800.75,
          total_trips: 90,
          average_trip_duration: 20,
          revenue_by_hour: {}
        },
        {
          station_id: 3,
          station_name: 'Market Station',
          total_revenue: 3200.25,
          total_trips: 160,
          average_trip_duration: 20,
          revenue_by_hour: {}
        }
      ];
      setStationRevenues(mockData);
      setTotalRevenue(mockData.reduce((sum, station) => sum + station.total_revenue, 0));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authState.role === 'superadmin') {
      fetchRevenueData();
    } else {
      navigate('/');
    }
  }, [authState.role]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading revenue data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="mr-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Revenue Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300">Track revenue performance across all stations</p>
          </div>
        </div>
        <Button onClick={fetchRevenueData}>
          Refresh Data
        </Button>
      </div>

      {/* Total Revenue Card */}
      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <DollarSign size={20} />
            Total Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCurrency(totalRevenue)}</div>
          <p className="text-green-100 text-sm">
            Across {stationRevenues.length} stations
          </p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Building size={16} />
              Active Stations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stationRevenues.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp size={16} />
              Total Trips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stationRevenues.reduce((sum, station) => sum + station.total_trips, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <DollarSign size={16} />
              Avg per Trip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                stationRevenues.length > 0 
                  ? totalRevenue / stationRevenues.reduce((sum, station) => sum + station.total_trips, 0)
                  : 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Station Revenue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Station</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Station</TableHead>
                <TableHead>Total Revenue</TableHead>
                <TableHead>Total Trips</TableHead>
                <TableHead>Avg. Trip Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stationRevenues.map((station) => (
                <TableRow key={station.station_id}>
                  <TableCell>{station.station_name}</TableCell>
                  <TableCell>${station.total_revenue.toFixed(2)}</TableCell>
                  <TableCell>{station.total_trips}</TableCell>
                  <TableCell>{Math.round(station.average_trip_duration)} min</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StationRevenue; 