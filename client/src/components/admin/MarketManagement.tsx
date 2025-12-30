import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useState } from 'react';
import api from '../../api/client';

export default function MarketManagement() {
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: submissions } = useQuery('admin-market', async () => {
    const res = await api.get('/market/all');
    return res.data;
  });

  const reviewMutation = useMutation(
    async ({ id, data }: { id: string; data: any }) => {
      const res = await api.post(`/market/${id}/review`, data);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-market');
        setSelectedSubmission(null);
        alert('Review submitted successfully!');
      },
    }
  );

  const deleteMutation = useMutation(
    async (id: string) => {
      const res = await api.delete(`/market/${id}`);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-market');
        alert('Market submission deleted successfully!');
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Failed to delete submission');
      },
    }
  );

  const allSubmissions = submissions?.submissions || [];
  
  const filteredSubmissions = allSubmissions.filter((s: any) => {
    if (statusFilter === 'all') return true;
    return s.status === statusFilter.toUpperCase();
  });

  const statuses = ['NEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Market Management</h2>
        <button
          onClick={async () => {
            try {
              const res = await api.get('/market/export?format=csv', {
                responseType: 'blob',
              });
              const blob = new Blob([res.data], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `market-submissions-${Date.now()}.csv`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
            } catch (error) {
              console.error('Export error:', error);
              alert('Failed to export submissions');
            }
          }}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Status Filters */}
      <div className="bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-400">Filter by Status:</span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              statusFilter === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All ({allSubmissions.length})
          </button>
          {statuses.map((status) => {
            const count = allSubmissions.filter((s: any) => s.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status.toLowerCase())}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  statusFilter === status.toLowerCase()
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {status.replace('_', ' ')} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          All Proposals ({filteredSubmissions.length})
        </h3>
        <div className="space-y-4">
          {filteredSubmissions.map((submission: any) => (
            <div
              key={submission.id}
              className="bg-gray-700 p-6 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
              onClick={() => setSelectedSubmission(submission)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h4 className="text-white font-semibold text-lg mb-2">{submission.title}</h4>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
                      {submission.ideaType || 'N/A'}
                    </span>
                    {submission.beneficiaries?.length > 0 && (
                      <span className="text-xs bg-primary-500/20 text-primary-300 px-2 py-1 rounded">
                        {submission.beneficiaries.length} beneficiaries
                      </span>
                    )}
                    <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
                      Impact: {submission.estimatedImpact || 'N/A'}
                    </span>
                    <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
                      Cost: {submission.estimatedCost || 'N/A'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">
                    By: {submission.fullName || `${submission.user?.firstName} ${submission.user?.lastName}`} 
                    {' '}({submission.email || submission.user?.email})
                  </p>
                  <p className="text-gray-400 text-sm">
                    {submission.department || submission.user?.department} • {submission.countryOffice || submission.user?.country}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-3 py-1 rounded ml-4 ${
                    submission.status === 'APPROVED'
                      ? 'bg-green-900/30 text-green-300'
                      : submission.status === 'REJECTED'
                      ? 'bg-red-900/30 text-red-300'
                      : submission.status === 'UNDER_REVIEW'
                      ? 'bg-blue-900/30 text-blue-300'
                      : 'bg-yellow-900/30 text-yellow-300'
                  }`}
                >
                  {submission.status?.replace('_', ' ') || 'NEW'}
                </span>
              </div>
              <div className="text-sm text-gray-300 line-clamp-2 mb-2">
                {submission.problemNeed || submission.problemStatement || 'No problem statement provided'}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Submitted: {new Date(submission.createdAt).toLocaleDateString()}</span>
                {submission.bonusApproved && submission.bonusAmount && (
                  <span className="text-green-400 font-medium">
                    Bonus: ${submission.bonusAmount}
                  </span>
                )}
                {submission.reviewScore !== null && submission.reviewScore !== undefined && (
                  <span className="text-primary-400">
                    Score: {submission.reviewScore}/100
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Are you sure you want to delete "${submission.title}"? This action cannot be undone.`)) {
                    deleteMutation.mutate(submission.id);
                  }
                }}
                disabled={deleteMutation.isLoading}
                className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Delete
              </button>
            </div>
          ))}
          {filteredSubmissions.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No submissions found
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedSubmission && (
        <ReviewModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onReview={(data) => reviewMutation.mutate({ id: selectedSubmission.id, data })}
        />
      )}
    </div>
  );
}

