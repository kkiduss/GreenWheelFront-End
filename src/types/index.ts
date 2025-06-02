export type UserRole = 'superadmin' | 'staff'  | 'admin' | 'maintenance';

export interface TeamMember {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'staff' | 'admin' | 'maintenance';
  station_id: number;
  station_name: string;
  national_id_number: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  national_id: string;
  createdAt: string | null;
  join_date: string | null;
  stationId: number;
  station_name: string;
  verified: boolean;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
}

export type BikeStatus = 'available' | 'in-use' | 'maintenance';
export type BikeCategory = 'regular' | 'electric' | 'scooter';

export interface Bike {
  id: string;
  model: string;
  status: BikeStatus;
  station_id: string;
  lastMaintenance: string;
  totalRides: number;
  category: BikeCategory;
  bike_number: string;
  brand: string;
  battery_level?: number; // Optional battery level property
}

export interface Station {
  id: string;
  name: string;
  location: string;
  total_capacity: number;
  availableBikes: number;
  coordinates: { lat: number; lng: number };
}

export interface Reservation {
  id: string;
  userId: string;
  bikeId: string;
  stationId: string;
  startTime: string;
  endTime: string | null;
  status: 'active' | 'completed' | 'overdue' | 'cancelled';
  code?: string;
}

export interface MaintenanceReport {
  id: string;
  bikeId: string;
  stationId?: string;
  stationName?: string;
  issue: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'resolved';
  reportedAt: string;
  resolvedAt?: string;
  notes?: string;
  bike_number?: string;
  reason?: string;
  description?: string;
  reported_by?: string;
  phone_number?: string;
  maintenance_status?: string;
  role?: string;
  email?: string;
  maintenance_id?: string;
  start_time?: string;
  location?: string;
}

export interface CommonIssue {
  id: string;
  name: string;
  category: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
}
