import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import CommentsSection from '../../components/CommentsSection';

export default function SuggestionsTab() {
  const [showForm, setShowForm] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'COUNTRY_DIRECTOR' || user?.role === 'DEPARTMENT_HEAD';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
  });

  const { data, isLoading } = useQuery('suggestions', async () => {
    const res = await api.get('/suggestions');
    return res.data;
  });

  const createMutation = useMutation(
    async (data: any) => {
      const res = await api.post('/suggestions', data);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['suggestions'] });
        setShowForm(false);
        setFormData({ title: '', description: '', category: '', priority: '' });
        alert('Suggestion submitted successfully!');
      },
    }
  );

  const voteMutation = useMutation(
    async ({ id, voteType }: { id: string; voteType: string }) => {
      const res = await api.post(`/suggestions/${id}/vote`, { voteType });
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      },
    }
  );

  const updateStatusMutation = useMutation(
    async ({ id, status, priority, adminNotes }: any) => {
      const res = await api.put(`/suggestions/${id}`, { status, priority, adminNotes });
      return res.data;
    },
    {
      onSuccess: () => {
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

  // Filter suggestions based on selected filters
  const filteredSuggestions = useMemo(() => {
    return allSuggestions.filter((s: any) => {
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
      return matchesStatus && matchesCategory;
    });
  }, [allSuggestions, statusFilter, categoryFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleVote = (suggestionId: string, voteType: string) => {
    voteMutation.mutate({ id: suggestionId, voteType });
  };

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Employee Suggestions</h1>
          <p className="text-gray-400 mt-2">Share your ideas and suggestions for improvement</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Submit Suggestion'}
        </button>
      </div>

      {/* Enhanced Filters */}
      {allSuggestions.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow p-4 space-y-4">
          {/* Status Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-400">Status:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All ({allSuggestions.length})
            </button>
            {statuses.map((status) => {
              const count = allSuggestions.filter((s: any) => s.status === status).length;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors capitalize ${
                    statusFilter === status
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {status.replace('_', ' ')} ({count})
                </button>
              );
            })}
          </div>

          {/* Category Filters */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-400">Category:</span>
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All ({allSuggestions.length})
              </button>
              {categories.slice(0, 8).map((cat) => {
                const count = allSuggestions.filter((s: any) => s.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors capitalize ${
                      categoryFilter === cat
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
              {categories.length > 8 && (
                <span className="text-xs text-gray-500">+{categories.length - 8} more</span>
              )}
            </div>
          )}

          {/* Results Count */}
          <div className="text-sm text-gray-400">
            Showing <strong className="text-white">{filteredSuggestions.length}</strong> of{' '}
            <strong className="text-white">{allSuggestions.length}</strong> suggestions
          </div>
        </div>
      )}

      {/* Submission Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-white mb-4">Submit New Suggestion</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={5}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                >
                  <option value="">Select Category</option>
                  <option value="improvement">Process Improvement</option>
                  <option value="process">Process Change</option>
                  <option value="system">System Enhancement</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                >
                  <option value="">Select Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-gray-600 rounded-lg hover:bg-gray-900 text-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isLoading}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {createMutation.isLoading ? 'Submitting...' : 'Submit Suggestion'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="implemented">Implemented</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
          >
            <option value="all">All Categories</option>
            <option value="improvement">Process Improvement</option>
            <option value="process">Process Change</option>
            <option value="system">System Enhancement</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Suggestions List */}
      {isLoading ? (
        <div className="text-center py-12">Loading suggestions...</div>
      ) : allSuggestions.length === 0 ? (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">No suggestions found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSuggestions.map((suggestion: any) => (
            <div key={suggestion.id} className="bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{suggestion.title}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                        suggestion.status
                      )}`}
                    >
                      {suggestion.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {suggestion.category && (
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                        {suggestion.category}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 mb-3">{suggestion.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <span>
                      By: {suggestion.user.firstName} {suggestion.user.lastName}
                    </span>
                    <span>
                      {new Date(suggestion.createdAt).toLocaleDateString()}
                    </span>
                    <span>{suggestion.commentCount || 0} comments</span>
                  </div>
                </div>
              </div>

              {/* Voting */}
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={() => handleVote(suggestion.id, 'upvote')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded transition-colors ${
                    suggestion.userVote === 'upvote'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  <span>{suggestion.upvotes || 0}</span>
                </button>
                <button
                  onClick={() => handleVote(suggestion.id, 'downvote')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded transition-colors ${
                    suggestion.userVote === 'downvote'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span>{suggestion.downvotes || 0}</span>
                </button>
                <button
                  onClick={() => setSelectedSuggestion(selectedSuggestion === suggestion.id ? null : suggestion.id)}
                  className="px-3 py-1 text-gray-400 hover:text-white text-sm"
                >
                  {selectedSuggestion === suggestion.id ? 'Hide Comments' : 'Comments'}
                </button>
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h4 className="text-sm font-medium text-white mb-2">Admin Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={suggestion.status}
                      onChange={(e) =>
                        updateStatusMutation.mutate({
                          id: suggestion.id,
                          status: e.target.value,
                        })
                      }
                      className="px-3 py-1 bg-gray-700 border border-gray-600 text-white rounded text-sm"
                    >
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under Review</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="implemented">Implemented</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Admin notes..."
                      onBlur={(e) => {
                        if (e.target.value) {
                          updateStatusMutation.mutate({
                            id: suggestion.id,
                            adminNotes: e.target.value,
                          });
                        }
                      }}
                      className="flex-1 px-3 py-1 bg-gray-700 border border-gray-600 text-white rounded text-sm"
                    />
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this suggestion?')) {
                          deleteMutation.mutate(suggestion.id);
                        }
                      }}
                      disabled={deleteMutation.isLoading}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                  {suggestion.adminNotes && (
                    <p className="text-sm text-gray-400 mt-2">
                      <strong>Admin Notes:</strong> {suggestion.adminNotes}
                    </p>
                  )}
                </div>
              )}

              {/* Comments Section */}
              {selectedSuggestion === suggestion.id && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <CommentsSection resourceType="suggestion" resourceId={suggestion.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

