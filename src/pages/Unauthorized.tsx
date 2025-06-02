import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Unauthorized = () => {
  const { authState } = useAuth();

  let redirectPath = '/';
  if (authState.role === 'superadmin') {
    redirectPath = '/admin-dashboard'; // Redirect for superadmin
  } else if (authState.role === 'admin') {
    redirectPath = '/station-admin-dashboard'; // Redirect for admin
  } else if (authState.role === 'staff') {
    redirectPath = '/staff-panel'; // Redirect for staff
  } else if (authState.role === 'maintenance') {
    redirectPath = '/maintenance-dashboard'; // Redirect for maintenance
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-graylight p-6">
      <div className="w-full max-w-md text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 mx-auto rounded-full bg-error/20 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-error"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-graydark">Access Denied</h1>
        <p className="text-lg text-gray-600">
          You don't have permission to access this page.
        </p>
        <p className="text-gray-500">
          Please contact your administrator if you believe this is an error.
        </p>
        <Button asChild className="mt-6 bg-greenprimary hover:bg-greenprimary/80 text-white">
          <Link to={redirectPath} className="inline-flex items-center">
            <ArrowLeft size={16} className="mr-2" />
            Go back to dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default Unauthorized;