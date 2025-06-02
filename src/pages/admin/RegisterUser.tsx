import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { UserRole, Station } from '@/types';
import { UserPlus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserFormData {
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  password: string;
  phone: string;
  status: string;
  station_id: string;
  national_id_number: string;
  national_id_front: File | null;  
  national_id_back: File | null;
}

const RegisterUser = () => {
  const { toast } = useToast();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [userToConfirm, setUserToConfirm] = useState<UserFormData | null>(null);
  const [stationsList, setStationsList] = useState<Station[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(true);
  const [stationsError, setStationsError] = useState<string>('');
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm<UserFormData>({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      role: 'admin',
      password: '',
      phone: '',
      status: 'verified',
      station_id: '',
      national_id_number: '',
      national_id_front: null,
      national_id_back: null
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
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
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
  
  const onSubmit = (data: UserFormData) => {
    console.log('📝 Form submitted with data:', data);
    setUserToConfirm(data);
    setShowConfirmation(true);
  };
  
  const confirmRegister = async () => {
    if (!userToConfirm) return;

    try {
      const formData = new FormData();
      formData.append('first_name', userToConfirm.first_name);
      formData.append('last_name', userToConfirm.last_name);
      formData.append('email', userToConfirm.email);
      formData.append('role', userToConfirm.role);
      formData.append('password', userToConfirm.password);
      formData.append('phone', userToConfirm.phone);
      formData.append('status', userToConfirm.status);
      formData.append('station_id', userToConfirm.station_id);
      formData.append('national_id_number', userToConfirm.national_id_number);
      
      if (userToConfirm.national_id_front) {
        formData.append('national_id_front', userToConfirm.national_id_front);
      }
      if (userToConfirm.national_id_back) {
        formData.append('national_id_back', userToConfirm.national_id_back);
      }

      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/superadmin/add_station_admins', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = 'Failed to register user';
        try {
          const errorData = await response.json();
          if (errorData && (errorData.message || errorData.error)) {
            errorMsg = errorData.message || errorData.error;
          }
        } catch {
          errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      const responseData = await response.json();
      console.log('✅ User registered successfully:', responseData);

      toast({
        title: 'Admin Registered Successfully',
        description: `${responseData.first_name || userToConfirm.first_name} has been registered as ${responseData.role || userToConfirm.role}`,
      });

      setShowConfirmation(false);
      setUserToConfirm(null);
      reset();
    } catch (error: any) {
      console.error('❌ Error registering user:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to register user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'national_id_front' | 'national_id_back') => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      setValue(field, file, { shouldValidate: true });
    }
  };

  const retryFetchStations = () => {
    window.location.reload(); // Simple retry by reloading the component
  };
  
  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Register New Admin</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Create accounts for station administrators</p>
      </div>
      
      <Card className="shadow">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4" />
            Admin Registration Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              {/* Personal Information */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Personal Information</h3>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="first_name" className="text-sm">First Name</Label>
                    <Input
                      id="first_name"
                      {...register('first_name', { required: 'First name is required' })}
                      placeholder="John"
                      className={errors.first_name ? 'border-red-500' : ''}
                    />
                    {errors.first_name && (
                      <p className="text-red-500 text-xs">{errors.first_name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="last_name" className="text-sm">Last Name</Label>
                    <Input
                      id="last_name"
                      {...register('last_name', { required: 'Last name is required' })}
                      placeholder="Doe"
                      className={errors.last_name ? 'border-red-500' : ''}
                    />
                    {errors.last_name && (
                      <p className="text-red-500 text-xs">{errors.last_name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      placeholder="john@example.com"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register('phone', {
                        required: 'Phone number is required',
                        pattern: {
                          value: /^[0-9]{10,15}$/,
                          message: 'Invalid phone number (10-15 digits)'
                        }
                      })}
                      placeholder="1234567890"
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs">{errors.phone.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Station & Account */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Station & Account</h3>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="station_id" className="text-sm">Assign Station</Label>
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
                      <p className="text-red-500 text-xs">{errors.station_id.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-sm">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters'
                        }
                      })}
                      placeholder="Enter secure password"
                      className={errors.password ? 'border-red-500' : ''}
                    />
                    {errors.password && (
                      <p className="text-red-500 text-xs">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="national_id_number" className="text-sm">National ID Number</Label>
                    <Input
                      id="national_id_number"
                      {...register('national_id_number', {
                        required: 'National ID Number is required',
                        minLength: {
                          value: 12,
                          message: 'National ID Number must be 12 characters'
                        },
                        maxLength: {
                          value: 12,
                          message: 'National ID Number must be 12 characters'
                        }
                      })}
                      placeholder="123456789012"
                      maxLength={12}
                      className={errors.national_id_number ? 'border-red-500' : ''}
                    />
                    {errors.national_id_number && (
                      <p className="text-red-500 text-xs">{errors.national_id_number.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Document Upload */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Document Upload</h3>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="national_id_front" className="text-sm">National ID (Front)</Label>
                    <Input
                      id="national_id_front"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'national_id_front')}
                      className={errors.national_id_front ? 'border-red-500' : ''}
                    />
                    {errors.national_id_front && (
                      <p className="text-red-500 text-xs">{errors.national_id_front.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="national_id_back" className="text-sm">National ID (Back)</Label>
                    <Input
                      id="national_id_back"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'national_id_back')}
                      className={errors.national_id_back ? 'border-red-500' : ''}
                    />
                    {errors.national_id_back && (
                      <p className="text-red-500 text-xs">{errors.national_id_back.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              size="sm"
              disabled={isSubmitting || isLoadingStations}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Registering...' : 'Register Admin'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Confirmation Modal */}
      {showConfirmation && userToConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Confirm Registration</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowConfirmation(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please confirm the registration details:
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg space-y-1 text-sm">
                <p><span className="font-medium">Name:</span> {userToConfirm.first_name} {userToConfirm.last_name}</p>
                <p><span className="font-medium">Email:</span> {userToConfirm.email}</p>
                <p><span className="font-medium">Phone:</span> {userToConfirm.phone}</p>
                <p><span className="font-medium">Station:</span> {(() => {
                  const selectedStation = stationsList.find((s) => String(s.id) === String(userToConfirm.station_id));
                  return selectedStation ? selectedStation.name : 'Unknown Station';
                })()}</p>
                <p><span className="font-medium">Role:</span> {userToConfirm.role}</p>
                <p><span className="font-medium">National ID:</span> {userToConfirm.national_id_number}</p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowConfirmation(false)}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={confirmRegister}
                >
                  Confirm Registration
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RegisterUser;
