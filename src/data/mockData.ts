import { User, Bike, Station, MaintenanceReport, BikeCategory, CommonIssue, Reservation, UserRole } from '@/types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    stationId: 1,
    station_name: 'Central Station',
    verified: true,
    createdAt: '2024-01-01',
    national_id: '1234567890',
    join_date: '2024-01-01',
    phone: '+1234567890',
    status: 'active'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'staff',
    stationId: 2,
    station_name: 'North Station',
    verified: true,
    createdAt: '2024-01-02',
    national_id: '0987654321',
    join_date: '2024-01-02',
    phone: '+1987654321',
    status: 'active'
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'maintenance',
    stationId: 1,
    station_name: 'Central Station',
    verified: true,
    createdAt: '2024-01-03',
    national_id: '1122334455',
    join_date: '2024-01-03',
    phone: '+1122334455',
    status: 'active'
  },
  {
    id: '4',
    name: 'Alice Brown',
    email: 'alice@example.com',
    role: 'staff',
    stationId: 3,
    station_name: 'South Station',
    verified: false,
    createdAt: '2024-01-04',
    national_id: '5544332211',
    join_date: '2024-01-04',
    phone: '+1554433221',
    status: 'pending'
  },
  {
    id: '5',
    name: 'Charlie Wilson',
    email: 'charlie@example.com',
    role: 'maintenance',
    stationId: 2,
    station_name: 'North Station',
    verified: true,
    createdAt: '2024-01-05',
    national_id: '6677889900',
    join_date: '2024-01-05',
    phone: '+1667788990',
    status: 'active'
  },
  {
    id: '6',
    name: 'Diana Miller',
    email: 'diana@example.com',
    role: 'staff',
    stationId: 1,
    station_name: 'Central Station',
    verified: true,
    createdAt: '2024-01-06',
    national_id: '9988776655',
    join_date: '2024-01-06',
    phone: '+1998877665',
    status: 'inactive'
  },
  {
    id: '7',
    name: 'Edward Davis',
    email: 'edward@example.com',
    role: 'maintenance',
    stationId: 3,
    station_name: 'South Station',
    verified: false,
    createdAt: '2024-01-07',
    national_id: '4433221100',
    join_date: '2024-01-07',
    phone: '+1443322110',
    status: 'pending'
  },
  {
    id: '8',
    name: 'Fiona Clark',
    email: 'fiona@example.com',
    role: 'staff',
    stationId: 2,
    station_name: 'North Station',
    verified: true,
    createdAt: '2024-01-08',
    national_id: '7788990011',
    join_date: '2024-01-08',
    phone: '+1778899001',
    status: 'active'
  }
];

export const stations: Station[] = [
  {
    id: '1',
    name: 'Meskel Square Station',
    location: 'Meskel Square, Addis Ababa',
    total_capacity: 40,
    availableBikes: 25,
    coordinates: { lat: 9.0054, lng: 38.7636 }
  },
  {
    id: '2',
    name: 'Piazza Station',
    location: 'Piazza, Addis Ababa',
    total_capacity: 60,
    availableBikes: 40,
    coordinates: { lat: 9.0348, lng: 38.7616 }
  },
  {
    id: '3',
    name: 'Bole Airport Station',
    location: 'Bole International Airport',
    total_capacity: 50,
    availableBikes: 35,
    coordinates: { lat: 8.9781, lng: 38.7999 }
  },
  {
    id: '4',
    name: 'Mexico Station',
    location: 'Mexico Square, Addis Ababa',
    total_capacity: 75,
    availableBikes: 60,
    coordinates: { lat: 9.0092, lng: 38.7569 }
  },
  {
    id: '5',
    name: 'Stadium Station',
    location: 'Addis Ababa Stadium',
    total_capacity: 40,
    availableBikes: 25,
    coordinates: { lat: 9.0182, lng: 38.7580 }
  }
];

