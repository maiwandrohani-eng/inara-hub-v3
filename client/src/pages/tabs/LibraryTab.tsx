import { useQuery } from 'react-query';
import { useState, useMemo } from 'react';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { getAllLibraryCategories } from '../../config/categories';
import QuickViewModal from '../../components/QuickViewModal';

export default function LibraryTab() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedResource, setSelectedResource] = useState<any | null>(null);
  const availableCategories = getAllLibraryCategories();
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'COUNTRY_DIRECTOR' || user?.role === 'DEPARTMENT_HEAD';

  const { data, isLoading } = useQuery(
    ['library', search, typeFilter, categoryFilter],
    async () => {
      const params: any = {};
      if (search) params.search = search;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      const res = await api.get('/library', { params });
      return res.data;
    }
  );

  const { data: recommended } = useQuery('library-recommended', async () => {
    const res = await api.get('/library/recommended/all');
    return res.data;
  });

  const { data: analytics } = useQuery(
    'library-analytics',
    async () => {
      const res = await api.get('/analytics/tab/library');
      return res.data;
    },
    { enabled: isAdmin && showAnalytics }
  );

  const allResources = data?.resources || [];
  const recommendedResources = recommended?.resources || [];

  // Extract unique categories from resources
  const { categories } = useMemo(() => {
    const cats = new Set<string>();
    allResources.forEach((resource: any) => {
      if (resource.category) cats.add(resource.category);
    });
    return {
      categories: Array.from(cats).sort(),
    };
  }, [allResources]);

  // Filter resources based on search, type, and category
  const resources = useMemo(() => {
    let filtered = [...allResources];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((r: any) =>
        r.title?.toLowerCase().includes(searchLower) ||
        r.description?.toLowerCase().includes(searchLower) ||
        r.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((r: any) => r.resourceType === typeFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((r: any) => r.category === categoryFilter);
    }

    return filtered;
  }, [allResources, search, typeFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Library</h1>
          <p className="text-gray-400 mt-2">INARA's knowledge hub and institutional resources</p>
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
          <h2 className="text-xl font-bold text-white mb-4">Library Analytics</h2>
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Top Readers</h3>
            <div className="space-y-2">
              {analytics.topReaders?.map((reader: any, idx: number) => (
                <div key={reader.id || idx} className="flex justify-between items-center bg-gray-700 p-3 rounded">
                  <span className="text-gray-200">
                    {reader.firstName} {reader.lastName}
                  </span>
                  <span className="text-primary-500 font-medium">
                    {reader.readCount} reads
                  </span>
                </div>
              ))}
              {(!analytics.topReaders || analytics.topReaders.length === 0) && (
                <p className="text-gray-400 text-sm">No data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Search and Filters */}
      <div className="bg-gray-800 rounded-lg shadow p-4 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search library by title, description, or tags..."
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-2 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Types</option>
            <option value="book">Books</option>
            <option value="sop">SOPs</option>
            <option value="guidance">Guidance Notes</option>
            <option value="research">Research</option>
            <option value="case_study">Case Studies</option>
          </select>
        </div>

        {/* Quick Category Filters (Pills) */}
        {categories.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-400">Quick Filters:</span>
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All ({allResources.length})
              </button>
              {categories.slice(0, 8).map((cat) => {
                const count = allResources.filter((r: any) => r.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
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
          </div>
        )}

        {/* Results Count */}
        <div className="text-sm text-gray-400">
          Showing <strong className="text-white">{resources.length}</strong> of{' '}
          <strong className="text-white">{allResources.length}</strong> resources
        </div>
      </div>

      {/* Recommended */}
      {recommendedResources.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Recommended for You</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedResources.slice(0, 3).map((resource: any) => (
              <div
                key={resource.id}
                className="bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold text-white mb-2">{resource.title}</h3>
                {resource.description && (
                  <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                    {resource.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{resource.resourceType}</span>
                  {resource.category && <span>{resource.category}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Resources */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">All Resources</h2>
          <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="List View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        {isLoading ? (
          <div className="text-center py-12">Loading resources...</div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource: any) => (
              <div
                key={resource.id}
                className="bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedResource(resource)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">
                    {resource.title}
                  </h3>
                  <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
                    {resource.resourceType}
                  </span>
                </div>
                {resource.description && (
                  <p className="text-sm text-gray-400 mb-3 line-clamp-3">
                    {resource.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {resource.tags?.slice(0, 3).map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {resource.category && (
                  <div className="mt-3 text-xs text-gray-500">
                    Category: {resource.category}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {resources.map((resource: any) => (
              <div
                key={resource.id}
                className="bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer flex items-start space-x-4"
                onClick={() => setSelectedResource(resource)}
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {resource.title}
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded ml-2">
                      {resource.resourceType}
                    </span>
                  </div>
                  {resource.description && (
                    <p className="text-sm text-gray-400 mb-3">
                      {resource.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {resource.tags?.slice(0, 5).map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {resource.category && (
                    <div className="text-xs text-gray-500">
                      Category: {resource.category}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {resources.length === 0 && !isLoading && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">No resources found.</p>
        </div>
      )}

      {/* Quick View Modal */}
      {selectedResource && (
        <QuickViewModal
          isOpen={!!selectedResource}
          onClose={() => setSelectedResource(null)}
          fileUrl={selectedResource.fileUrl || ''}
          title={selectedResource.title}
          fileType={selectedResource.fileUrl?.split('.').pop()?.toLowerCase()}
          downloadEndpoint={selectedResource.fileUrl?.startsWith('/uploads/') ? selectedResource.fileUrl : undefined}
          resourceId={selectedResource.id}
        />
      )}
    </div>
  );
}

