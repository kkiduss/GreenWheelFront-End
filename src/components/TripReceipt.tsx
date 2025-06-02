import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface TripSummary {
  bike_number: string;
  start_time: string;
  end_time: string;
  duration: number;
  price: string | number | null;
  start_staff_name: string | null;
}

interface TripData {
  id: string;
  tracking_code: string;
  duration: number;
  price: string | number | null;
  status: string;
  bike?: {
    model: string;
    bike_number: string;
  };
  start_time?: string;
  end_time?: string;
  user?: {
    name: string;
    email: string;
  };
  summary?: TripSummary;
}

interface TripReceiptProps {
  tripId: string;
  onClose?: () => void;
}

const TripReceipt = ({ tripId, onClose }: TripReceiptProps) => {
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTripData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`http://127.0.0.1:8000/api/check_payment_status/${tripId}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch trip data');
        }

        const data = await response.json();
        setTripData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trip data');
        toast({
          title: 'Error',
          description: 'Failed to load trip details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (tripId) {
      fetchTripData();
    }
  }, [tripId, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blueprimary" />
      </div>
    );
  }

  if (error || !tripData) {
    return (
      <div className="p-6 text-center">
        <p className="text-error">{error || 'No trip data available'}</p>
        {onClose && (
          <Button 
            variant="outline" 
            onClick={onClose}
            className="mt-4"
          >
            Close
          </Button>
        )}
      </div>
    );
  }

  const formatPrice = (price: string | number | null | undefined): string => {
    if (price === null || price === undefined) return 'N/A';
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numericPrice)) return 'N/A';
    return `$${numericPrice.toFixed(2)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const formatDuration = (minutes: number | null | undefined): string => {
    if (minutes === null || minutes === undefined) return 'N/A';
    if (minutes < 1) {
      const seconds = Math.round(minutes * 60);
      return `${seconds} seconds`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours === 0) {
      return `${remainingMinutes}m`;
    }
    return `${hours}h ${remainingMinutes}m`;
  };

  const displayData: Partial<TripSummary & TripData> = tripData?.summary || tripData;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto dark:bg-gray-800">
      {/* Receipt Header */}
      <div className="text-center border-b border-gray-200 pb-4 mb-4 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">GreenWheels</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Trip Receipt</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Trip Details */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-600 dark:text-gray-400">Trip ID:</div>
          <div className="font-medium text-right">{tripData?.id || 'N/A'}</div>
          
          <div className="text-gray-600 dark:text-gray-400">Tracking Code:</div>
          <div className="font-medium text-right">{tripData?.tracking_code || 'N/A'}</div>
          
          <div className="text-gray-600 dark:text-gray-400">Start Time:</div>
          <div className="font-medium text-right">{formatDate(displayData?.start_time)}</div>
          
          <div className="text-gray-600 dark:text-gray-400">End Time:</div>
          <div className="font-medium text-right">{formatDate(displayData?.end_time)}</div>
          
          <div className="text-gray-600 dark:text-gray-400">Duration:</div>
          <div className="font-medium text-right">{formatDuration(displayData?.duration)}</div>
          
          <div className="text-gray-600 dark:text-gray-400">Bike Number:</div>
          <div className="font-medium text-right">{displayData?.bike_number || tripData?.bike?.bike_number || 'N/A'}</div>
          
          {tripData?.bike?.model && (
            <>
              <div className="text-gray-600 dark:text-gray-400">Bike Model:</div>
              <div className="font-medium text-right">{tripData.bike.model}</div>
            </>
          )}
        </div>

        {/* User Details */}
        {tripData?.user && (
          <div className="border-t border-gray-200 pt-4 mt-4 dark:border-gray-700">
            <h3 className="font-medium mb-2 text-gray-900 dark:text-white">User Details</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-600 dark:text-gray-400">Name:</div>
              <div className="font-medium text-right">{tripData.user.name || 'N/A'}</div>
              
              <div className="text-gray-600 dark:text-gray-400">Email:</div>
              <div className="font-medium text-right">{tripData.user.email || 'N/A'}</div>
            </div>
          </div>
        )}

        {/* Staff Details */}
        {displayData?.start_staff_name && (
          <div className="border-t border-gray-200 pt-4 mt-4 dark:border-gray-700">
            <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Staff Details</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-600 dark:text-gray-400">Staff Name:</div>
              <div className="font-medium text-right">{displayData.start_staff_name}</div>
            </div>
          </div>
        )}

        {/* Price Summary */}
        <div className="border-t border-gray-200 pt-4 mt-4 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount:</span>
            <span className="text-lg font-bold text-greenprimary">
              {formatPrice(displayData?.price)}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="text-center mt-4">
          <span className={`px-4 py-2 rounded-full text-sm font-semibold
            ${tripData?.status === 'completed' ? 'bg-greenprimary/20 text-greenprimary dark:bg-greenprimary/40 dark:text-white' :
              tripData?.status === 'in-progress' ? 'bg-blueprimary/20 text-blueprimary dark:bg-blueprimary/40 dark:text-white' :
              'bg-error/20 text-error dark:bg-error/40 dark:text-white'}`}
          >
            {(tripData?.status || 'UNKNOWN').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 text-center dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Thank you for choosing GreenWheels!
        </p>
        {onClose && (
          <Button 
            variant="outline" 
            onClick={onClose}
            className="mt-4"
          >
            Close Receipt
          </Button>
        )}
      </div>
    </div>
  );
};

export default TripReceipt; 