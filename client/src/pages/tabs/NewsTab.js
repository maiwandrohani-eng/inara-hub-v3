import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import CommentsSection from '../../components/CommentsSection';
export default function NewsTab() {
    const [selectedNews, setSelectedNews] = useState(null);
    const [showConfirmations, setShowConfirmations] = useState(null);
    const [priorityFilter, setPriorityFilter] = useState('all');
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'COUNTRY_DIRECTOR' || user?.role === 'DEPARTMENT_HEAD';
    const { data, isLoading } = useQuery('news', async () => {
        const res = await api.get('/news');
        return res.data;
    });
    const confirmMutation = useMutation(async (newsId) => {
        const res = await api.post(`/news/${newsId}/confirm`);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['news'] });
        },
    });
    const { data: confirmationData } = useQuery(['news-confirmations', showConfirmations], async () => {
        if (!showConfirmations)
            return null;
        const res = await api.get(`/news/${showConfirmations}/confirmations`);
        return res.data;
    }, { enabled: !!showConfirmations && isAdmin });
    const allNews = data?.news || [];
    const filteredNews = useMemo(() => {
        if (priorityFilter === 'all')
            return allNews;
        return allNews.filter((item) => item.priority === priorityFilter);
    }, [allNews, priorityFilter]);
    // Extract unique priorities
    const priorities = useMemo(() => {
        const prioritySet = new Set();
        allNews.forEach((item) => {
            if (item.priority)
                prioritySet.add(item.priority);
        });
        return Array.from(prioritySet).sort();
    }, [allNews]);
    const handleConfirm = (newsId) => {
        confirmMutation.mutate(newsId);
    };
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-900/30 text-red-300 border-red-700';
            case 'high':
                return 'bg-orange-900/30 text-orange-300 border-orange-700';
            case 'normal':
                return 'bg-blue-900/30 text-blue-300 border-blue-700';
            default:
                return 'bg-gray-700 text-gray-300 border-gray-600';
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex justify-between items-center", children: _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "News & Announcements" }), _jsx("p", { className: "text-gray-400 mt-2", children: "Stay updated with INARA announcements" })] }) }), allNews.length > 0 && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-4 space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "text-sm text-gray-400", children: "Priority:" }), _jsxs("button", { onClick: () => setPriorityFilter('all'), className: `px-3 py-1 rounded-full text-sm transition-colors ${priorityFilter === 'all'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: ["All (", allNews.length, ")"] }), priorities.map((priority) => {
                                const count = allNews.filter((item) => item.priority === priority).length;
                                return (_jsxs("button", { onClick: () => setPriorityFilter(priority), className: `px-3 py-1 rounded-full text-sm transition-colors capitalize ${priorityFilter === priority
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: [priority, " (", count, ")"] }, priority));
                            })] }), _jsxs("div", { className: "text-sm text-gray-400", children: ["Showing ", _jsx("strong", { className: "text-white", children: filteredNews.length }), " of", ' ', _jsx("strong", { className: "text-white", children: allNews.length }), " announcements"] })] })), isLoading ? (_jsx("div", { className: "text-center py-12", children: "Loading news..." })) : allNews.length === 0 ? (_jsx("div", { className: "bg-gray-900 border border-gray-700 rounded-lg p-8 text-center", children: _jsx("p", { className: "text-gray-400", children: "No announcements at this time." }) })) : (_jsx("div", { className: "space-y-4", children: filteredNews.map((item) => (_jsx("div", { className: `bg-gray-800 rounded-lg shadow border-l-4 ${item.priority === 'urgent'
                        ? 'border-red-500'
                        : item.priority === 'high'
                            ? 'border-orange-500'
                            : 'border-blue-500'}`, children: _jsxs("div", { className: "p-6", children: [_jsx("div", { className: "flex items-start justify-between mb-4", children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-2", children: [_jsx("h3", { className: "text-xl font-bold text-white", children: item.title }), _jsx("span", { className: `px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(item.priority)}`, children: item.priority.toUpperCase() })] }), item.summary && (_jsx("p", { className: "text-gray-300 mb-3", children: item.summary })), _jsx("div", { className: "text-gray-200 prose prose-invert max-w-none", dangerouslySetInnerHTML: { __html: item.content } }), _jsxs("div", { className: "flex items-center justify-between mt-4 text-xs text-gray-400", children: [_jsxs("span", { children: ["Published: ", new Date(item.publishedAt).toLocaleDateString()] }), _jsxs("span", { children: [item.confirmationCount || 0, " staff confirmed"] })] })] }) }), _jsx("div", { className: "flex items-center justify-between mt-4 pt-4 border-t border-gray-700", children: _jsxs("div", { className: "flex space-x-2", children: [!item.isConfirmed && (_jsx("button", { onClick: () => handleConfirm(item.id), disabled: confirmMutation.isLoading, className: "px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 text-sm", children: confirmMutation.isLoading ? 'Confirming...' : '✓ Confirm Read' })), item.isConfirmed && (_jsx("span", { className: "px-4 py-2 bg-green-900/30 text-green-300 rounded-lg text-sm", children: "\u2713 Confirmed" })), isAdmin && (_jsxs("button", { onClick: () => setShowConfirmations(showConfirmations === item.id ? null : item.id), className: "px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm", children: ["View Confirmations (", item.confirmationCount || 0, ")"] })), _jsx("button", { onClick: () => setSelectedNews(selectedNews === item.id ? null : item.id), className: "px-4 py-2 text-gray-400 hover:text-white text-sm", children: selectedNews === item.id ? 'Hide Comments' : 'Comments' })] }) }), isAdmin && showConfirmations === item.id && confirmationData && (_jsxs("div", { className: "mt-4 pt-4 border-t border-gray-700", children: [_jsx("h4", { className: "text-lg font-semibold text-white mb-3", children: "Confirmation Status" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs("h5", { className: "text-sm font-medium text-green-300 mb-2", children: ["Confirmed (", confirmationData.confirmedCount, ")"] }), _jsx("div", { className: "space-y-1 max-h-48 overflow-y-auto", children: confirmationData.confirmed.map((user) => (_jsxs("div", { className: "bg-green-900/20 text-green-200 p-2 rounded text-sm", children: [user.firstName, " ", user.lastName, user.department && ` - ${user.department}`] }, user.id))) })] }), _jsxs("div", { children: [_jsxs("h5", { className: "text-sm font-medium text-red-300 mb-2", children: ["Not Confirmed (", confirmationData.notConfirmedCount, ")"] }), _jsx("div", { className: "space-y-1 max-h-48 overflow-y-auto", children: confirmationData.notConfirmed.map((user) => (_jsxs("div", { className: "bg-red-900/20 text-red-200 p-2 rounded text-sm", children: [user.firstName, " ", user.lastName, user.department && ` - ${user.department}`] }, user.id))) })] })] })] })), selectedNews === item.id && (_jsx("div", { className: "mt-4 pt-4 border-t border-gray-700", children: _jsx(CommentsSection, { resourceType: "news", resourceId: item.id }) }))] }) }, item.id))) }))] }));
}
