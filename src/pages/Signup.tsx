
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bike, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Password strength checker
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '' };
    
    let score = 0;
    
    // Length check
    if (pass.length >= 8) score += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    return {
      score,
      label: labels[score - 1] || ''
    };
  };

  const strength = getPasswordStrength(password);
  
  const getStrengthColor = (score: number) => {
    const colors = ['#E74C3C', '#F39C12', '#F1C40F', '#28B463'];
    return colors[score - 1] || 'transparent';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate signup delay
    setTimeout(() => {
      toast({
        title: 'Account created!',
        description: 'You can now sign in with your credentials.',
        variant: 'default',
      });
      
      navigate('/login');
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-graylight p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg animate-fade-in">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center justify-center">
            <Bike size={40} className="text-greenprimary" />
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-graydark">Create your account</h1>
          <p className="mt-2 text-sm text-graydark">
            Join GreenWheels for eco-friendly transportation
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="form-input-animated" style={{ '--input-index': 0 } as React.CSSProperties}>
              <label htmlFor="name" className="block text-sm font-medium text-graydark mb-1">
                Full name
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                className="block w-full text-graydark"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-input-animated" style={{ '--input-index': 1 } as React.CSSProperties}>
              <label htmlFor="email" className="block text-sm font-medium text-graydark mb-1">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full text-graydark"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-input-animated" style={{ '--input-index': 2 } as React.CSSProperties}>
              <label htmlFor="password" className="block text-sm font-medium text-graydark mb-1">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="block w-full text-graydark"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              
              {password && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-graydark">Password strength</span>
                    {strength.score > 0 && (
                      <span className="text-xs" style={{ color: getStrengthColor(strength.score) }}>
                        {strength.label}
                      </span>
                    )}
                  </div>
                  <div className="w-full h-1.5 bg-graylight rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${(strength.score / 4) * 100}%`,
                        backgroundColor: getStrengthColor(strength.score)
                      }}
                    />
                  </div>
                  
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex items-center gap-1">
                      {password.length >= 8 ? (
                        <Check size={12} className="text-greenprimary" />
                      ) : (
                        <X size={12} className="text-error" />
                      )}
                      <span className="text-graydark">At least 8 characters</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {/[A-Z]/.test(password) ? (
                        <Check size={12} className="text-greenprimary" />
                      ) : (
                        <X size={12} className="text-error" />
                      )}
                      <span className="text-graydark">At least 1 uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {/[0-9]/.test(password) ? (
                        <Check size={12} className="text-greenprimary" />
                      ) : (
                        <X size={12} className="text-error" />
                      )}
                      <span className="text-graydark">At least 1 number</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="form-input-animated" style={{ '--input-index': 3 } as React.CSSProperties}>
            <Button 
              type="submit"
              className="w-full bg-greenprimary hover:bg-greenprimary/80 text-white"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </div>
        </form>

        <p className="mt-4 text-center text-sm text-graydark form-input-animated" 
           style={{ '--input-index': 4 } as React.CSSProperties}>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-greenprimary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