// Active bike tracking data for live movement simulation
export interface ActiveBikeTracking {
  id: number;
  bike_number: string;
  model: string;
  brand: string;
  status: 'in-use';
  station_id: number;
  start_time: string;
  user_id: number;
  station_name: string;
  user_email: string;
  created_at: string;
  trip_id: number;
  current_location: {
    latitude: number;
    longitude: number;
    heading: number;
    speed: number;
    battery_level: number;
    signal_strength: 'excellent' | 'good' | 'fair' | 'poor';
    last_update: string;
  };
  route_points: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
    speed: number;
  }>;
}

// Generate active bikes with live tracking data
export const generateActiveBikes = (): ActiveBikeTracking[] => {
  const activeBikes: ActiveBikeTracking[] = [];
  const currentTime = new Date();
  
  // Create 8-12 active bikes for simulation
  const numActiveBikes = Math.floor(Math.random() * 5) + 8;
  
  for (let i = 0; i < numActiveBikes; i++) {
    const station = stations[Math.floor(Math.random() * stations.length)];
    const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];
    const startTime = new Date(currentTime.getTime() - Math.random() * 3600000); // Started within last hour
    
    // Generate initial position near station
    const baseLatOffset = (Math.random() - 0.5) * 0.01; // Up to ~1km from station
    const baseLngOffset = (Math.random() - 0.5) * 0.01;
    const currentLat = station.coordinates.lat + baseLatOffset;
    const currentLng = station.coordinates.lng + baseLngOffset;
    
    // Generate route history (last 10 minutes of movement)
    const routePoints = [];
    let routeLat = station.coordinates.lat;
    let routeLng = station.coordinates.lng;
    
    for (let j = 0; j < 10; j++) {
      const pointTime = new Date(currentTime.getTime() - (10 - j) * 60000); // Every minute
      const heading = Math.random() * 2 * Math.PI;
      const distance = (Math.random() * 0.0005); // Random movement
      
      routeLat += distance * Math.cos(heading);
      routeLng += distance * Math.sin(heading);
      
      routePoints.push({
        latitude: routeLat,
        longitude: routeLng,
        timestamp: pointTime.toISOString(),
        speed: Math.floor(Math.random() * 25) + 5 // 5-30 km/h
      });
    }
    
    activeBikes.push({
      id: i + 1,
      bike_number: `B${String(100 + i).padStart(3, '0')}`,
      model: ['City Cruiser Pro', 'Urban Explorer', 'Metro Glide', 'Speed Demon'][Math.floor(Math.random() * 4)],
      brand: ['BikeShare', 'UrbanCycle', 'CityRide', 'EcoMotion'][Math.floor(Math.random() * 4)],
      status: 'in-use',
      station_id: parseInt(station.id),
      start_time: startTime.toISOString(),
      user_id: parseInt(user.id.split('-')[1]) || i + 1,
      station_name: station.name,
      user_email: user.email,
      created_at: startTime.toISOString(),
      trip_id: 1000 + i,
      current_location: {
        latitude: currentLat,
        longitude: currentLng,
        heading: Math.random() * 2 * Math.PI,
        speed: Math.floor(Math.random() * 25) + 5,
        battery_level: Math.floor(Math.random() * 40) + 60, // 60-100%
        signal_strength: ['excellent', 'good', 'fair'][Math.floor(Math.random() * 3)] as 'excellent' | 'good' | 'fair',
        last_update: currentTime.toISOString()
      },
      route_points: routePoints
    });
  }
  
  return activeBikes;
};

