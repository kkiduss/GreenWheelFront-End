import { User, MapPin, Clock } from 'lucide-react';

interface ActiveBike {
  id: number;
  bike_number: string;
  model: string;
  brand: string;
  status: string;
  station_id: number;
  start_time?: string;
  user_id?: number;
  station_name?: string;
  user_email?: string;
  created_at?: string;
}

interface BikeTrackerProps {
  bikes: ActiveBike[];
  selectedBike: ActiveBike | null;
  onSelectBike: (bike: ActiveBike) => void;
}

const BikeTracker = ({ bikes, selectedBike, onSelectBike }: BikeTrackerProps) => {
  if (bikes.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500">No active rides at the moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bikes.map((bike) => {
        const startTime = bike.created_at || bike.start_time || new Date().toISOString();
        const isSelected = selectedBike?.id === bike.id;
        
        return (
          <div
            key={bike.id}
            className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
              isSelected 
                ? 'bg-blue-50 border-blue-200 shadow-md' 
                : 'bg-white border-gray-200 hover:border-blue-200'
            }`}
            onClick={() => onSelectBike(bike)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  isSelected ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <User className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{bike.user_email?.split('@')[0] || 'Unknown User'}</p>
                  <p className="text-sm text-gray-500">
                    Bike #{bike.bike_number || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" />
                  {bike.station_name || 'Unknown Station'}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <Clock className="h-4 w-4" />
                  {new Date(startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BikeTracker; 