import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { BikeCategory, BikeStatus, Station } from '@/types';
import { Bike, Plus, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BikeFormData {
  model: string;
  category: BikeCategory;
  station_id: string;
  status: BikeStatus;
  bike_number: string;
  brand: string;
}

const RegisterBike = () => {
  const { toast } = useToast();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bikeToConfirm, setBikeToConfirm] = useState<BikeFormData | null>(null);
  const [stationsList, setStationsList] = useState<Station[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(true);
  const [stationsError, setStationsError] = useState<string>('');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<BikeFormData>({
    defaultValues: {
      model: '',
      category: 'regular',
      station_id: '',
      status: 'available',
      bike_number: '',
      brand: ''
    }
  });

  const selectedStationId = watch('station_id');

  useEffect(() => {
    const fetchStations = async () => {
      console.log('🔄 Starting to fetch stations...');
      setIsLoadingStations(true);
      setStationsError('');
      
      try {
        const token = localStorage.getItem('token');
        console.log('🔑 Token exists:', !!token);
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('http://127.0.0.1:8000/api/stations', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Response error:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch stations'}`);
        }

        const data = await response.json();
        console.log('📦 Raw API response:', data);
        
        let stations: Station[] = [];
        if (Array.isArray(data)) {
          stations = data;
        } else if (data && Array.isArray(data.data)) {
          stations = data.data;
        } else if (data && Array.isArray(data.stations)) {
          stations = data.stations;
        } else {
          console.warn('⚠️ Unexpected response format:', data);
          throw new Error('Unexpected response format from stations API');
        }
        
        const transformedStations = stations.map((station: any) => ({
          id: String(station.id),
          name: station.name || `Station ${station.id}`,
          location: station.location,
          status: station.status,
          total_capacity: station.total_capacity || 0,
          availableBikes: station.availableBikes || 0,
          coordinates: station.coordinates || { lat: 0, lng: 0 }
        }));
        
        console.log('✅ Transformed stations:', transformedStations);
        setStationsList(transformedStations);
        
        if (transformedStations.length === 0) {
          setStationsError('No stations available');
        }
        
      } catch (error: any) {
        console.error('❌ Error fetching stations:', error);
        const errorMessage = error.message || 'Failed to fetch stations';
        setStationsError(errorMessage);
        setStationsList([]);
        
        toast({
          title: 'Error Loading Stations',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoadingStations(false);
      }
    };

    fetchStations();
  }, [toast]);
  
  const onSubmit = (data: BikeFormData) => {
    setBikeToConfirm(data);
    setShowConfirmation(true);
  };
  
  const confirmRegister = async () => {
    if (!bikeToConfirm) return;

    try {
      const response = await fetch('http://127.0.0.1:8000/api/superadmin/add_bikes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(bikeToConfirm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to register bike');
      }

      toast({
        title: 'Success',
        description: data.message || `Bike ${bikeToConfirm.bike_number} has been successfully registered.`,
      });

      setShowConfirmation(false);
      setBikeToConfirm(null);
      reset();
    } catch (error: any) {
      console.error('Error registering bike:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to register bike. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const retryFetchStations = () => {
    window.location.reload();
  };
  
  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-graydark">Register New Bike</h1>
        <p className="text-muted-foreground">Add new bikes to the GreenWheels fleet</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="model">
              Bike Model
            </label>
            <Input
              id="model"
              {...register('model', { required: 'Bike model is required' })}
              placeholder="City Cruiser"
            />
            {errors.model && (
              <p className="text-error text-sm mt-1">{errors.model.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="bike_number">
              Bike Number
            </label>
            <Input
              id="bike_number"
              {...register('bike_number', {
                required: 'Bike number is required',
                validate: (value) => value.length === 6 || 'Bike number must be 6 characters long',
              })}
              placeholder="111232"
            />
            {errors.bike_number && (
              <p className="text-error text-sm mt-1">{errors.bike_number.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="brand">
              Brand
            </label>
            <Input
              id="brand"
              {...register('brand', { required: 'Brand is required' })}
              placeholder="weawe"
            />
            {errors.brand && (
              <p className="text-error text-sm mt-1">{errors.brand.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="station_id">
              Station
            </label>
            {isLoadingStations ? (
              <div className="space-y-2">
                <div className="h-10 bg-gray-100 animate-pulse rounded-md" />
                <div className="h-4 w-24 bg-gray-100 animate-pulse rounded-md" />
              </div>
            ) : stationsError ? (
              <div className="text-center py-2">
                <p className="text-red-500 text-xs mb-2">❌ {stationsError}</p>
                <Button onClick={retryFetchStations} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            ) : stationsList.length === 0 ? (
              <div className="text-center py-2">
                <p className="text-gray-500 text-xs">No stations available</p>
                <Button onClick={retryFetchStations} variant="outline" size="sm" className="mt-1">
                  Refresh
                </Button>
              </div>
            ) : (
              <Select onValueChange={(value) => setValue('station_id', value)} value={selectedStationId}>
                <SelectTrigger className={errors.station_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a station" />
                </SelectTrigger>
                <SelectContent>
                  {stationsList.map(station => (
                    <SelectItem key={station.id} value={station.id}>
                      {station.name}
                      {station.location && <span className="text-gray-500 ml-2">({station.location})</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <input type="hidden" {...register('station_id', { required: 'Station selection is required' })} />
            {errors.station_id && (
              <p className="text-red-500 text-xs mt-1">{errors.station_id.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="status">
              Initial Status
            </label>
            <select
              id="status"
              {...register('status')}
              className="w-full border border-input p-2 rounded-md focus:outline-none focus:ring-2"
            >
              <option value="available">Available</option>
              <option value="maintenance">Maintenance Required</option>
            </select>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoadingStations}>
            <Bike className="mr-2" size={18} />
            Register Bike
          </Button>
        </form>
      </div>
      
      {/* Confirmation Modal */}
      {showConfirmation && bikeToConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Confirm Bike Registration</h2>
              <button onClick={() => setShowConfirmation(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <p className="mb-4">Are you sure you want to register the following bike?</p>
            
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <p><span className="font-medium">Model:</span> {bikeToConfirm.model || 'N/A'}</p>
              <p><span className="font-medium">Brand:</span> {bikeToConfirm.brand || 'N/A'}</p>
              <p><span className="font-medium">Bike Number:</span> {bikeToConfirm.bike_number || 'N/A'}</p>
              <p><span className="font-medium">Station:</span> {(() => {
                const selectedStation = stationsList.find(s => s.id === bikeToConfirm.station_id);
                return selectedStation ? selectedStation.name : 'Unknown Station';
              })()}</p>
              <p><span className="font-medium">Status:</span> {bikeToConfirm.status || 'N/A'}</p>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                Cancel
              </Button>
              <Button onClick={confirmRegister}>
                Confirm Registration
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterBike;
