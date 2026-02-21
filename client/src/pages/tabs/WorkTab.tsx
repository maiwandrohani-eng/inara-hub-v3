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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data?.systems?.map((system: any) => (
          <div
            key={system.id}
            className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6 hover:border-primary-500 transition-all"
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              {system.name}
            </h3>
            {system.description && (
              <p className="text-sm text-gray-400 mb-4">{system.description}</p>
            )}
            <button
              onClick={() => handleAccess(system.id)}
              disabled={accessing === system.id}
              className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {accessing === system.id ? 'Checking access...' : 'Access System'}
            </button>
          </div>
        ))}
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

