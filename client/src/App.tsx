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

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore();
  
  console.log('PrivateRoute: Checking auth...', { hasToken: !!token, hasUser: !!user });
  
  if (!token || !user) {
    console.log('PrivateRoute: Not authenticated, redirecting to /login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('PrivateRoute: Authenticated, rendering children');
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="work" element={<WorkTab />} />
            <Route path="training" element={<TrainingTab />} />
            <Route path="orientation" element={<OrientationTab />} />
            <Route path="policies" element={<PoliciesTab />} />
            <Route path="library" element={<LibraryTab />} />
            <Route path="news" element={<NewsTab />} />
            <Route path="suggestions" element={<SuggestionsTab />} />
            <Route path="surveys" element={<SurveysTab />} />
            <Route path="market" element={<MarketTab />} />
            <Route path="templates" element={<TemplatesTab />} />
            <Route path="bookmarks" element={<Bookmarks />} />
            <Route path="learning" element={<LearningDashboard />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="admin" element={<AdminPanel />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

