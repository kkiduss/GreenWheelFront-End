import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const AdminRevenue = () => {
  const { toast } = useToast();
  const { authState } = useAuth();
  const [timeRange, setTimeRange] = useState('week');
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration - daily data
  const mockRevenueData = [
    { date: '2024-03-01', revenue: 850, rides: 45, maintenance: 120 },
    { date: '2024-03-02', revenue: 920, rides: 48, maintenance: 150 },
    { date: '2024-03-03', revenue: 780, rides: 42, maintenance: 100 },
    { date: '2024-03-04', revenue: 950, rides: 50, maintenance: 180 },
    { date: '2024-03-05', revenue: 890, rides: 47, maintenance: 130 },
    { date: '2024-03-06', revenue: 910, rides: 49, maintenance: 140 },
    { date: '2024-03-07', revenue: 880, rides: 46, maintenance: 125 },
  ];

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        // const response = await fetch(`http://127.0.0.1:8000/api/revenue/${timeRange}`, {
        //   headers: {
        //     'Authorization': `Bearer ${authState.token}`,
        //     'Accept': 'application/json',
        //   },
        // });
        // const data = await response.json();
        // setRevenueData(data);
        
        // Using mock data for now
        setRevenueData(mockRevenueData);
      } catch (error) {
        console.error('Error fetching revenue data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load revenue data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [timeRange, authState.token]);

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalRides = revenueData.reduce((sum, item) => sum + item.rides, 0);
  const totalMaintenance = revenueData.reduce((sum, item) => sum + item.maintenance, 0);

  // Format date to show day and month
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Revenue Dashboard</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last {timeRange}
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
              +15% from last {timeRange}
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
              -5% from last {timeRange}
            </p>
          </CardContent>
        </Card>
      </div>

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
                {revenueData.map((item) => (
                  <tr key={item.date} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{formatDate(item.date)}</td>
                    <td className="py-3 px-4 text-green-600">${item.revenue.toLocaleString()}</td>
                    <td className="py-3 px-4">{item.rides.toLocaleString()}</td>
                    <td className="py-3 px-4 text-orange-600">${item.maintenance.toLocaleString()}</td>
                    <td className="py-3 px-4 text-blue-600">${(item.revenue - item.maintenance).toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td className="py-3 px-4">Total</td>
                  <td className="py-3 px-4 text-green-600">${totalRevenue.toLocaleString()}</td>
                  <td className="py-3 px-4">{totalRides.toLocaleString()}</td>
                  <td className="py-3 px-4 text-orange-600">${totalMaintenance.toLocaleString()}</td>
                  <td className="py-3 px-4 text-blue-600">${(totalRevenue - totalMaintenance).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRevenue; 