// Live location update simulation
export const updateBikeLocation = (bike: ActiveBikeTracking): ActiveBikeTracking => {
  const currentTime = new Date();
  const timeDelta = 2; // 2 seconds between updates
  
  // Calculate new position based on current heading and speed
  const distancePerSecond = (bike.current_location.speed * 1000) / 3600; // m/s
  const distanceThisUpdate = (distancePerSecond * timeDelta) / 111000; // Convert to lat/lng degrees
  
  // Add some randomness to heading (realistic movement)
  const headingVariation = (Math.random() - 0.5) * 0.2; // ±0.1 radians
  const newHeading = bike.current_location.heading + headingVariation;
  
  // Calculate new position
  const newLat = bike.current_location.latitude + (distanceThisUpdate * Math.cos(newHeading));
  const newLng = bike.current_location.longitude + (distanceThisUpdate * Math.sin(newHeading));
  
  // Keep bikes within Addis Ababa bounds
  const boundedLat = Math.max(8.9, Math.min(9.1, newLat));
  const boundedLng = Math.max(38.6, Math.min(38.9, newLng));
  
  // Vary speed slightly (realistic riding patterns)
  const speedVariation = (Math.random() - 0.5) * 5; // ±2.5 km/h
  const newSpeed = Math.max(0, Math.min(35, bike.current_location.speed + speedVariation));
  
  // Battery drain based on speed and time
  const batteryDrain = (newSpeed > 0 ? 0.02 : 0.01); // Drain faster when moving
  const newBatteryLevel = Math.max(0, bike.current_location.battery_level - batteryDrain);
  
  // Signal strength based on distance from original station
  const originalStation = stations.find(s => s.id === bike.station_id.toString());
  const distanceFromStation = originalStation ? Math.sqrt(
    Math.pow(boundedLat - originalStation.coordinates.lat, 2) + 
    Math.pow(boundedLng - originalStation.coordinates.lng, 2)
  ) : 0;
  
  const signalStrength = distanceFromStation < 0.002 ? 'excellent' :
                        distanceFromStation < 0.005 ? 'good' :
                        distanceFromStation < 0.008 ? 'fair' : 'poor';
  
  // Add current position to route history
  const newRoutePoint = {
    latitude: boundedLat,
    longitude: boundedLng,
    timestamp: currentTime.toISOString(),
    speed: newSpeed
  };
  
  // Keep only last 20 route points
  const updatedRoutePoints = [...bike.route_points, newRoutePoint].slice(-20);
  
  return {
    ...bike,
    current_location: {
      latitude: boundedLat,
      longitude: boundedLng,
      heading: newHeading,
      speed: newSpeed,
      battery_level: newBatteryLevel,
      signal_strength: signalStrength,
      last_update: currentTime.toISOString()
    },
    route_points: updatedRoutePoints
  };
};

// Initialize active bikes data
let activeBikesData = generateActiveBikes();

// Get current active bikes (call this from your component)
export const getActiveBikes = (): ActiveBikeTracking[] => {
  return activeBikesData;
};

// Update all bike locations (call this periodically)
export const updateAllBikeLocations = (): ActiveBikeTracking[] => {
  activeBikesData = activeBikesData.map(updateBikeLocation);
  return activeBikesData;
};

// Get a specific bike's tracking data
export const getBikeTrackingData = (bikeNumber: string): ActiveBikeTracking | undefined => {
  return activeBikesData.find(bike => bike.bike_number === bikeNumber);
};

export const bikes: Bike[] = [
  ...Array.from({ length: 200 }).map((_, i) => ({
    id: `bike-${i + 1}`,
    bike_number: `B${String(i + 1).padStart(3, '0')}`,
    model: ['City Cruiser', 'Mountain Explorer', 'Urban Commuter'][Math.floor(Math.random() * 3)],
    brand: ['BikeShare', 'UrbanCycle', 'CityRide', 'EcoMotion'][Math.floor(Math.random() * 4)],
    status: ['available', 'in-use', 'maintenance'][Math.floor(Math.random() * 3)] as 'available' | 'in-use' | 'maintenance',
    station_id: `${Math.floor(Math.random() * 5) + 1}`,
    category: ['regular', 'electric', 'scooter'][Math.floor(Math.random() * 3)] as BikeCategory,
    lastMaintenance: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
    totalRides: Math.floor(Math.random() * 1000)
  }))
];

// ... keep existing code (maintenanceReports, reservations, commonIssues, helper functions)

