import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, ArrowLeft, UserCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Define NotificationContext locally with correct type to avoid TS errors
const NotificationContext = React.createContext<{ setVerificationCount?: (count: number) => void }>({});

interface VerificationRequest {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role_id: number;
  station_id: number | null;
  phone: string;
  profile_picture: string | null;
  national_id_number: string;
  national_id_front: string;
  national_id_back: string;
  status: 'Inprogress' | 'accepted' | 'rejected';
  google_id: string | null;
  created_at: string;
  updated_at: string;
}

const UserVerification = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [selectedImage, setSelectedImage] = useState<{ url: string; type: 'front' | 'back' } | null>(null);
  const [rejectionDialog, setRejectionDialog] = useState<{ open: boolean; requestId: number | null }>({
    open: false,
    requestId: null
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const notificationCtx = useContext(NotificationContext) as { setVerificationCount?: (count: number) => void };

  const fetchVerificationRequests = async () => {
    try {
      console.log('Fetching verification requests...');
      const response = await fetch('https://www.green-wheels.pro.et/api/inprogress-ids', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authState.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch verification requests:', response.status, errorText);
        throw new Error('Failed to fetch verification requests');
      }

      const data = await response.json();
      console.log('Raw API Response:', data);

      const processedData = Array.isArray(data)
        ? data
        : data?.inprogress || data?.data || [];

      const formattedData = processedData.map((request: VerificationRequest) => ({
        ...request,
        national_id_front: request.national_id_front.replace(/\\/g, ''),
        national_id_back: request.national_id_back.replace(/\\/g, ''),
      }));

      // Only update if there are changes
      if (JSON.stringify(formattedData) !== JSON.stringify(verificationRequests)) {
        setVerificationRequests(formattedData);

        if (notificationCtx.setVerificationCount) {
          notificationCtx.setVerificationCount(formattedData.length);
        }
        console.log('Processed verification requests:', formattedData);
      }
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load verification requests',
        variant: 'destructive',
      });
      setVerificationRequests([]);
      if (notificationCtx.setVerificationCount) {
        notificationCtx.setVerificationCount(0);
      }
    }
  };

  useEffect(() => {
    console.log('Component mounted, checking auth state:', authState);
    if (authState.role === 'superadmin') {
      fetchVerificationRequests();
      
      // Add polling for live updates
      const interval = setInterval(() => {
        fetchVerificationRequests();
      }, 30000); // Poll every 30 seconds

      return () => clearInterval(interval);
    } else {
      console.log('User is not superadmin, redirecting...');
      navigate('/');
    }
  }, [authState.role]);

  const handleVerification = async (requestId: number, action: 'accept' | 'reject') => {
    try {
      if (action === 'reject') {
        setRejectionDialog({ open: true, requestId });
        return;
      }

      // Check if user is superadmin
      if (authState.role !== 'superadmin') {
        console.error('Unauthorized: User is not a superadmin');
        toast({
          title: 'Unauthorized',
          description: 'You do not have permission to perform this action',
          variant: 'destructive',
        });
        return;
      }

      console.log(`Handling verification for ID ${requestId} with action ${action}`);

      const response = await fetch(`https://www.green-wheels.pro.et/api/superadmin/verify_id/${requestId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`, // Ensure token is included
        },
        body: JSON.stringify({
          status: action === 'accept' ? 'accepted' : 'rejected', // Use 'accepted' for accept action
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to ${action} verification request`);
      }

      const responseData = await response.json();
      console.log('Verification response:', responseData);

      setVerificationRequests(prev => {
        const updated = prev.filter(request => request.id !== requestId);
        if (notificationCtx.setVerificationCount) {
          notificationCtx.setVerificationCount(updated.length);
        }
        return updated;
      });

      toast({
        title: 'Success',
        description: `Verification request ${action}ed successfully`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error handling verification:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process verification request';

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleRejection = async () => {
    if (!rejectionDialog.requestId) return;

    // Check if user is superadmin
    if (authState.role !== 'superadmin') {
      console.error('Unauthorized: User is not a superadmin');
      toast({
        title: 'Unauthorized',
        description: 'You do not have permission to perform this action',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Sending rejection request:', {
        requestId: rejectionDialog.requestId,
        reason: rejectionReason,
        userRole: authState.role,
        isAuthenticated: authState.isAuthenticated
      });

      const response = await fetch(`https://www.green-wheels.pro.et/api/superadmin/reject_id/${rejectionDialog.requestId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'X-Requested-With': 'XMLHttpRequest',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Add JWT token
        },
        body: JSON.stringify({
          reason: rejectionReason,
          status: 'rejected' // Add status to match the API expectation
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Rejection response error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (response.status === 403) {
          throw new Error('You do not have permission to perform this action. Please ensure you are logged in as a superadmin.');
        }
        
        throw new Error(errorData?.message || 'Failed to reject verification request');
      }

      const responseData = await response.json();
      console.log('Rejection response:', responseData);

      setVerificationRequests(prev => {
        const updated = prev.filter(request => request.id !== rejectionDialog.requestId);
        if (notificationCtx.setVerificationCount) {
          notificationCtx.setVerificationCount(updated.length);
        }
        return updated;
      });

      toast({
        title: 'Success',
        description: 'Verification request rejected successfully',
        variant: 'default',
      });

      // Reset rejection state
      setRejectionDialog({ open: false, requestId: null });
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting verification:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject verification request';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      // If unauthorized, redirect to home
      if (errorMessage.includes('permission')) {
        navigate('/');
      }
    }
  };

  const showImage = (url: string, type: 'front' | 'back') => {
    console.log('showImage called with:', { 
      url, 
      type,
      urlType: typeof url,
      urlLength: url?.length,
      urlValue: JSON.stringify(url)
    });
    
    if (!url || url.trim() === '') {
      console.log('URL check failed:', {
        isNull: url === null,
        isUndefined: url === undefined,
        isEmpty: url === '',
        trimmedLength: url?.trim()?.length,
        originalValue: url
      });
      toast({
        title: 'Error',
        description: 'No image available',
        variant: 'destructive',
      });
      return;
    }

    // Clean and format the URL
    const cleanUrl = url
      .replace(/\\/g, '') // Remove backslashes
      .replace(/^"|"$/g, '') // Remove quotes if present
      .trim(); // Remove any whitespace

    console.log('URL processing:', {
      original: url,
      cleaned: cleanUrl,
      hasQuotes: url.includes('"'),
      hasBackslashes: url.includes('\\')
    });

    setSelectedImage({ url: cleanUrl, type });
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="mr-1 sm:mr-2"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-graydark dark:text-white">User Verification</h1>
            <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-300">
              Review and verify user identity documents
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-semibold text-graydark dark:text-white">Verification Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-graydark dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-graydark dark:text-gray-300 uppercase tracking-wider">
                  National ID
                </th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-graydark dark:text-gray-300 uppercase tracking-wider">
                  Submitted On
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-graydark dark:text-gray-300 uppercase tracking-wider">
                  ID Images
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-graydark dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-graydark dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {verificationRequests && verificationRequests.length > 0 ? (
                verificationRequests.map((request) => {
                  if (!request.id || typeof request.id !== 'number') {
                    console.warn('Invalid request ID:', request);
                    return null;
                  }

                  return (
                    <tr key={`verification-${request.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-graydark dark:text-white">
                        {request.first_name} {request.last_name}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-graydark dark:text-white">
                        {request.national_id_number}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-graydark dark:text-white">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => showImage(request.national_id_front, 'front')}
                            className="w-full sm:w-auto text-xs sm:text-sm"
                          >
                            Front
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => showImage(request.national_id_back, 'back')}
                            className="w-full sm:w-auto text-xs sm:text-sm"
                          >
                            Back
                          </Button>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          request.status === 'Inprogress' 
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : request.status === 'accepted'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                        {request.status === 'Inprogress' && (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleVerification(request.id, 'accept')}
                              className="bg-primary hover:bg-primary/90 w-full sm:w-auto text-xs sm:text-sm"
                            >
                              <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleVerification(request.id, 'reject')}
                              className="w-full sm:w-auto text-xs sm:text-sm"
                            >
                              <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                }).filter(Boolean)
              ) : (
                <tr key="no-data">
                  <td colSpan={6} className="px-3 sm:px-6 py-6 sm:py-8 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center">
                      <UserCheck className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mb-2" />
                      <p className="text-sm sm:text-base">No verification requests at the moment</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialog.open} onOpenChange={(open) => {
        if (!open) {
          setRejectionDialog({ open: false, requestId: null });
          setRejectionReason('');
        }
      }}>
        <DialogContent className="sm:max-w-[425px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Reject Verification Request</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Please provide a reason for rejecting this verification request.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 sm:py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px] w-full text-sm sm:text-base"
            />
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejectionDialog({ open: false, requestId: null });
                setRejectionReason('');
              }}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejection}
              disabled={!rejectionReason.trim()}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg max-w-2xl w-full mx-2 sm:mx-4">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold dark:text-white">
                National ID {selectedImage.type === 'front' ? 'Front' : 'Back'}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedImage(null)}
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
            <div className="relative aspect-[16/9] w-full">
              <img
                src={selectedImage.url}
                alt={`National ID ${selectedImage.type}`}
                className="object-contain w-full h-full rounded-lg"
                onError={() => {
                  console.error('Image failed to load:', selectedImage.url);
                  toast({
                    title: 'Error',
                    description: 'Failed to load the image. Please try again.',
                    variant: 'destructive',
                  });
                  setSelectedImage(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserVerification;