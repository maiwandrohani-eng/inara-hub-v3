import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';

export default function SuggestionManagement() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery('admin-suggestions', async () => {
    const res = await api.get('/suggestions');
    return res.data;
  });

  const updateStatusMutation = useMutation(
    async ({ id, status }: any) => {
      const res = await api.put(`/suggestions/${id}`, { status });
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-suggestions'] });
        queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      },
      onError: (error: any) => {
        console.error('Error updating status:', error);
        alert('Error updating suggestion status');
      },
    }
  );

  const deleteMutation = useMutation(
    async (id: string) => {
      const res = await api.delete(`/suggestions/${id}`);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-suggestions'] });
        queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      },
      onError: (error: any) => {
        console.error('Error deleting:', error);
        alert('Error deleting suggestion');
      },
    }
  );

  const allSuggestions = data?.suggestions || [];

  // Extract unique statuses and categories
  const { categories } = useMemo(() => {
    const categorySet = new Set<string>();

    allSuggestions.forEach((s: any) => {
      if (s.category) categorySet.add(s.category);
    });

    return {
      categories: Array.from(categorySet),
    };
  }, [allSuggestions]);

  // Filter suggestions
  const filteredSuggestions = useMemo(() => {
    return allSuggestions.filter((s: any) => {
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
      return matchesStatus && matchesCategory;
    });
  }, [allSuggestions, statusFilter, categoryFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-600';
      case 'rejected':
        return 'bg-red-600';
      case 'under_review':
        return 'bg-yellow-600';
      case 'implemented':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Suggestion Management</h2>
        <p className="text-gray-400 mt-1">Review and manage employee suggestions</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg shadow p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
            >
              <option value="all">All Status ({allSuggestions.length})</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="implemented">Implemented</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
            >
              <option value="all">All Categories</option>
              <option value="improvement">Process Improvement</option>
              <option value="process">Process Change</option>
              <option value="system">System Enhancement</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Suggestions Table */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading suggestions...</div>
      ) : filteredSuggestions.length === 0 ? (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">No suggestions found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSuggestions.map((suggestion: any) => (
            <div key={suggestion.id} className="bg-gray-800 rounded-lg shadow p-4 border border-gray-700">
              {/* Main Row */}
              <div className="flex items-start justify-between gap-4">
                {/* Left Section - Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white">{suggestion.title}</h3>
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                      {suggestion.category}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{suggestion.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                    <span>By: {suggestion.user.firstName} {suggestion.user.lastName}</span>
                    <span>{new Date(suggestion.createdAt).toLocaleDateString()}</span>
                    <span>👍 {suggestion.upvotes || 0} 👎 {suggestion.downvotes || 0}</span>
                  </div>
                </div>

                {/* Right Section - Admin Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Status Selector */}
                  <select
                    value={suggestion.status || 'submitted'}
                    onChange={(e) =>
                      updateStatusMutation.mutate({
                        id: suggestion.id,
                        status: e.target.value,
                      })
                    }
                    disabled={updateStatusMutation.isLoading}
                    className={`px-3 py-1 rounded text-sm text-white border-0 cursor-pointer ${getStatusColor(suggestion.status)} hover:opacity-90 disabled:opacity-50`}
                  >
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="implemented">Implemented</option>
                  </select>

                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this suggestion?')) {
                        deleteMutation.mutate(suggestion.id);
                      }
                    }}
                    disabled={deleteMutation.isLoading}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    {deleteMutation.isLoading ? '...' : 'Delete'}
                  </button>
                </div>
              </div>

              {/* Admin Notes Row - If exists */}
              {suggestion.adminNotes && (
                <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
                  <strong>Notes:</strong> {suggestion.adminNotes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
