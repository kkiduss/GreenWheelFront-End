import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bike as BikeIcon, Clock, DollarSign, TrendingUp } from 'lucide-react';

interface BikeRevenueData {
  total_revenue: number;
  total_trips: number;
  average_duration: string;
  bike_number: string;
  model: string;
}

const BikeRevenueSummary = () => {
  const [data, setData] = useState<BikeRevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://www.green-wheels.pro.et/api/superadmin/revenue/bike-summary', {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch bike revenue data');
        }

        const result = await response.json();
        setData(result);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load bike revenue data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data.map((bike) => (
        <Card key={bike.bike_number} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bike {bike.bike_number}</CardTitle>
            <BikeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Model:</span>
                <span className="font-medium">{bike.model}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Revenue:</span>
                <span className="font-medium text-green-600">${bike.total_revenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Trips:</span>
                <span className="font-medium">{bike.total_trips}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Duration:</span>
                <span className="font-medium">{bike.average_duration}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BikeRevenueSummary; 