function ReviewModal({ submission, onClose, onReview }: any) {
  const [reviewData, setReviewData] = useState({
    status: submission.status || 'NEW',
    reviewScore: submission.reviewScore || '',
    bonusApproved: submission.bonusApproved || false,
    bonusAmount: submission.bonusAmount || '',
    internalNotes: submission.internalNotes || '',
    assignedReviewer: submission.assignedReviewer || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReview(reviewData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-white">Review Proposal</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Submission Details */}
          <div className="space-y-6 mb-6 border-b border-gray-700 pb-6">
            <Section title="Staff Information">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong className="text-gray-400">Name:</strong> <span className="text-white">{submission.fullName || `${submission.user?.firstName} ${submission.user?.lastName}`}</span></div>
                <div><strong className="text-gray-400">Job Title:</strong> <span className="text-white">{submission.jobTitle || 'N/A'}</span></div>
                <div><strong className="text-gray-400">Country/Office:</strong> <span className="text-white">{submission.countryOffice || submission.user?.country || 'N/A'}</span></div>
                <div><strong className="text-gray-400">Department:</strong> <span className="text-white">{submission.department || submission.user?.department || 'N/A'}</span></div>
                <div><strong className="text-gray-400">Email:</strong> <span className="text-white">{submission.email || submission.user?.email || 'N/A'}</span></div>
                <div><strong className="text-gray-400">Phone:</strong> <span className="text-white">{submission.phone || submission.user?.phone || 'N/A'}</span></div>
              </div>
            </Section>

            <Section title="Idea Title">
              <p className="text-white text-lg font-semibold">{submission.title}</p>
            </Section>

            <Section title="Idea Type">
              <p className="text-white">{submission.ideaType || 'N/A'}</p>
            </Section>

            <Section title="Problem / Need Identified">
              <p className="text-gray-200 whitespace-pre-wrap">{submission.problemNeed || submission.problemStatement || 'N/A'}</p>
            </Section>

            <Section title="Proposed Solution">
              <p className="text-gray-200 whitespace-pre-wrap">{submission.proposedSolution || 'N/A'}</p>
            </Section>

            <Section title="Beneficiaries">
              <div className="flex flex-wrap gap-2">
                {submission.beneficiaries?.map((b: string, idx: number) => (
                  <span key={idx} className="bg-primary-500/20 text-primary-300 px-2 py-1 rounded text-sm">
                    {b}
                  </span>
                ))}
                {(!submission.beneficiaries || submission.beneficiaries.length === 0) && (
                  <span className="text-gray-400">N/A</span>
                )}
              </div>
            </Section>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <strong className="text-gray-400 block mb-1">Estimated Impact</strong>
                <p className="text-white">{submission.estimatedImpact || 'N/A'}</p>
              </div>
              <div>
                <strong className="text-gray-400 block mb-1">Estimated Cost</strong>
                <p className="text-white">{submission.estimatedCost || 'N/A'}</p>
              </div>
              <div>
                <strong className="text-gray-400 block mb-1">Funding Potential</strong>
                <p className="text-white">{submission.fundingPotential || 'N/A'}</p>
              </div>
              <div>
                <strong className="text-gray-400 block mb-1">Urgency</strong>
                <p className="text-white">{submission.urgency || 'N/A'}</p>
              </div>
            </div>

            <Section title="Leadership Interest">
              <p className="text-white">{submission.leadershipInterest || 'N/A'}</p>
            </Section>

            {submission.attachments && submission.attachments.length > 0 && (
              <Section title="Attachments">
                <div className="space-y-2">
                  {submission.attachments.map((att: string, idx: number) => (
                    <a
                      key={idx}
                      href={att}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:text-primary-400 underline block"
                    >
                      Attachment {idx + 1} →
                    </a>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Review Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Admin Review</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Review Status *</label>
                <select
                  value={reviewData.status}
                  onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="NEW">New</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Assigned Reviewer</label>
                <input
                  type="text"
                  value={reviewData.assignedReviewer}
                  onChange={(e) => setReviewData({ ...reviewData, assignedReviewer: e.target.value })}
                  placeholder="Reviewer name or email"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Review Score (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={reviewData.reviewScore}
                  onChange={(e) => setReviewData({ ...reviewData, reviewScore: parseInt(e.target.value) || '' })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Bonus Approved</label>
                <select
                  value={reviewData.bonusApproved ? 'Yes' : 'No'}
                  onChange={(e) => setReviewData({ ...reviewData, bonusApproved: e.target.value === 'Yes' })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              {reviewData.bonusApproved && (
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Bonus Amount ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={reviewData.bonusAmount}
                    onChange={(e) => setReviewData({ ...reviewData, bonusAmount: parseFloat(e.target.value) || '' })}
                    required={reviewData.bonusApproved}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Internal Notes</label>
              <textarea
                value={reviewData.internalNotes}
                onChange={(e) => setReviewData({ ...reviewData, internalNotes: e.target.value })}
                rows={4}
                placeholder="Internal notes for this proposal..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-600 rounded-lg hover:bg-gray-800 text-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                Submit Review
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-700 pb-4 mb-4">
      <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
      {children}
    </div>
  );
}
