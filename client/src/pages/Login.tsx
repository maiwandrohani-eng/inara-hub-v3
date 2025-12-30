import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import Logo from '../components/Logo';

export default function Login() {
  console.log('Login component: Rendering...');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Sign-up form fields
  const [signUpData, setSignUpData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    whatsapp: '',
    password: '',
    confirmPassword: '',
    role: 'STAFF',
    department: '',
    country: '',
    city: '',
    address: '',
  });
  
  const navigate = useNavigate();
  const { user, token, setAuth } = useAuthStore();

  // Redirect if already logged in
  useEffect(() => {
    if (token && user) {
      navigate('/', { replace: true });
    }
  }, [token, user, navigate]);
  
  // Fetch dropdown options from config (only when sign up is active)
  const { data: departmentsData } = useQuery(
    'config-departments',
    async () => {
      try {
        const res = await api.get('/config/department');
        return res.data;
      } catch {
        return { configs: [] };
      }
    },
    { enabled: isSignUp, retry: false }
  );

  const { data: countriesData } = useQuery(
    'config-countries',
    async () => {
      try {
        const res = await api.get('/config/country');
        return res.data;
      } catch {
        return { configs: [] };
      }
    },
    { enabled: isSignUp, retry: false }
  );

  const { data: citiesData } = useQuery(
    'config-cities',
    async () => {
      try {
        const res = await api.get('/config/city');
        return res.data;
      } catch {
        return { configs: [] };
      }
    },
    { enabled: isSignUp, retry: false }
  );

  const departments = departmentsData?.configs || [];
  const countries = countriesData?.configs || [];
  const cities = citiesData?.configs || [];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      setAuth(response.data.user, response.data.token);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error details:', {
        message: err.response?.data?.message,
        error: err.response?.data?.error,
        code: err.response?.data?.code,
        name: err.response?.data?.name,
        stack: err.response?.data?.stack,
      });
      
      // Show detailed error for debugging
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      
      // Also log to console for debugging
      if (err.response?.data?.stack) {
        console.error('Error stack:', err.response?.data?.stack);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation
    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (signUpData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setLoading(true);

    try {
      const response = await api.post('/auth/signup', {
        email: signUpData.email,
        password: signUpData.password,
        firstName: signUpData.firstName,
        lastName: signUpData.lastName,
        phone: signUpData.phone || undefined,
        whatsapp: signUpData.whatsapp || undefined,
        role: signUpData.role,
        department: signUpData.department || undefined,
        country: signUpData.country || undefined,
        city: signUpData.city || undefined,
        address: signUpData.address || undefined,
      });
      
      setSuccess(response.data.message);
      // Reset form
      setSignUpData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        whatsapp: '',
        password: '',
        confirmPassword: '',
        role: 'STAFF',
        department: '',
        country: '',
        city: '',
        address: '',
      });
      
      // Switch to login after 3 seconds
      setTimeout(() => {
        setIsSignUp(false);
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  console.log('Login component: About to render JSX');
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4" 
      style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#111827', 
        padding: '48px 16px',
        width: '100%',
        position: 'relative',
        zIndex: 1
      }}
    >
      <div 
        className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-700"
        style={{
          maxWidth: '28rem',
          width: '100%',
          backgroundColor: '#1f2937',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          padding: '2rem',
          border: '1px solid #374151',
          position: 'relative',
          zIndex: 2
        }}
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" showText={false} />
          </div>
          <h2 className="text-xl text-gray-200 font-medium">Global Staff Platform</h2>
          <p className="text-sm text-gray-400 mt-2">Unified Digital Workplace</p>
        </div>

        {/* Toggle between Login and Sign Up */}
        <div className="flex mb-6 border-b border-gray-700">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              !isSignUp
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              isSignUp
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/50 border border-green-700 text-green-200 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {!isSignUp ? (
          // Login Form
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
                placeholder="your.email@inara.org"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          // Sign Up Form
          <div className="max-h-[600px] overflow-y-auto pr-2">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">First Name *</label>
                <input
                  type="text"
                  value={signUpData.firstName}
                  onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Last Name *</label>
                <input
                  type="text"
                  value={signUpData.lastName}
                  onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
              <input
                type="email"
                value={signUpData.email}
                onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
                placeholder="your.email@inara.org"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={signUpData.phone}
                  onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">WhatsApp Number</label>
                <input
                  type="tel"
                  value={signUpData.whatsapp}
                  onChange={(e) => setSignUpData({ ...signUpData, whatsapp: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
              <select
                value={signUpData.department}
                onChange={(e) => setSignUpData({ ...signUpData, department: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select Department</option>
                {departments.map((dept: any) => (
                  <option key={dept.key || dept.value} value={dept.key || dept.value}>
                    {dept.value}
                  </option>
                ))}
                {departments.length === 0 && (
                  <>
                    <option value="HR">HR</option>
                    <option value="FINANCE">FINANCE</option>
                    <option value="PROCUREMENT">PROCUREMENT</option>
                    <option value="PROGRAMS">PROGRAMS</option>
                    <option value="MEAL">MEAL</option>
                    <option value="IT">IT</option>
                    <option value="OPERATIONS">OPERATIONS</option>
                  </>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Country *</label>
                <select
                  value={signUpData.country}
                  onChange={(e) => setSignUpData({ ...signUpData, country: e.target.value, city: '' })}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Country</option>
                  {countries.map((country: any) => (
                    <option key={country.key || country.value} value={country.key || country.value}>
                      {country.value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">City/Province</label>
                <select
                  value={signUpData.city}
                  onChange={(e) => setSignUpData({ ...signUpData, city: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select City</option>
                  {cities
                    .filter((city: any) => !signUpData.country || city.metadata?.country === signUpData.country)
                    .map((city: any) => (
                      <option key={city.key || city.value} value={city.key || city.value}>
                        {city.value}
                      </option>
                    ))}
                </select>
                {cities.filter((c: any) => !signUpData.country || c.metadata?.country === signUpData.country).length === 0 && (
                  <input
                    type="text"
                    value={signUpData.city}
                    onChange={(e) => setSignUpData({ ...signUpData, city: e.target.value })}
                    className="w-full mt-2 px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
                    placeholder="Enter city name"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
              <textarea
                value={signUpData.address}
                onChange={(e) => setSignUpData({ ...signUpData, address: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
                placeholder="Street address, building, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password *</label>
              <input
                type="password"
                value={signUpData.password}
                onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                required
                minLength={8}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
                placeholder="At least 8 characters"
              />
              <p className="text-xs text-gray-400 mt-1">Password must be at least 8 characters long</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password *</label>
              <input
                type="password"
                value={signUpData.confirmPassword}
                onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>

            <p className="text-xs text-gray-400 text-center mt-4">
              Your account will be reviewed by an administrator. You'll be notified once approved.
            </p>
          </form>
          </div>
        )}

        {!isSignUp && (
          <div className="mt-6 text-center text-sm text-gray-400">
            <p>Don't have an account? <button onClick={() => setIsSignUp(true)} className="text-primary-500 hover:text-primary-400">Sign up here</button></p>
          </div>
        )}
      </div>
    </div>
  );
}

