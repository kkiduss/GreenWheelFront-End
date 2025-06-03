import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getUserById } from '@/data/mockData';
import { Bike as BikeIcon } from 'lucide-react';
import { endTrip } from "@/api/staff";
import TripReceiptStaff from '@/components/TripReceiptStaff';
import SummaryDialog from '@/components/SummaryDialog';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

const StaffPanel = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [reservations, setReservations] = useState<any[]>([]);
  const [reservationCode, setReservationCode] = useState('');
  const [endTripCode, setEndTripCode] = useState('');
  const [bikeDetails, setBikeDetails] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEndingTrip, setIsEndingTrip] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [endTripError, setEndTripError] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<any>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);

  useEffect(() => {
    fetch('https://www.green-wheels.pro.et/api/reservations', {
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

      const res = await fetch('https://www.green-wheels.pro.et/api/staff/verify-trip', {
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

      const res = await fetch('https://www.green-wheels.pro.et/api/staff/end-trip', {
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
        setIsEndingTrip(false);
        return;
      }

      const tripId = data?.trip?.id || data?.id;
      toast({
        title: 'Trip Ended Successfully',
        description: `Trip ID: ${tripId} - ${typeof data === 'string' ? data : (data?.message || 'Trip ended successfully')}`,
        variant: 'default',
      });

      // Poll for payment ID
      let isPollingPaymentId = true;
      let paymentId = null;
      let pollCount = 0;
      const maxPolls = 12; // 1 minute maximum (5 seconds * 12)

      const checkPaymentId = async () => {
        if (!isPollingPaymentId || pollCount >= maxPolls) return;
        
        try {
          const paymentIdRes = await fetch(`https://www.green-wheels.pro.et/api/staff/trip/get-payment-id/${tripId}`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });

          if (paymentIdRes.ok) {
            const paymentIdData = await paymentIdRes.json();
            if (paymentIdData.payment_id) {
              paymentId = paymentIdData.payment_id;
              isPollingPaymentId = false;

              // Get payment method using the payment ID
              const paymentMethodRes = await fetch(`https://www.green-wheels.pro.et/api/staff/trip/${paymentId}/payment-method`, {
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (!paymentMethodRes.ok) {
                toast({
                  title: 'Error',
                  description: 'Failed to get payment method',
                  variant: 'destructive',
                });
                setIsEndingTrip(false);
                return;
              }

              const paymentMethodData = await paymentMethodRes.json();
              const paymentMethod = paymentMethodData.payment_method;

              if (paymentMethod === 'cash') {
                // Get trip details for summary
                const tripDetailsRes = await fetch(`https://www.green-wheels.pro.et/api/staff/trip/get-payment-id/${tripId}`, {
                  credentials: 'include',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                });

                if (!tripDetailsRes.ok) {
                  toast({
                    title: 'Error',
                    description: 'Failed to get trip details',
                    variant: 'destructive',
                  });
                  setIsEndingTrip(false);
                  return;
                }

                const tripDetails = await tripDetailsRes.json();

                // Show summary dialog for cash payment
                const summaryItems = [
                  { label: 'Trip ID', value: tripDetails.trip_id, type: 'string' },
                  { label: 'Tracking Code', value: tripDetails.tracking_code, type: 'string' },
                  { label: 'Bike Number', value: tripDetails.bike_number || 'N/A', type: 'string' },
                  { label: 'User', value: `${tripDetails.first_name} ${tripDetails.last_name}`, type: 'string' },
                  { label: 'Email', value: tripDetails.email || 'N/A', type: 'string' },
                  { label: 'Start Time', value: tripDetails.start_time, type: 'string' },
                  { label: 'End Time', value: tripDetails.end_time, type: 'string' },
                  { label: 'Duration', value: tripDetails.duration, type: 'string' },
                  { label: 'Amount', value: tripDetails.price, type: 'number' }
                ];

                setSummaryData({
                  title: 'Cash Payment Summary',
                  description: 'Please confirm the trip details and collect cash payment',
                  summary: summaryItems,
                  type: 'success',
                  confirmText: 'Confirm Payment',
                  onConfirm: async () => {
                    try {
                      // Confirm cash payment
                      const confirmRes = await fetch(`https://www.green-wheels.pro.et/api/staff/confirm_cash_payment/${paymentId}`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                          'Content-Type': 'application/json',
                          'Accept': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                      });

                      if (!confirmRes.ok) {
                        toast({
                          title: 'Error',
                          description: 'Failed to confirm cash payment',
                          variant: 'destructive',
                        });
                        return;
                      }

                      // Show success message
                      toast({
                        title: 'Payment Confirmed',
                        description: 'Cash payment has been confirmed successfully',
                        variant: 'default',
                      });

                      // Set trip details for receipt
                      setCurrentTrip({
                        id: tripDetails.trip_id,
                        tracking_code: tripDetails.tracking_code,
                        bike_number: tripDetails.bike_number || 'N/A',
                        user_name: `${tripDetails.first_name} ${tripDetails.last_name}`,
                        start_time: tripDetails.start_time,
                        end_time: tripDetails.end_time,
                        duration: tripDetails.duration,
                        price: tripDetails.price,
                        status: 'completed',
                        payment_type: 'Cash'
                      });

                      // Show receipt and cleanup
                      setShowReceipt(true);
                      setShowSummary(false);
                      setEndTripCode('');
                      setIsEndingTrip(false);
                    } catch (error) {
                      console.error('Error confirming cash payment:', error);
                      toast({
                        title: 'Error',
                        description: 'Failed to confirm cash payment',
                        variant: 'destructive',
                      });
                    }
                  }
                });
                setShowSummary(true);
              } else if (paymentMethod === 'chapa') {
                // For Chapa payments, check payment status first
                const statusRes = await fetch(`https://www.green-wheels.pro.et/api/check_payment_status/${tripId}`, {
                  credentials: 'include',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                });

                if (!statusRes.ok) {
                  toast({
                    title: 'Error',
                    description: 'Failed to check payment status',
                    variant: 'destructive',
                  });
                  setIsEndingTrip(false);
                  return;
                }

                const statusData = await statusRes.json();
                console.log('Initial payment status:', statusData); // Debug log
                
                if (statusData.status === 'completed') {
                  // Get trip details for receipt
                  const tripDetailsRes = await fetch(`https://www.green-wheels.pro.et/api/staff/trip/get-payment-id/${tripId}`, {
                    credentials: 'include',
                    headers: {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json',
                      'Authorization': `Bearer ${token}`,
                    },
                  });

                  if (!tripDetailsRes.ok) {
                    toast({
                      title: 'Error',
                      description: 'Failed to get trip details',
                      variant: 'destructive',
                    });
                    setIsEndingTrip(false);
                    return;
                  }

                  const tripDetails = await tripDetailsRes.json();

                  const formattedTrip = {
                    id: tripDetails.trip_id,
                    tracking_code: tripDetails.tracking_code,
                    bike_number: tripDetails.bike_number || 'N/A',
                    user_name: `${tripDetails.first_name} ${tripDetails.last_name}`,
                    start_time: tripDetails.start_time,
                    end_time: tripDetails.end_time,
                    duration: tripDetails.duration,
                    price: tripDetails.price,
                    status: 'completed',
                    payment_type: 'Chapa'
                  };
                  setCurrentTrip(formattedTrip);
                  setShowReceipt(true);
                  setEndTripCode('');
                  setIsEndingTrip(false);
                } else if (statusData.status === 'payment_pending') {
                  toast({
                    title: 'Payment Pending',
                    description: 'Waiting for payment confirmation...',
                    variant: 'default',
                  });
                  
                  // Start polling for payment status
                  let isPollingStatus = true;
                  let pollCount = 0;
                  const maxPolls = 24; // 2 minutes maximum (5 seconds * 24)

                  const checkPaymentStatus = async () => {
                    if (!isPollingStatus || pollCount >= maxPolls) {
                      if (pollCount >= maxPolls) {
                        toast({
                          title: 'Timeout',
                          description: 'Payment confirmation timed out. Please check payment status manually.',
                          variant: 'destructive',
                        });
                        setIsEndingTrip(false);
                      }
                      return;
                    }

                    try {
                      const response = await fetch(`https://www.green-wheels.pro.et/api/check_payment_status/${tripId}`, {
                        credentials: 'include',
                        headers: {
                          'Content-Type': 'application/json',
                          'Accept': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                      });

                      if (response.ok) {
                        const paymentData = await response.json();
                        console.log('Payment status check:', paymentData); // Debug log
                        
                        if (paymentData.status === 'completed') {
                          isPollingStatus = false;
                          // Get trip details for receipt
                          const tripDetailsRes = await fetch(`https://www.green-wheels.pro.et/api/staff/trip/get-payment-id/${tripId}`, {
                            credentials: 'include',
                            headers: {
                              'Content-Type': 'application/json',
                              'Accept': 'application/json',
                              'Authorization': `Bearer ${token}`,
                            },
                          });

                          if (!tripDetailsRes.ok) {
                            toast({
                              title: 'Error',
                              description: 'Failed to get trip details',
                              variant: 'destructive',
                            });
                            setIsEndingTrip(false);
                            return;
                          }

                          const tripDetails = await tripDetailsRes.json();

                          const formattedTrip = {
                            id: tripDetails.trip_id,
                            tracking_code: tripDetails.tracking_code,
                            bike_number: tripDetails.bike_number || 'N/A',
                            user_name: `${tripDetails.first_name} ${tripDetails.last_name}`,
                            start_time: tripDetails.start_time,
                            end_time: tripDetails.end_time,
                            duration: tripDetails.duration,
                            price: tripDetails.price,
                            status: 'completed',
                            payment_type: 'Chapa'
                          };
                          setCurrentTrip(formattedTrip);
                          setShowReceipt(true);
                          setEndTripCode('');
                          setIsEndingTrip(false);
                        } else if (paymentData.status === 'payment_pending') {
                          pollCount++;
                          if (isPollingStatus) {
                            setTimeout(checkPaymentStatus, 5000);
                          }
                        } else if (paymentData.status === 'failed') {
                          isPollingStatus = false;
                          toast({
                            title: 'Payment Failed',
                            description: 'Payment processing failed. Please try again.',
                            variant: 'destructive',
                          });
                          setIsEndingTrip(false);
                        }
                      }
                    } catch (error) {
                      console.error('Error checking payment status:', error);
                      isPollingStatus = false;
                      toast({
                        title: 'Error',
                        description: 'Failed to check payment status',
                        variant: 'destructive',
                      });
                      setIsEndingTrip(false);
                    }
                  };

                  checkPaymentStatus();
                } else if (statusData.status === 'failed') {
                  toast({
                    title: 'Payment Failed',
                    description: 'Payment processing failed. Please try again.',
                    variant: 'destructive',
                  });
                  setIsEndingTrip(false);
                }
              }
              return;
            }
          }
          
          pollCount++;
          if (isPollingPaymentId && pollCount < maxPolls) {
            setTimeout(checkPaymentId, 5000);
          } else {
            toast({
              title: 'Timeout',
              description: 'Payment ID not received. Please try again.',
              variant: 'destructive',
            });
            setIsEndingTrip(false);
          }
        } catch (error) {
          console.error('Error checking payment ID:', error);
          isPollingPaymentId = false;
          toast({
            title: 'Error',
            description: 'Failed to check payment ID',
            variant: 'destructive',
          });
          setIsEndingTrip(false);
        }
      };

      // Start polling for payment ID
      checkPaymentId();
      setEndTripCode('');
    } catch (error) {
      setEndTripError('Network error. Please try again.');
      toast({
        title: 'End Trip Failed',
        description: 'Network error',
        variant: 'destructive',
      });
      setIsEndingTrip(false);
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

      {/* Add Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-2xl">
          {currentTrip && (
            <TripReceiptStaff
              trip={currentTrip}
              onClose={() => setShowReceipt(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-2xl">
          {summaryData && (
            <SummaryDialog
              isOpen={showSummary}
              title={summaryData.title}
              description={summaryData.description}
              summary={summaryData.summary}
              type={summaryData.type}
              confirmText={summaryData.confirmText}
              onConfirm={summaryData.onConfirm}
              onClose={() => setShowSummary(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffPanel;