export const maintenanceReports: MaintenanceReport[] = [
  {
    id: '1',
    bikeId: 'B001',
    reported_by: 'John Doe',
    status: 'pending',
    issue: 'Flat tire',
    description: 'Front tire is completely flat',
    priority: 'high',
    reportedAt: '2024-03-15T10:00:00Z',
    resolvedAt: '',
    maintenance_status: 'pending',
    role: 'staff',
    bike_number: '712345',
    reason: 'Flat tire',
    phone_number: '+251974018646'
  },
  {
    id: '2',
    bikeId: 'B002',
    reported_by: 'Jane Smith',
    status: 'in-progress',
    issue: 'Brake issues',
    description: 'Brakes are not responding properly',
    priority: 'medium',
    reportedAt: '2024-03-14T15:30:00Z',
    resolvedAt: '',
    maintenance_status: 'in_progress',
    role: 'maintenance',
    bike_number: '712346',
    reason: 'Brake issues',
    phone_number: '+251974018647'
  },
  {
    id: '3',
    bikeId: 'B003',
    reported_by: 'Mike Johnson',
    status: 'resolved',
    issue: 'Chain problem',
    description: 'Chain keeps falling off',
    priority: 'low',
    reportedAt: '2024-03-13T09:15:00Z',
    resolvedAt: '2024-03-13T11:30:00Z',
    maintenance_status: 'completed',
    role: 'staff',
    bike_number: '712347',
    reason: 'Chain problem',
    phone_number: '+251974018648'
  }
];

export const reservations: Reservation[] = [
  ...Array.from({ length: 50 }).map((_, i) => ({
    id: `reservation-${i + 1}`,
    userId: mockUsers[Math.floor(Math.random() * mockUsers.length)].id,
    bikeId: bikes[Math.floor(Math.random() * bikes.length)].id,
    stationId: stations[Math.floor(Math.random() * stations.length)].id,
    startTime: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString(),
    endTime: Math.random() > 0.3 ? new Date(Date.now() + Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000).toISOString() : null,
    status: ['active', 'completed', 'overdue', 'cancelled'][Math.floor(Math.random() * 4)] as 'active' | 'completed' | 'overdue' | 'cancelled',
    code: Math.random().toString(36).substring(2, 8).toUpperCase()
  }))
];

export const commonIssues: CommonIssue[] = [
  { id: 'issue-1', name: 'Flat Tire', category: 'Wheel' },
  { id: 'issue-2', name: 'Brake Issue', category: 'Brakes' },
  { id: 'issue-3', name: 'Chain Problem', category: 'Drivetrain' },
  { id: 'issue-4', name: 'Seat Loose', category: 'Comfort' },
  { id: 'issue-5', name: 'Light Not Working', category: 'Electrical' },
  { id: 'issue-6', name: 'Gear Shifting Issue', category: 'Drivetrain' },
  { id: 'issue-7', name: 'Handlebar Loose', category: 'Steering' },
  { id: 'issue-8', name: 'Pedal Issue', category: 'Drivetrain' },
  { id: 'issue-9', name: 'Wheel Alignment', category: 'Wheel' },
  { id: 'issue-10', name: 'Frame Damage', category: 'Structure' }
];

export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(user => user.id === id);
};

export const getBikeSummary = () => {
  const availableBikes = bikes.filter(bike => bike.status === 'available').length;
  const inUseBikes = bikes.filter(bike => bike.status === 'in-use').length;
  const maintenanceBikes = bikes.filter(bike => bike.status === 'maintenance').length;

  return {
    totalBikes: bikes.length,
    availableBikes,
    inUseBikes,
    maintenanceBikes,
    utilization: Math.round((inUseBikes / bikes.length) * 100)
  };
};

export const getStationSummary = () => {
  const totalCapacity = stations.reduce((sum, station) => sum + station.total_capacity, 0);
  const totalAvailableBikes = stations.reduce((sum, station) => sum + station.availableBikes, 0);

  return {
    totalStations: stations.length,
    totalCapacity,
    totalAvailableBikes,
    utilization: Math.round((totalAvailableBikes / totalCapacity) * 100)
  };
};

export const getMaintenanceSummary = () => {
  const pendingIssues = maintenanceReports.filter(report => report.status === 'pending').length;
  const inProgressIssues = maintenanceReports.filter(report => report.status === 'in-progress').length;
  const resolvedIssues = maintenanceReports.filter(report => report.status === 'resolved').length;

  return {
    totalIssues: maintenanceReports.length,
    pendingIssues,
    inProgressIssues,
    resolvedIssues,
    resolutionRate: Math.round((resolvedIssues / maintenanceReports.length) * 100)
  };
};