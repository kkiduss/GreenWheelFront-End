import { useState, useEffect, useCallback } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Satellite, Users, Search, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import StationMap, { StationMapLocation } from '@/components/StationMap';
import { useAuth } from '@/contexts/AuthContext';
import BikeTracker from '../components/BikeTracker';
import TrackingStats from '../components/TrackingStats';
import { Input } from '@/components/ui/input';

interface ActiveBike {
  id: number;
  bike_number: string;
  model: string;
  brand: string;
  status: string;
  station_id: number;
  start_time?: string;
  user_id?: number;
  station_name?: string;
  user_email?: string;
  created_at?: string;
  trip_id?: number;
  tracking_code?: string;
}

interface BikeLocation {
  bike_number: string;
  latitude: number;
  longitude: number;
  updated_at: string;
  user_email?: string;
}

const ADDIS_BOUNDS = {
  minLat: 8.9,
  maxLat: 9.1,
  minLng: 38.6,
  maxLng: 38.9
};

const ActiveRides = () => {
  const { toast } = useToast();
  const { authState } = useAuth();
  
  const [activeBikes, setActiveBikes] = useState<ActiveBike[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBike, setSelectedBike] = useState<ActiveBike | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ActiveBike[]>([]);
  const [bikeLocations, setBikeLocations] = useState<Record<string, BikeLocation>>({});
  const [useMockData, setUseMockData] = useState(true);

  const generateMockLocation = useCallback((stationId: string): BikeLocation => {
    return {
      bike_number: `MOCK-${stationId}`,
      latitude: 8.9806,
      longitude: 38.7578,
      updated_at: new Date().toISOString()
    };
  }, [bikeLocations]);

  const fetchRealBikeLocation = useCallback(async (tripId: number, bikeNumber: string) => {
    try {
      console.log('Fetching real location for bike:', bikeNumber);
      const response = await fetch(`http://127.0.0.1:8000/api/latest_location/${tripId}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch bike location');
      }

      const data = await response.json();
      console.log('Received location data:', data);

      const clampedLat = Math.min(Math.max(data.latitude, ADDIS_BOUNDS.minLat), ADDIS_BOUNDS.maxLat);
      const clampedLng = Math.min(Math.max(data.longitude, ADDIS_BOUNDS.minLng), ADDIS_BOUNDS.maxLng);

      return {
        bike_number: bikeNumber,
        latitude: clampedLat,
        longitude: clampedLng,
        updated_at: data.recorded_at,
        user_email: data.user?.email
      };
    } catch (error) {
      console.error('Error fetching bike location:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!selectedBike) return;
    
    const intervalId = setInterval(async () => {
      if (useMockData) {
        const mockLocation = generateMockLocation(selectedBike.station_id?.toString() || '');
        setBikeLocations(prev => ({
          ...prev,
          [selectedBike.bike_number]: mockLocation
        }));
      } else if (selectedBike.trip_id) {
        const location = await fetchRealBikeLocation(selectedBike.trip_id, selectedBike.bike_number);
        if (location) {
          setBikeLocations(prev => ({
            ...prev,
            [selectedBike.bike_number]: location
          }));
        }
      }
    }, 500);

    return () => clearInterval(intervalId);
  }, [selectedBike, useMockData, generateMockLocation, fetchRealBikeLocation]);

  const fetchActiveBikes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8000/api/bike/active', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        setActiveBikes([]);
        return;
      }

      const data = await response.json();
      
      let bikes: ActiveBike[] = [];
      if (typeof data === 'object' && data !== null) {
        if (Array.isArray(data.bikes)) {
          bikes = data.bikes;
        } else if (Array.isArray(data.data)) {
          bikes = data.data;
        } else if (Array.isArray(data.results)) {
          bikes = data.results;
        }
      } else if (Array.isArray(data)) {
        bikes = data;
      }

      if (authState.role === 'staff' || authState.role === 'admin') {
        const userStationId = localStorage.getItem('stationId');
        bikes = bikes.filter(bike => 
          bike.station_id !== undefined && 
          String(bike.station_id) === String(userStationId)
        );
      }

      setActiveBikes(bikes.map(bike => ({
        ...bike,
        trip_id: bike.id
      })));
      setSearchResults(bikes);
    } catch (error) {
      setActiveBikes([]);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [authState]);

  useEffect(() => {
    fetchActiveBikes();
  }, [fetchActiveBikes]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults(activeBikes);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const results = activeBikes.filter(bike => 
      bike.bike_number?.toLowerCase().includes(searchTermLower) ||
      bike.user_email?.toLowerCase().includes(searchTermLower) ||
      bike.station_name?.toLowerCase().includes(searchTermLower) ||
      bike.model?.toLowerCase().includes(searchTermLower)
    );
    setSearchResults(results);
  }, [searchTerm, activeBikes]);

  const handleBikeSelect = (bike: ActiveBike) => {
    // if (!bike.station_id) {
    //   console.error('Selected bike has no station_id:', bike);
    //   return;
    // }

    setSelectedBike(bike);
    
    if (useMockData) {
      const mockLocation = generateMockLocation(bike.station_id.toString());
      setBikeLocations(prev => ({
        ...prev,
        [bike.bike_number]: mockLocation
      }));
    } else if (bike.trip_id) {
      fetchRealBikeLocation(bike.trip_id, bike.bike_number).then(location => {
        if (location) {
          setBikeLocations(prev => ({
            ...prev,
            [bike.bike_number]: location
          }));
        }
      });
    }
  };

  const handleBackToList = () => {
    setSelectedBike(null);
  };

  const stationLocations: StationMapLocation[] = [];

  const activeBikeLocations: StationMapLocation[] = selectedBike 
    ? [{
        id: `bike-${selectedBike.bike_number}`,
        name: `Bike #${selectedBike.bike_number}`,
        location: {
          latitude: bikeLocations[selectedBike.bike_number]?.latitude || 0,
          longitude: bikeLocations[selectedBike.bike_number]?.longitude || 0
        },
        type: 'bike'
      }]
    : [];

  const activeStations = [...new Set(activeBikes.map(bike => bike.station_id))].length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Live Tracking</h2>
          <p className="text-gray-600">Fetching real-time bike data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Satellite className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Live Bike Tracking</h1>
                <p className="text-gray-600">
                  {authState.role === 'superadmin' 
                    ? 'Real-time monitoring of all active bike rides'
                    : 'Monitor active rides at your station in real-time'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant={useMockData ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUseMockData(!useMockData)}
                className="text-xs"
              >
                {useMockData ? 'Using Mock Data' : 'Using Real Data'}
              </Button>
            )}
            
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live
            </div>
          </div>
        </div>

        <TrackingStats 
          activeRides={activeBikes.length}
          totalStations={activeStations}
        />

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          <div className="xl:col-span-2 space-y-6">
            <Card className="border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-green-600" />
                  Active Rides
                  <span className="ml-auto bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                    {searchResults.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by bike number, user, or station..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div className="max-h-[600px] overflow-y-auto p-4">
                  <BikeTracker 
                    bikes={searchResults}
                    selectedBike={selectedBike}
                    onSelectBike={handleBikeSelect}
                  />
                </div>
              </CardContent>
            </Card>

            {selectedBike && (
              <Card className="border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5 text-green-600" />
                      Tracking Details
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToList}
                      className="text-gray-600 hover:text-green-600"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to List
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Bike Number</p>
                      <p className="font-semibold">#{selectedBike.bike_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Rider</p>
                      <p className="font-semibold">{selectedBike.user_email?.split('@')[0] || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Station</p>
                      <p className="font-semibold">{selectedBike.station_name || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Status</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        In Use
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Tracking Code</p>
                      <p className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">
                        {selectedBike.tracking_code}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Last Update</p>
                      <p className="font-semibold">
                        {bikeLocations[selectedBike.bike_number]?.updated_at 
                          ? new Date(bikeLocations[selectedBike.bike_number].updated_at).toLocaleTimeString()
                          : 'Just now'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="xl:col-span-3">
            <Card className="border-0 bg-white/80 backdrop-blur-sm h-[700px] relative" style={{ zIndex: 1 }}>
              <CardHeader className="pb-4 relative" style={{ zIndex: 2 }}>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Satellite className="h-5 w-5 text-green-600" />
                  Live Map View
                  {selectedBike && (
                    <span className="ml-auto text-sm font-normal text-gray-600">
                      Tracking Bike #{selectedBike.bike_number}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-80px)] relative" style={{ zIndex: 1 }}>
                <div className="h-full rounded-lg overflow-hidden relative">
                  <StationMap 
                    stations={stationLocations}
                    bikes={activeBikeLocations}
                    selectedStation={selectedBike ? `station-${selectedBike.station_id}` : ""}
                    selectedBike={selectedBike ? `bike-${selectedBike.bike_number}` : ""}
                    onStationSelect={() => {}}
                    bounds={ADDIS_BOUNDS}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveRides;
