import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from 'react-query';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
export default function UserProfile() {
    const { user } = useAuthStore();
    const { data: achievementsData } = useQuery('achievements', async () => {
        try {
            const res = await api.get('/achievements');
            return res.data;
        }
        catch {
            return { achievements: [] };
        }
    });
    const { data: activityData } = useQuery('user-activity', async () => {
        try {
            const res = await api.get('/activity?limit=20');
            return res.data;
        }
        catch {
            return { activities: [] };
        }
    });
    const achievements = achievementsData?.achievements || [];
    const activities = activityData?.activities || [];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "My Profile" }), _jsx("p", { className: "text-gray-400 mt-2", children: "View your profile and achievements" })] }), _jsx("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: _jsxs("div", { className: "flex items-start space-x-6", children: [_jsxs("div", { className: "w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center text-white text-3xl font-bold", children: [user?.firstName[0], user?.lastName[0]] }), _jsxs("div", { className: "flex-1", children: [_jsxs("h2", { className: "text-2xl font-bold text-white", children: [user?.firstName, " ", user?.lastName] }), _jsx("p", { className: "text-gray-400", children: user?.email }), _jsxs("div", { className: "mt-4 grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "Role" }), _jsx("p", { className: "text-white font-medium", children: user?.role })] }), user?.department && (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "Department" }), _jsx("p", { className: "text-white font-medium", children: user.department })] })), user?.country && (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "Country" }), _jsx("p", { className: "text-white font-medium", children: user.country })] })), user?.city && (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "City" }), _jsx("p", { className: "text-white font-medium", children: user.city })] }))] })] })] }) }), achievements.length > 0 && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: "Achievements" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4", children: achievements.map((achievement) => (_jsxs("div", { className: "bg-gray-700 rounded-lg p-4 text-center hover:bg-gray-600 transition-colors", children: [_jsx("div", { className: "text-4xl mb-2", children: achievement.icon || '🏆' }), _jsx("p", { className: "text-sm font-medium text-white", children: achievement.title }), achievement.description && (_jsx("p", { className: "text-xs text-gray-400 mt-1", children: achievement.description })), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: new Date(achievement.earnedAt).toLocaleDateString() })] }, achievement.id))) })] })), activities.length > 0 && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: "Recent Activity" }), _jsx("div", { className: "space-y-3", children: activities.map((activity) => (_jsxs("div", { className: "flex items-start space-x-3 pb-3 border-b border-gray-700 last:border-0", children: [_jsxs("div", { className: "w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-semibold", children: [activity.user.firstName[0], activity.user.lastName[0]] }), _jsxs("div", { className: "flex-1", children: [_jsxs("p", { className: "text-sm text-gray-200", children: [activity.action.replace('_', ' '), activity.resourceType && (_jsxs("span", { className: "text-gray-400", children: [" ", activity.resourceType] }))] }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: new Date(activity.createdAt).toLocaleString() })] })] }, activity.id))) })] }))] }));
}
