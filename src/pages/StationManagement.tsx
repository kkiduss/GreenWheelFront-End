import { useState, useEffect } from 'react';
import { Station, Bike } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Bike as BikeIcon, Edit, Plus, Loader2 } from 'lucide-react';
import StationMap, { StationMapLocation } from '@/components/StationMap';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CustomPagination } from '@/components/ui/custom-pagination';
import { useAuth } from '@/contexts/AuthContext';

const StationManagement = () => {
  const { toast } = useToast();
  const { authState } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStations, setFilteredStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    location: '',
    latitude: 0,
    longitude: 0,
    total_capacity: 0
  });
  const [mapSelectedStation, setMapSelectedStation] = useState<Station | null>(null);
  const [stationBikes, setStationBikes] = useState<Bike[]>([]);
  const [currentBikesPage, setCurrentBikesPage] = useState(1);
  const bikesPerPage = 15;
  const [bikesLoading, setBikesLoading] = useState(false);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        console.log('Fetching stations...');
        const response = await fetch('http://127.0.0.1:8000/api/stations', {
          headers: {
            'Authorization': `Bearer ${authState.token}`,
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch stations');
        }
        
        const data = await response.json();
        console.log('Raw stations data:', data);
        
        // Support both array and object response formats
        const stationsArray = Array.isArray(data) ? data : data.stations || data.data || [];
        
        const mappedStations = stationsArray.map((station: any) => {
          // Try to get available bikes from the most likely property
          let availableBikes = 0;
          if (typeof station.available_bikes === 'number') {
            availableBikes = station.available_bikes;
          } else if (typeof station.availableBikes === 'number') {
            availableBikes = station.availableBikes;
          } else if (typeof station.available_capacity === 'number') {
            availableBikes = station.available_capacity;
          } else if (Array.isArray(station.bikes)) {
            availableBikes = station.bikes.length;
          }
          return {
            id: station.id.toString(),
            name: station.name,
            location: station.location,
            total_capacity: station.capacity || station.total_capacity || 0,
            availableBikes,
            coordinates: {
              lat: parseFloat(station.latitude),
              lng: parseFloat(station.longitude),
            },
          };
        });
        
        console.log('Mapped stations:', mappedStations);
        setStations(mappedStations);
        setFilteredStations(mappedStations);
        // Removed updateStationsWithBikes to avoid fetching bikes for all stations on load
      } catch (error) {
        console.error('Error fetching stations:', error);
        toast({
          title: 'Error',
          description: 'Failed to load stations. Please try again later.',
          variant: 'destructive',
        });
      }
    };

    fetchStations();
  }, [authState.token]);

  useEffect(() => {
    if (selectedStation) {
      const fetchBikesForStation = async () => {
        setBikesLoading(true);
        try {
          console.log('Fetching bikes for station:', selectedStation.name);
          const response = await fetch(`http://127.0.0.1:8000/api/stations/${selectedStation.id}/bikes`, {
            headers: {
              'Authorization': `Bearer ${authState.token}`,
              'Accept': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch bikes');
          }

          const data = await response.json();
          console.log('Raw bikes data:', data);
          
          // Support multiple response formats
          let bikesArray = [];
          if (Array.isArray(data)) {
            bikesArray = data;
          } else if (data && typeof data === 'object') {
            bikesArray = data.bikes || data.data || data.results || [];
          }

          setStationBikes(bikesArray);

          // Update the station's available bikes count without triggering a re-render
          const updatedStation = {
            ...selectedStation,
            availableBikes: bikesArray.length
          };
          setSelectedStation(updatedStation);
        } catch (error) {
          console.error('Error fetching bikes:', error);
          setStationBikes([]);
          // No toast notification here
        } finally {
          setBikesLoading(false);
        }
      };

      fetchBikesForStation();
    } else {
      setStationBikes([]);
      setBikesLoading(false);
    }
  }, [selectedStation?.id, authState.token]); // Only depend on station ID and token

  // Update the stations list when selected station changes
  useEffect(() => {
    if (selectedStation) {
      const updatedStations = stations.map(station => 
        station.id === selectedStation.id ? selectedStation : station
      );
      setStations(updatedStations);
      setFilteredStations(updatedStations);
    }
  }, [selectedStation]);

  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filtered = stations.filter(station =>
        station.name.toLowerCase().includes(term) ||
        station.location.toLowerCase().includes(term)
      );
      setFilteredStations(filtered);
    } else {
      setFilteredStations(stations);
    }
  }, [stations, searchTerm]);

  const handleStationSelect = (station: Station) => {
    setSelectedStation(station);
    setMapSelectedStation(station);
    setCurrentBikesPage(1);
  };

  const handleMapPinClick = (stationId: string) => {
    const station = stations.find(s => s.id === stationId);
    if (station) {
      handleStationSelect(station);
    }
  };

  const getPaginatedBikes = () => {
    const indexOfLastBike = currentBikesPage * bikesPerPage;
    const indexOfFirstBike = indexOfLastBike - bikesPerPage;
    return stationBikes.slice(indexOfFirstBike, indexOfLastBike);
  };
  
  const getTotalBikesPages = () => {
    return Math.ceil(stationBikes.length / bikesPerPage);
  };

  const handleEditClick = () => {
    if (!selectedStation) return;
    
    setEditForm({
      name: selectedStation.name,
      location: selectedStation.location,
      latitude: selectedStation.coordinates.lat,
      longitude: selectedStation.coordinates.lng,
      total_capacity: selectedStation.total_capacity
    });
    
    setShowEditDialog(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedStation) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/superadmin/update_station/${selectedStation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${authState.token}`,
        },
        body: JSON.stringify({
          name: editForm.name,
          location: editForm.location,
          latitude: editForm.latitude,
          longitude: editForm.longitude,
          total_capacity: editForm.total_capacity
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update station');
      }

      const updatedStations = stations.map(station => 
        station.id === selectedStation.id 
          ? { 
              ...station, 
              name: editForm.name,
              location: editForm.location,
              coordinates: {
                lat: editForm.latitude,
                lng: editForm.longitude
              },
              total_capacity: editForm.total_capacity
            } 
          : station
      );
      
      setStations(updatedStations);
      setFilteredStations(updatedStations);
      
      const updatedStation = updatedStations.find(s => s.id === selectedStation.id);
      if (updatedStation) {
        setSelectedStation(updatedStation);
        setMapSelectedStation(updatedStation);
      }
      
      setShowEditDialog(false);
      
      toast({
        title: "Station Updated",
        description: `${editForm.name} station has been updated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update station",
        variant: "destructive"
      });
    }
  };

  const stationLocations: StationMapLocation[] = stations.map(station => ({
    id: station.id,
    name: station.name,
    location: {
      latitude: station.coordinates.lat,
      longitude: station.coordinates.lng
    }
  }));
  
  const selectedStationId = mapSelectedStation?.id || '';

  // Fix the CustomPagination props
  const paginationProps = {
    currentPage: currentBikesPage,
    totalPages: getTotalBikesPages(),
    onPageChange: setCurrentBikesPage,
    itemsPerPage: bikesPerPage,
    totalItems: stationBikes.length
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Station Management</h1>
          <p className="text-gray-600 mt-1">View and manage bike stations across the city</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border p-6">
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search stations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              All Stations ({filteredStations.length})
            </h3>
            {filteredStations.map((station) => (
              <button
                key={station.id}
                onClick={() => handleStationSelect(station)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedStation?.id === station.id 
                    ? 'bg-green-50 border-green-200 text-green-900' 
                    : 'hover:bg-gray-50 border-gray-200 text-gray-900'
                }`}
              >
                <div className="font-medium">{station.name}</div>
                <div className="text-sm text-gray-500 mt-1">{station.location}</div>
                <div className="text-sm mt-2 flex justify-between">
                  {/* Only show total capacity */}
                  <span className="text-gray-500">
                    {station.total_capacity} total
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
          {selectedStation ? (
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{selectedStation.name}</h2>
                  <p className="text-gray-500 mt-1">{selectedStation.location}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2" 
                  onClick={handleEditClick}
                >
                  <Edit size={16} />
                  Edit Station
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium">Total Capacity</div>
                  <div className="text-2xl font-bold text-blue-900">{selectedStation.total_capacity}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-sm text-green-600 font-medium">Available Bikes</div>
                  <div className="text-2xl font-bold text-green-900">{selectedStation.availableBikes}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="text-sm text-purple-600 font-medium">Utilization</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {Math.round((selectedStation.availableBikes / selectedStation.total_capacity) * 100)}%
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Bikes at this Station ({stationBikes.length} total)
                </h3>
              </div>
              
              <div className="overflow-x-auto mb-6">
                {bikesLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="animate-spin mr-2" />
                    <span>Loading bikes...</span>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bike Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Model
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Brand
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getPaginatedBikes().map((bike) => (
                        <tr key={bike.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {bike.bike_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {bike.model}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {bike.brand}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              bike.status === 'available' ? 'bg-green-100 text-green-800' : 
                              bike.status === 'in-use' ? 'bg-blue-100 text-blue-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {bike.status.charAt(0).toUpperCase() + bike.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {getPaginatedBikes().length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                            No bikes currently at this station
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
              
              {stationBikes.length > bikesPerPage && (
                <div className="flex justify-center">
                  <CustomPagination {...paginationProps} />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-16">
              <MapPin size={48} className="text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Station Selected</h3>
              <p className="text-gray-500 text-center max-w-md">
                Select a station from the list or map to view detailed information and manage bikes at that location.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 relative" style={{ zIndex: 1 }}>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 relative" style={{ zIndex: 2 }}>Station Map</h2>
        <div className="h-[600px] rounded-lg overflow-hidden border border-gray-200 relative" style={{ zIndex: 1 }}>
          <StationMap 
            stations={stationLocations} 
            selectedStation={selectedStationId} 
            onStationSelect={handleMapPinClick} 
          />
        </div>
      </div>

      {/* Edit Station Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Station Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="location" className="text-right text-sm font-medium">
                Location
              </label>
              <Input
                id="location"
                value={editForm.location}
                onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="latitude" className="text-right text-sm font-medium">
                Latitude
              </label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={editForm.latitude}
                onChange={(e) => setEditForm({...editForm, latitude: parseFloat(e.target.value)})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="longitude" className="text-right text-sm font-medium">
                Longitude
              </label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={editForm.longitude}
                onChange={(e) => setEditForm({...editForm, longitude: parseFloat(e.target.value)})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="total_capacity" className="text-right text-sm font-medium">
                Capacity
              </label>
              <Input
                id="total_capacity"
                type="number"
                min="1"
                value={editForm.total_capacity}
                onChange={(e) => setEditForm({...editForm, total_capacity: parseInt(e.target.value)})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StationManagement;
