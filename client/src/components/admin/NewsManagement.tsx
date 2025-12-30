import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';

export default function NewsManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingNews, setEditingNews] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery('admin-news', async () => {
    const res = await api.get('/news');
    return res.data;
  });

  const createMutation = useMutation(
    async (data: any) => {
      const res = await api.post('/news', data);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-news'] });
        queryClient.invalidateQueries({ queryKey: ['news'] });
        setShowForm(false);
        resetForm();
        alert('News published! All staff will be notified.');
      },
    }
  );

  const updateMutation = useMutation(
    async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/news/${id}`, data);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-news'] });
        queryClient.invalidateQueries({ queryKey: ['news'] });
        setEditingNews(null);
        resetForm();
      },
    }
  );

  const deleteMutation = useMutation(
    async (id: string) => {
      const res = await api.delete(`/news/${id}`);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-news'] });
        queryClient.invalidateQueries({ queryKey: ['news'] });
      },
    }
  );

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    priority: 'normal',
    expiresAt: '',
    publishedAt: '',
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      summary: '',
      content: '',
      priority: 'normal',
      expiresAt: '',
      publishedAt: '',
      isActive: true,
    });
  };

  const handleEdit = (news: any) => {
    setEditingNews(news);
    setFormData({
      title: news.title,
      summary: news.summary || '',
      content: news.content,
      priority: news.priority,
      expiresAt: news.expiresAt ? new Date(news.expiresAt).toISOString().split('T')[0] : '',
      publishedAt: news.publishedAt ? new Date(news.publishedAt).toISOString().split('T')[0] : '',
      isActive: news.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingNews) {
      updateMutation.mutate({ id: editingNews.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const news = data?.news || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">News & Announcements Management</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              setEditingNews(null);
              resetForm();
            }
          }}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
        >
          {showForm ? 'Cancel' : '+ Add News'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            {editingNews ? 'Edit News' : 'Create New News'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Summary</label>
              <input
                type="text"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                placeholder="Brief summary (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Content *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                rows={10}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                placeholder="Full announcement content (supports HTML/Markdown)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Published Date</label>
                <input
                  type="date"
                  value={formData.publishedAt}
                  onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Expires At (Optional)</label>
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-sm text-gray-200">
                Active (visible to staff)
              </label>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingNews(null);
                  resetForm();
                }}
                className="px-6 py-2 border border-gray-600 rounded-lg hover:bg-gray-900 text-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isLoading || updateMutation.isLoading}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {editingNews ? 'Update' : 'Publish'} News
              </button>
            </div>
          </form>
        </div>
      )}

      {/* News List */}
      {isLoading ? (
        <div className="text-center py-12">Loading news...</div>
      ) : (
        <div className="space-y-4">
          {news.map((item: any) => (
            <div key={item.id} className="bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                    <span className="text-xs bg-primary-500/20 text-primary-300 px-2 py-1 rounded">
                      {item.priority}
                    </span>
                    {!item.isActive && (
                      <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  {item.summary && <p className="text-gray-300 mb-2">{item.summary}</p>}
                  <div className="text-xs text-gray-400">
                    Published: {new Date(item.publishedAt).toLocaleDateString()} |{' '}
                    {item.confirmationCount || 0} confirmations
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this news item?')) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                    className="px-3 py-1 bg-red-900/30 text-red-300 rounded hover:bg-red-900/50 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

