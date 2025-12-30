import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function SuggestionBox() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
  });

  // Fetch recent suggestions
  const { data } = useQuery('suggestions', async () => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const recentSuggestions = (data?.suggestions || []).slice(0, 3);

  return (
    <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">💡 Share Your Ideas</h2>
          <p className="text-sm text-gray-400 mt-1">Help improve INARA by sharing your suggestions</p>
        </div>
        <Link
          to="/suggestions"
          className="text-sm text-primary-400 hover:text-primary-300 underline"
        >
          View All →
        </Link>
      </div>

      {!showForm ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submit Button Section */}
          <div className="lg:col-span-1">
            <button
              onClick={() => setShowForm(true)}
              className="w-full bg-primary-500 text-white px-4 py-4 rounded-lg hover:bg-primary-600 transition-colors font-medium text-center"
            >
              + Submit a Suggestion
            </button>
          </div>

          {/* Recent Suggestions Section */}
          {recentSuggestions.length > 0 && (
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Recent Suggestions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {recentSuggestions.map((suggestion: any) => (
                  <div
                    key={suggestion.id}
                    className="bg-gray-700/50 rounded-lg p-3 border border-gray-600"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-medium text-white line-clamp-1 flex-1">{suggestion.title}</h4>
                      <span
                        className={`ml-2 text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                          suggestion.status === 'approved'
                            ? 'bg-green-900/30 text-green-300'
                            : suggestion.status === 'under_review'
                            ? 'bg-yellow-900/30 text-yellow-300'
                            : suggestion.status === 'rejected'
                            ? 'bg-red-900/30 text-red-300'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {suggestion.status || 'submitted'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                      {suggestion.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>👍 {suggestion.upvotes || 0}</span>
                      <span>👎 {suggestion.downvotes || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Brief title for your suggestion"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              placeholder="Describe your suggestion in detail..."
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-gray-200 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 text-sm"
            >
              {createMutation.isLoading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

