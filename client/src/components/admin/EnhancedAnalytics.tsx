import { useQuery, useQueryClient } from 'react-query';
import { useState } from 'react';
import api from '../../api/client';

export default function EnhancedAnalytics() {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'content' | 'engagement'>('overview');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const queryClient = useQueryClient();

  const { data: overviewData, isLoading: overviewLoading, refetch: refetchOverview } = useQuery(
    ['analytics-overview', dateRange],
    async () => {
      const res = await api.get(`/analytics/overview?range=${dateRange}`);
      return res.data;
    },
    {
      refetchOnWindowFocus: true,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const { data: userData, isLoading: userLoading, refetch: refetchUsers } = useQuery(
    ['analytics-users', dateRange],
    async () => {
      const res = await api.get(`/analytics/users?range=${dateRange}`);
      return res.data;
    },
    {
      refetchOnWindowFocus: true,
      refetchInterval: 30000,
    }
  );

  const { data: contentData, isLoading: contentLoading, refetch: refetchContent } = useQuery(
    ['analytics-content', dateRange],
    async () => {
      const res = await api.get(`/analytics/content?range=${dateRange}`);
      return res.data;
    },
    {
      refetchOnWindowFocus: true,
      refetchInterval: 30000,
    }
  );

  const { data: engagementData, isLoading: engagementLoading, refetch: refetchEngagement } = useQuery(
    ['analytics-engagement', dateRange],
    async () => {
      const res = await api.get(`/analytics/engagement?range=${dateRange}`);
      return res.data;
    },
    {
      refetchOnWindowFocus: true,
      refetchInterval: 30000,
    }
  );

  const handleRefresh = () => {
    queryClient.invalidateQueries('analytics-overview');
    queryClient.invalidateQueries('analytics-users');
    queryClient.invalidateQueries('analytics-content');
    queryClient.invalidateQueries('analytics-engagement');
    refetchOverview();
    refetchUsers();
    refetchContent();
    refetchEngagement();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Enhanced Analytics</h2>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-700">
        {(['overview', 'users', 'content', 'engagement'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              selectedTab === tab
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {overviewLoading ? (
            <div className="text-center py-12 text-gray-400">Loading analytics...</div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
                  <p className="text-sm text-gray-400">Total Users</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {overviewData?.metrics?.totalUsers || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {overviewData?.metrics?.activeUsers || 0} active
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
                  <p className="text-sm text-gray-400">Training Completions</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {overviewData?.metrics?.trainingCompletions || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {overviewData?.metrics?.trainingCompletionRate || 0}% rate
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
                  <p className="text-sm text-gray-400">Policy Certifications</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {overviewData?.metrics?.policyCertifications || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {overviewData?.metrics?.policyCertificationRate || 0}% rate
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
                  <p className="text-sm text-gray-400">Platform Engagement</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {overviewData?.metrics?.engagementScore || 0}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Average score</p>
                </div>
              </div>

              {/* Activity Chart */}
              <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Activity Over Time</h3>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  Chart visualization would go here
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Users Tab */}
      {selectedTab === 'users' && (
        <div className="space-y-6">
          {userLoading ? (
            <div className="text-center py-12 text-gray-400">Loading user analytics...</div>
          ) : (
            <>
              <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">New Users</p>
                    <p className="text-2xl font-bold text-white">
                      {userData?.growth?.newUsers || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Active Users</p>
                    <p className="text-2xl font-bold text-white">
                      {userData?.growth?.activeUsers || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Retention Rate</p>
                    <p className="text-2xl font-bold text-white">
                      {userData?.growth?.retentionRate || 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Avg. Session</p>
                    <p className="text-2xl font-bold text-white">
                      {userData?.growth?.avgSessionTime || 0}m
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Top Performers</h3>
                <div className="space-y-2">
                  {userData?.topPerformers?.map((user: any, idx: number) => (
                    <div
                      key={user.id || idx}
                      className="flex justify-between items-center bg-gray-700 p-3 rounded"
                    >
                      <span className="text-gray-200">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="text-primary-500 font-medium">
                        Score: {user.score || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Content Tab */}
      {selectedTab === 'content' && (
        <div className="space-y-6">
          {contentLoading ? (
            <div className="text-center py-12 text-gray-400">Loading content analytics...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
                  <p className="text-sm text-gray-400">Most Viewed</p>
                  <p className="text-2xl font-bold text-white mt-2">
                    {contentData?.mostViewed?.title || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {contentData?.mostViewed?.views || 0} views
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
                  <p className="text-sm text-gray-400">Most Downloaded</p>
                  <p className="text-2xl font-bold text-white mt-2">
                    {contentData?.mostDownloaded?.title || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {contentData?.mostDownloaded?.downloads || 0} downloads
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
                  <p className="text-sm text-gray-400">Most Commented</p>
                  <p className="text-2xl font-bold text-white mt-2">
                    {contentData?.mostCommented?.title || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {contentData?.mostCommented?.comments || 0} comments
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Engagement Tab */}
      {selectedTab === 'engagement' && (
        <div className="space-y-6">
          {engagementLoading ? (
            <div className="text-center py-12 text-gray-400">Loading engagement analytics...</div>
          ) : (
            <>
              <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Engagement Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Daily Active</p>
                    <p className="text-2xl font-bold text-white">
                      {engagementData?.dailyActive || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Weekly Active</p>
                    <p className="text-2xl font-bold text-white">
                      {engagementData?.weeklyActive || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Avg. Time</p>
                    <p className="text-2xl font-bold text-white">
                      {engagementData?.avgTime || 0}m
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Bounce Rate</p>
                    <p className="text-2xl font-bold text-white">
                      {engagementData?.bounceRate || 0}%
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

