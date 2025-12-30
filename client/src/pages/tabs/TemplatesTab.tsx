import { useQuery } from 'react-query';
import { useState, useMemo } from 'react';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import QuickViewModal from '../../components/QuickViewModal';

export default function TemplatesTab() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'popularity'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'COUNTRY_DIRECTOR' || user?.role === 'DEPARTMENT_HEAD';

  const { data, isLoading } = useQuery(
    ['templates', search, categoryFilter, subcategoryFilter],
    async () => {
      const params: any = {};
      if (search) params.search = search;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (subcategoryFilter !== 'all') params.subcategory = subcategoryFilter;
      const res = await api.get('/templates', { params });
      return res.data;
    }
  );

  const { data: mostUsed } = useQuery('templates-most-used', async () => {
    const res = await api.get('/templates/analytics/most-used');
    return res.data;
  });

  const { data: analytics } = useQuery(
    'templates-analytics',
    async () => {
      const res = await api.get('/analytics/tab/templates');
      return res.data;
    },
    { enabled: isAdmin && showAnalytics }
  );

  const allTemplates = data?.templates || [];
  const mostUsedTemplates = mostUsed?.templates || [];

  // Extract unique categories and subcategories from templates
  const { categories, subcategories, allTags } = useMemo(() => {
    const cats = new Set<string>();
    const subcats = new Set<string>();
    const tags = new Set<string>();

    allTemplates.forEach((template: any) => {
      if (template.category) cats.add(template.category);
      if (template.subcategory) subcats.add(template.subcategory);
      if (template.tags && Array.isArray(template.tags)) {
        template.tags.forEach((tag: string) => tags.add(tag));
      }
    });

    return {
      categories: Array.from(cats).sort(),
      subcategories: Array.from(subcats).sort(),
      allTags: Array.from(tags).sort(),
    };
  }, [allTemplates]);

  // Filter and sort templates
  const templates = useMemo(() => {
    let filtered = [...allTemplates];

    // Tag filter
    if (tagFilter) {
      filtered = filtered.filter((template: any) =>
        template.tags?.some((tag: string) =>
          tag.toLowerCase().includes(tagFilter.toLowerCase())
        )
      );
    }

    // Sort
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'date':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case 'popularity':
          return (b._count?.downloads || 0) - (a._count?.downloads || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allTemplates, tagFilter, sortBy]);

  const handleDownload = async (templateId: string, templateTitle?: string) => {
    try {
      // Use the download endpoint which will trigger proper file download
      const res = await api.get(`/templates/${templateId}/download`, {
        responseType: 'blob', // Important: tell axios to expect binary data
      });

      // Create a blob from the response
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from Content-Disposition header or use template title
      const contentDisposition = res.headers['content-disposition'];
      let filename = templateTitle || 'template';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Download error:', error);
      alert(error.response?.data?.message || 'Failed to download template. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Templates</h1>
          <p className="text-gray-400 mt-2">Standardized INARA templates for donor compliance</p>
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
          <h2 className="text-xl font-bold text-white mb-4">Templates Analytics</h2>
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Top Users</h3>
            <div className="space-y-2">
              {analytics.topUsers?.map((user: any, idx: number) => (
                <div key={user.id || idx} className="flex justify-between items-center bg-gray-700 p-3 rounded">
                  <span className="text-gray-200">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-primary-500 font-medium">
                    {user.downloadCount} downloads
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

      {/* Enhanced Search and Filters */}
      <div className="bg-gray-800 rounded-lg shadow p-4 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search templates by title, description, or tags..."
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
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showAdvancedFilters
                ? 'bg-primary-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {showAdvancedFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>

        {/* Quick Category Filters (Pills) */}
        {categories.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-400">Quick Filters:</span>
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  setSubcategoryFilter('all');
                }}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All ({allTemplates.length})
              </button>
              {categories.slice(0, 8).map((cat) => {
                const count = allTemplates.filter((t: any) => t.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategoryFilter(cat);
                      setSubcategoryFilter('all');
                    }}
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

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="border-t border-gray-700 pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setSubcategoryFilter('all');
                  }}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategory Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subcategory
                </label>
                <select
                  value={subcategoryFilter}
                  onChange={(e) => setSubcategoryFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={categoryFilter === 'all'}
                >
                  <option value="all">All Subcategories</option>
                  {subcategories
                    .filter((sub) => {
                      if (categoryFilter === 'all') return true;
                      return allTemplates.some(
                        (t: any) => t.category === categoryFilter && t.subcategory === sub
                      );
                    })
                    .map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="date">Most Recent</option>
                  <option value="popularity">Most Popular</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Filter by Tag
                </label>
                <div className="flex flex-wrap gap-2">
                  {allTags.slice(0, 10).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        tagFilter === tag
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                  {allTags.length > 10 && (
                    <span className="text-xs text-gray-500 self-center">
                      +{allTags.length - 10} more tags
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Active Filters Summary */}
            {(categoryFilter !== 'all' || subcategoryFilter !== 'all' || tagFilter) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-400">Active filters:</span>
                {categoryFilter !== 'all' && (
                  <span className="px-2 py-1 bg-primary-500/20 text-primary-300 rounded text-sm">
                    Category: {categoryFilter}
                    <button
                      onClick={() => setCategoryFilter('all')}
                      className="ml-2 hover:text-white"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {subcategoryFilter !== 'all' && (
                  <span className="px-2 py-1 bg-primary-500/20 text-primary-300 rounded text-sm">
                    Subcategory: {subcategoryFilter}
                    <button
                      onClick={() => setSubcategoryFilter('all')}
                      className="ml-2 hover:text-white"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {tagFilter && (
                  <span className="px-2 py-1 bg-primary-500/20 text-primary-300 rounded text-sm">
                    Tag: {tagFilter}
                    <button
                      onClick={() => setTagFilter('')}
                      className="ml-2 hover:text-white"
                    >
                      ✕
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setCategoryFilter('all');
                    setSubcategoryFilter('all');
                    setTagFilter('');
                    setSearch('');
                  }}
                  className="text-sm text-primary-400 hover:text-primary-300"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="text-sm text-gray-400">
          Showing <strong className="text-white">{templates.length}</strong> of{' '}
          <strong className="text-white">{allTemplates.length}</strong> templates
        </div>
      </div>

      {/* Most Used */}
      {mostUsedTemplates.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Most Used Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mostUsedTemplates.slice(0, 3).map((template: any) => (
              <div
                key={template.id}
                className="bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold text-white mb-2">{template.title}</h3>
                {template.description && (
                  <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                    {template.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{template._count?.downloads || 0} downloads</span>
                <button
                  onClick={() => setSelectedTemplate(template)}
                  className="text-primary-500 hover:text-primary-700 font-medium"
                >
                  Quick View →
                </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Templates */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">All Templates</h2>
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
          <div className="text-center py-12">Loading templates...</div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template: any) => (
              <div
                key={template.id}
                className="bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-white">
                    {template.title}
                  </h3>
                  <span className="text-xs text-gray-500">v{template.version}</span>
                </div>
                {template.description && (
                  <p className="text-sm text-gray-400 mb-4 line-clamp-3">
                    {template.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {template.category && (
                      <span className="bg-primary-500/20 text-primary-300 px-2 py-1 rounded">
                        {template.category}
                      </span>
                    )}
                    {template.subcategory && (
                      <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded">
                        {template.subcategory}
                      </span>
                    )}
                    {template.tags && template.tags.length > 0 && (
                      <span className="text-gray-400">
                        {template.tags.slice(0, 2).map((tag: string) => (
                          <span key={tag} className="mr-1">#{tag}</span>
                        ))}
                        {template.tags.length > 2 && (
                          <span className="text-gray-500">+{template.tags.length - 2}</span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {template._count?.downloads > 0 && (
                      <span className="text-gray-400">
                        📥 {template._count.downloads} downloads
                      </span>
                    )}
                    <span>
                      Updated: {new Date(template.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTemplate(template)}
                  className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Quick View
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template: any) => (
              <div
                key={template.id}
                className="bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow flex items-start space-x-4"
              >
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-white">
                      {template.title}
                    </h3>
                    <span className="text-xs text-gray-500">v{template.version}</span>
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-400 mb-4">
                      {template.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {template.category && (
                        <span className="bg-primary-500/20 text-primary-300 px-2 py-1 rounded">
                          {template.category}
                        </span>
                      )}
                      {template.subcategory && (
                        <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded">
                          {template.subcategory}
                        </span>
                      )}
                      {template.tags && template.tags.length > 0 && (
                        <span className="text-gray-400">
                          {template.tags.slice(0, 2).map((tag: string) => (
                            <span key={tag} className="mr-1">#{tag}</span>
                          ))}
                          {template.tags.length > 2 && (
                            <span className="text-gray-500">+{template.tags.length - 2}</span>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {template._count?.downloads > 0 && (
                        <span className="text-gray-400">
                          📥 {template._count.downloads} downloads
                        </span>
                      )}
                      <span>
                        Updated: {new Date(template.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTemplate(template)}
                  className="bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap"
                >
                  Quick View
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {templates.length === 0 && !isLoading && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">No templates found.</p>
        </div>
      )}

      {/* Quick View Modal */}
      {selectedTemplate && (
        <QuickViewModal
          isOpen={!!selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          fileUrl={selectedTemplate.fileUrl || ''}
          title={selectedTemplate.title}
          fileType={selectedTemplate.fileUrl?.split('.').pop()?.toLowerCase()}
          downloadEndpoint={`/templates/${selectedTemplate.id}/download`}
          resourceId={selectedTemplate.id}
        />
      )}
    </div>
  );
}

