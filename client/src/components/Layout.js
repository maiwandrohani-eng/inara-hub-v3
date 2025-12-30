import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs("div", { className: "min-h-screen bg-white dark:bg-gray-900", children: [_jsx("header", { className: "bg-gray-100 dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between items-center h-20", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx(Logo, { size: "lg", showText: false }), _jsx("div", { children: _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "text-xl font-normal text-gray-900 dark:text-white", children: "INARA" }), _jsx("span", { className: "ml-2 text-sm text-gray-600 dark:text-gray-400", children: "Global Staff Platform" })] }) })] }), _jsxs("div", { className: "flex items-center space-x-4 flex-1 justify-end", children: [_jsx(GlobalSearch, {}), _jsx(LanguageSwitcher, {}), _jsx(ThemeToggle, {}), _jsx(NotificationCenter, {}), _jsxs("button", { onClick: () => navigate('/profile'), className: "text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white", children: [user?.firstName, " ", user?.lastName] }), user?.role === 'ADMIN' && (_jsx("button", { onClick: () => navigate('/admin'), className: "px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600", children: "Admin Panel" })), _jsx("button", { onClick: logout, className: "px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white", children: "Logout" })] })] }) }) }), _jsx("nav", { className: "bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex space-x-1 overflow-x-auto", children: [_jsx("button", { onClick: () => navigate('/'), className: `px-4 py-3 text-sm font-medium border-b-2 transition-colors ${currentTab === 'dashboard' || currentTab === ''
                                    ? 'border-primary-500 text-primary-500'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'}`, children: "Dashboard" }), tabs.map((tab) => (_jsx("button", { onClick: () => navigate(`/${tab.id}`), className: `px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${currentTab === tab.id
                                    ? 'border-primary-500 text-primary-500'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'}`, children: tab.name }, tab.id)))] }) }) }), _jsx("main", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: _jsx(Outlet, {}) }), _jsx(INARABot, {})] }));
}
