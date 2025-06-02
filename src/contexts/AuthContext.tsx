import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import axios from 'axios'; // Add axios for API calls
import { User, UserRole } from '@/types'; // Remove AuthState import to avoid conflict

export interface AuthState {
  user: User | null;
  role: UserRole | ''; // Allow empty string or valid UserRole
  token: string;
  isAuthenticated: boolean; // Add this property to track authentication status
}

interface AuthContextProps {
  authState: AuthState;
  setAuthState: (state: AuthState) => void;
  login: (ep: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthorized: (roles?: UserRole[]) => boolean;
}

// Update the default state to include isAuthenticated
const defaultAuthState: AuthState = {
  user: null,
  role: '', // Initialize as an empty string
  token: '', // Initialize token as an empty string
  isAuthenticated: false, // Initialize as false
};

const AuthContext = createContext<AuthContextProps>({
  authState: defaultAuthState,
  setAuthState: () => {},
  login: async () => false,
  logout: () => {},
  isAuthorized: () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      try {
        const parsedAuth = JSON.parse(storedAuth);
        return {
          ...defaultAuthState,
          ...parsedAuth,
          isAuthenticated: !!parsedAuth.token, // Ensure isAuthenticated is set correctly
        };
      } catch {
        console.error('Failed to parse auth state from localStorage');
      }
    }
    return defaultAuthState;
  });

  useEffect(() => {
    localStorage.setItem('auth', JSON.stringify(authState));
  }, [authState]);

  const login = async (ep: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login...');
      // Send login request to the backend
      const response = await axios.post('http://127.0.0.1:8000/api/login', { ep, password }, { withCredentials: true });
      console.log('Login response:', response.data);

      // Destructure the response to get role and token
      const { role, token, message, user } = response.data;

      if (role && token) {
        console.log('Login successful, setting auth state with user:', user);
        
        // Create a complete user object that matches the User type
        const userData: User = {
          id: user?.id || ep,
          email: ep,
          role: role as UserRole,
          name: user?.name || 'Admin User',
          verified: user?.verified || true,
          createdAt: user?.createdAt || new Date().toISOString(),
          national_id: user?.national_id || '',
          join_date: user?.join_date || new Date().toISOString(),
          stationId: user?.station_id || user?.stationId || undefined,
          station_name: user?.station_name || undefined,
          phone: user?.phone || 'N/A',
          status: user?.status || 'pending'
        };

        const newAuthState: AuthState = {
          user: userData,
          role: role as UserRole,
          token,
          isAuthenticated: true,
        };

        console.log('Setting new auth state:', newAuthState);
        setAuthState(newAuthState);

        // Save the token and user to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('auth', JSON.stringify(newAuthState));

        // Set axios default header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        console.log('Login complete, auth state saved');
        return true;
      } else {
        console.error('Login response missing required data:', { role, token, user });
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      // 401 Unauthorized means invalid credentials
      if (error.response && error.response.status === 401) {
        console.error('Login failed: Unauthorized (401)');
      } else {
        console.error('Login failed:', error);
      }
      return false;
    }
  };

  const logout = () => {
    setAuthState({
      user: null,
      role: '', // Clear role during logout
      token: '', // Clear token during logout
      isAuthenticated: false, // Set to false on logout
    });
    localStorage.removeItem('auth');
    localStorage.removeItem('token');
  };

  const isAuthorized = (roles?: UserRole[]): boolean => {
    if (!authState.token) return false; // Check if token exists
    if (!roles || roles.length === 0) return true;
    return !!authState.role && roles.includes(authState.role);
  };

  return (
    <AuthContext.Provider value={{ authState, setAuthState, login, logout, isAuthorized }}>
      {children}
    </AuthContext.Provider>
  );
};