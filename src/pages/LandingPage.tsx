import { Link } from 'react-router-dom';
import { Bike, Shield, Users, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-greenprimary/10 to-white">
      {/* Main Content */}
      <div className="flex-grow">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-graydark mb-6">
              GreenWheels <span className="text-greenprimary">Management System</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Streamlined platform for managing bike sharing operations
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/login">
                <Button size="lg" className="bg-greenprimary hover:bg-greenprimary/90">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Role Cards */}
        <div className="bg-white py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-graydark mb-12">
              Team Access
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="p-6 rounded-lg bg-graylight/50 hover:shadow-lg transition-shadow">
                <Shield className="h-12 w-12 text-greenprimary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Super Admin</h3>
                <p className="text-gray-600">
                  Full system control and management capabilities
                </p>
              </div>
              <div className="p-6 rounded-lg bg-graylight/50 hover:shadow-lg transition-shadow">
                <Users className="h-12 w-12 text-greenprimary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Station Admin</h3>
                <p className="text-gray-600">
                  Station operations and staff management
                </p>
              </div>
              <div className="p-6 rounded-lg bg-graylight/50 hover:shadow-lg transition-shadow">
                <Wrench className="h-12 w-12 text-greenprimary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Maintenance</h3>
                <p className="text-gray-600">
                  Bike maintenance and repair management
                </p>
              </div>
              <div className="p-6 rounded-lg bg-graylight/50 hover:shadow-lg transition-shadow">
                <Bike className="h-12 w-12 text-greenprimary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Staff</h3>
                <p className="text-gray-600">
                  Daily operations and customer service
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-graydark text-white py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-300">
            &copy; {new Date().getFullYear()} GreenWheels Management System. Internal use only.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 