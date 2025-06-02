import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, UserPlus, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Station } from '@/types';

interface StaffFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  station: string;
  role: 'staff' | 'maintenance';
  national_id_number: string;
  national_id_front: FileList | null;
  national_id_back: FileList | null;
  password: string;
}

const RegisterStationStaff = () => {
  const { toast } = useToast();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [staffToConfirm, setStaffToConfirm] = useState<StaffFormData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [backendErrors, setBackendErrors] = useState<Record<string, string>>({});
  const [stationsList, setStationsList] = useState<Station[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(true);
  const [stationsError, setStationsError] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<StaffFormData>({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      station: '',
      role: 'staff',
      national_id_number: '',
      national_id_front: null,
      national_id_back: null,
      password: '',
    },
  });

  const selectedStationId = watch('station');

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

  const onSubmit = (data: StaffFormData) => {
    setStaffToConfirm(data);
    setShowConfirmation(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'national_id_front' | 'national_id_back') => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload an image smaller than 2MB',
          variant: 'destructive',
        });
        e.target.value = ''; // Clear the input
        return;
      }
      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a JPG, JPEG, or PNG image',
          variant: 'destructive',
        });
        e.target.value = ''; // Clear the input
        return;
      }
    }
    setValue(field, fileList, { shouldValidate: true });
  };

  const confirmRegister = async () => {
    if (!staffToConfirm) return;

    try {
      setIsRegistering(true);
      setBackendErrors({});
      const formData = new FormData();

      // Optimize file handling
      if (staffToConfirm.national_id_front instanceof FileList && staffToConfirm.national_id_front.length > 0) {
        const file = staffToConfirm.national_id_front[0];
        // Compress image before upload if it's too large
        if (file.size > 1024 * 1024) { // If larger than 1MB
          const compressedFile = await compressImage(file);
          formData.append('national_id_front', compressedFile);
        } else {
          formData.append('national_id_front', file);
        }
      }

      if (staffToConfirm.national_id_back instanceof FileList && staffToConfirm.national_id_back.length > 0) {
        const file = staffToConfirm.national_id_back[0];
        // Compress image before upload if it's too large
        if (file.size > 1024 * 1024) { // If larger than 1MB
          const compressedFile = await compressImage(file);
          formData.append('national_id_back', compressedFile);
        } else {
          formData.append('national_id_back', file);
        }
      }

      // Add other form data
      formData.append('first_name', staffToConfirm.first_name);
      formData.append('last_name', staffToConfirm.last_name);
      formData.append('email', staffToConfirm.email);
      formData.append('phone', staffToConfirm.phone);
      formData.append('station', staffToConfirm.station);
      formData.append('role', staffToConfirm.role);
      formData.append('national_id_number', staffToConfirm.national_id_number);
      formData.append('password', staffToConfirm.password);

      // Choose endpoint based on role
      const apiUrl = staffToConfirm.role === 'staff' 
        ? 'http://127.0.0.1:8000/api/admin/add_staff'
        : 'http://127.0.0.1:8000/api/admin/add_maintenance';

      // Set a shorter timeout (15 seconds instead of 30)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        setBackendErrors(errorData.errors || {});
        throw new Error(errorData.message || 'Failed to register staff');
      }

      const data = await response.json();
      
      toast({
        title: 'Staff Registered',
        description: `${data.first_name || staffToConfirm.first_name} ${data.last_name || staffToConfirm.last_name} has been successfully registered as a ${data.role || staffToConfirm.role}`,
      });

      setShowConfirmation(false);
      setStaffToConfirm(null);
      reset();

    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast({
          title: 'Request Timeout',
          description: 'The registration request took too long. Please try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to register staff. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsRegistering(false);
    }
  };

  // Add image compression function
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          }, 'image/jpeg', 0.7);
        };
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Register Station Staff</h1>
        <p className="text-muted-foreground dark:text-gray-400">Create accounts for staff and maintenance team members</p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300" htmlFor="first_name">
                First Name
              </label>
              <Input
                id="first_name"
                {...register('first_name', { required: 'First name is required' })}
                placeholder="John"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {errors.first_name && (
                <p className="text-error text-sm mt-1">{errors.first_name.message}</p>
              )}
              {backendErrors.first_name && (
                <p className="text-error text-sm mt-1">{backendErrors.first_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300" htmlFor="last_name">
                Last Name
              </label>
              <Input
                id="last_name"
                {...register('last_name', { required: 'Last name is required' })}
                placeholder="Doe"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {errors.last_name && (
                <p className="text-error text-sm mt-1">{errors.last_name.message}</p>
              )}
              {backendErrors.last_name && (
                <p className="text-error text-sm mt-1">{backendErrors.last_name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300" htmlFor="email">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                placeholder="john@example.com"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {errors.email && (
                <p className="text-error text-sm mt-1">{errors.email.message}</p>
              )}
              {backendErrors.email && (
                <p className="text-error text-sm mt-1">{backendErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300" htmlFor="phone">
                Phone Number
              </label>
              <Input
                id="phone"
                {...register('phone', { required: 'Phone number is required' })}
                placeholder="+251651469920"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {errors.phone && (
                <p className="text-error text-sm mt-1">{errors.phone.message}</p>
              )}
              {backendErrors.phone && (
                <p className="text-error text-sm mt-1">{backendErrors.phone}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300" htmlFor="station">
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
                  <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                    Try Again
                  </Button>
                </div>
              ) : stationsList.length === 0 ? (
                <div className="text-center py-2">
                  <p className="text-gray-500 text-xs">No stations available</p>
                  <Button onClick={() => window.location.reload()} variant="outline" size="sm" className="mt-1">
                    Refresh
                  </Button>
                </div>
              ) : (
                <Select onValueChange={(value) => setValue('station', value)} value={selectedStationId}>
                  <SelectTrigger className={errors.station ? 'border-red-500' : ''}>
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
              <input type="hidden" {...register('station', { required: 'Station selection is required' })} />
              {errors.station && (
                <p className="text-red-500 text-xs mt-1">{errors.station.message}</p>
              )}
              {backendErrors.station && (
                <p className="text-red-500 text-xs mt-1">{backendErrors.station}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300" htmlFor="role">
                Staff Role
              </label>
              <select
                id="role"
                {...register('role', { required: 'Role is required' })}
                className="w-full border border-input p-2 rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="staff">Regular Staff</option>
                <option value="maintenance">Maintenance Team</option>
              </select>
              {errors.role && (
                <p className="text-error text-sm mt-1">{errors.role.message}</p>
              )}
              {backendErrors.role && (
                <p className="text-error text-sm mt-1">{backendErrors.role}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300" htmlFor="national_id_number">
                National ID Number
              </label>
              <Input
                id="national_id_number"
                {...register('national_id_number', {
                  required: 'National ID number is required',
                  minLength: {
                    value: 12,
                    message: 'National ID number must be 12 characters',
                  },
                  maxLength: {
                    value: 12,
                    message: 'National ID number must be 12 characters',
                  },
                })}
                placeholder="123456789012"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {errors.national_id_number && (
                <p className="text-error text-sm mt-1">{errors.national_id_number.message}</p>
              )}
              {backendErrors.national_id_number && (
                <p className="text-error text-sm mt-1">{backendErrors.national_id_number}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                  })}
                  placeholder="Enter password"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-error text-sm mt-1">{errors.password.message}</p>
              )}
              {backendErrors.password && (
                <p className="text-error text-sm mt-1">{backendErrors.password}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300" htmlFor="national_id_front">
                National ID Front
              </label>
              <Input
                id="national_id_front"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'national_id_front')}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {errors.national_id_front && (
                <p className="text-error text-sm mt-1">{errors.national_id_front.message}</p>
              )}
              {backendErrors.national_id_front && (
                <p className="text-error text-sm mt-1">{backendErrors.national_id_front}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300" htmlFor="national_id_back">
                National ID Back
              </label>
              <Input
                id="national_id_back"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'national_id_back')}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {errors.national_id_back && (
                <p className="text-error text-sm mt-1">{errors.national_id_back.message}</p>
              )}
              {backendErrors.national_id_back && (
                <p className="text-error text-sm mt-1">{backendErrors.national_id_back}</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isRegistering}>
            {isRegistering ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Registering...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Register Staff
              </>
            )}
          </Button>
        </form>
      </div>

      {showConfirmation && staffToConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white">Confirm Registration</h2>
              <Button
                variant="ghost"
                onClick={() => setShowConfirmation(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
              >
                <X size={20} />
              </Button>
            </div>

            <p className="mb-4 dark:text-gray-300">Are you sure you want to register the following staff member?</p>

            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md mb-4">
              <p className="dark:text-white"><span className="font-medium">Name:</span> {staffToConfirm.first_name} {staffToConfirm.last_name}</p>
              <p className="dark:text-white"><span className="font-medium">Email:</span> {staffToConfirm.email}</p>
              <p className="dark:text-white"><span className="font-medium">Phone:</span> {staffToConfirm.phone}</p>
              <p className="dark:text-white">
                <span className="font-medium">Station:</span> {
                  stationsList.find(s => s.id === staffToConfirm.station)?.name || 'Unknown Station'
                }
              </p>
              <p className="dark:text-white"><span className="font-medium">Role:</span> {staffToConfirm.role}</p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowConfirmation(false)} disabled={isRegistering}>
                Cancel
              </Button>
              <Button onClick={confirmRegister} disabled={isRegistering}>
                {isRegistering ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Registering...
                  </>
                ) : (
                  'Confirm Registration'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterStationStaff;