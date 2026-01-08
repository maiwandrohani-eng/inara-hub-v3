import { useQuery, useQueryClient } from 'react-query';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import QuickViewModal from '../../components/QuickViewModal';

export default function PoliciesTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<'all' | 'mandatory' | 'acknowledged' | 'not-acknowledged'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'brief' | 'complete' | 'assessment' | 'file'>('brief');
  const [selectedPolicy, setSelectedPolicy] = useState<any | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'COUNTRY_DIRECTOR' || user?.role === 'DEPARTMENT_HEAD';

  const { data, isLoading } = useQuery('policies', async () => {
    const res = await api.get('/policies');
    return res.data;
  });

  const allPolicies = data?.policies || [];

  // Handle query parameter to open specific policy
  useEffect(() => {
    const policyId = searchParams.get('policy');
    if (policyId && allPolicies.length > 0) {
      const policy = allPolicies.find((p: any) => p.id === policyId);
      if (policy) {
        setSelectedPolicy(policy);
        // Remove query parameter from URL
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, allPolicies, setSearchParams]);

  const { data: analytics } = useQuery(
    'policies-analytics',
    async () => {
      const res = await api.get('/analytics/tab/policies');
      return res.data;
    },
    { enabled: isAdmin && showAnalytics }
  );

  // Extract unique categories from policies
  const { categories } = useMemo(() => {
    const cats = new Set<string>();
    allPolicies.forEach((policy: any) => {
      if (policy.category) cats.add(policy.category);
    });
    return {
      categories: Array.from(cats).sort(),
    };
  }, [allPolicies]);

  const filteredPolicies = useMemo(() => {
    return allPolicies.filter((p: any) => {
      const cert = p.certifications?.[0];
      
      // Status filter
      if (filter === 'mandatory' && !p.isMandatory) return false;
      if (filter === 'acknowledged' && cert?.status !== 'ACKNOWLEDGED') return false;
      if (filter === 'not-acknowledged' && cert?.status === 'ACKNOWLEDGED') return false;
      
      // Category filter
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      
      return true;
    });
  }, [allPolicies, filter, categoryFilter]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Policies</h1>
          <p className="text-gray-400 mt-2">Read, understand, and certify INARA policies</p>
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
          <h2 className="text-xl font-bold text-white mb-4">Policies Analytics</h2>
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Top Certifiers</h3>
            <div className="space-y-2">
              {analytics.topCertifiers?.map((certifier: any, idx: number) => (
                <div key={certifier.id || idx} className="flex justify-between items-center bg-gray-700 p-3 rounded">
                  <span className="text-gray-200">
                    {certifier.firstName} {certifier.lastName}
                  </span>
                  <span className="text-primary-500 font-medium">
                    {certifier.certificationCount} certifications
                  </span>
                </div>
              ))}
              {(!analytics.topCertifiers || analytics.topCertifiers.length === 0) && (
                <p className="text-gray-400 text-sm">No data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Filters */}
      <div className="bg-gray-800 rounded-lg shadow p-4 space-y-4">
        {/* Status Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-400">Status:</span>
          {(['all', 'mandatory', 'not-acknowledged', 'acknowledged'] as const).map((f) => {
            const count = allPolicies.filter((p: any) => {
              const cert = p.certifications?.[0];
              if (f === 'all') return true;
              if (f === 'mandatory') return p.isMandatory;
              if (f === 'acknowledged') return cert?.status === 'ACKNOWLEDGED';
              if (f === 'not-acknowledged') return !cert || cert.status === 'NOT_ACKNOWLEDGED';
              return true;
            }).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filter === f
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')} ({count})
              </button>
            );
          })}
        </div>

        {/* Quick Category Filters (Pills) */}
        {categories.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-400">Categories:</span>
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All ({allPolicies.length})
              </button>
              {categories.slice(0, 8).map((cat) => {
                const count = allPolicies.filter((p: any) => p.category === cat).length;
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
          Showing <strong className="text-white">{filteredPolicies.length}</strong> of{' '}
          <strong className="text-white">{allPolicies.length}</strong> policies
        </div>
      </div>

      {/* Policy List */}
      {isLoading ? (
        <div className="text-center py-12">Loading policies...</div>
      ) : (
        <div className="space-y-4">
          {filteredPolicies.map((policy: any) => {
            const cert = policy.certifications?.[0];
            const status = cert?.status || 'NOT_ACKNOWLEDGED';

            return (
              <div
                key={policy.id}
                className="bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {policy.title}
                      </h3>
                      {policy.isMandatory && (
                        <span className="bg-red-900/30 text-red-300 text-xs font-medium px-2 py-1 rounded">
                          Mandatory
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        v{policy.version}
                      </span>
                    </div>
                    {policy.category && (
                      <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
                        {policy.category}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      status === 'ACKNOWLEDGED'
                        ? 'bg-green-900/30 text-green-300'
                        : 'bg-yellow-100 text-yellow-300'
                    }`}
                  >
                    {status.replace('_', ' ')}
                  </span>
                </div>

                {/* Tabs */}
                <div className="flex space-x-2 mb-4 border-b border-gray-700">
                  {(['brief', 'complete', 'assessment'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        viewMode === mode
                          ? 'border-primary-500 text-primary-500'
                          : 'border-transparent text-gray-500 hover:text-gray-200'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                  {policy.fileUrl && (
                    <button
                      onClick={() => setViewMode('file')}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        viewMode === 'file'
                          ? 'border-primary-500 text-primary-500'
                          : 'border-transparent text-gray-500 hover:text-gray-200'
                      }`}
                    >
                      📄 File
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="mb-4">
                  {viewMode === 'brief' && (
                    <p className="text-gray-200">{policy.brief}</p>
                  )}
                  {viewMode === 'complete' && (
                    <div
                      className="prose max-w-none text-gray-200"
                      dangerouslySetInnerHTML={{ __html: policy.complete }}
                    />
                  )}
                  {viewMode === 'assessment' && policy.assessment && (
                    <div className="text-gray-200">
                      <p>Assessment available. Click below to take it.</p>
                    </div>
                  )}
                  {viewMode === 'file' && policy.fileUrl && (
                    <div className="text-center py-8">
                      <p className="text-gray-300 mb-4">
                        📄 Policy document is available for download
                      </p>
                      <a
                        href={policy.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                      >
                        Open in New Tab
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Effective: {new Date(policy.effectiveDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPolicy(policy);
                      }}
                      className="text-primary-500 hover:text-primary-700 text-sm font-medium"
                    >
                      Quick View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPolicy(policy);
                      }}
                      className="text-primary-500 hover:text-primary-700 text-sm font-medium"
                    >
                      {status === 'NOT_ACKNOWLEDGED' ? 'Read & Certify' : 'View'} →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredPolicies.length === 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">No policies found.</p>
        </div>
      )}

      {/* Quick View Modal for Policies */}
      {selectedPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={() => setSelectedPolicy(null)}>
          <div className="bg-gray-900 rounded-lg shadow-xl w-full h-full max-w-5xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">{selectedPolicy.title}</h2>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex space-x-2 px-6 pt-4 border-b border-gray-700">
              {(['brief', 'complete', 'assessment'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    viewMode === mode
                      ? 'border-primary-500 text-primary-500'
                      : 'border-transparent text-gray-500 hover:text-gray-200'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
              {selectedPolicy.fileUrl && (
                <button
                  onClick={() => setViewMode('file')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    viewMode === 'file'
                      ? 'border-primary-500 text-primary-500'
                      : 'border-transparent text-gray-500 hover:text-gray-200'
                  }`}
                >
                  📄 File
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-invert max-w-none text-gray-200">
                {viewMode === 'brief' && <p>{selectedPolicy.brief}</p>}
                {viewMode === 'complete' && (
                  <div dangerouslySetInnerHTML={{ __html: selectedPolicy.complete }} />
                )}
                {viewMode === 'assessment' && selectedPolicy.assessment && (
                  <div>
                    <p className="text-gray-400 mb-4">Assessment available. Click below to take it.</p>
                  </div>
                )}
                {viewMode === 'file' && selectedPolicy.fileUrl && (
                  <div className="text-center py-8">
                    <p className="text-gray-300 mb-4">
                      📄 Policy document is available for download and viewing
                    </p>
                    <div className="space-y-2">
                      <a
                        href={selectedPolicy.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                      >
                        Open in New Tab
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-700">
              <div className="text-xs text-gray-500">
                Effective: {new Date(selectedPolicy.effectiveDate).toLocaleDateString()}
              </div>
              <div className="flex items-center space-x-3">
                {selectedPolicy.fileUrl && (
                  <a
                    href={selectedPolicy.fileUrl}
                    download={`${selectedPolicy.title.replace(/[^a-z0-9]/gi, '_')}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Download File
                  </a>
                )}
                <button
                  onClick={() => {
                    // Export policy as text
                    const content = viewMode === 'brief' ? selectedPolicy.brief : viewMode === 'complete' ? selectedPolicy.complete : 'Assessment data';
                    const blob = new Blob([content], { type: 'text/plain' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${selectedPolicy.title.replace(/[^a-z0-9]/gi, '_')}_${viewMode}.txt`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
                >
                  Download as Text
                </button>
                <button
                  onClick={() => setSelectedPolicy(null)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

