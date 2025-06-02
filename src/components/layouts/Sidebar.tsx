import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarItem,
  SidebarGroup,
} from '@/components/ui/sidebar';
import { Bike } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Wrench,
  Settings,
  Calendar,
  Search,
  ChevronRight,
  FileText,
  BarChart2,
  UserCheck,
  ShieldAlert
} from 'lucide-react';

export function AppSidebar() {
  const location = useLocation();
  const { authState } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const isAdmin = authState.role === 'superadmin';
  const isStaff = authState.role === 'staff';
  
  return (
    <Sidebar className="bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-800">
      <SidebarHeader>
        <div className="flex items-center">
          <Bike className="h-6 w-6 text-greenprimary" />
          <span className="ml-2 text-xl font-bold text-graydark dark:text-white">GreenWheels</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup title="Navigation">
          {isAdmin && (
            <>
              <SidebarItem 
                icon={<LayoutDashboard size={18} />} 
                title="Admin Dashboard"
                active={isActive('/admin-dashboard')}
                href="/admin-dashboard"
              >
                Admin Dashboard
              </SidebarItem>
              <SidebarItem 
                icon={<Users size={18} />} 
                title="All Users"
                active={isActive('/superadmin/users')}
                href="/superadmin/users"
              >
                All Users
              </SidebarItem>
              <SidebarItem 
                icon={<UserCheck size={18} />} 
                title="User Management"
                active={isActive('/user-management')}
                href="/user-management"
              >
                User Management
              </SidebarItem>
              <SidebarItem 
                icon={<Bike size={18} />} 
                title="Bike Fleet"
                active={isActive('/bike-fleet')}
                href="/bike-fleet"
              >
                Bike Fleet
              </SidebarItem>
              <SidebarItem 
                icon={<MapPin size={18} />} 
                title="Station Management"
                active={isActive('/station-management')}
                href="/station-management"
              >
                Station Management
              </SidebarItem>
              <SidebarItem 
                icon={<LayoutDashboard size={18} />} 
                title="Active Rides"
                active={isActive('/active-rides')}
                href="/active-rides"
              >
                Active Rides
              </SidebarItem>
              <SidebarItem 
                icon={<Search size={18} />} 
                title="Available Bikes"
                active={isActive('/available-bikes')}
                href="/available-bikes"
              >
                Available Bikes
              </SidebarItem>
              <SidebarItem 
                icon={<BarChart2 size={18} />} 
                title="Reports"
                active={isActive('/reports')}
                href="/reports"
              >
                Reports
              </SidebarItem>
              <SidebarItem 
                icon={<UserCheck size={18} />} 
                title="Register User"
                active={isActive('/register-user')}
                href="/register-user"
              >
                Register User
              </SidebarItem>
              <SidebarItem 
                icon={<Bike size={18} />} 
                title="Register Bike"
                active={isActive('/register-bike')}
                href="/register-bike"
              >
                Register Bike
              </SidebarItem>
              <SidebarItem 
                icon={<MapPin size={18} />} 
                title="Create Station"
                active={isActive('/create-station')}
                href="/create-station"
              >
                Create Station
              </SidebarItem>
            </>
          )}
        </SidebarGroup>
        
        {(isAdmin || isStaff) && (
          <SidebarGroup title="Management">
            {isAdmin && (
              <>
                <SidebarItem 
                  icon={<Users size={18} />} 
                  title="Users"
                  active={isActive('/user-management')}
                  href="/user-management"
                >
                  Users
                </SidebarItem>
                
                <SidebarItem 
                  icon={<Bike size={18} />} 
                  title="Bike Fleet"
                  active={isActive('/bike-fleet')}
                  href="/bike-fleet"
                >
                  Bike Fleet
                </SidebarItem>
                
                <SidebarItem 
                  icon={<MapPin size={18} />} 
                  title="Stations"
                  active={isActive('/station-management')}
                  href="/station-management"
                >
                  Stations
                </SidebarItem>
              </>
            )}
            
            <SidebarItem 
              icon={<Wrench size={18} />} 
              title="Maintenance"
              active={isActive('/maintenance-dashboard') || isActive('/user-reports') || isActive('/staff-reports')}
              href="/maintenance-dashboard"
            >
              Maintenance
            </SidebarItem>
            
            {isStaff && (
              <SidebarItem 
                icon={<UserCheck size={18} />} 
                title="Reservations"
                active={isActive('/reservations')}
                href="/reservations"
              >
                Reservations
              </SidebarItem>
            )}
            
            {isAdmin && (
              <SidebarItem 
                icon={<BarChart2 size={18} />} 
                title="Reports"
                active={isActive('/reports')}
                href="/reports"
              >
                Reports
              </SidebarItem>
            )}
          </SidebarGroup>
        )}
        
        <SidebarGroup title="General">
          <SidebarItem 
            icon={<Search size={18} />} 
            title="Find Bikes"
            active={isActive('/available-bikes')}
            href="/available-bikes"
          >
            Find Bikes
          </SidebarItem>
          
          <SidebarItem 
            icon={<Settings size={18} />} 
            title="Settings"
            active={isActive('/settings')}
            href="/settings"
          >
            Settings
          </SidebarItem>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
