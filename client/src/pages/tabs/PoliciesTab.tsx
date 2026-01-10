import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import PDFViewer from '../../components/PDFViewer';

// Helper function to convert R2 URLs to API proxy URLs
const getProxiedPolicyUrl = (fileUrl: string): string => {
  if (!fileUrl) return '';
  
  // If it's an R2 URL (full URL), extract the path and use API proxy
  if (fileUrl.startsWith('http')) {
    try {
      const parsedUrl = new URL(fileUrl);
      const path = parsedUrl.pathname;
      return `/api${path}`;
    } catch {
      return fileUrl;
    }
  }
  
  // If it's already a path, ensure it goes through API proxy
  if (fileUrl.startsWith('/')) {
    return `/api${fileUrl}`;
  }
  
  // Otherwise assume it's a relative path and add /api/uploads/
  return `/api/uploads/${fileUrl}`;
};

export default function PoliciesTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<'all' | 'mandatory' | 'acknowledged' | 'not-acknowledged'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'brief' | 'complete' | 'assessment' | 'file'>('brief');
  const [selectedPolicy, setSelectedPolicy] = useState<any | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [takingAssessment, setTakingAssessment] = useState(false);
  const [assessmentAnswers, setAssessmentAnswers] = useState<{ [key: number]: string }>({});
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState<number | null>(null);
  const [showAcknowledgmentModal, setShowAcknowledgmentModal] = useState(false);
  const [acknowledgmentLoading, setAcknowledgmentLoading] = useState(false);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'COUNTRY_DIRECTOR' || user?.role === 'DEPARTMENT_HEAD';

  const { data, isLoading } = useQuery('policies', async () => {
    const res = await api.get('/policies');
    return res.data;
  });

  // Mutation for submitting assessment
  const assessmentMutation = useMutation(
    async (data: { policyId: string; answers: { [key: number]: string } }) => {
      const res = await api.post(`/policies/${data.policyId}/assessment`, {
        answers: Object.entries(data.answers).map(([_, value]) => value),
      });
      return res.data;
    },
    {
      onSuccess: (data) => {
        setAssessmentScore(data.score);
        setAssessmentSubmitted(true);
        queryClient.invalidateQueries('policies');
        if (data.passed) {
          alert(`✅ Assessment passed! Score: ${data.score}%`);
        } else {
          alert(`❌ Assessment not passed. Score: ${data.score}%. Passing score: 70%`);
        }
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Failed to submit assessment');
      },
    }
  );

  // Mutation for acknowledging policy
  const acknowledgmentMutation = useMutation(
    async (policyId: string) => {
      const res = await api.post(`/policies/${policyId}/acknowledge`);
      return res.data;
    },
    {
      onSuccess: (data) => {
        setShowAcknowledgmentModal(false);
        queryClient.invalidateQueries('policies');
        alert('✅ Policy acknowledged successfully!');
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Failed to acknowledge policy');
      },
      onSettled: () => {
        setAcknowledgmentLoading(false);
      },
    }
  );

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
                    <div className="text-center py-12 space-y-6">
                      <div className="flex flex-col items-center">
                        <svg className="w-16 h-16 text-primary-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-300 mb-6 text-lg">
                          Review the complete policy document and certify your acknowledgment
                        </p>
                        {policy.fileUrl && (
                          <button
                            onClick={() => {
                              setSelectedPolicy(policy);
                              setViewMode('file');
                            }}
                            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                          >
                            View Full Policy
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {viewMode === 'assessment' && policy.assessment && (
                    <div className="text-gray-200">
                      <p>Assessment available. Click below to take it.</p>
                    </div>
                  )}
                  {viewMode === 'file' && policy.fileUrl && (
                    <div className="w-full h-96 bg-gray-900 rounded-lg overflow-hidden">
                      <iframe
                        src={`${getProxiedPolicyUrl(policy.fileUrl)}#toolbar=0`}
                        className="w-full h-full border-none"
                        title="Policy Document"
                      />
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
                        setShowAcknowledgmentModal(true);
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
                  <div className="text-center py-12 space-y-6">
                    <div className="flex flex-col items-center">
                      <svg className="w-16 h-16 text-primary-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-300 mb-6 text-lg">
                        Review the complete policy document and certify your acknowledgment
                      </p>
                      {selectedPolicy.fileUrl && (
                        <button
                          onClick={() => setQuickViewPolicy(selectedPolicy)}
                          className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
                        >
                          📄 View Full Policy
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {viewMode === 'assessment' && selectedPolicy.assessment && (
                  <div className="space-y-4">
                    {!assessmentSubmitted ? (
                      <>
                        <div className="bg-blue-900/30 border border-blue-700 p-4 rounded-lg mb-4">
                          <p className="text-blue-300 text-sm">
                            📋 Assessment: Answer all questions correctly to certify this policy. Passing score: 70%
                          </p>
                        </div>
                        {selectedPolicy.assessment.questions?.map((question: any, qIdx: number) => (
                          <div key={qIdx} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                            <p className="text-white font-semibold mb-3">
                              {qIdx + 1}. {question.question}
                            </p>
                            {question.type === 'multiple_choice' && question.options && (
                              <div className="space-y-2">
                                {question.options.map((option: string, oIdx: number) => (
                                  <label key={oIdx} className="flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`question-${qIdx}`}
                                      value={option}
                                      checked={assessmentAnswers[qIdx] === option}
                                      onChange={(e) => setAssessmentAnswers({ ...assessmentAnswers, [qIdx]: e.target.value })}
                                      className="mr-3"
                                    />
                                    <span className="text-gray-300">{option}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                            {question.type === 'text' && (
                              <input
                                type="text"
                                placeholder="Enter your answer..."
                                value={assessmentAnswers[qIdx] || ''}
                                onChange={(e) => setAssessmentAnswers({ ...assessmentAnswers, [qIdx]: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                              />
                            )}
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className={`text-6xl mb-4 ${assessmentScore! >= 70 ? '✅' : '❌'}`}></div>
                        <p className="text-2xl font-bold text-white mb-2">
                          {assessmentScore! >= 70 ? 'Assessment Passed!' : 'Assessment Not Passed'}
                        </p>
                        <p className="text-gray-300 mb-6">
                          Your Score: <span className="text-lg font-bold">{assessmentScore}%</span>
                        </p>
                        <button
                          onClick={() => {
                            setAssessmentSubmitted(false);
                            setAssessmentAnswers({});
                            setAssessmentScore(null);
                          }}
                          className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                        >
                          Retake Assessment
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {viewMode === 'file' && selectedPolicy.fileUrl && (
                  <div className="py-4">
                    <PDFViewer
                      pdfUrl={selectedPolicy.fileUrl}
                      title="Policy Document"
                    />
                    <div className="mt-4 text-center">
                      <a
                        href={getProxiedPolicyUrl(selectedPolicy.fileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                      >
                        Download File
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-700 flex-wrap gap-2">
              <div className="text-xs text-gray-500">
                Effective: {new Date(selectedPolicy.effectiveDate).toLocaleDateString()}
              </div>
              <div className="flex items-center space-x-2 flex-wrap">
                {viewMode === 'assessment' && !assessmentSubmitted && (
                  <button
                    onClick={() => {
                      const allAnswered = Object.keys(assessmentAnswers).length === (selectedPolicy.assessment?.questions?.length || 0);
                      if (!allAnswered) {
                        alert('Please answer all questions before submitting');
                        return;
                      }
                      assessmentMutation.mutate({
                        policyId: selectedPolicy.id,
                        answers: assessmentAnswers,
                      });
                    }}
                    disabled={assessmentMutation.isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                  >
                    {assessmentMutation.isLoading ? 'Submitting...' : 'Submit Assessment'}
                  </button>
                )}
                {(viewMode === 'brief' || viewMode === 'complete') && (
                  <button
                    onClick={() => setShowAcknowledgmentModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    ✓ Read & Certify
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedPolicy(null);
                    setAssessmentSubmitted(false);
                    setAssessmentAnswers({});
                    setAssessmentScore(null);
                  }}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Acknowledgment Modal */}
      {showAcknowledgmentModal && selectedPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 border border-gray-700">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Policy Acknowledgment</h3>
              <p className="text-gray-300">
                <strong>{selectedPolicy.title}</strong>
              </p>
            </div>

            {/* Check if assessment is completed */}
            {assessmentScore !== null && assessmentScore >= 70 ? (
              <>
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-6">
                  <p className="text-green-300 text-sm mb-2">
                    ✅ Assessment completed with score: <strong>{assessmentScore}%</strong>
                  </p>
                </div>
                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
                  <p className="text-blue-200 text-sm">
                    I have read and understand this policy and certify that I will obey and comply with all its provisions.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setAcknowledgmentLoading(true);
                      acknowledgmentMutation.mutate(selectedPolicy.id);
                    }}
                    disabled={acknowledgmentLoading || acknowledgmentMutation.isLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {acknowledgmentLoading ? 'Acknowledging...' : 'I Acknowledge'}
                  </button>
                  <button
                    onClick={() => setShowAcknowledgmentModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-amber-900/40 border border-amber-600 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-amber-300 text-sm font-semibold mb-1">Assessment Completion Required</p>
                      <p className="text-amber-200 text-sm leading-relaxed">
                        To proceed with policy acknowledgment, please complete the assessment first. You must score at least <strong>70%</strong> to successfully acknowledge this policy. Return to the assessment section to complete it.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAcknowledgmentModal(false);
                      setViewMode('assessment');
                      setAssessmentSubmitted(false);
                      setAssessmentAnswers({});
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Go to Assessment
                  </button>
                  <button
                    onClick={() => setShowAcknowledgmentModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

