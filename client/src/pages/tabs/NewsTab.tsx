import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import CommentsSection from '../../components/CommentsSection';
import ViewToggle from '../../components/ViewToggle';
import { useViewMode } from '../../hooks/useViewMode';

export default function NewsTab() {
  const [selectedNews, setSelectedNews] = useState<string | null>(null);
  const [showConfirmations, setShowConfirmations] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [listViewMode, handleListViewModeChange] = useViewMode('news', 'grid');
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'COUNTRY_DIRECTOR' || user?.role === 'DEPARTMENT_HEAD';

  const { data, isLoading } = useQuery('news', async () => {
    const res = await api.get('/news');
    return res.data;
  });

  const confirmMutation = useMutation(
    async (newsId: string) => {
      const res = await api.post(`/news/${newsId}/confirm`);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['news'] });
      },
    }
  );

  const { data: confirmationData } = useQuery(
    ['news-confirmations', showConfirmations],
    async () => {
      if (!showConfirmations) return null;
      const res = await api.get(`/news/${showConfirmations}/confirmations`);
      return res.data;
    },
    { enabled: !!showConfirmations && isAdmin }
  );

  const allNews = data?.news || [];

  const filteredNews = useMemo(() => {
    if (priorityFilter === 'all') return allNews;
    return allNews.filter((item: any) => item.priority === priorityFilter);
  }, [allNews, priorityFilter]);

  // Extract unique priorities
  const priorities = useMemo(() => {
    const prioritySet = new Set<string>();
    allNews.forEach((item: any) => {
      if (item.priority) prioritySet.add(item.priority);
    });
    return Array.from(prioritySet).sort();
  }, [allNews]);

  const handleConfirm = (newsId: string) => {
    confirmMutation.mutate(newsId);
  };

  const getPriorityColor = (priority: string) => {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">News & Announcements</h1>
          <p className="text-gray-400 mt-2">Stay updated with INARA announcements</p>
        </div>
        <ViewToggle viewMode={listViewMode} onViewModeChange={handleListViewModeChange} />
      </div>

      {/* Enhanced Filters */}
      {allNews.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow p-4 space-y-4">
          {/* Priority Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-400">Priority:</span>
            <button
              onClick={() => setPriorityFilter('all')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                priorityFilter === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All ({allNews.length})
            </button>
            {priorities.map((priority) => {
              const count = allNews.filter((item: any) => item.priority === priority).length;
              return (
                <button
                  key={priority}
                  onClick={() => setPriorityFilter(priority)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors capitalize ${
                    priorityFilter === priority
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {priority} ({count})
                </button>
              );
            })}
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-400">
            Showing <strong className="text-white">{filteredNews.length}</strong> of{' '}
            <strong className="text-white">{allNews.length}</strong> announcements
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">Loading news...</div>
      ) : allNews.length === 0 ? (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">No announcements at this time.</p>
        </div>
      ) : listViewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((item: any) => (
            <div
              key={item.id}
              className={`bg-gray-800 rounded-lg shadow border-l-4 cursor-pointer hover:shadow-lg transition-shadow ${
                item.priority === 'urgent'
                  ? 'border-red-500'
                  : item.priority === 'high'
                  ? 'border-orange-500'
                  : 'border-blue-500'
              }`}
              onClick={() => setSelectedNews(item.id)}
            >
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-white flex-1 line-clamp-2">{item.title}</h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded border whitespace-nowrap ml-2 ${getPriorityColor(
                      item.priority
                    )}`}
                  >
                    {item.priority.toUpperCase()}
                  </span>
                </div>
                {item.summary && (
                  <p className="text-gray-300 mb-3 line-clamp-2 text-sm">{item.summary}</p>
                )}
                <div className="text-gray-400 text-xs mb-3 line-clamp-2">
                  {item.content?.replace(/<[^>]*>/g, '').substring(0, 100)}...
                </div>
                <div className="mt-auto pt-3 border-t border-gray-700 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>
                      {new Date(item.publishedAt).toLocaleDateString()}
                    </span>
                    <span>
                      {item.confirmationCount || 0} confirmed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNews.map((item: any) => (
            <div
              key={item.id}
              className={`bg-gray-800 rounded-lg shadow border-l-4 cursor-pointer hover:shadow-lg transition-shadow ${
                item.priority === 'urgent'
                  ? 'border-red-500'
                  : item.priority === 'high'
                  ? 'border-orange-500'
                  : 'border-blue-500'
              }`}
              onClick={() => setSelectedNews(item.id)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{item.title}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(
                          item.priority
                        )}`}
                      >
                        {item.priority.toUpperCase()}
                      </span>
                    </div>
                    {item.summary && (
                      <p className="text-gray-300 mb-3">{item.summary}</p>
                    )}
                    <div
                      className="text-gray-200 prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                    <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                      <span>
                        Published: {new Date(item.publishedAt).toLocaleDateString()}
                      </span>
                      <span>
                        {item.confirmationCount || 0} staff confirmed
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                  <div className="flex space-x-2">
                    {!item.isConfirmed && (
                      <button
                        onClick={() => handleConfirm(item.id)}
                        disabled={confirmMutation.isLoading}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 text-sm"
                      >
                        {confirmMutation.isLoading ? 'Confirming...' : '✓ Confirm Read'}
                      </button>
                    )}
                    {item.isConfirmed && (
                      <span className="px-4 py-2 bg-green-900/30 text-green-300 rounded-lg text-sm">
                        ✓ Confirmed
                      </span>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => setShowConfirmations(showConfirmations === item.id ? null : item.id)}
                        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm"
                      >
                        View Confirmations ({item.confirmationCount || 0})
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedNews(selectedNews === item.id ? null : item.id)}
                      className="px-4 py-2 text-gray-400 hover:text-white text-sm"
                    >
                      {selectedNews === item.id ? 'Hide Comments' : 'Comments'}
                    </button>
                  </div>
                </div>

                {/* Confirmations List (Admin) */}
                {isAdmin && showConfirmations === item.id && confirmationData && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-white mb-3">
                      Confirmation Status
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-green-300 mb-2">
                          Confirmed ({confirmationData.confirmedCount})
                        </h5>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {confirmationData.confirmed.map((user: any) => (
                            <div
                              key={user.id}
                              className="bg-green-900/20 text-green-200 p-2 rounded text-sm"
                            >
                              {user.firstName} {user.lastName}
                              {user.department && ` - ${user.department}`}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-red-300 mb-2">
                          Not Confirmed ({confirmationData.notConfirmedCount})
                        </h5>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {confirmationData.notConfirmed.map((user: any) => (
                            <div
                              key={user.id}
                              className="bg-red-900/20 text-red-200 p-2 rounded text-sm"
                            >
                              {user.firstName} {user.lastName}
                              {user.department && ` - ${user.department}`}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments Section */}
                {selectedNews === item.id && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <CommentsSection resourceType="news" resourceId={item.id} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

