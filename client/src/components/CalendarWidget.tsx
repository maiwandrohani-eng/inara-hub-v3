import { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../api/client';

export default function CalendarWidget() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

  const { data } = useQuery(
    ['calendar', startOfMonth.toISOString(), endOfMonth.toISOString()],
    async () => {
      const res = await api.get(
        `/calendar?start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`
      );
      return res.data;
    }
  );

  const events = data?.events || [];

  const getEventsForDate = (date: Date) => {
    return events.filter((event: any) => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction: number) => {
    setSelectedDate(new Date(currentYear, currentMonth + direction, 1));
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Calendar</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-1 text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => navigateMonth(1)}
            className="p-1 text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-lg font-semibold text-white">
          {monthNames[currentMonth]} {currentYear}
        </h4>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
          <div key={`empty-${idx}`} className="aspect-square" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const date = new Date(currentYear, currentMonth, day);
          const dayEvents = getEventsForDate(date);
          const isToday =
            date.getDate() === new Date().getDate() &&
            date.getMonth() === new Date().getMonth() &&
            date.getFullYear() === new Date().getFullYear();

          return (
            <div
              key={day}
              className={`aspect-square p-1 border border-gray-700 rounded ${
                isToday ? 'bg-primary-500/20 border-primary-500' : 'bg-gray-700/50'
              }`}
            >
              <div className={`text-xs ${isToday ? 'text-primary-300 font-bold' : 'text-gray-300'}`}>
                {day}
              </div>
              {dayEvents.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {dayEvents.slice(0, 2).map((event: any) => (
                    <div
                      key={event.id}
                      className="text-[10px] bg-primary-500 text-white px-1 rounded truncate"
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-primary-400">+{dayEvents.length - 2}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upcoming Events */}
      {events.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-white mb-3">Upcoming Events</h4>
          <div className="space-y-2">
            {events.slice(0, 5).map((event: any) => (
              <div key={event.id} className="bg-gray-700 rounded p-2">
                <p className="text-xs font-medium text-white">{event.title}</p>
                <p className="text-xs text-gray-400">
                  {new Date(event.startDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

