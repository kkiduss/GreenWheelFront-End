import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, RefreshCcw, Bike as BikeIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { CustomPagination } from '@/components/ui/custom-pagination';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AvailableBike {
  id: number;
  bike_number: string;
  model: string;
  brand: string;
  status: string;
  station_id: number;
  station: {
    id: number;
    name: string;
    location: string;
  };
  station_name?: string;
  station_location?: string;
}

const AvailableBikes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { authState } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentBikePage, setCurrentBikePage] = useState<Record<string, number>>({});
  const [availableBikes, setAvailableBikes] = useState<AvailableBike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const itemsPerPage = 6;
  const bikesPerStation = 5;

  const fetchAvailableBikes = async () => {
    try {
      setLoading(true);
      setError(null);
      let response;
      
      // For staff, maintenance, and admin: fetch only their station's available bikes
      if (authState.role === 'staff' || authState.role === 'admin' || authState.role === 'maintenance') {
        const stationId = localStorage.getItem('stationId');
        if (!stationId) {
          console.error('No station ID found in localStorage');
          throw new Error('No station ID found for user');
        }
        console.log(`Fetching bikes for ${authState.role} user from station ${stationId}`);
        response = await fetch(`http://127.0.0.1:8000/api/bikes/${stationId}/available`, {
          credentials: 'include',
          headers: { 
            'Accept': 'application/json',
            'Authorization': `Bearer ${authState.token}`
          },
        });
      } else {
        // For regular users: fetch all available bikes
        response = await fetch('http://127.0.0.1:8000/api/bike/available', {
          credentials: 'include',
          headers: { 
            'Accept': 'application/json',
            'Authorization': `Bearer ${authState.token}`
          },
        });
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      let processedBikes: AvailableBike[] = [];
      
      // Handle different API response formats
      if (Array.isArray(data.stations)) {
        // Flatten all bikes from all stations
        processedBikes = data.stations.flatMap((station: any) =>
          (station.bikes || []).map((bike: any) => ({
            ...bike,
            station: {
              id: station.id,
              name: station.name,
              location: station.location,
            },
            station_id: station.id,
            station_name: station.name,
            station_location: station.location,
          }))
        );
      } else if (typeof data === 'object' && data !== null) {
        if (Array.isArray(data.bikes)) {
          processedBikes = data.bikes;
        } else if (Array.isArray(data.data)) {
          processedBikes = data.data;
        } else if (Array.isArray(data.results)) {
          processedBikes = data.results;
        } else if (data.station && Array.isArray(data.station.bikes)) {
          // Handle single station response
          processedBikes = data.station.bikes.map((bike: any) => ({
            ...bike,
            station: data.station,
            station_id: data.station.id,
            station_name: data.station.name,
            station_location: data.station.location,
          }));
        } else {
          processedBikes = [];
        }
      } else if (Array.isArray(data)) {
        processedBikes = data;
      } else {
        processedBikes = [];
      }
      
      console.log('Processed bikes:', processedBikes);
      setAvailableBikes(processedBikes);
      
      // For staff/admin/maintenance, auto-select their station
      if ((authState.role === 'staff' || authState.role === 'admin' || authState.role === 'maintenance') && !selectedStationId) {
        const stationId = localStorage.getItem('stationId');
        if (stationId) {
          console.log('Setting selected station ID:', stationId);
          setSelectedStationId(stationId);
        }
      }
      
    } catch (error) {
      console.error('Error fetching available bikes:', error);
      setAvailableBikes([]);
      setError('Failed to fetch available bikes. Please check your network connection or try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableBikes();
  }, [authState.role, localStorage.getItem('stationId')]);

  // Poll for live updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAvailableBikes();
    }, 30000);
    return () => clearInterval(interval);
  }, [authState.role, localStorage.getItem('stationId')]);

  // Group bikes by station
  const bikesByStation = availableBikes.reduce((acc, bike) => {
    let stationKey = '';
    let stationName = '';
    let stationLocation = '';
    
    if (bike.station_name) {
      stationKey = bike.station_name;
      stationName = bike.station_name;
      stationLocation = bike.station_location || '';
    } else if (bike.station && bike.station.id != null) {
      stationKey = String(bike.station.id);
      stationName = bike.station.name || '';
      stationLocation = bike.station.location || '';
    } else if (bike.station_id != null) {
      stationKey = String(bike.station_id);
      // Try to find station name from the bike data or fallback
      stationName = `Station ${bike.station_id}`;
    } else if (bike.station && bike.station.name) {
      stationKey = bike.station.name;
      stationName = bike.station.name;
    }
    
    if (!stationKey) return acc;
    
    if (!acc[stationKey]) {
      acc[stationKey] = [];
    }
    acc[stationKey].push({ ...bike, station_name: stationName, station_location: stationLocation });
    return acc;
  }, {} as Record<string, (AvailableBike & { station_name?: string; station_location?: string })[]>);

  // Build station options for dropdown
  const stationOptions = Object.entries(bikesByStation)
    .filter(([stationId, bikes]) => !!stationId && bikes.length > 0)
    .map(([stationId, bikes]) => {
      const firstBike = bikes[0];
      return {
        id: String(stationId),
        name: firstBike.station_name || firstBike.station?.name || `Station ${stationId}`,
        location: firstBike.station_location || firstBike.station?.location || '',
        count: bikes.length,
      };
    });

  // Get bikes for selected station
  let selectedBikes: AvailableBike[] = [];
  if (selectedStationId) {
    selectedBikes = bikesByStation[selectedStationId] || [];
  }

  const bikesPerPage = 8;
  const [bikePage, setBikePage] = useState(1);
  const totalBikePages = Math.ceil(selectedBikes.length / bikesPerPage);
  const paginatedBikes = selectedBikes.slice((bikePage - 1) * bikesPerPage, bikePage * bikesPerPage);

  // Reset bike page when station changes or bikes change
  useEffect(() => {
    setBikePage(1);
  }, [selectedStationId, selectedBikes.length]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAvailableBikes();
    setRefreshing(false);
    toast({
      title: 'Data Refreshed',
      description: 'Available bike data has been updated',
      variant: 'default',
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/admin-dashboard')}
            className="mr-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-graydark dark:text-white">Available Bikes</h1>
            <p className="text-muted-foreground dark:text-gray-400">
              {loading ? 'Loading...' : `${availableBikes.length} bikes ready for rental across ${Object.keys(bikesByStation).length} stations`}
            </p>
          </div>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <RefreshCcw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button onClick={fetchAvailableBikes} variant="outline" size="sm" className="mt-2">
            Try Again
          </Button>
        </div>
      )}

      {/* Station Selector - Hide for staff/admin/maintenance as they only see their station */}
      {!(authState.role === 'staff' || authState.role === 'admin' || authState.role === 'maintenance') && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <label className="block mb-2 text-sm font-medium text-graydark dark:text-gray-300">Select Station</label>
          <Select value={selectedStationId ?? undefined} onValueChange={v => setSelectedStationId(v === 'none' ? null : v)}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Choose a station" />
            </SelectTrigger>
            <SelectContent>
              {stationOptions.length > 0 ? (
                stationOptions.map(station => (
                  <SelectItem key={station.id} value={String(station.id)}>
                    {station.name} ({station.count} bikes)
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  No stations with available bikes
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Show current user's station info for staff/admin/maintenance */}
      {(authState.role === 'staff' || authState.role === 'admin' || authState.role === 'maintenance') && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-400">Your Station</h3>
          <p className="text-blue-700 dark:text-blue-300">
            Showing bikes for Station {localStorage.getItem('stationId') || 'Unknown'}
            {stationOptions.length > 0 && ` - ${stationOptions[0]?.name}`}
          </p>
        </div>
      )}

      {/* Bikes Table for Selected Station */}
      {selectedStationId ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-graydark dark:text-white">
                Bikes at {stationOptions.find(s => s.id === selectedStationId)?.name || `Station ${selectedStationId}`}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedBikes.length} bike{selectedBikes.length !== 1 ? 's' : ''} available
              </p>
            </div>
            <span className="text-xs bg-greenprimary/10 text-greenprimary dark:bg-greenprimary/20 dark:text-green-400 px-2 py-1 rounded-full">
              {stationOptions.find(s => s.id === selectedStationId)?.location || 'Unknown Location'}
            </span>
          </div>
          <div className="overflow-x-auto">
            {paginatedBikes.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-graydark dark:text-gray-300 uppercase tracking-wider">Bike Number</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-graydark dark:text-gray-300 uppercase tracking-wider">Model</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-graydark dark:text-gray-300 uppercase tracking-wider">Brand</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-graydark dark:text-gray-300 uppercase tracking-wider">Station</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-graydark dark:text-gray-300 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedBikes.map((bike) => (
                    <tr key={bike.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-graydark dark:text-white">{bike.bike_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark dark:text-gray-300">{bike.model}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark dark:text-gray-300">{bike.brand}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark dark:text-gray-300">{bike.station_name || bike.station?.name || ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">{bike.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <BikeIcon size={32} className="text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No bikes available at this station</p>
              </div>
            )}
          </div>
          {/* Pagination for bikes */}
          {selectedBikes.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <CustomPagination
                currentPage={bikePage}
                totalPages={totalBikePages}
                onPageChange={setBikePage}
                itemsPerPage={bikesPerPage}
                totalItems={selectedBikes.length}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <BikeIcon size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Select a station to view available bikes</h3>
          <p className="text-gray-500 dark:text-gray-400">Choose a station from the dropdown above.</p>
        </div>
      )}
    </div>
  );
};

export default AvailableBikes;