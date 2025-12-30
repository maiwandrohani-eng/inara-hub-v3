import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../api/client';
export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery('notifications', async () => {
        const res = await api.get('/notifications?unreadOnly=false');
        return res.data;
    });
    const markReadMutation = useMutation(async (id) => {
        const res = await api.put(`/notifications/${id}/read`);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
    const markAllReadMutation = useMutation(async () => {
        const res = await api.put('/notifications/read-all');
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
    const notifications = data?.notifications || [];
    const unreadCount = data?.unreadCount || 0;
    return (_jsxs(_Fragment, { children: [_jsxs("button", { onClick: () => setIsOpen(!isOpen), className: "relative p-2 text-gray-300 hover:text-white transition-colors", "aria-label": "Notifications", children: [_jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" }) }), unreadCount > 0 && (_jsx("span", { className: "absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center", children: unreadCount > 9 ? '9+' : unreadCount }))] }), isOpen && (_jsxs("div", { className: "fixed right-4 top-20 w-96 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 z-50 max-h-[600px] flex flex-col", children: [_jsxs("div", { className: "bg-primary-500 text-white p-4 rounded-t-lg flex justify-between items-center", children: [_jsx("h3", { className: "font-bold", children: "Notifications" }), _jsxs("div", { className: "flex space-x-2", children: [unreadCount > 0 && (_jsx("button", { onClick: () => markAllReadMutation.mutate(), className: "text-xs hover:underline", children: "Mark all read" })), _jsx("button", { onClick: () => setIsOpen(false), className: "hover:text-gray-200", children: "\u2715" })] })] }), _jsx("div", { className: "flex-1 overflow-y-auto", children: isLoading ? (_jsx("div", { className: "p-4 text-center text-gray-400", children: "Loading..." })) : notifications.length === 0 ? (_jsx("div", { className: "p-8 text-center text-gray-400", children: "No notifications" })) : (_jsx("div", { className: "divide-y divide-gray-700", children: notifications.map((notification) => (_jsx("div", { className: `p-4 hover:bg-gray-700 cursor-pointer ${!notification.isRead ? 'bg-gray-700/50' : ''}`, onClick: () => {
                                    if (!notification.isRead) {
                                        markReadMutation.mutate(notification.id);
                                    }
                                    if (notification.link) {
                                        window.location.href = notification.link;
                                    }
                                }, children: _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: `flex-shrink-0 w-2 h-2 rounded-full mt-2 ${!notification.isRead ? 'bg-primary-500' : 'bg-transparent'}` }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-white", children: notification.title }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: notification.message }), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: new Date(notification.createdAt).toLocaleString() })] })] }) }, notification.id))) })) })] }))] }));
}
