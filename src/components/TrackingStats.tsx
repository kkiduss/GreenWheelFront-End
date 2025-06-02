import { Bike, MapPin } from 'lucide-react';

interface TrackingStatsProps {
  activeRides: number;
  totalStations: number;
}

const TrackingStats = ({ activeRides, totalStations }: TrackingStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Bike className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Rides</p>
            <h3 className="text-2xl font-bold text-gray-900">{activeRides}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <MapPin className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Stations</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalStations}</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingStats; 