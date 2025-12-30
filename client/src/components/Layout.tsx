import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import INARABot from './INARABot';
import Logo from './Logo';
import NotificationCenter from './NotificationCenter';
import GlobalSearch from './GlobalSearch';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const tabs = [
  { id: 'orientation', name: 'Orientation' }, // First after Dashboard
  { id: 'work', name: 'Work' },
  { id: 'training', name: 'Training' },
  { id: 'policies', name: 'Policies' },
  { id: 'library', name: 'Library' },
  { id: 'news', name: 'News' },
  { id: 'suggestions', name: 'Suggestions' },
  { id: 'surveys', name: 'Surveys' },
  { id: 'market', name: 'Market' },
  { id: 'templates', name: 'Templates' },
  { id: 'bookmarks', name: 'Bookmarks' },
];

export default function Layout() {
  console.log('Layout component: Rendering...');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  useKeyboardShortcuts();

  const currentTab = location.pathname.split('/')[1] || 'dashboard';
  console.log('Layout component: Current tab:', currentTab, 'Location:', location.pathname);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gray-100 dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <Logo size="lg" showText={false} />
              <div>
                <div className="flex items-center">
                  <span className="text-xl font-normal text-gray-900 dark:text-white">INARA</span>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Global Staff Platform</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4 flex-1 justify-end">
              <GlobalSearch />
              <LanguageSwitcher />
              <ThemeToggle />
              <NotificationCenter />
              <button
                onClick={() => navigate('/profile')}
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                {user?.firstName} {user?.lastName}
              </button>
              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  Admin Panel
                </button>
              )}
              <button
                onClick={logout}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            <button
              onClick={() => navigate('/')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                currentTab === 'dashboard' || currentTab === ''
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Dashboard
            </button>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => navigate(`/${tab.id}`)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  currentTab === tab.id
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* INARA Bot */}
      <INARABot />
    </div>
  );
}

