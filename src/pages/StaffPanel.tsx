import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getUserById } from '@/data/mockData';
import { Bike as BikeIcon, MapPin, Search, Wrench, Car } from 'lucide-react';
import StationMap, { StationMapLocation } from '@/components/StationMap';
import { endTrip } from "@/api/staff";

const StaffPanel = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [stations, setStations] = useState<any[]>([]);
  const [bikes, setBikes] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);

  const [reservationCode, setReservationCode] = useState('');
  const [endTripCode, setEndTripCode] = useState('');
  const [bikeDetails, setBikeDetails] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEndingTrip, setIsEndingTrip] = useState(false);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [endTripError, setEndTripError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/stations', {
      credentials: 'include',
      headers: { 'Accept': 'application/json' },
    })
      .then(async res => {
        if (!res.ok) return;
        try {
          const data = await res.json();
          const stationsArr = Array.isArray(data) ? data : data.stations || [];
          setStations(stationsArr);
          if (stationsArr.length > 0) setSelectedStation(stationsArr[0]);
        } catch {
          setStations([]);
        }
      });
  }, []);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/bikes', {
      credentials: 'include',
      headers: { 'Accept': 'application/json' },
    })
      .then(async res => {
        if (!res.ok) return;
        try {
          const data = await res.json();
          const bikesArr = Array.isArray(data) ? data : data.bikes || [];
          setBikes(bikesArr);
        } catch {
          setBikes([]);
        }
      });
  }, []);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/reservations', {
      credentials: 'include',
      headers: { 'Accept': 'application/json' },
    })
      .then(async res => {
        if (!res.ok) return;
        try {
          const data = await res.json();
          const reservationsArr = Array.isArray(data) ? data : data.reservations || [];
          setReservations(reservationsArr);
        } catch {
          setReservations([]);
        }
      });
  }, []);

  // Fetch active bikes from backend API
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/bikes/1/available', {
      credentials: 'include',
      headers: { 'Accept': 'application/json' },
    })
      .then(async res => {
        if (!res.ok) return;
        try {
          const data = await res.json();
          // Expecting an array of bikes with latitude/longitude and status === 'in-use'
          if (Array.isArray(data)) {
            // Merge with bikes state if needed, or use separately for map
            // Example: setActiveBikes(data);
            // For now, just log for debugging:
            console.log('Active bikes from API:', data);
          }
        } catch {
          // Ignore parse errors
        }
      });
  }, []);

  const stationBikes = bikes.filter(bike => bike.station_id === selectedStation?.id);
  const filteredBikes = stationBikes.filter(bike => 
    bike.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
    bike.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleVerifyCode = async () => {
    if (!reservationCode.trim()) {
      setErrorMessage('Please enter a reservation code');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    // Always use the latest code from the input, not from bikeDetails or previous state
    const codeToCheck = reservationCode.trim().toUpperCase().startsWith('TRK-')
      ? reservationCode.trim().toUpperCase()
      : `TRK-${reservationCode.trim().toUpperCase()}`;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('No authentication token found. Please log in again.');
        toast({
          title: 'Unauthorized',
          description: 'No authentication token found. Please log in again.',
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }

      // Always build the body with the current codeToCheck
      const payload = {
        tracking_code: codeToCheck,
      };

      // Debug: log payload before sending
      console.log('Sending payload:', payload);

      const res = await fetch('http://127.0.0.1:8000/api/staff/verify-trip', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        setErrorMessage('Unauthorized. Please log in again.');
        toast({
          title: 'Unauthorized',
          description: 'You are not authorized. Please log in again.',
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'Verification Failed',
          description: data?.message || 'Invalid code',
          variant: 'destructive',
        });
        setErrorMessage(data?.message || 'Invalid code. Please check and try again.');
      } else {
        toast({
          title: 'Verification Success',
          description: typeof data === 'string' ? data : (data?.message || 'Trip verified successfully'),
          variant: 'default',
        });
      }
    } catch (error) {
      setErrorMessage('Network error. Please try again.');
      toast({
        title: 'Verification Failed',
        description: 'Network error',
        variant: 'destructive',
      });
    }

    setIsProcessing(false);
  };
  
  const handleStartRide = () => {
    toast({
      title: 'Trip Started',
      description: `${bikeDetails.userName} has started a trip on ${bikeDetails.model}`,
      variant: 'default',
    });
    
    setBikeDetails(null);
    setReservationCode('');
  };

  const handleEndTrip = async () => {
    if (!endTripCode.trim()) {
      setEndTripError('Please enter a trip code');
      return;
    }

    setIsEndingTrip(true);
    setEndTripError('');

    const codeToCheck = endTripCode.trim().toUpperCase().startsWith('TRK-')
      ? endTripCode.trim().toUpperCase()
      : `TRK-${endTripCode.trim().toUpperCase()}`;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setEndTripError('No authentication token found. Please log in again.');
        toast({
          title: 'Unauthorized',
          description: 'No authentication token found. Please log in again.',
          variant: 'destructive',
        });
        setIsEndingTrip(false);
        return;
      }

      const payload = {
        tracking_code: codeToCheck,
      };

      // Debug: log payload before sending
      console.log('Sending end-trip payload:', payload);

      const res = await fetch('http://127.0.0.1:8000/api/staff/end-trip', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        setEndTripError('Unauthorized. Please log in again.');
        toast({
          title: 'Unauthorized',
          description: 'You are not authorized. Please log in again.',
          variant: 'destructive',
        });
        setIsEndingTrip(false);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'End Trip Failed',
          description: data?.message || 'Invalid code or trip not active',
          variant: 'destructive',
        });
        setEndTripError(data?.message || 'Invalid code or trip not active. Please check and try again.');
      } else {
        const tripId = data?.trip?.id || data?.id;
        toast({
          title: 'Trip Ended Successfully',
          description: `Trip ID: ${tripId} - ${typeof data === 'string' ? data : (data?.message || 'Trip ended successfully')}`,
          variant: 'default',
        });
        // Poll trip status
        if (tripId) {
          let isPolling = true;
          const checkTripStatus = async () => {
            if (!isPolling) return;
            try {
              const response = await fetch(`http://127.0.0.1:8000/api/check_payment_status/${tripId}`, {
                credentials: 'include',
                headers: { 'Accept': 'application/json' },
              });
              if (response.ok) {
                const tripData = await response.json();
                console.log('Payment status response:', tripData);
                if (tripData.status === 'completed') {
                  isPolling = false;
                  toast({
                    title: 'Trip Completed',
                    description: JSON.stringify(tripData, null, 2),
                    variant: 'default',
                  });
                  return;
                } else if (tripData.status === 'failed') {
                  isPolling = false;
                  toast({
                    title: 'Trip Failed',
                    description: JSON.stringify(tripData, null, 2),
                    variant: 'destructive',
                  });
                  return;
                }
              }
              if (isPolling) {
                setTimeout(checkTripStatus, 5000);
              }
            } catch (error) {
              console.error('Error checking trip status:', error);
              if (isPolling) {
                setTimeout(checkTripStatus, 5000);
              }
            }
          };
          checkTripStatus();
        }
        setEndTripCode('');
      }
    } catch (error) {
      setEndTripError('Network error. Please try again.');
      toast({
        title: 'End Trip Failed',
        description: 'Network error',
        variant: 'destructive',
      });
    }

    setIsEndingTrip(false);
  };
  
  // Defensive: only map stations with valid coordinates
  // Add active bikes as map pins
  const activeBikeLocations: StationMapLocation[] = bikes
    .filter(bike => bike.status === 'in-use' && bike.latitude && bike.longitude)
    .map(bike => ({
      id: bike.id,
      name: `Bike ${bike.id} (${bike.model})`,
      location: {
        latitude: bike.latitude,
        longitude: bike.longitude,
      }
    }));

  const stationLocations: StationMapLocation[] = stations
    .filter(station => station.coordinates && typeof station.coordinates.lat === 'number' && typeof station.coordinates.lng === 'number')
    .map(station => ({
      id: station.id,
      name: station.name,
      location: {
        latitude: station.coordinates.lat,
        longitude: station.coordinates.lng
      }
    }));

  // Combine stations and active bikes for the map
  const mapLocations: StationMapLocation[] = [
    ...stationLocations,
    ...activeBikeLocations
  ];

  const selectedStationId = selectedStation?.id;
  
  const handleStationSelect = (stationId: string) => {
    const station = stations.find(s => s.id === stationId);
    if (station) {
      setSelectedStation(station);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Staff Control Panel</h1>
        <div className="text-sm text-graydark">Today: {new Date().toLocaleDateString()}</div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800 dark:text-white">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <BikeIcon className="mr-2 text-blueprimary" size={20} />
            Start Trip
          </h2>
          
          {!bikeDetails ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="reservation-code" className="block text-sm font-medium mb-1 text-graydark dark:text-gray-300">
                  Enter Trip Code
                </label>
                <div className="flex gap-2">
                  <Input
                    id="reservation-code"
                    value={reservationCode}
                    onChange={(e) => setReservationCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit code"
                    className="uppercase"
                    maxLength={6}
                  />
                  <Button 
                    onClick={handleVerifyCode} 
                    disabled={isProcessing}
                    className="whitespace-nowrap bg-greenprimary hover:bg-greenprimary/90"
                  >
                    {isProcessing ? 'Verifying...' : 'Verify Code'}
                  </Button>
                </div>
                {errorMessage && <p className="mt-2 text-sm text-error">{errorMessage}</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-4 bg-graylight p-4 rounded-lg animate-fade-in dark:bg-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Bike Details</h3>
                <Button variant="outline" size="sm" onClick={() => setBikeDetails(null)}>
                  Reset
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">ID</p>
                  <p className="font-medium">{bikeDetails.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Model</p>
                  <p className="font-medium">{bikeDetails.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                  <p className="font-medium capitalize">{bikeDetails.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <p className="font-medium capitalize">{bikeDetails.status.replace('-', ' ')}</p>
                </div>
              </div>
              
              <div className="pt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">User</p>
                <p className="font-medium">{bikeDetails.userName} (ID: {bikeDetails.userId})</p>
              </div>
              
              <div className="pt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Trip Code</p>
                <p className="font-medium">
                  {bikeDetails.reservation.code}
                </p>
              </div>
              
              <div className="pt-3">
                <Button 
                  onClick={handleStartRide} 
                  className="w-full bg-tealsecondary hover:bg-tealsecondary/90"
                >
                  Start Trip
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800 dark:text-white">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <BikeIcon className="mr-2 text-blueprimary" size={20} />
            End Trip
          </h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="end-trip-code" className="block text-sm font-medium mb-1 text-graydark dark:text-gray-300">
                Enter Trip Code
              </label>
              <div className="flex gap-2">
                <Input
                  id="end-trip-code"
                  value={endTripCode}
                  onChange={(e) => setEndTripCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit code"
                  className="uppercase"
                  maxLength={6}
                />
                <Button 
                  onClick={handleEndTrip} 
                  disabled={isEndingTrip}
                  className="whitespace-nowrap bg-greenprimary hover:bg-greenprimary/90"
                >
                  {isEndingTrip ? 'Processing...' : 'End Trip'}
                </Button>
              </div>
              {endTripError && <p className="mt-2 text-sm text-error">{endTripError}</p>}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-medium mb-2">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-graylight p-3 rounded-lg hover:bg-graylight/80 cursor-pointer transition-colors dark:bg-gray-700 dark:hover:bg-gray-600"
                    onClick={() => navigate('/reservations')}>
                  <h4 className="font-medium text-sm">Reservations</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">View all active reservations</p>
                </div>
                
                <div className="bg-graylight p-3 rounded-lg hover:bg-graylight/80 cursor-pointer transition-colors dark:bg-gray-700 dark:hover:bg-gray-600"
                    onClick={() => navigate('/active-rides')}>
                  <h4 className="font-medium text-sm">Active Trips</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">View ongoing rides</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800 dark:text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Active Bikes by Station</h2>
          
          <div className="flex items-center">
            <MapPin size={18} className="mr-1 text-graydark dark:text-gray-300" />
            <select
              value={selectedStation?.id}
              onChange={(e) => setSelectedStation(stations.find(s => s.id === e.target.value) || stations[0])}
              className="border rounded p-1 text-sm focus:outline-none focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            >
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name} ({station.availableBikes} bikes)
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-[500px] bg-graylight rounded-lg overflow-hidden dark:bg-gray-700">
            <StationMap 
              stations={mapLocations} 
              selectedStation={selectedStationId} 
              onStationSelect={handleStationSelect} 
            />
          </div>

          <div className="lg:col-span-1 max-h-[500px] overflow-y-auto pr-2">
            <div className="flex items-center gap-2 mb-3">
              <Search size={16} />
              <Input 
                placeholder="Search bikes..." 
                className="text-sm" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {filteredBikes.length > 0 ? (
              <ul className="space-y-2">
                {filteredBikes.map((bike) => (
                  <li key={bike.id} className="p-3 bg-graylight rounded-md hover:bg-graylight/80 cursor-pointer dark:bg-gray-700 dark:hover:bg-gray-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{bike.model}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">ID: {bike.id}</p>
                      </div>
                      {bike.category === 'scooter' ? (
                        <Car className="text-graydark dark:text-gray-300" size={20} />
                      ) : (
                        <BikeIcon className="text-graydark dark:text-gray-300" size={20} />
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs">{bike.category}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${bike.status === 'available' ? 'bg-greenprimary/20 text-greenprimary dark:bg-greenprimary/40 dark:text-white' : 
                          bike.status === 'in-use' ? 'bg-greenaccent/30 text-graydark dark:bg-greenaccent/50 dark:text-white' : 
                          'bg-error/20 text-error dark:bg-error/50 dark:text-white'}`}
                      >
                        {bike.status.replace('-', ' ')}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No bikes found for your search
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffPanel;
