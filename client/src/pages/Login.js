import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
    const { data: departmentsData } = useQuery('config-departments', async () => {
        try {
            const res = await api.get('/config/department');
            return res.data;
        }
        catch {
            return { configs: [] };
        }
    }, { enabled: isSignUp, retry: false });
    const { data: countriesData } = useQuery('config-countries', async () => {
        try {
            const res = await api.get('/config/country');
            return res.data;
        }
        catch {
            return { configs: [] };
        }
    }, { enabled: isSignUp, retry: false });
    const { data: citiesData } = useQuery('config-cities', async () => {
        try {
            const res = await api.get('/config/city');
            return res.data;
        }
        catch {
            return { configs: [] };
        }
    }, { enabled: isSignUp, retry: false });
    const departments = departmentsData?.configs || [];
    const countries = countriesData?.configs || [];
    const cities = citiesData?.configs || [];
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            setAuth(response.data.user, response.data.token);
            navigate('/');
        }
        catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSignUp = async (e) => {
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
        }
        catch (err) {
            setError(err.response?.data?.message || 'Sign up failed');
        }
        finally {
            setLoading(false);
        }
    };
    console.log('Login component: About to render JSX');
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4", style: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#111827',
            padding: '48px 16px',
            width: '100%',
            position: 'relative',
            zIndex: 1
        }, children: _jsxs("div", { className: "max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-700", style: {
                maxWidth: '28rem',
                width: '100%',
                backgroundColor: '#1f2937',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                padding: '2rem',
                border: '1px solid #374151',
                position: 'relative',
                zIndex: 2
            }, children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "flex justify-center mb-4", children: _jsx(Logo, { size: "lg", showText: false }) }), _jsx("h2", { className: "text-xl text-gray-200 font-medium", children: "Global Staff Platform" }), _jsx("p", { className: "text-sm text-gray-400 mt-2", children: "Unified Digital Workplace" })] }), _jsxs("div", { className: "flex mb-6 border-b border-gray-700", children: [_jsx("button", { type: "button", onClick: () => {
                                setIsSignUp(false);
                                setError('');
                                setSuccess('');
                            }, className: `flex-1 py-2 text-sm font-medium transition-colors ${!isSignUp
                                ? 'text-primary-500 border-b-2 border-primary-500'
                                : 'text-gray-400 hover:text-gray-200'}`, children: "Sign In" }), _jsx("button", { type: "button", onClick: () => {
                                setIsSignUp(true);
                                setError('');
                                setSuccess('');
                            }, className: `flex-1 py-2 text-sm font-medium transition-colors ${isSignUp
                                ? 'text-primary-500 border-b-2 border-primary-500'
                                : 'text-gray-400 hover:text-gray-200'}`, children: "Sign Up" })] }), error && (_jsx("div", { className: "bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded mb-4", children: error })), success && (_jsx("div", { className: "bg-green-900/50 border border-green-700 text-green-200 px-4 py-3 rounded mb-4", children: success })), !isSignUp ? (
                // Login Form
                _jsxs("form", { onSubmit: handleLogin, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-300 mb-2", children: "Email" }), _jsx("input", { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400", placeholder: "your.email@inara.org" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-300 mb-2", children: "Password" }), _jsx("input", { id: "password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: loading ? 'Signing in...' : 'Sign In' })] })) : (
                // Sign Up Form
                _jsx("div", { className: "max-h-[600px] overflow-y-auto pr-2", children: _jsxs("form", { onSubmit: handleSignUp, className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "First Name *" }), _jsx("input", { type: "text", value: signUpData.firstName, onChange: (e) => setSignUpData({ ...signUpData, firstName: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Last Name *" }), _jsx("input", { type: "text", value: signUpData.lastName, onChange: (e) => setSignUpData({ ...signUpData, lastName: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Email *" }), _jsx("input", { type: "email", value: signUpData.email, onChange: (e) => setSignUpData({ ...signUpData, email: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400", placeholder: "your.email@inara.org" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Phone Number" }), _jsx("input", { type: "tel", value: signUpData.phone, onChange: (e) => setSignUpData({ ...signUpData, phone: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400", placeholder: "+1234567890" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "WhatsApp Number" }), _jsx("input", { type: "tel", value: signUpData.whatsapp, onChange: (e) => setSignUpData({ ...signUpData, whatsapp: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400", placeholder: "+1234567890" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Department" }), _jsxs("select", { value: signUpData.department, onChange: (e) => setSignUpData({ ...signUpData, department: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500", children: [_jsx("option", { value: "", children: "Select Department" }), departments.map((dept) => (_jsx("option", { value: dept.key || dept.value, children: dept.value }, dept.key || dept.value))), departments.length === 0 && (_jsxs(_Fragment, { children: [_jsx("option", { value: "HR", children: "HR" }), _jsx("option", { value: "FINANCE", children: "FINANCE" }), _jsx("option", { value: "PROCUREMENT", children: "PROCUREMENT" }), _jsx("option", { value: "PROGRAMS", children: "PROGRAMS" }), _jsx("option", { value: "MEAL", children: "MEAL" }), _jsx("option", { value: "IT", children: "IT" }), _jsx("option", { value: "OPERATIONS", children: "OPERATIONS" })] }))] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Country *" }), _jsxs("select", { value: signUpData.country, onChange: (e) => setSignUpData({ ...signUpData, country: e.target.value, city: '' }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500", children: [_jsx("option", { value: "", children: "Select Country" }), countries.map((country) => (_jsx("option", { value: country.key || country.value, children: country.value }, country.key || country.value)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "City/Province" }), _jsxs("select", { value: signUpData.city, onChange: (e) => setSignUpData({ ...signUpData, city: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500", children: [_jsx("option", { value: "", children: "Select City" }), cities
                                                        .filter((city) => !signUpData.country || city.metadata?.country === signUpData.country)
                                                        .map((city) => (_jsx("option", { value: city.key || city.value, children: city.value }, city.key || city.value)))] }), cities.filter((c) => !signUpData.country || c.metadata?.country === signUpData.country).length === 0 && (_jsx("input", { type: "text", value: signUpData.city, onChange: (e) => setSignUpData({ ...signUpData, city: e.target.value }), className: "w-full mt-2 px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400", placeholder: "Enter city name" }))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Address" }), _jsx("textarea", { value: signUpData.address, onChange: (e) => setSignUpData({ ...signUpData, address: e.target.value }), rows: 2, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400", placeholder: "Street address, building, etc." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Password *" }), _jsx("input", { type: "password", value: signUpData.password, onChange: (e) => setSignUpData({ ...signUpData, password: e.target.value }), required: true, minLength: 8, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400", placeholder: "At least 8 characters" }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: "Password must be at least 8 characters long" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Confirm Password *" }), _jsx("input", { type: "password", value: signUpData.confirmPassword, onChange: (e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400", placeholder: "Confirm your password" })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: loading ? 'Creating account...' : 'Sign Up' }), _jsx("p", { className: "text-xs text-gray-400 text-center mt-4", children: "Your account will be reviewed by an administrator. You'll be notified once approved." })] }) })), !isSignUp && (_jsx("div", { className: "mt-6 text-center text-sm text-gray-400", children: _jsxs("p", { children: ["Don't have an account? ", _jsx("button", { onClick: () => setIsSignUp(true), className: "text-primary-500 hover:text-primary-400", children: "Sign up here" })] }) }))] }) }));
}
