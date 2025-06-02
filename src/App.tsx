import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/layouts/MainLayout";

import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import StaffPanel from "./pages/StaffPanel";
import StationManagement from "./pages/StationManagement";
import UserManagement from "./pages/UserManagement";
import Reports from "./pages/Reports";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import BikeFleet from "./pages/BikeFleet";
import ActiveRides from "./pages/ActiveRides";
import AvailableBikes from "./pages/AvailableBikes";
import Reservations from "./pages/staff/Reservations";
import MaintenanceIssues from "./pages/staff/MaintenanceIssues";
import RegisterUser from "./pages/admin/RegisterUser";
import RegisterBike from "./pages/admin/RegisterBike";
import CreateStation from "./pages/admin/CreateStation";
import StationAdminDashboard from "./pages/StationAdminDashboard";
import RegisterStationStaff from "./pages/RegisterStationStaff";
import MaintenanceDashboard from "./pages/MaintenanceDashboard";
import ChangePassword from "./pages/ChangePassword";
import UserVerification from '@/pages/UserVerification';
import ForgotPassword from '@/pages/ForgotPassword';
import MyStationStaff from '@/pages/MyStationStaff';
import StationBikes from '@/pages/StationBikes';
import Users from '@/pages/superadmin/Users';
// Define MaintenanceDashboardWithProps to handle the reportSource prop
const StaffReports = () => <MaintenanceDashboard reportSource="staff" />;
const UserReports = () => <MaintenanceDashboard reportSource="user" />;

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<MainLayout><Index /></MainLayout>} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
      
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Admin Routes */}
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute roles={['superadmin']}>
                  <MainLayout>
                    <AdminDashboard />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/station-management" 
              element={
                <ProtectedRoute roles={['superadmin']}>
                  <MainLayout>
                    <StationManagement />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user-management" 
              element={
                <ProtectedRoute roles={['superadmin', 'admin']}>
                  <MainLayout>
                    <UserManagement />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute roles={['superadmin']}>
                  <MainLayout>
                    <Reports />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* New Admin Routes */}
            <Route 
              path="/register-user" 
              element={
                <ProtectedRoute roles={['superadmin']}>
                  <MainLayout>
                    <RegisterUser />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/register-bike" 
              element={
                <ProtectedRoute roles={['superadmin']}>
                  <MainLayout>
                    <RegisterBike />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create-station" 
              element={
                <ProtectedRoute roles={['superadmin']}>
                  <MainLayout>
                    <CreateStation />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Station Admin Routes */}
            <Route 
              path="/station-admin-dashboard" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <MainLayout>
                    <StationAdminDashboard />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-station-staff" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <MainLayout>
                    <MyStationStaff />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/station-bikes" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <MainLayout>
                    <StationBikes />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/available-bikes" 
              element={
                <ProtectedRoute roles={['superadmin', 'staff', 'admin']}>
                  <MainLayout>
                    <AvailableBikes />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/register-station-staff" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <MainLayout>
                    <RegisterStationStaff />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/maintenance-team" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <MainLayout>
                    <UserManagement />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/station-reports" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <MainLayout>
                    <Reports />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />

            {/* Maintenance Team Routes */}
            <Route 
              path="/maintenance-dashboard" 
              element={
                <ProtectedRoute roles={['maintenance']}>
                  <MainLayout>
                    <MaintenanceDashboard reportSource="maintenance" />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user-reports" 
              element={
                <ProtectedRoute roles={['maintenance']}>
                  <MainLayout>
                    <UserReports />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/staff-reports" 
              element={
                <ProtectedRoute roles={['maintenance']}>
                  <MainLayout>
                    <StaffReports />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/maintenance-queue" 
              element={
                <ProtectedRoute roles={['maintenance']}>
                  <MainLayout>
                    <MaintenanceDashboard reportSource="maintenance" />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Detail Routes */}
            <Route 
              path="/bike-fleet" 
              element={
                <ProtectedRoute roles={['superadmin']}>
                  <MainLayout>
                    <BikeFleet />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/active-rides" 
              element={
                <ProtectedRoute roles={['superadmin', 'staff', 'admin']}>
                  <MainLayout>
                    <ActiveRides />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Staff Routes */}
            <Route 
              path="/staff-panel" 
              element={
                <ProtectedRoute roles={['staff', 'superadmin']}>
                  <MainLayout>
                    <StaffPanel />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reservations" 
              element={
                <ProtectedRoute roles={['staff', 'admin', 'superadmin']}>
                  <MainLayout>
                    <Reservations />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/maintenance-issues" 
              element={
                <ProtectedRoute roles={['staff', 'admin', 'superadmin']}>
                  <MainLayout>
                    <MaintenanceIssues />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Change Password Route */}
            <Route 
              path="/change-password" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ChangePassword />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* User Verification Route */}
            <Route 
              path="/user-verification" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <UserVerification />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Superadmin Routes */}
            <Route 
              path="/superadmin/users" 
              element={
                <ProtectedRoute roles={['superadmin']}>
                  <MainLayout>
                    <Users />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
