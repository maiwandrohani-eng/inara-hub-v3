import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../api/client';
export default function CalendarWidget() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const { data } = useQuery(['calendar', startOfMonth.toISOString(), endOfMonth.toISOString()], async () => {
        const res = await api.get(`/calendar?start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`);
        return res.data;
    });
    const events = data?.events || [];
    const getEventsForDate = (date) => {
        return events.filter((event) => {
            const eventDate = new Date(event.startDate);
            return (eventDate.getDate() === date.getDate() &&
                eventDate.getMonth() === date.getMonth() &&
                eventDate.getFullYear() === date.getFullYear());
        });
    };
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const navigateMonth = (direction) => {
        setSelectedDate(new Date(currentYear, currentMonth + direction, 1));
    };
    return (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h3", { className: "text-xl font-bold text-white", children: "Calendar" }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => navigateMonth(-1), className: "p-1 text-gray-400 hover:text-white", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 19l-7-7 7-7" }) }) }), _jsx("button", { onClick: () => navigateMonth(1), className: "p-1 text-gray-400 hover:text-white", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) }) })] })] }), _jsx("div", { className: "mb-4", children: _jsxs("h4", { className: "text-lg font-semibold text-white", children: [monthNames[currentMonth], " ", currentYear] }) }), _jsx("div", { className: "grid grid-cols-7 gap-1 mb-2", children: weekDays.map((day) => (_jsx("div", { className: "text-center text-xs font-medium text-gray-400 py-2", children: day }, day))) }), _jsxs("div", { className: "grid grid-cols-7 gap-1", children: [Array.from({ length: firstDayOfMonth }).map((_, idx) => (_jsx("div", { className: "aspect-square" }, `empty-${idx}`))), Array.from({ length: daysInMonth }).map((_, idx) => {
                        const day = idx + 1;
                        const date = new Date(currentYear, currentMonth, day);
                        const dayEvents = getEventsForDate(date);
                        const isToday = date.getDate() === new Date().getDate() &&
                            date.getMonth() === new Date().getMonth() &&
                            date.getFullYear() === new Date().getFullYear();
                        return (_jsxs("div", { className: `aspect-square p-1 border border-gray-700 rounded ${isToday ? 'bg-primary-500/20 border-primary-500' : 'bg-gray-700/50'}`, children: [_jsx("div", { className: `text-xs ${isToday ? 'text-primary-300 font-bold' : 'text-gray-300'}`, children: day }), dayEvents.length > 0 && (_jsxs("div", { className: "mt-1 space-y-0.5", children: [dayEvents.slice(0, 2).map((event) => (_jsx("div", { className: "text-[10px] bg-primary-500 text-white px-1 rounded truncate", title: event.title, children: event.title }, event.id))), dayEvents.length > 2 && (_jsxs("div", { className: "text-[10px] text-primary-400", children: ["+", dayEvents.length - 2] }))] }))] }, day));
                    })] }), events.length > 0 && (_jsxs("div", { className: "mt-6", children: [_jsx("h4", { className: "text-sm font-semibold text-white mb-3", children: "Upcoming Events" }), _jsx("div", { className: "space-y-2", children: events.slice(0, 5).map((event) => (_jsxs("div", { className: "bg-gray-700 rounded p-2", children: [_jsx("p", { className: "text-xs font-medium text-white", children: event.title }), _jsx("p", { className: "text-xs text-gray-400", children: new Date(event.startDate).toLocaleDateString() })] }, event.id))) })] }))] }));
}
