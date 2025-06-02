import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { MapPin, X } from 'lucide-react';

interface StationFormData {
  name: string;
  location: string;
  capacity: number;
  latitude: string;
  longitude: string;
}

const CreateStation = () => {
  const { toast } = useToast();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [stationToConfirm, setStationToConfirm] = useState<StationFormData | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<StationFormData>({
    defaultValues: {
      name: '',
      location: '',
      capacity: 20,
      latitude: '',
      longitude: ''
    }
  });
  
  const onSubmit = (data: StationFormData) => {
    const updatedData = {
      ...data,
      total_capacity: data.capacity, // Map capacity to total_capacity
    };
    setStationToConfirm(updatedData);
    setShowConfirmation(true);
  };
  
  const confirmCreate = async () => {
    if (!stationToConfirm) return;

    try {
      // Make an API call to create the station
      const response = await fetch('http://127.0.0.1:8000/api/superadmin/add_stations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(stationToConfirm),
      });

      if (!response.ok) {
        throw new Error('Failed to create station');
      }

      const data = await response.json();

      toast({
        title: 'Station Created',
        description: `${data.station.name} has been added to the system at ${data.station.location}`,
      });

      setShowConfirmation(false);
      setStationToConfirm(null);
      reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create station. Please try again.',
        variant: 'destructive',
      });
      console.error('Error creating station:', error);
    }
  };
  
  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-graydark">Create New Station</h1>
        <p className="text-muted-foreground">Add new docking stations to the GreenWheels network</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">
              Station Name
            </label>
            <Input
              id="name"
              {...register('name', { required: 'Station name is required' })}
              placeholder="Central Park"
            />
            {errors.name && (
              <p className="text-error text-sm mt-1">{errors.name.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="location">
              Location Description
            </label>
            <Input
              id="location"
              {...register('location', { required: 'Location is required' })}
              placeholder="5th Ave & 59th St"
            />
            {errors.location && (
              <p className="text-error text-sm mt-1">{errors.location.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="capacity">
              Bike Capacity
            </label>
            <Input
              id="capacity"
              type="number"
              {...register('capacity', { 
                required: 'Capacity is required',
                min: {
                  value: 5,
                  message: 'Minimum capacity is 5'
                },
                max: {
                  value: 50,
                  message: 'Maximum capacity is 50'
                }
              })}
              placeholder="20"
            />
            {errors.capacity && (
              <p className="text-error text-sm mt-1">{errors.capacity.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="latitude">
                Latitude
              </label>
              <Input
                id="latitude"
                {...register('latitude', { 
                  required: 'Latitude is required',
                  pattern: {
                    value: /^-?[0-9]\d*(\.\d+)?$/,
                    message: 'Enter a valid latitude'
                  }
                })}
                placeholder="40.7812"
              />
              {errors.latitude && (
                <p className="text-error text-sm mt-1">{errors.latitude.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="longitude">
                Longitude
              </label>
              <Input
                id="longitude"
                {...register('longitude', { 
                  required: 'Longitude is required',
                  pattern: {
                    value: /^-?[0-9]\d*(\.\d+)?$/,
                    message: 'Enter a valid longitude'
                  }
                })}
                placeholder="-73.9665"
              />
              {errors.longitude && (
                <p className="text-error text-sm mt-1">{errors.longitude.message}</p>
              )}
            </div>
          </div>
          
          <Button type="submit" className="w-full">
            <MapPin className="mr-2" size={18} />
            Create Station
          </Button>
        </form>
      </div>
      
      {/* Confirmation Modal */}
      {showConfirmation && stationToConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Confirm Station Creation</h2>
              <button onClick={() => setShowConfirmation(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <p className="mb-4">Are you sure you want to create the following station?</p>
            
            <div className="bg-graylight p-4 rounded-md mb-4">
              <p><span className="font-medium">Name:</span> {stationToConfirm.name}</p>
              <p><span className="font-medium">Location:</span> {stationToConfirm.location}</p>
              <p><span className="font-medium">Capacity:</span> {stationToConfirm.capacity} bikes</p>
              <p><span className="font-medium">Coordinates:</span> {stationToConfirm.latitude}, {stationToConfirm.longitude}</p>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                Cancel
              </Button>
              <Button onClick={confirmCreate}>
                Confirm Creation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateStation;
