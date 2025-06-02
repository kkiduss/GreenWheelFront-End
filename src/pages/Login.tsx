import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bike, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const Login = () => {
  const { authState, setAuthState } = useAuth(); // Get setAuthState from context
  const navigate = useNavigate();
  const { toast } = useToast();

  const [ep, setEp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/login', 
        { ep, password }, 
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        }
      );

      const { role, token, user, message } = response.data;

      if (role && token) {
        // Update auth state directly
        setAuthState({
          user: user || null,
          role,
          token,
          isAuthenticated: true,
        });

        // Set axios default header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Save to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('auth', JSON.stringify({
          user: user || null,
          role,
          token,
          isAuthenticated: true,
        }));

        toast({
          title: 'Login successful',
          description: 'Welcome to GreenWheels!',
          variant: 'default',
        });

        // Navigate based on role
        switch (role) {
          case 'superadmin':
            navigate('/admin-dashboard');
            break;
          case 'admin':
            navigate('/station-admin-dashboard');
            break;
          case 'staff':
            navigate('/staff-panel');
            break;
          case 'maintenance':
            navigate('/maintenance-dashboard');
            break;
          default:
            navigate('/staff-panel');
            break;
        }
      } else {
        setError('Invalid credentials');
        toast({
          title: 'Login failed',
          description: 'Please check your credentials',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      if (err.response) {
        console.error('Backend Error:', err.response.data);
        setError(err.response.data.message || 'An error occurred during login');
      } else if (err.request) {
        console.error('Network Error:', err.request);
        setError('Unable to connect to the server. Please try again later.');
      } else {
        console.error('Error:', err.message);
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-graylight p-4 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg animate-fade-in dark:bg-gray-800">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center justify-center">
            <Bike size={40} className="text-greenprimary" />
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-graydark dark:text-white">
            Sign in to GreenWheels
          </h1>
          <p className="mt-2 text-sm text-graydark dark:text-gray-300">
            Enter your credentials to access your account
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm bg-error/10 border border-error/30 text-error rounded">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-graydark mb-1 dark:text-gray-300">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full text-graydark dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={ep}
                onChange={(e) => setEp(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-graydark mb-1 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="block w-full text-graydark dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <Link to="/forgot-password" className="text-xs text-greenprimary hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-greenprimary hover:bg-greenprimary/80 text-white"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
