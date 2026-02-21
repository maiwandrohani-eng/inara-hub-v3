import { useQuery } from 'react-query';
import { useState } from 'react';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';

export default function WorkTab() {
  const [accessing, setAccessing] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'COUNTRY_DIRECTOR' || user?.role === 'DEPARTMENT_HEAD';

  const { data, isLoading } = useQuery('work-systems', async () => {
    const res = await api.get('/work/systems');
    return res.data;
  });

  const { data: analytics } = useQuery(
    'work-analytics',
    async () => {
      const res = await api.get('/analytics/tab/work');
      return res.data;
    },
    { enabled: isAdmin && showAnalytics }
  );

  const handleAccess = async (systemId: string) => {
    setAccessing(systemId);
    try {
      const res = await api.get(`/work/systems/${systemId}/access`);
      if (res.data.hasAccess) {
        window.open(res.data.system.url, '_blank');
      } else {
        alert(`Access denied:\n${res.data.blockers.join('\n')}`);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to access system');
    } finally {
      setAccessing(null);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">Loading work systems...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Work Systems</h1>
          <p className="text-gray-400 mt-2">Access INARA's operational systems</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm"
          >
            {showAnalytics ? 'Hide' : 'Show'} Analytics
          </button>
        )}
      </div>

      {/* Analytics Dashboard */}
      {isAdmin && showAnalytics && analytics && (
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Work Systems Analytics</h2>
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Top Users</h3>
            <div className="space-y-2">
              {analytics.topUsers?.map((user: any, idx: number) => (
                <div key={user.id || idx} className="flex justify-between items-center bg-gray-700 p-3 rounded">
                  <span className="text-gray-200">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-primary-500 font-medium">
                    {user.accessCount} accesses
                  </span>
                </div>
              ))}
              {(!analytics.topUsers || analytics.topUsers.length === 0) && (
                <p className="text-gray-400 text-sm">No data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* INARA Form Builder - show as static card if not yet in DB (run seed or add via Admin to manage) */}
        {!data?.systems?.some((s: any) => s.name === 'INARA Form Builder') && (
          <div className="group relative bg-gray-800/90 rounded-xl border border-gray-700/80 overflow-hidden hover:border-gray-600 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300 hover:-translate-y-0.5">
            <div className="h-1.5 bg-gradient-to-r from-inara-magenta to-pink-600" />
            <div className="p-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-inara-magenta to-pink-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                  F
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-white leading-tight group-hover:text-primary-300 transition-colors">
                    INARA Form Builder
                  </h3>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-5 line-clamp-2 leading-relaxed">
                Create and manage forms for data collection
              </p>
              <a
                href="https://forms.inara.org"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gray-700 hover:bg-primary-500/90 text-gray-200 hover:text-white border border-gray-600 hover:border-primary-500 transition-all duration-200 font-medium text-sm"
              >
                Access System
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        )}
        {data?.systems?.map((system: any, index: number) => {
          const accents = [
            'from-primary-500 to-primary-600',
            'from-inara-cyan to-blue-600',
            'from-inara-teal to-emerald-600',
            'from-inara-magenta to-pink-600',
            'from-inara-yellow to-amber-500',
            'from-emerald-500 to-teal-600',
            'from-violet-500 to-purple-600',
            'from-orange-500 to-amber-500',
          ];
          const accent = accents[index % accents.length];
          return (
            <div
              key={system.id}
              className="group relative bg-gray-800/90 rounded-xl border border-gray-700/80 overflow-hidden hover:border-gray-600 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300 hover:-translate-y-0.5"
            >
              {/* Accent bar */}
              <div className={`h-1.5 bg-gradient-to-r ${accent}`} />
              <div className="p-6">
                {/* Icon + Title row */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${accent} flex items-center justify-center text-white text-lg font-bold shadow-lg`}>
                    {system.icon ? (
                      <span>{system.icon}</span>
                    ) : (
                      <span>{system.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-white leading-tight group-hover:text-primary-300 transition-colors">
                      {system.name}
                    </h3>
                  </div>
                </div>
                {system.description && (
                  <p className="text-sm text-gray-500 mb-5 line-clamp-2 leading-relaxed">
                    {system.description}
                  </p>
                )}
                <button
                  onClick={() => handleAccess(system.id)}
                  disabled={accessing === system.id}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gray-700 hover:bg-primary-500/90 text-gray-200 hover:text-white border border-gray-600 hover:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm"
                >
                  {accessing === system.id ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Checking...
                    </>
                  ) : (
                    <>
                      Access System
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {(!data?.systems || data.systems.length === 0) && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
          <p className="text-yellow-300">
            No work systems configured. Contact your administrator.
          </p>
        </div>
      )}
    </div>
  );
}

