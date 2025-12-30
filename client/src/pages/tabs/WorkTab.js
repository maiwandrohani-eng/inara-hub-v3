import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from 'react-query';
import { useState } from 'react';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
export default function WorkTab() {
    const [accessing, setAccessing] = useState(null);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'COUNTRY_DIRECTOR' || user?.role === 'DEPARTMENT_HEAD';
    const { data, isLoading } = useQuery('work-systems', async () => {
        const res = await api.get('/work/systems');
        return res.data;
    });
    const { data: analytics } = useQuery('work-analytics', async () => {
        const res = await api.get('/analytics/tab/work');
        return res.data;
    }, { enabled: isAdmin && showAnalytics });
    const handleAccess = async (systemId) => {
        setAccessing(systemId);
        try {
            const res = await api.get(`/work/systems/${systemId}/access`);
            if (res.data.hasAccess) {
                window.open(res.data.system.url, '_blank');
            }
            else {
                alert(`Access denied:\n${res.data.blockers.join('\n')}`);
            }
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to access system');
        }
        finally {
            setAccessing(null);
        }
    };
    if (isLoading) {
        return _jsx("div", { className: "text-center py-12 text-gray-400", children: "Loading work systems..." });
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Work Systems" }), _jsx("p", { className: "text-gray-400 mt-2", children: "Access INARA's operational systems" })] }), isAdmin && (_jsxs("button", { onClick: () => setShowAnalytics(!showAnalytics), className: "px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm", children: [showAnalytics ? 'Hide' : 'Show', " Analytics"] }))] }), isAdmin && showAnalytics && analytics && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: "Work Systems Analytics" }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-3", children: "Top Users" }), _jsxs("div", { className: "space-y-2", children: [analytics.topUsers?.map((user, idx) => (_jsxs("div", { className: "flex justify-between items-center bg-gray-700 p-3 rounded", children: [_jsxs("span", { className: "text-gray-200", children: [user.firstName, " ", user.lastName] }), _jsxs("span", { className: "text-primary-500 font-medium", children: [user.accessCount, " accesses"] })] }, user.id || idx))), (!analytics.topUsers || analytics.topUsers.length === 0) && (_jsx("p", { className: "text-gray-400 text-sm", children: "No data available" }))] })] })] })), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: data?.systems?.map((system) => (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6 hover:border-primary-500 transition-all", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-2", children: system.name }), system.description && (_jsx("p", { className: "text-sm text-gray-400 mb-4", children: system.description })), _jsx("button", { onClick: () => handleAccess(system.id), disabled: accessing === system.id, className: "w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: accessing === system.id ? 'Checking access...' : 'Access System' })] }, system.id))) }), (!data?.systems || data.systems.length === 0) && (_jsx("div", { className: "bg-yellow-900/30 border border-yellow-700 rounded-lg p-4", children: _jsx("p", { className: "text-yellow-300", children: "No work systems configured. Contact your administrator." }) }))] }));
}
