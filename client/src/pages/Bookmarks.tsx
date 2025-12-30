import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import BookmarkButton from '../components/BookmarkButton';

export default function Bookmarks() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [folderFilter, setFolderFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { data, isLoading } = useQuery('bookmarks', async () => {
    const res = await api.get('/bookmarks');
    return res.data;
  });

  const deleteMutation = useMutation(
    async (id: string) => {
      const res = await api.delete(`/bookmarks/${id}`);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      },
    }
  );

  const bookmarks = data?.bookmarks || [];
  const folders: string[] = Array.from(new Set(bookmarks.map((b: any) => b.folder).filter((f: any): f is string => typeof f === 'string' && f.length > 0)));

  const filteredBookmarks = bookmarks.filter((b: any) => {
    if (folderFilter !== 'all' && b.folder !== folderFilter) return false;
    if (typeFilter !== 'all' && b.resourceType !== typeFilter) return false;
    return true;
  });

  const handleResourceClick = (bookmark: any) => {
    const routes: Record<string, string> = {
      training: '/training',
      policy: '/policies',
      library: '/library',
      template: '/templates',
    };
    navigate(routes[bookmark.resourceType] || '/');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">My Bookmarks</h1>
          <p className="text-gray-400 mt-2">Your saved resources and favorites</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={folderFilter}
            onChange={(e) => setFolderFilter(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Folders</option>
            {folders.map((folder) => (
              <option key={folder} value={folder}>
                {folder}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Types</option>
            <option value="training">Training</option>
            <option value="policy">Policy</option>
            <option value="library">Library</option>
            <option value="template">Template</option>
          </select>
        </div>
      </div>

      {/* Bookmarks List */}
      {isLoading ? (
        <div className="text-center py-12">Loading bookmarks...</div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">No bookmarks found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookmarks.map((bookmark: any) => (
            <div
              key={bookmark.id}
              className="bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <span className="text-xs bg-primary-500/20 text-primary-300 px-2 py-1 rounded capitalize">
                    {bookmark.resourceType}
                  </span>
                  {bookmark.folder && (
                    <span className="ml-2 text-xs text-gray-500">{bookmark.folder}</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <BookmarkButton
                    resourceType={bookmark.resourceType}
                    resourceId={bookmark.resourceId}
                  />
                  <button
                    onClick={() => deleteMutation.mutate(bookmark.id)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <button
                onClick={() => handleResourceClick(bookmark)}
                className="text-left w-full"
              >
                <h3 className="text-lg font-semibold text-white mb-2">
                  Resource ID: {bookmark.resourceId}
                </h3>
                {bookmark.notes && (
                  <p className="text-sm text-gray-400 mb-2">{bookmark.notes}</p>
                )}
                <p className="text-xs text-gray-500">
                  Bookmarked {new Date(bookmark.createdAt).toLocaleDateString()}
                </p>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

