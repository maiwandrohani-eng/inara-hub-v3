import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';

export default function SuggestionManagement() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery('admin-suggestions', async () => {
    const res = await api.get('/suggestions');
    return res.data;
  });

  const updateStatusMutation = useMutation(
    async ({ id, status, priority, adminNotes }: any) => {
      const res = await api.put(`/suggestions/${id}`, { status, priority, adminNotes });
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-suggestions'] });
        queryClient.invalidateQueries({ queryKey: ['suggestions'] });
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
        alert('Suggestion deleted successfully');
      },
      onError: (error: any) => {
        alert('Failed to delete suggestion: ' + error.response?.data?.message || error.message);
      },
    }
  );

  const allSuggestions = data?.suggestions || [];

  // Extract unique statuses and categories
  const { statuses, categories } = useMemo(() => {
    const statusSet = new Set<string>();
    const categorySet = new Set<string>();

    allSuggestions.forEach((s: any) => {
      if (s.status) statusSet.add(s.status);
      if (s.category) categorySet.add(s.category);
    });

    return {
      statuses: Array.from(statusSet),
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
        return 'bg-green-900/30 text-green-300';
      case 'rejected':
        return 'bg-red-900/30 text-red-300';
      case 'under_review':
        return 'bg-yellow-900/30 text-yellow-300';
      case 'implemented':
        return 'bg-blue-900/30 text-blue-300';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'improvement':
        return 'bg-purple-900/30 text-purple-300';
      case 'process':
        return 'bg-cyan-900/30 text-cyan-300';
      case 'system':
        return 'bg-indigo-900/30 text-indigo-300';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Suggestion Management</h2>
        <p className="text-gray-400 mt-1">Review and manage employee suggestions</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg shadow p-4 space-y-4">
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

      {/* Suggestions List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading suggestions...</div>
      ) : filteredSuggestions.length === 0 ? (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">No suggestions found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSuggestions.map((suggestion: any) => (
            <div key={suggestion.id} className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2 flex-wrap gap-2">
                    <h3 className="text-lg font-bold text-white">{suggestion.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(suggestion.status)}`}>
                      {suggestion.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {suggestion.category && (
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getCategoryColor(suggestion.category)}`}>
                        {suggestion.category}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 mb-3">{suggestion.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-400 flex-wrap gap-2">
                    <span>By: {suggestion.user.firstName} {suggestion.user.lastName}</span>
                    <span>Email: {suggestion.user.email}</span>
                    <span>{new Date(suggestion.createdAt).toLocaleDateString()}</span>
                    <span>👍 {suggestion.upvotes || 0} 👎 {suggestion.downvotes || 0}</span>
                  </div>
                </div>
              </div>

              {/* Admin Actions */}
              <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                <h4 className="text-sm font-medium text-white">Admin Actions</h4>
                
                {/* Status Update */}
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={suggestion.status}
                    onChange={(e) =>
                      updateStatusMutation.mutate({
                        id: suggestion.id,
                        status: e.target.value,
                      })
                    }
                    className="px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded text-sm hover:bg-gray-600"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="implemented">Implemented</option>
                  </select>

                  {/* Priority Update */}
                  <select
                    defaultValue={suggestion.priority || 'medium'}
                    onChange={(e) =>
                      updateStatusMutation.mutate({
                        id: suggestion.id,
                        priority: e.target.value,
                      })
                    }
                    className="px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded text-sm hover:bg-gray-600"
                  >
                    <option value="">Set Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>

                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this suggestion?')) {
                        deleteMutation.mutate(suggestion.id);
                      }
                    }}
                    disabled={deleteMutation.isLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    {deleteMutation.isLoading ? 'Deleting...' : '🗑️ Delete'}
                  </button>
                </div>

                {/* Admin Notes */}
                <div>
                  <input
                    type="text"
                    placeholder="Add admin notes..."
                    defaultValue={suggestion.adminNotes || ''}
                    onBlur={(e) => {
                      if (e.target.value !== suggestion.adminNotes) {
                        updateStatusMutation.mutate({
                          id: suggestion.id,
                          adminNotes: e.target.value,
                        });
                      }
                    }}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded text-sm"
                  />
                </div>

                {suggestion.adminNotes && (
                  <div className="bg-gray-700/50 p-3 rounded text-sm text-gray-300">
                    <strong>Admin Notes:</strong> {suggestion.adminNotes}
                  </div>
                )}

                {suggestion.reviewedBy && (
                  <div className="text-xs text-gray-400">
                    Last reviewed: {new Date(suggestion.reviewedAt).toLocaleString()}
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
