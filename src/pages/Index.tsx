
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bike, ChevronRight, Clock, MapPin } from 'lucide-react';
import StationMap from '@/components/StationMap';
import { stations } from '@/data/mockData';

// Create proper interface for station mapping
interface StationLocationInfo {
  id: string;
  name: string;
  location: { latitude: number; longitude: number } | null;
}

const Index = () => {
  // Transform stations data to match the expected format for StationMap
  const stationLocations: StationLocationInfo[] = stations.map(station => ({
    id: station.id,
    name: station.name,
    location: {
      latitude: station.coordinates.lat,
      longitude: station.coordinates.lng
    }
  }));

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-greenprimary/90 to-greenprimary flex items-center justify-center py-24 px-6 md:py-32">
        <div className="absolute inset-0 bg-black/30 z-10"></div>
        <div className="container mx-auto relative z-20 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-md">
            Explore Addis Ababa on Two Wheels
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Discover the new beautiful streets of Addis Ababa with our eco-friendly bike sharing system
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="px-8 py-6 text-lg">
                Get Started
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-6 bg-white dark:bg-gray-900">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Why Choose Green Wheels?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-center shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="bg-greenprimary/10 dark:bg-greenprimary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bike className="h-8 w-8 text-greenprimary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 dark:text-white">Eco-Friendly Transportation</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Reduce your carbon footprint while enjoying the beautiful streets of Addis Ababa on our well-maintained bikes.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-center shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="bg-greenprimary/10 dark:bg-greenprimary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-greenprimary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 dark:text-white">Convenient Locations</h3>
              <p className="text-gray-600 dark:text-gray-300">
                With stations throughout Addis Ababa, including near major landmarks and transportation hubs, our bikes are always accessible.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-center shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="bg-greenprimary/10 dark:bg-greenprimary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-greenprimary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 dark:text-white">24/7 Availability</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our bike sharing service is available around the clock, allowing you to explore the city at your own pace.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* About Addis Ababa */}
      <section className="py-16 px-6 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-6 dark:text-white">Discover the New Addis Ababa</h2>
              <p className="text-gray-700 mb-4 dark:text-gray-300">
                Addis Ababa, the capital of Ethiopia, has undergone significant transformation with beautiful new streets, parks, and pathways perfect for cycling. The city's moderate climate makes it ideal for bike exploration year-round.
              </p>
              <p className="text-gray-700 mb-4 dark:text-gray-300">
                Recent infrastructure improvements have added dedicated bike lanes across major thoroughfares, making cycling safer and more enjoyable than ever before. From the historic Piazza to the modern areas around Bole, our bike network connects you to all the important landmarks.
              </p>
              <p className="text-gray-700 mb-6 dark:text-gray-300">
                Experience the unique blend of traditional culture and modern development as you pedal through neighborhoods, past bustling markets, and along tree-lined avenues. With Green Wheels, you'll see Addis Ababa from a whole new perspective.
              </p>
            </div>
            <div className="md:w-1/2 h-[400px] rounded-lg overflow-hidden shadow-lg">
              <div className="h-full w-full border border-gray-200 dark:border-gray-700 rounded-lg">
                <StationMap 
                  stations={stationLocations} 
                  selectedStation={""} 
                  onStationSelect={() => {}} 
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="py-16 px-6 bg-white dark:bg-gray-900">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">How Green Wheels Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-greenprimary text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-3 dark:text-white">Find a Station</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Use our app to locate the nearest bike station to your location in Addis Ababa.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-greenprimary text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-3 dark:text-white">Unlock a Bike</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Scan the QR code or enter your unique code to unlock a bike from the station rack.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-greenprimary text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-3 dark:text-white">Enjoy Your Ride</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Explore the beautiful streets of Addis Ababa at your own pace with our comfortable bikes.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-greenprimary text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
              <h3 className="text-xl font-semibold mb-3 dark:text-white">Return the Bike</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Return your bike to any Green Wheels station and lock it securely to end your trip.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link to="/login">
              <Button size="lg">
                Start Riding Today
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-16 px-6 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">What Our Users Say</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-greenprimary/20 rounded-full flex items-center justify-center text-xl font-bold text-greenprimary">A</div>
                <div className="ml-4">
                  <h4 className="font-semibold dark:text-white">Abebe Kebede</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Regular User</p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                "Green Wheels has changed the way I commute in Addis. I love taking the bikes through the new paths in Meskel Square and along the light rail route."
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-greenprimary/20 rounded-full flex items-center justify-center text-xl font-bold text-greenprimary">S</div>
                <div className="ml-4">
                  <h4 className="font-semibold dark:text-white">Sara Haile</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Student</p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                "As a university student, the Green Wheels bikes are affordable and perfect for getting around campus and to nearby cafés. The stations near Addis Ababa University are so convenient!"
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-greenprimary/20 rounded-full flex items-center justify-center text-xl font-bold text-greenprimary">D</div>
                <div className="ml-4">
                  <h4 className="font-semibold dark:text-white">Daniel Getu</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Business Professional</p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                "I use Green Wheels to avoid traffic jams during rush hour. The bikes are always well-maintained and the app makes it easy to find available bikes near my office in the financial district."
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-graydark dark:bg-gray-950 text-white py-12 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center">
                <Bike className="h-8 w-8" />
                <span className="text-xl font-bold ml-2">GreenWheels</span>
              </div>
              <p className="mt-4 max-w-xs text-gray-400">
                Eco-friendly bike sharing for a greener Addis Ababa, connecting people and places sustainably.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Services</h3>
                <ul className="space-y-2 text-gray-400">
                  <li>Bike Rental</li>
                  <li>Electric Bikes</li>
                  <li>Regular Bikes</li>
                  <li>Corporate Programs</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">About</h3>
                <ul className="space-y-2 text-gray-400">
                  <li>Our Story</li>
                  <li>Team</li>
                  <li>Careers</li>
                  <li>Press Kit</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact</h3>
                <ul className="space-y-2 text-gray-400">
                  <li>Support</li>
                  <li>Sales</li>
                  <li>Report Issue</li>
                  <li>Partnerships</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Green Wheels Bike Sharing. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0">
              <ul className="flex space-x-6">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Cookies
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
