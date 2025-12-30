import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WorkTab from './pages/tabs/WorkTab';
import TrainingTab from './pages/tabs/TrainingTab';
import OrientationTab from './pages/tabs/OrientationTab';
import PoliciesTab from './pages/tabs/PoliciesTab';
import LibraryTab from './pages/tabs/LibraryTab';
import MarketTab from './pages/tabs/MarketTab';
import TemplatesTab from './pages/tabs/TemplatesTab';
import NewsTab from './pages/tabs/NewsTab';
import SuggestionsTab from './pages/tabs/SuggestionsTab';
import SurveysTab from './pages/tabs/SurveysTab';
import AdminPanel from './pages/AdminPanel';
import Bookmarks from './pages/Bookmarks';
import LearningDashboard from './pages/LearningDashboard';
import UserProfile from './pages/UserProfile';
import Layout from './components/Layout';
const queryClient = new QueryClient();
function PrivateRoute({ children }) {
    const { user, token } = useAuthStore();
    console.log('PrivateRoute: Checking auth...', { hasToken: !!token, hasUser: !!user });
    if (!token || !user) {
        console.log('PrivateRoute: Not authenticated, redirecting to /login');
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    console.log('PrivateRoute: Authenticated, rendering children');
    return _jsx(_Fragment, { children: children });
}
function App() {
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsx(Router, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsxs(Route, { path: "/", element: _jsx(PrivateRoute, { children: _jsx(Layout, {}) }), children: [_jsx(Route, { index: true, element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "work", element: _jsx(WorkTab, {}) }), _jsx(Route, { path: "training", element: _jsx(TrainingTab, {}) }), _jsx(Route, { path: "orientation", element: _jsx(OrientationTab, {}) }), _jsx(Route, { path: "policies", element: _jsx(PoliciesTab, {}) }), _jsx(Route, { path: "library", element: _jsx(LibraryTab, {}) }), _jsx(Route, { path: "news", element: _jsx(NewsTab, {}) }), _jsx(Route, { path: "suggestions", element: _jsx(SuggestionsTab, {}) }), _jsx(Route, { path: "surveys", element: _jsx(SurveysTab, {}) }), _jsx(Route, { path: "market", element: _jsx(MarketTab, {}) }), _jsx(Route, { path: "templates", element: _jsx(TemplatesTab, {}) }), _jsx(Route, { path: "bookmarks", element: _jsx(Bookmarks, {}) }), _jsx(Route, { path: "learning", element: _jsx(LearningDashboard, {}) }), _jsx(Route, { path: "profile", element: _jsx(UserProfile, {}) }), _jsx(Route, { path: "admin", element: _jsx(AdminPanel, {}) })] })] }) }) }));
}
export default App;
